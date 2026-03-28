package com.jobportal.service;

import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.jobportal.dto.ProfileDTO;
import com.jobportal.dto.ProfileDTO.PersonalDetails;
import com.jobportal.dto.UserDTO;
import com.jobportal.entity.Profile;
import com.jobportal.exception.JobPortalException;
import com.jobportal.repository.ProfileRepository;
import com.jobportal.security.PiiCryptoService;

@Service("profileService")
public class ProfileServiceImpl implements ProfileService {

	private static final Logger logger = LoggerFactory.getLogger(ProfileServiceImpl.class);

	@Autowired
	private ProfileRepository profileRepository;

	@Autowired
	private PiiCryptoService piiCryptoService;

	@Override
	public Long createProfile(UserDTO userDTO) throws JobPortalException {
		Profile profile = new Profile();
		profile.setEmail(userDTO.getEmail());
		profile.setName(userDTO.getName());
		profile.setSkills(new ArrayList<>());
		profile.setExperiences(new ArrayList<>());
		profile.setCertifications(new ArrayList<>());
		profile = profileRepository.save(profile);
		return profile.getId();
	}

	@Override
	public ProfileDTO getProfile(Long id) throws JobPortalException {
		Profile profile = profileRepository.findById(id)
				.orElseThrow(() -> new JobPortalException("Profile not found with ID: " + id));
		return decryptProfile(profile);
	}

	@Override
	public ProfileDTO updateProfile(ProfileDTO profileDTO) throws JobPortalException {
		logger.info("Updating profile with ID: {}", profileDTO.getId());

		profileRepository.findById(profileDTO.getId())
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
