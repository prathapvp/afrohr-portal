package com.jobportal.api;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.jobportal.dto.ProfileDTO;
import com.jobportal.dto.AccountType;
import com.jobportal.exception.JobPortalException;
import com.jobportal.service.AiAssistantService;
import com.jobportal.service.CurrentUserService;
import com.jobportal.service.ProfileService;
import com.jobportal.service.ResumeProcessingService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.Map;

@RestController
@CrossOrigin
@RequestMapping("/api/ahrm/v3/profiles")
@Validated
public class ProfileAPI {
	private static final Logger logger = LoggerFactory.getLogger(ProfileAPI.class);

	@Autowired
	private ProfileService profileService;

	@Autowired
	private ResumeProcessingService resumeProcessingService;

	@Autowired
	private AiAssistantService aiAssistantService;

	@Autowired
	private CurrentUserService currentUserService;

	public record UploadResumeRequest(
			@NotNull Long profileId,
			@NotBlank String fileName,
			String fileData
	) {}

	public record ParseResumeRequest(
			@NotBlank String fileData,
			@NotBlank String fileName
	) {}

	public record ProfileAssistantChatRequest(
			@NotBlank(message = "{assistant.message.absent}")
			@Size(max = 2000, message = "{assistant.message.tooLong}")
			String message,
			@Size(max = 40, message = "{assistant.accountType.tooLong}")
			String accountType,
			@Size(max = 6000, message = "{assistant.profileContext.tooLong}")
			String profileContext
	) {}

	@GetMapping("/get/{id}")
	public ResponseEntity<ProfileDTO> getProfile(@PathVariable Long id) throws JobPortalException {
		logger.info("Fetching profile with ID: {}", id);
		try {
			ProfileDTO profile = profileService.getProfile(id);
			logger.info("Successfully fetched profile with ID: {}", id);
			return new ResponseEntity<>(profile, HttpStatus.OK);
		} catch (JobPortalException e) {
			logger.error("Profile not found with ID: {}", id);
			throw e;
		} catch (Exception e) {
			logger.error("Error fetching profile with ID: {}", id, e);
			throw new JobPortalException("Error fetching profile: " + e.getMessage());
		}
	}

	@GetMapping("/by-user/{userId}")
	public ResponseEntity<ProfileDTO> getProfileByUserId(@PathVariable Long userId) throws JobPortalException {
		logger.info("Fetching profile for user ID: {}", userId);
		ProfileDTO profile = profileService.getProfileByUserId(userId);
		logger.info("Successfully fetched profile for user ID: {}", userId);
		return new ResponseEntity<>(profile, HttpStatus.OK);
	}

	@GetMapping("/me")
	public ResponseEntity<ProfileDTO> getMyProfile() throws JobPortalException {
		Long profileId = requireCurrentProfileId();
		return new ResponseEntity<>(profileService.getProfile(profileId), HttpStatus.OK);
	}

	@GetMapping("/getAll")
	public ResponseEntity<List<ProfileDTO>> getAllProfiles(@RequestParam(required = false) String accountType)
			throws JobPortalException {
		CurrentUserService.CurrentUser currentUser = currentUserService.getCurrentUser();
		boolean isAdmin = currentUser.isAdmin();
		boolean isEmployer = currentUser.accountType() == AccountType.EMPLOYER;

		if (!isAdmin && !isEmployer) {
			throw new JobPortalException("Admin or employer access required to view profiles");
		}

		logger.info("Fetching profiles" + (accountType != null ? " with accountType: " + accountType : ""));
		try {
			List<ProfileDTO> profiles;
			if (isAdmin) {
				if (accountType != null && !accountType.isEmpty()) {
					profiles = profileService.getProfilesByAccountType(accountType.trim().toUpperCase());
				} else {
					profiles = profileService.getAllProfiles();
				}
			} else {
				if (accountType == null || accountType.isEmpty()) {
					profiles = new java.util.ArrayList<>();
					profiles.addAll(profileService.getProfilesByAccountType(AccountType.APPLICANT.name()));
					profiles.addAll(profileService.getProfilesByAccountType(AccountType.STUDENT.name()));
				} else {
					String normalizedType = accountType.trim().toUpperCase();
					if (!AccountType.APPLICANT.name().equals(normalizedType)
							&& !AccountType.STUDENT.name().equals(normalizedType)) {
						throw new JobPortalException("Employers can only view applicant and student profiles");
					}
					profiles = profileService.getProfilesByAccountType(normalizedType);
				}
			}

			if (profiles == null || profiles.isEmpty()) {
				logger.info("No profiles found in the system");
				return new ResponseEntity<>(List.of(), HttpStatus.OK);
			}
			logger.info("Successfully fetched {} profiles", profiles.size());
			return new ResponseEntity<>(profiles, HttpStatus.OK);
		} catch (Exception e) {
			logger.error("Error fetching profiles", e);
			throw new JobPortalException("Error fetching profiles: " + e.getMessage());
		}
	}

	@PatchMapping("/{id}")
	public ResponseEntity<ProfileDTO> patchProfile(
			@PathVariable Long id,
			@RequestBody Map<String, Object> updates) throws JobPortalException {
		enforceProfileAccess(id);
		logger.info("Partial update request received for profile ID: {}", id);
		if (id == null || id <= 0) {
			throw new JobPortalException("Profile ID is required and must be positive");
		}

		ProfileDTO updatedProfile = profileService.patchProfile(id, updates);
		logger.info("Successfully partially updated profile with ID: {}", updatedProfile.getId());
		return new ResponseEntity<>(updatedProfile, HttpStatus.OK);
	}

	@PatchMapping("/me")
	public ResponseEntity<ProfileDTO> patchMyProfile(@RequestBody Map<String, Object> updates) throws JobPortalException {
		Long profileId = requireCurrentProfileId();
		ProfileDTO updatedProfile = profileService.patchProfile(profileId, updates);
		return new ResponseEntity<>(updatedProfile, HttpStatus.OK);
	}

	@PutMapping("/update")
	public ResponseEntity<ProfileDTO> updateProfile(@RequestBody @Valid ProfileDTO profileDTO)
			throws JobPortalException {
		enforceProfileAccess(profileDTO.getId());
		logger.info("Update request received for profile ID: {}", profileDTO.getId());
		try {
			if (profileDTO.getId() == null || profileDTO.getId() <= 0) {
				logger.warn("Invalid profile ID for update: {}", profileDTO.getId());
				throw new JobPortalException("Profile ID is required and must be positive");
			}
			ProfileDTO updatedProfile = profileService.updateProfile(profileDTO);
			logger.info("Successfully updated profile with ID: {}", updatedProfile.getId());
			return new ResponseEntity<>(updatedProfile, HttpStatus.OK);
		} catch (JobPortalException e) {
			logger.error("Profile operation failed for ID: {}: {}", profileDTO.getId(), e.getMessage());
			throw e;
		} catch (Exception e) {
			logger.error("Unexpected error updating profile ID: {}", profileDTO.getId(), e);
			throw new JobPortalException("Error updating profile: " + e.getMessage());
		}
	}

	@PutMapping("/me")
	public ResponseEntity<ProfileDTO> updateMyProfile(@RequestBody @Valid ProfileDTO profileDTO)
			throws JobPortalException {
		Long profileId = requireCurrentProfileId();
		profileDTO.setId(profileId);
		ProfileDTO updatedProfile = profileService.updateProfile(profileDTO);
		return new ResponseEntity<>(updatedProfile, HttpStatus.OK);
	}

	@PostMapping("/uploadResume")
	public ResponseEntity<Map<String, Object>> uploadResume(@RequestBody @Valid UploadResumeRequest request)
			throws JobPortalException {
		enforceProfileAccess(request.profileId());
		ProfileDTO profile = profileService.getProfile(request.profileId());
		profile.setCvFileName(request.fileName());
		profile.setCvLastUpdated(Instant.now().toString());
		ProfileDTO updated = profileService.updateProfile(profile);

		return ResponseEntity.ok(Map.of(
				"message", "Resume uploaded successfully",
				"profileId", updated.getId(),
				"cvFileName", updated.getCvFileName(),
				"cvLastUpdated", updated.getCvLastUpdated()
		));
	}

	@PostMapping("/me/uploadResume")
	public ResponseEntity<Map<String, Object>> uploadMyResume(@RequestBody @Valid ParseResumeRequest request)
			throws JobPortalException {
		Long profileId = requireCurrentProfileId();
		ProfileDTO profile = profileService.getProfile(profileId);
		profile.setCvFileName(request.fileName());
		profile.setCvLastUpdated(Instant.now().toString());
		ProfileDTO updated = profileService.updateProfile(profile);

		return ResponseEntity.ok(Map.of(
				"message", "Resume uploaded successfully",
				"profileId", updated.getId(),
				"cvFileName", updated.getCvFileName(),
				"cvLastUpdated", updated.getCvLastUpdated()
		));
	}

	@PostMapping("/parseResume")
	public ResponseEntity<Map<String, Object>> parseResume(@RequestBody @Valid ParseResumeRequest request) {
		Map<String, Object> parsed = resumeProcessingService.parseResume(request.fileData(), request.fileName());
		return ResponseEntity.ok(parsed);
	}

	@PostMapping("/chatAssistant")
	public ResponseEntity<Map<String, Object>> chatAssistant(@RequestBody @Valid ProfileAssistantChatRequest request)
			throws JobPortalException {
		String reply = aiAssistantService.getProfileAssistantReply(
				request.message(),
				request.accountType(),
				request.profileContext()
		);
		return ResponseEntity.ok(Map.of("reply", reply));
	}

	private Long requireCurrentProfileId() {
		CurrentUserService.CurrentUser currentUser = currentUserService.getCurrentUser();
		Long profileId = currentUser.profileId();
		if (profileId == null || profileId <= 0) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Authenticated user does not have a profile");
		}
		return profileId;
	}

	@PostMapping("/{id}/resume/view")
	public ResponseEntity<Map<String, Object>> recordResumeView(@PathVariable Long id) throws JobPortalException {
		int count = profileService.incrementResumeViewCount(id);
		return ResponseEntity.ok(Map.of("resumeViewCount", count));
	}

	private void enforceProfileAccess(Long profileId) {
		CurrentUserService.CurrentUser currentUser = currentUserService.getCurrentUser();
		if (profileId == null || profileId <= 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Profile ID is required and must be positive");
		}
		if (!currentUser.isAdmin() && !profileId.equals(currentUser.profileId())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not authorized to access this profile");
		}
	}
}

