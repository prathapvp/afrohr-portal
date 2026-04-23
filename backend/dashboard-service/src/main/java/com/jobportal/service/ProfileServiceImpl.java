package com.jobportal.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import com.jobportal.dto.AccountType;
import com.jobportal.dto.ProfileDTO;
import com.jobportal.dto.ProfileDTO.PersonalDetails;
import com.jobportal.dto.UserDTO;
import com.jobportal.entity.Profile;
import com.jobportal.entity.User;
import com.jobportal.exception.JobPortalException;
import com.jobportal.repository.ProfileRepository;
import com.jobportal.repository.UserRepository;
import com.jobportal.security.PiiCryptoService;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Validator;

@Service("profileService")
public class ProfileServiceImpl implements ProfileService {

	private static final Logger logger = LoggerFactory.getLogger(ProfileServiceImpl.class);

	@Autowired
	private ProfileRepository profileRepository;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private PiiCryptoService piiCryptoService;

	@Autowired
	private ObjectMapper objectMapper;

	@Autowired
	private Validator validator;

	@Override
	public Long createProfile(UserDTO userDTO) throws JobPortalException {
		Profile profile = new Profile();
		profile.setEmail(userDTO.getEmail());
		profile.setName(userDTO.getName());
		profile.setSkills(new ArrayList<>());
		profile.setExperiences(new ArrayList<>());
		profile.setCertifications(new ArrayList<>());
		profile = Objects.requireNonNull(profileRepository.save(profile));
		return profile.getId();
	}

	@Override
	public ProfileDTO getProfile(Long id) throws JobPortalException {
		Long safeId = Objects.requireNonNull(id, "Profile ID is required");
		Profile profile = profileRepository.findById(safeId)
				.orElseThrow(() -> new JobPortalException("Profile not found with ID: " + id));
		return decryptProfile(profile);
	}

	@Override
	public ProfileDTO getProfileByUserId(Long userId) throws JobPortalException {
		Long safeUserId = Objects.requireNonNull(userId, "User ID is required");
		var user = userRepository.findById(safeUserId)
				.orElseThrow(() -> new JobPortalException("User not found with ID: " + safeUserId));
		if (user.getProfileId() == null) {
			throw new JobPortalException("No profile linked to user: " + safeUserId);
		}
		return getProfile(user.getProfileId());
	}

	@Override
	public ProfileDTO patchProfile(Long id, Map<String, Object> updates) throws JobPortalException {
		if (updates == null || updates.isEmpty()) {
			return getProfile(id);
		}

		Object requestId = updates.get("id");
		if (requestId != null && !String.valueOf(requestId).equals(String.valueOf(id))) {
			throw new JobPortalException("Profile ID in request body does not match path ID");
		}

		ProfileDTO existingProfile = getProfile(id);
		ProfileDTO mergedProfile = mergeProfile(existingProfile, updates);

		Set<ConstraintViolation<ProfileDTO>> violations = validator.validate(mergedProfile);
		if (!violations.isEmpty()) {
			throw new ConstraintViolationException(violations);
		}

		return updateProfile(mergedProfile);
	}

	@Override
	@SuppressWarnings("null")
	public ProfileDTO updateProfile(ProfileDTO profileDTO) throws JobPortalException {
		logger.info("Updating profile with ID: {}", profileDTO.getId());
		Long profileId = profileDTO.getId();
		if (profileId == null) {
			throw new JobPortalException("Profile ID is required");
		}

		profileRepository.findById(profileId)
				.orElseThrow(() -> new JobPortalException("Profile not found with ID: " + profileDTO.getId()));

		try {
			if (profileDTO.getPicture() != null) {
				logger.debug("Profile picture size: {} bytes", profileDTO.getPicture().length());
			}
			if (profileDTO.getBanner() != null) {
				logger.debug("Banner image size: {} bytes", profileDTO.getBanner().length());
			}

			Profile profileToSave = encryptProfile(profileDTO);
			Profile savedProfile = profileRepository.save(profileToSave);
			logger.info("Profile updated successfully with ID: {}", savedProfile.getId());

			return decryptProfile(savedProfile);
		} catch (Exception e) {
			logger.error("Failed to update profile with ID: {}", profileDTO.getId(), e);
			throw new JobPortalException("Failed to update profile: " + e.getMessage());
		}
	}

	private ProfileDTO mergeProfile(ProfileDTO existingProfile, Map<String, Object> updates) throws JobPortalException {
		try {
			ObjectNode existingNode = objectMapper.valueToTree(existingProfile);
			JsonNode updatesNode = objectMapper.valueToTree(normalizeProfilePatch(updates));

			if (!(updatesNode instanceof ObjectNode updatesObject)) {
				throw new JobPortalException("Profile patch payload must be a JSON object");
			}

			existingNode.setAll(updatesObject);
			ProfileDTO mergedProfile = objectMapper.treeToValue(existingNode, ProfileDTO.class);
			mergedProfile.setId(existingProfile.getId());
			return mergedProfile;
		} catch (JobPortalException e) {
			throw e;
		} catch (Exception e) {
			throw new JobPortalException("Failed to merge profile patch: " + e.getMessage());
		}
	}

	@SuppressWarnings("unchecked")
	private Map<String, Object> normalizeProfilePatch(Map<String, Object> updates) {
		Map<String, Object> normalized = new LinkedHashMap<>(updates);
		normalized.remove("id");

		Object experiences = normalized.get("experiences");
		if (experiences instanceof List<?> experienceList) {
			List<Object> normalizedExperiences = new ArrayList<>();
			for (Object item : experienceList) {
				if (item instanceof Map<?, ?> rawMap) {
					Map<String, Object> experienceMap = new LinkedHashMap<>((Map<String, Object>) rawMap);
					if (!experienceMap.containsKey("title") && experienceMap.containsKey("jobTitle")) {
						experienceMap.put("title", experienceMap.get("jobTitle"));
					}
					experienceMap.remove("jobTitle");
					normalizedExperiences.add(experienceMap);
				} else {
					normalizedExperiences.add(item);
				}
			}
			normalized.put("experiences", normalizedExperiences);
		}

		return normalized;
	}

	@Override
	public List<ProfileDTO> getAllProfiles() throws JobPortalException {
		try {
			logger.info("Fetching all profiles from repository");
			List<Profile> profiles = profileRepository.findAll();
			logger.info("Found {} profiles in repository", profiles.size());

			return profiles.stream().map(profile -> {
				try {
					return decryptProfile(profile);
				} catch (Exception e) {
					logger.error("Failed to decrypt profile with ID: {}. Skipping this profile.", profile.getId(), e);
					return null;
				}
			}).filter(dto -> dto != null).toList();
		} catch (Exception e) {
			logger.error("Error fetching all profiles", e);
			throw new JobPortalException("Failed to fetch profiles: " + e.getMessage());
		}
	}

	@Override
	public List<ProfileDTO> getProfilesByAccountType(String accountType) throws JobPortalException {
		try {
			logger.info("Fetching profiles with accountType: {}", accountType);

			List<User> users = userRepository.findByAccountType(AccountType.valueOf(accountType));
			logger.info("Found {} users with accountType: {}", users.size(), accountType);

			List<Long> profileIds = users.stream()
					.filter(user -> user.getProfileId() != null)
					.map(User::getProfileId)
					.toList();

			List<Profile> profiles = profileRepository.findAllById(Objects.requireNonNull(profileIds));
			logger.info("Found {} profiles for accountType: {}", profiles.size(), accountType);

			return profiles.stream().map(profile -> {
				try {
					return decryptProfile(profile);
				} catch (Exception e) {
					logger.error("Failed to decrypt profile with ID: {}. Skipping this profile.", profile.getId(), e);
					return null;
				}
			}).filter(dto -> dto != null).toList();
		} catch (Exception e) {
			logger.error("Error fetching profiles by accountType: {}", accountType, e);
			throw new JobPortalException("Failed to fetch profiles: " + e.getMessage());
		}
	}

	@Override
	@Transactional
	public int incrementResumeViewCount(Long profileId) throws JobPortalException {
		Long safeProfileId = Objects.requireNonNull(profileId, "Profile ID is required");
		if (!profileRepository.existsById(safeProfileId)) {
			throw new JobPortalException("Profile not found with ID: " + profileId);
		}
		profileRepository.incrementResumeViewCount(safeProfileId);
		return profileRepository.findById(safeProfileId)
				.map(p -> p.getResumeViewCount() != null ? p.getResumeViewCount() : 0)
				.orElse(0);
	}

	private Profile encryptProfile(ProfileDTO dto) {
		Profile profile = dto.toEntity();
		if (dto.getLocation() != null && !dto.getLocation().isEmpty()) {
			profile.setLocation(piiCryptoService.encryptString(dto.getLocation()));
		}
		if (dto.getEmail() != null && !dto.getEmail().isEmpty()) {
			profile.setEmail(piiCryptoService.encryptString(dto.getEmail()));
		}
		if (dto.getName() != null && !dto.getName().isEmpty()) {
			profile.setName(piiCryptoService.encryptString(dto.getName()));
		}

		PersonalDetails pd = dto.getPersonalDetails();
		if (pd != null) {
			PersonalDetails encrypted = new PersonalDetails();
			encrypted.setDateOfBirth(pd.getDateOfBirth() != null && !pd.getDateOfBirth().isEmpty()
					? piiCryptoService.encryptString(pd.getDateOfBirth()) : null);
			encrypted.setGender(pd.getGender() != null && !pd.getGender().isEmpty()
					? piiCryptoService.encryptString(pd.getGender()) : null);
			encrypted.setNationality(pd.getNationality() != null && !pd.getNationality().isEmpty()
					? piiCryptoService.encryptString(pd.getNationality()) : null);
			encrypted.setMaritalStatus(pd.getMaritalStatus() != null && !pd.getMaritalStatus().isEmpty()
					? piiCryptoService.encryptString(pd.getMaritalStatus()) : null);
			encrypted.setDrivingLicense(pd.getDrivingLicense() != null && !pd.getDrivingLicense().isEmpty()
					? piiCryptoService.encryptString(pd.getDrivingLicense()) : null);
			encrypted.setCurrentLocation(pd.getCurrentLocation() != null && !pd.getCurrentLocation().isEmpty()
					? piiCryptoService.encryptString(pd.getCurrentLocation()) : null);
			encrypted.setLanguagesKnown(pd.getLanguagesKnown());
			encrypted.setVisaStatus(pd.getVisaStatus() != null && !pd.getVisaStatus().isEmpty()
					? piiCryptoService.encryptString(pd.getVisaStatus()) : null);
			encrypted.setReligion(pd.getReligion() != null && !pd.getReligion().isEmpty()
					? piiCryptoService.encryptString(pd.getReligion()) : null);
			encrypted.setAlternateEmail(pd.getAlternateEmail() != null && !pd.getAlternateEmail().isEmpty()
					? piiCryptoService.encryptString(pd.getAlternateEmail()) : null);
			encrypted.setAlternateContact(pd.getAlternateContact() != null && !pd.getAlternateContact().isEmpty()
					? piiCryptoService.encryptString(pd.getAlternateContact()) : null);
			profile.setPersonalDetails(encrypted);
		}

		return profile;
	}

	private ProfileDTO decryptProfile(Profile profile) {
		ProfileDTO dto = profile.toDTO();

		if (profile.getLocation() != null && !profile.getLocation().isEmpty()) {
			try {
				dto.setLocation(piiCryptoService.decryptString(profile.getLocation()));
			} catch (Exception e) {
				logger.debug("Location not encrypted for profile ID: {}, using original value", profile.getId());
			}
		}

		if (profile.getEmail() != null && !profile.getEmail().isEmpty()) {
			try {
				dto.setEmail(piiCryptoService.decryptString(profile.getEmail()));
			} catch (Exception e) {
				logger.debug("Email not encrypted for profile ID: {}, using original value", profile.getId());
			}
		}

		if (profile.getName() != null && !profile.getName().isEmpty()) {
			try {
				dto.setName(piiCryptoService.decryptString(profile.getName()));
			} catch (Exception e) {
				logger.debug("Name not encrypted for profile ID: {}, using original value", profile.getId());
			}
		}

		PersonalDetails pd = dto.getPersonalDetails();
		if (pd != null) {
			PersonalDetails decrypted = new PersonalDetails();

			if (pd.getDateOfBirth() != null && !pd.getDateOfBirth().isEmpty()) {
				try { decrypted.setDateOfBirth(piiCryptoService.decryptString(pd.getDateOfBirth())); }
				catch (Exception e) { decrypted.setDateOfBirth(pd.getDateOfBirth()); }
			}
			if (pd.getGender() != null && !pd.getGender().isEmpty()) {
				try { decrypted.setGender(piiCryptoService.decryptString(pd.getGender())); }
				catch (Exception e) { decrypted.setGender(pd.getGender()); }
			}
			if (pd.getNationality() != null && !pd.getNationality().isEmpty()) {
				try { decrypted.setNationality(piiCryptoService.decryptString(pd.getNationality())); }
				catch (Exception e) { decrypted.setNationality(pd.getNationality()); }
			}
			if (pd.getMaritalStatus() != null && !pd.getMaritalStatus().isEmpty()) {
				try { decrypted.setMaritalStatus(piiCryptoService.decryptString(pd.getMaritalStatus())); }
				catch (Exception e) { decrypted.setMaritalStatus(pd.getMaritalStatus()); }
			}
			if (pd.getDrivingLicense() != null && !pd.getDrivingLicense().isEmpty()) {
				try { decrypted.setDrivingLicense(piiCryptoService.decryptString(pd.getDrivingLicense())); }
				catch (Exception e) { decrypted.setDrivingLicense(pd.getDrivingLicense()); }
			}
			if (pd.getCurrentLocation() != null && !pd.getCurrentLocation().isEmpty()) {
				try { decrypted.setCurrentLocation(piiCryptoService.decryptString(pd.getCurrentLocation())); }
				catch (Exception e) { decrypted.setCurrentLocation(pd.getCurrentLocation()); }
			}
			decrypted.setLanguagesKnown(pd.getLanguagesKnown());
			if (pd.getVisaStatus() != null && !pd.getVisaStatus().isEmpty()) {
				try { decrypted.setVisaStatus(piiCryptoService.decryptString(pd.getVisaStatus())); }
				catch (Exception e) { decrypted.setVisaStatus(pd.getVisaStatus()); }
			}
			if (pd.getReligion() != null && !pd.getReligion().isEmpty()) {
				try { decrypted.setReligion(piiCryptoService.decryptString(pd.getReligion())); }
				catch (Exception e) { decrypted.setReligion(pd.getReligion()); }
			}
			if (pd.getAlternateEmail() != null && !pd.getAlternateEmail().isEmpty()) {
				try { decrypted.setAlternateEmail(piiCryptoService.decryptString(pd.getAlternateEmail())); }
				catch (Exception e) { decrypted.setAlternateEmail(pd.getAlternateEmail()); }
			}
			if (pd.getAlternateContact() != null && !pd.getAlternateContact().isEmpty()) {
				try { decrypted.setAlternateContact(piiCryptoService.decryptString(pd.getAlternateContact())); }
				catch (Exception e) { decrypted.setAlternateContact(pd.getAlternateContact()); }
			}

			dto.setPersonalDetails(decrypted);
		}

		return dto;
	}
}
