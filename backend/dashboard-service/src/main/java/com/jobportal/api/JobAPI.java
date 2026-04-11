package com.jobportal.api;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.core.io.Resource;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import com.jobportal.dto.ApplicantDTO;
import com.jobportal.dto.Application;
import com.jobportal.dto.ApplicationStatus;
import com.jobportal.dto.JobImageUploadResponseDTO;
import com.jobportal.dto.JobDTO;
import com.jobportal.dto.ResponseDTO;
import com.jobportal.exception.JobPortalException;
import com.jobportal.service.JobService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@RestController
@CrossOrigin
@RequestMapping("/api/ahrm/v3/jobs")
@Validated
public class JobAPI {
	public record JobApplicationRequest(
			@NotBlank(message = "{applicant.name.required}") String applicantName,
			@NotBlank(message = "{applicant.email.required}") @Email(message = "{applicant.email.invalid}") String applicantEmail,
			@NotBlank(message = "{applicant.phone.required}") String applicantPhone,
			String website,
			String resumeUrl,
			@Size(max = 4000, message = "{applicant.coverLetter.max}") String coverLetter) {}

	@Autowired
	private JobService jobService;

	@PostMapping("/post")
	public ResponseEntity<JobDTO> postJob(@RequestBody @Valid JobDTO jobDTO) throws JobPortalException {
		return new ResponseEntity<>(jobService.postJob(jobDTO), HttpStatus.CREATED);
	}

	@PostMapping("/me")
	public ResponseEntity<JobDTO> postMyJob(@RequestBody @Valid JobDTO jobDTO) throws JobPortalException {
		return new ResponseEntity<>(jobService.postJob(jobDTO), HttpStatus.CREATED);
	}

	@PostMapping("/me/{jobId}/close")
	public ResponseEntity<JobDTO> closeMyJob(@PathVariable Long jobId) throws JobPortalException {
		return new ResponseEntity<>(jobService.closeJob(jobId), HttpStatus.OK);
	}

	@PostMapping("/postAll")
	public ResponseEntity<List<JobDTO>> postAllJob(@RequestBody @Valid List<JobDTO> jobDTOs) throws JobPortalException {
		return new ResponseEntity<>(jobDTOs.stream().map((x) -> {
			try {
				return jobService.postJob(x);
			} catch (JobPortalException e) {
				e.printStackTrace();
			}
			return x;
		}).toList(), HttpStatus.CREATED);
	}

	@GetMapping("/getAll")
	public ResponseEntity<List<JobDTO>> getAllJobs(@RequestParam(required = false) String postedBy) throws JobPortalException {
		if (postedBy == null || postedBy.isBlank()) {
			return new ResponseEntity<>(jobService.getAllJobs(), HttpStatus.OK);
		}

		if ("me".equalsIgnoreCase(postedBy.trim())) {
			return new ResponseEntity<>(jobService.getMyPostedJobs(), HttpStatus.OK);
		}

		try {
			Long postedById = Long.parseLong(postedBy.trim());
			return new ResponseEntity<>(jobService.getPublicJobsByPoster(postedById), HttpStatus.OK);
		} catch (NumberFormatException ex) {
			throw new JobPortalException("Invalid postedBy filter");
		}
	}

	@GetMapping("/get/{id}")
	public ResponseEntity<JobDTO> getJob(@PathVariable Long id) throws JobPortalException {
		return new ResponseEntity<>(jobService.getJob(id), HttpStatus.OK);
	}

	@DeleteMapping("/delete/{id}")
	public ResponseEntity<ResponseDTO> deleteJob(@PathVariable Long id) throws JobPortalException {
		jobService.deleteJob(id);
		return new ResponseEntity<>(new ResponseDTO("Job deleted successfully"), HttpStatus.OK);
	}

	@DeleteMapping("/me/{jobId}")
	public ResponseEntity<ResponseDTO> deleteMyJob(@PathVariable Long jobId) throws JobPortalException {
		jobService.deleteJob(jobId);
		return new ResponseEntity<>(new ResponseDTO("Job deleted successfully"), HttpStatus.OK);
	}

	@PostMapping("apply/{id}")
	public ResponseEntity<ResponseDTO> applyJob(@PathVariable Long id,
			@RequestBody @Valid JobApplicationRequest request) throws JobPortalException {
		jobService.applyJob(id, toApplicantDTO(request));
		return new ResponseEntity<>(new ResponseDTO("Applied Successfully"), HttpStatus.OK);
	}

	@PostMapping("/me/applications/{jobId}")
	public ResponseEntity<ResponseDTO> applyCurrentUserJob(@PathVariable Long jobId,
			@RequestBody @Valid JobApplicationRequest request) throws JobPortalException {
		jobService.applyCurrentUserToJob(jobId, toApplicantDTO(request));
		return new ResponseEntity<>(new ResponseDTO("Applied Successfully"), HttpStatus.OK);
	}

	@GetMapping("/postedBy/{id}")
	public ResponseEntity<List<JobDTO>> getJobsPostedBy(@PathVariable Long id) throws JobPortalException {
		return new ResponseEntity<>(jobService.getJobsPostedBy(id), HttpStatus.OK);
	}

	@GetMapping("/me/posted")
	public ResponseEntity<List<JobDTO>> getMyPostedJobs() throws JobPortalException {
		return new ResponseEntity<>(jobService.getMyPostedJobs(), HttpStatus.OK);
	}

	@GetMapping("/me/{jobId}/applications/{applicantId}/resume")
	public ResponseEntity<ResponseDTO> getApplicantResumeForMyJob(
			@PathVariable Long jobId,
			@PathVariable Long applicantId,
			@RequestParam(defaultValue = "VIEW") String action) throws JobPortalException {
		String resumeBase64 = jobService.getApplicantResumeForMyJob(jobId, applicantId, action);
		return new ResponseEntity<>(new ResponseDTO(resumeBase64), HttpStatus.OK);
	}

	@GetMapping("/history/{id}/{applicationStatus}")
	public ResponseEntity<List<JobDTO>> getHistory(@PathVariable Long id,
			@PathVariable ApplicationStatus applicationStatus) throws JobPortalException {
		return new ResponseEntity<>(jobService.getHistory(id, applicationStatus), HttpStatus.OK);
	}

	@GetMapping("/me/history/{applicationStatus}")
	public ResponseEntity<List<JobDTO>> getMyHistory(@PathVariable ApplicationStatus applicationStatus)
			throws JobPortalException {
		return new ResponseEntity<>(jobService.getMyHistory(applicationStatus), HttpStatus.OK);
	}

	@PostMapping("/changeAppStatus")
	public ResponseEntity<ResponseDTO> changeAppStatus(@RequestBody @Valid Application application)
			throws JobPortalException {
		jobService.changeAppStatus(application);
		return new ResponseEntity<>(new ResponseDTO("Status Changed Successfully"), HttpStatus.OK);
	}

	@PostMapping(value = "/postImage", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<JobImageUploadResponseDTO> postJobImage(@RequestParam("file") MultipartFile file)
			throws JobPortalException {
		return new ResponseEntity<>(jobService.uploadJobImage(file), HttpStatus.OK);
	}

	@GetMapping(value = "/image/{fileName}")
	public ResponseEntity<Resource> getJobImage(@PathVariable String fileName) throws JobPortalException {
		Resource resource = jobService.getJobImage(fileName);
		MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
		String lowerFileName = fileName.toLowerCase();
		if (lowerFileName.endsWith(".png")) mediaType = MediaType.IMAGE_PNG;
		else if (lowerFileName.endsWith(".jpg") || lowerFileName.endsWith(".jpeg")) mediaType = MediaType.IMAGE_JPEG;
		else if (lowerFileName.endsWith(".gif")) mediaType = MediaType.IMAGE_GIF;
		else if (lowerFileName.endsWith(".webp")) mediaType = MediaType.parseMediaType("image/webp");

		return ResponseEntity.status(HttpStatus.OK)
				.header("Content-Type", mediaType.toString())
				.body(resource);
	}

	private ApplicantDTO toApplicantDTO(JobApplicationRequest request) throws JobPortalException {
		ApplicantDTO applicantDTO = new ApplicantDTO();
		applicantDTO.setName(request.applicantName());
		applicantDTO.setEmail(request.applicantEmail());
		applicantDTO.setPhone(parsePhone(request.applicantPhone()));
		applicantDTO.setWebsite(request.website());
		applicantDTO.setResume(request.resumeUrl());
		applicantDTO.setCoverLetter(request.coverLetter());
		return applicantDTO;
	}

	private Long parsePhone(String rawPhone) throws JobPortalException {
		if (rawPhone == null || rawPhone.isBlank()) {
			throw new JobPortalException("Applicant phone is required");
		}
		String normalized = rawPhone.replaceAll("[^0-9]", "");
		if (normalized.isBlank()) {
			throw new JobPortalException("Applicant phone is invalid");
		}
		try {
			return Long.parseLong(normalized);
		} catch (NumberFormatException ex) {
			throw new JobPortalException("Applicant phone is invalid");
		}
	}
}
