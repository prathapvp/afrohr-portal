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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jobportal.dto.ProfileDTO;
import com.jobportal.exception.JobPortalException;
import com.jobportal.service.AiAssistantService;
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

	@GetMapping("/getAll")
	public ResponseEntity<List<ProfileDTO>> getAllProfiles() throws JobPortalException {
		logger.info("Fetching all profiles");
		try {
			List<ProfileDTO> profiles = profileService.getAllProfiles();
			if (profiles == null || profiles.isEmpty()) {
				logger.info("No profiles found in the system");
				return new ResponseEntity<>(List.of(), HttpStatus.OK);
			}
			logger.info("Successfully fetched {} profiles", profiles.size());
			return new ResponseEntity<>(profiles, HttpStatus.OK);
		} catch (Exception e) {
			logger.error("Error fetching all profiles", e);
			throw new JobPortalException("Error fetching profiles: " + e.getMessage());
		}
	}

	@PutMapping("/update")
	public ResponseEntity<ProfileDTO> updateProfile(@RequestBody @Valid ProfileDTO profileDTO)
			throws JobPortalException {
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

	@PostMapping("/uploadResume")
	public ResponseEntity<Map<String, Object>> uploadResume(@RequestBody @Valid UploadResumeRequest request)
			throws JobPortalException {
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
}
