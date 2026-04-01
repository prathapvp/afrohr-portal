package com.jobportal.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.net.MalformedURLException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.jobportal.dto.ApplicantDTO;
import com.jobportal.dto.AccountType;
import com.jobportal.dto.Application;
import com.jobportal.dto.ApplicationStatus;
import com.jobportal.dto.JobImageUploadResponseDTO;
import com.jobportal.dto.JobDTO;
import com.jobportal.dto.JobStatus;
import com.jobportal.dto.NotificationDTO;
import com.jobportal.entity.Applicant;
import com.jobportal.entity.Job;
import com.jobportal.exception.JobPortalException;
import com.jobportal.repository.JobRepository;

@Service("jobService")
public class JobServiceImpl implements JobService {

	private static final Set<String> SUPPORTED_IMAGE_CONTENT_TYPES = Set.of(
			"image/png",
			"image/jpeg",
			"image/jpg",
			"image/webp",
			"image/gif");
	private static final Path JOB_IMAGE_UPLOAD_DIR = Paths.get("uploads", "jobs").toAbsolutePath().normalize();

	@Autowired
	private JobRepository jobRepository;
	@Autowired
	private NotificationService notificationService;
	@Autowired
	private CurrentUserService currentUserService;
	@Autowired
	private EmployerSubscriptionService employerSubscriptionService;

	@Override
	public JobDTO postJob(JobDTO jobDTO) throws JobPortalException {
		CurrentUserService.CurrentUser currentUser = currentUserService.getCurrentUser();
		ensureEmployerAccess(currentUser);
		jobDTO.setPostedBy(currentUser.id());

		if (jobDTO.getId() == null || jobDTO.getId() == 0) {
			if (currentUser.accountType() == AccountType.EMPLOYER) {
				boolean consumesActiveSlot = jobDTO.getJobStatus() == JobStatus.ACTIVE;
				employerSubscriptionService.ensureEmployerCanPost(currentUser.id(), consumesActiveSlot);
			}
			jobDTO.setId(null);
			jobDTO.setPostTime(LocalDateTime.now());
			Job savedJob = jobRepository.save(jobDTO.toEntity());
			NotificationDTO notiDto = new NotificationDTO();
			notiDto.setAction("Job Posted");
			notiDto.setMessage("Job Posted Successfully for " + jobDTO.getJobTitle() + " at " + jobDTO.getCompany());
			notiDto.setUserId(currentUser.id());
			notiDto.setRoute("/posted-jobs/" + savedJob.getId());
			notificationService.sendNotification(notiDto);
			return savedJob.toDTO();
		} else {
			Job job = jobRepository.findById(jobDTO.getId())
					.orElseThrow(() -> new JobPortalException("JOB_NOT_FOUND"));
			ensureJobOwnership(job, currentUser);
			if (currentUser.accountType() == AccountType.EMPLOYER) {
				boolean consumesActiveSlot = jobDTO.getJobStatus() == JobStatus.ACTIVE && job.getJobStatus() != JobStatus.ACTIVE;
				employerSubscriptionService.ensureEmployerCanPost(currentUser.id(), consumesActiveSlot);
			}
			if (job.getJobStatus().equals(JobStatus.DRAFT) || jobDTO.getJobStatus().equals(JobStatus.CLOSED))
				jobDTO.setPostTime(LocalDateTime.now());
			return jobRepository.save(jobDTO.toEntity()).toDTO();
		}
	}

	@Override
	public List<JobDTO> getAllJobs() throws JobPortalException {
		return jobRepository.findAll().stream().map((x) -> x.toDTO()).toList();
	}

	@Override
	public JobDTO getJob(Long id) throws JobPortalException {
		return jobRepository.findById(id).orElseThrow(() -> new JobPortalException("JOB_NOT_FOUND")).toDTO();
	}

	@Override
	public void deleteJob(Long id) throws JobPortalException {
		CurrentUserService.CurrentUser currentUser = currentUserService.getCurrentUser();
		ensureEmployerAccess(currentUser);
		Job job = jobRepository.findById(id)
				.orElseThrow(() -> new JobPortalException("JOB_NOT_FOUND"));
		ensureJobOwnership(job, currentUser);
		jobRepository.delete(job);
	}

	@Override
	public void applyJob(Long id, ApplicantDTO applicantDTO) throws JobPortalException {
		CurrentUserService.CurrentUser currentUser = currentUserService.getCurrentUser();
		ensureApplicantAccess(currentUser);
		ApplicantDTO normalizedApplicant = normalizeApplicant(applicantDTO, currentUser);
		applyApplicantToJob(id, normalizedApplicant);
	}

	@Override
	public void applyCurrentUserToJob(Long id, ApplicantDTO applicantDTO) throws JobPortalException {
		CurrentUserService.CurrentUser currentUser = currentUserService.getCurrentUser();
		ensureApplicantAccess(currentUser);
		ApplicantDTO normalizedApplicant = normalizeApplicant(applicantDTO, currentUser);
		applyApplicantToJob(id, normalizedApplicant);
	}

	private void applyApplicantToJob(Long id, ApplicantDTO applicantDTO) throws JobPortalException {
		Job job = jobRepository.findById(id).orElseThrow(() -> new JobPortalException("JOB_NOT_FOUND"));
		List<Applicant> applicants = job.getApplicants();
		if (applicants == null)
			applicants = new ArrayList<>();
		if (applicants.stream().anyMatch((x) -> x.getApplicantId() != null && x.getApplicantId().equals(applicantDTO.getApplicantId())))
			throw new JobPortalException("JOB_APPLIED_ALREADY");
		applicantDTO.setApplicationStatus(ApplicationStatus.APPLIED);
		applicantDTO.setTimestamp(LocalDateTime.now());
		applicants.add(applicantDTO.toEntity());
		job.setApplicants(applicants);
		jobRepository.save(job);
	}

	@Override
	public List<JobDTO> getHistory(Long id, ApplicationStatus applicationStatus) throws JobPortalException {
		CurrentUserService.CurrentUser currentUser = currentUserService.getCurrentUser();
		ensureHistoryAccess(id, currentUser);
		return jobRepository.findByApplicantIdAndApplicationStatus(id, applicationStatus.name()).stream()
				.map((x) -> x.toDTO()).toList();
	}

	@Override
	public List<JobDTO> getMyHistory(ApplicationStatus applicationStatus) throws JobPortalException {
		CurrentUserService.CurrentUser currentUser = currentUserService.getCurrentUser();
		ensureApplicantAccess(currentUser);
		return jobRepository.findByApplicantIdAndApplicationStatus(currentUser.id(), applicationStatus.name()).stream()
				.map((x) -> x.toDTO()).toList();
	}

	@Override
	public List<JobDTO> getJobsPostedBy(Long id) throws JobPortalException {
		CurrentUserService.CurrentUser currentUser = currentUserService.getCurrentUser();
		ensurePostedByAccess(id, currentUser);
		return jobRepository.findByPostedBy(id).stream().map((x) -> x.toDTO()).toList();
	}

	@Override
	public List<JobDTO> getMyPostedJobs() throws JobPortalException {
		CurrentUserService.CurrentUser currentUser = currentUserService.getCurrentUser();
		ensureEmployerAccess(currentUser);
		return jobRepository.findByPostedBy(currentUser.id()).stream().map((x) -> x.toDTO()).toList();
	}

	@Override
	public void changeAppStatus(Application application) throws JobPortalException {
		CurrentUserService.CurrentUser currentUser = currentUserService.getCurrentUser();
		ensureEmployerAccess(currentUser);
		Job job = jobRepository.findById(application.getId())
				.orElseThrow(() -> new JobPortalException("JOB_NOT_FOUND"));
		ensureJobOwnership(job, currentUser);
		List<Applicant> apps = job.getApplicants().stream().map((x) -> {
			if (x.getApplicantId() != null && x.getApplicantId().equals(application.getApplicantId())) {
				x.setApplicationStatus(application.getApplicationStatus());
				if (application.getApplicationStatus().equals(ApplicationStatus.INTERVIEWING)) {
					x.setInterviewTime(application.getInterviewTime());
					NotificationDTO notiDto = new NotificationDTO();
					notiDto.setAction("Interview Scheduled");
					notiDto.setMessage("Interview scheduled for job id: " + application.getId());
					notiDto.setUserId(application.getApplicantId());
					notiDto.setRoute("/job-history");
					try {
						notificationService.sendNotification(notiDto);
					} catch (JobPortalException e) {
						e.printStackTrace();
					}
				}
			}
			return x;
		}).toList();
		job.setApplicants(apps);
		jobRepository.save(job);
	}

	@Override
	public JobImageUploadResponseDTO uploadJobImage(MultipartFile file) throws JobPortalException {
		if (file == null || file.isEmpty()) {
			throw new JobPortalException("Image file is required");
		}

		String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
		if (!SUPPORTED_IMAGE_CONTENT_TYPES.contains(contentType)) {
			throw new JobPortalException("Unsupported image format. Allowed: PNG, JPG, JPEG, WEBP, GIF");
		}

		try {
			Files.createDirectories(JOB_IMAGE_UPLOAD_DIR);
			String originalName = file.getOriginalFilename() == null ? "image" : file.getOriginalFilename();
			String extension = getSafeExtension(originalName);
			String fileName = UUID.randomUUID() + extension;
			Path destinationPath = JOB_IMAGE_UPLOAD_DIR.resolve(fileName).normalize();

			if (!destinationPath.startsWith(JOB_IMAGE_UPLOAD_DIR)) {
				throw new JobPortalException("Invalid image file path");
			}

			Files.copy(file.getInputStream(), destinationPath, StandardCopyOption.REPLACE_EXISTING);
			return new JobImageUploadResponseDTO(
					"Image uploaded successfully",
					fileName,
					"/api/ahrm/v3/jobs/image/" + fileName,
					contentType,
					file.getSize());
		} catch (JobPortalException ex) {
			throw ex;
		} catch (Exception ex) {
			throw new JobPortalException("Failed to upload image");
		}
	}

	@Override
	public Resource getJobImage(String fileName) throws JobPortalException {
		if (fileName == null || fileName.isBlank() || fileName.contains("..") || fileName.contains("/") || fileName.contains("\\")) {
			throw new JobPortalException("Invalid image file name");
		}

		try {
			Path filePath = JOB_IMAGE_UPLOAD_DIR.resolve(fileName).normalize();
			if (!filePath.startsWith(JOB_IMAGE_UPLOAD_DIR) || !Files.exists(filePath)) {
				throw new JobPortalException("Image not found");
			}

			Resource resource = new UrlResource(filePath.toUri());
			if (!resource.exists() || !resource.isReadable()) {
				throw new JobPortalException("Image not found");
			}
			return resource;
		} catch (JobPortalException ex) {
			throw ex;
		} catch (MalformedURLException ex) {
			throw new JobPortalException("Invalid image path");
		}
	}

	private String getSafeExtension(String fileName) {
		int dotIndex = fileName.lastIndexOf('.');
		if (dotIndex < 0 || dotIndex == fileName.length() - 1) {
			return ".png";
		}

		String extension = fileName.substring(dotIndex).toLowerCase();
		if (!extension.matches("\\.[a-z0-9]{1,5}")) {
			return ".png";
		}
		return extension;
	}

	private ApplicantDTO normalizeApplicant(ApplicantDTO applicantDTO, CurrentUserService.CurrentUser currentUser)
			throws JobPortalException {
		if (applicantDTO == null) {
			throw new JobPortalException("Applicant details are required");
		}
		Long phone = applicantDTO.getPhone();
		if (phone == null || phone <= 0) {
			throw new JobPortalException("Applicant phone is required");
		}

		ApplicantDTO normalized = new ApplicantDTO();
		normalized.setApplicantId(currentUser.id());
		normalized.setName(currentUser.name());
		normalized.setEmail(currentUser.email());
		normalized.setPhone(phone);
		normalized.setWebsite(applicantDTO.getWebsite());
		normalized.setResume(applicantDTO.getResume());
		normalized.setCoverLetter(applicantDTO.getCoverLetter());
		normalized.setInterviewTime(applicantDTO.getInterviewTime());
		normalized.setApplicationStatus(ApplicationStatus.APPLIED);
		return normalized;
	}

	private void ensureEmployerAccess(CurrentUserService.CurrentUser currentUser) throws JobPortalException {
		if (currentUser.accountType() != AccountType.EMPLOYER && currentUser.accountType() != AccountType.ADMIN) {
			throw new JobPortalException("Employer access required");
		}
	}

	private void ensureApplicantAccess(CurrentUserService.CurrentUser currentUser) throws JobPortalException {
		if (currentUser.accountType() != AccountType.APPLICANT
				&& currentUser.accountType() != AccountType.STUDENT
				&& currentUser.accountType() != AccountType.ADMIN) {
			throw new JobPortalException("Applicant access required");
		}
	}

	private void ensureJobOwnership(Job job, CurrentUserService.CurrentUser currentUser) throws JobPortalException {
		if (currentUser.accountType() == AccountType.ADMIN) {
			return;
		}
		if (job.getPostedBy() == null || !job.getPostedBy().equals(currentUser.id())) {
			throw new JobPortalException("You are not authorized to modify this job");
		}
	}

	private void ensurePostedByAccess(Long postedBy, CurrentUserService.CurrentUser currentUser) throws JobPortalException {
		if (currentUser.accountType() == AccountType.ADMIN) {
			return;
		}
		ensureEmployerAccess(currentUser);
		if (postedBy == null || !postedBy.equals(currentUser.id())) {
			throw new JobPortalException("You are not authorized to view these posted jobs");
		}
	}

	private void ensureHistoryAccess(Long applicantId, CurrentUserService.CurrentUser currentUser) throws JobPortalException {
		if (currentUser.accountType() == AccountType.ADMIN) {
			return;
		}
		ensureApplicantAccess(currentUser);
		if (applicantId == null || !applicantId.equals(currentUser.id())) {
			throw new JobPortalException("You are not authorized to view this job history");
		}
	}
}
