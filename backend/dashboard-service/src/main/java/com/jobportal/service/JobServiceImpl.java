package com.jobportal.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
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
import com.jobportal.dto.EmployerRole;
import com.jobportal.dto.Application;
import com.jobportal.dto.ApplicationStatus;
import com.jobportal.dto.JobImageUploadResponseDTO;
import com.jobportal.dto.JobDTO;
import com.jobportal.dto.JobStatus;
import com.jobportal.dto.NotificationDTO;
import com.jobportal.entity.Applicant;
import com.jobportal.entity.Job;
import com.jobportal.entity.User;
import com.jobportal.exception.JobPortalException;
import com.jobportal.repository.JobRepository;
import com.jobportal.repository.UserRepository;

@Service("jobService")
public class JobServiceImpl implements JobService {

	private static final Set<String> SUPPORTED_IMAGE_CONTENT_TYPES = Set.of(
			"image/png",
			"image/jpeg",
			"image/jpg",
			"image/webp",
			"image/gif");
	private static final Path JOB_IMAGE_UPLOAD_DIR = Paths.get("uploads", "jobs").toAbsolutePath().normalize();
	private static final Set<String> BLOCKED_PUBLIC_PLACEHOLDER_NAMES = Set.of("test", "dummy", "sample", "n/a", "na");

	@Autowired
	private JobRepository jobRepository;
	@Autowired
	private NotificationService notificationService;
	@Autowired
	private CurrentUserService currentUserService;
	@Autowired
	private EmployerSubscriptionService employerSubscriptionService;
	@Autowired
	private UserRepository userRepository;

	@Override
	@SuppressWarnings("null")
	public JobDTO postJob(JobDTO jobDTO) throws JobPortalException {
		CurrentUserService.CurrentUser currentUser = currentUserService.getCurrentUser();
		ensureEmployerAccess(currentUser);
		ensureEmployerWriteAccess(currentUser);
		jobDTO.setPostedBy(currentUser.id());

		if (jobDTO.getId() == null || jobDTO.getId() == 0) {
			if (currentUser.accountType() == AccountType.EMPLOYER) {
				boolean consumesActiveSlot = jobDTO.getJobStatus() == JobStatus.ACTIVE;
				employerSubscriptionService.ensureEmployerCanPost(currentUser.id(), consumesActiveSlot);
			}
			jobDTO.setId(null);
			jobDTO.setPostTime(LocalDateTime.now());
			Job savedJob = jobRepository.save(jobDTO.toEntity());
			savedJob.setJobCode(buildJobCode(savedJob.getCountry(), currentUser.id(), savedJob.getId()));
			savedJob = jobRepository.save(savedJob);
			NotificationDTO notiDto = new NotificationDTO();
			notiDto.setAction("Job Posted");
			notiDto.setMessage("Job Posted Successfully for " + jobDTO.getJobTitle() + " at " + jobDTO.getCompany());
			notiDto.setUserId(currentUser.id());
			notiDto.setRoute("/posted-jobs/" + savedJob.getId());
			notificationService.sendNotification(notiDto);
			return savedJob.toDTO();
		} else {
			Long jobId = Objects.requireNonNull(jobDTO.getId(), "Job ID is required");
			Job job = jobRepository.findById(jobId)
					.orElseThrow(() -> new JobPortalException("JOB_NOT_FOUND"));
			ensureJobOwnership(job, currentUser);
			if (currentUser.accountType() == AccountType.EMPLOYER) {
				boolean consumesActiveSlot = jobDTO.getJobStatus() == JobStatus.ACTIVE && job.getJobStatus() != JobStatus.ACTIVE;
				employerSubscriptionService.ensureEmployerCanPost(currentUser.id(), consumesActiveSlot);
			}
			if (job.getJobStatus().equals(JobStatus.DRAFT) || jobDTO.getJobStatus().equals(JobStatus.CLOSED))
				jobDTO.setPostTime(LocalDateTime.now());
			Job savedJob = jobRepository.save(jobDTO.toEntity());
			savedJob.setJobCode(buildJobCode(savedJob.getCountry(), currentUser.id(), savedJob.getId()));
			savedJob = jobRepository.save(savedJob);
			return savedJob.toDTO();
		}
	}

	@Override
	public JobDTO closeJob(Long id) throws JobPortalException {
		CurrentUserService.CurrentUser currentUser = currentUserService.getCurrentUser();
		ensureEmployerAccess(currentUser);
		ensureEmployerWriteAccess(currentUser);
		Long safeId = Objects.requireNonNull(id, "Job ID is required");
		Job job = jobRepository.findById(safeId)
				.orElseThrow(() -> new JobPortalException("JOB_NOT_FOUND"));
		ensureJobOwnership(job, currentUser);

		if (job.getJobStatus() != JobStatus.CLOSED) {
			job.setJobStatus(JobStatus.CLOSED);
			job.setPostTime(LocalDateTime.now());
			job = jobRepository.save(job);
		}

		return job.toDTO();
	}

	private String buildJobCode(String country, Long employerId, Long jobId) {
		String countryCode = toCountryCode(country);
		String employerCode = String.format("EMP%04d", employerId == null ? 0L : employerId);
		String idCode = String.format("%05d", jobId == null ? 0L : jobId);
		return countryCode + employerCode + idCode;
	}

	private String toCountryCode(String country) {
		String raw = country == null ? "" : country.trim();
		if (raw.isBlank()) {
			return "GLB";
		}

		String normalized = raw.replaceAll("[^A-Za-z ]", " ").trim();
		if (normalized.isBlank()) {
			return "GLB";
		}

		String[] words = normalized.split("\\s+");
		if (words.length >= 2) {
			StringBuilder initials = new StringBuilder();
			for (String word : words) {
				if (!word.isBlank() && initials.length() < 3) {
					initials.append(Character.toUpperCase(word.charAt(0)));
				}
			}
			while (initials.length() < 3) {
				initials.append('X');
			}
			return initials.toString();
		}

		String token = words[0].toUpperCase(Locale.ROOT);
		if (token.length() >= 3) {
			return token.substring(0, 3);
		}
		return String.format("%-3s", token).replace(' ', 'X');
	}

	@Override
	public List<JobDTO> getAllJobs() throws JobPortalException {
		return jobRepository.findAll().stream()
				.filter(this::isPublicCandidateSafeJob)
				.map(Job::toDTO)
				.toList();
	}

	@Override
	public JobDTO getJob(Long id) throws JobPortalException {
		Long safeId = Objects.requireNonNull(id, "Job ID is required");
		return jobRepository.findById(safeId).orElseThrow(() -> new JobPortalException("JOB_NOT_FOUND")).toDTO();
	}

	@Override
	public void deleteJob(Long id) throws JobPortalException {
		CurrentUserService.CurrentUser currentUser = currentUserService.getCurrentUser();
		ensureEmployerAccess(currentUser);
		ensureEmployerWriteAccess(currentUser);
		Long safeId = Objects.requireNonNull(id, "Job ID is required");
		Job job = jobRepository.findById(safeId)
				.orElseThrow(() -> new JobPortalException("JOB_NOT_FOUND"));
		ensureJobOwnership(job, currentUser);
		jobRepository.delete(Objects.requireNonNull(job));
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
		Long safeId = Objects.requireNonNull(id, "Job ID is required");
		Job job = jobRepository.findById(safeId).orElseThrow(() -> new JobPortalException("JOB_NOT_FOUND"));
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
		List<Long> portalPosterIds = resolveEmployerPortalUserIdsForPoster(id);
		return jobRepository.findByPostedByIn(portalPosterIds).stream().map(this::toEmployerSafeJobDTO).toList();
	}

	@Override
	public List<JobDTO> getMyPostedJobs() throws JobPortalException {
		CurrentUserService.CurrentUser currentUser = currentUserService.getCurrentUser();
		ensureEmployerAccess(currentUser);
		List<Long> portalPosterIds = resolveEmployerPortalUserIds(currentUser);
		return jobRepository.findByPostedByIn(portalPosterIds).stream().map(this::toEmployerSafeJobDTO).toList();
	}

	@Override
	public List<JobDTO> getPublicJobsByPoster(Long id) throws JobPortalException {
		List<Long> portalPosterIds = resolveEmployerPortalUserIdsForPoster(id);
		return jobRepository.findByPostedByIn(portalPosterIds).stream()
				.filter(this::isPublicCandidateSafeJob)
				.map(this::toEmployerSafeJobDTO)
				.toList();
	}

	@Override
	public String getApplicantResumeForMyJob(Long jobId, Long applicantId, String action) throws JobPortalException {
		CurrentUserService.CurrentUser currentUser = currentUserService.getCurrentUser();
		ensureEmployerAccess(currentUser);
		Long safeJobId = Objects.requireNonNull(jobId, "Job ID is required");
		Job job = jobRepository.findById(safeJobId)
				.orElseThrow(() -> new JobPortalException("JOB_NOT_FOUND"));
		ensureJobOwnership(job, currentUser);

		Applicant applicant = job.getApplicants() == null
				? null
				: job.getApplicants().stream()
						.filter(x -> x.getApplicantId() != null && x.getApplicantId().equals(applicantId))
						.findFirst()
						.orElse(null);
		if (applicant == null) {
			throw new JobPortalException("Applicant not found for this job");
		}
		if (applicant.getResume() == null || applicant.getResume().length == 0) {
			throw new JobPortalException("Resume not available");
		}

		employerSubscriptionService.consumeResumeAccess(currentUser.id(), action);
		return java.util.Base64.getEncoder().encodeToString(applicant.getResume());
	}

	@Override
	public void changeAppStatus(Application application) throws JobPortalException {
		CurrentUserService.CurrentUser currentUser = currentUserService.getCurrentUser();
		ensureEmployerAccess(currentUser);
		ensureEmployerWriteAccess(currentUser);
		Long jobId = Objects.requireNonNull(application.getId(), "Job ID is required");
		Job job = jobRepository.findById(jobId)
				.orElseThrow(() -> new JobPortalException("JOB_NOT_FOUND"));
		ensureJobOwnership(job, currentUser);
		List<Applicant> apps = job.getApplicants().stream().map((x) -> {
			if (x.getApplicantId() != null && x.getApplicantId().equals(application.getApplicantId())) {
				if (application.getApplicationStatus() != null) {
					x.setApplicationStatus(application.getApplicationStatus());
				}
				if (application.getScreeningOwner() != null) {
					x.setScreeningOwner(application.getScreeningOwner());
				}
				if (application.getInterviewStatus() != null) {
					x.setInterviewStatus(application.getInterviewStatus());
				}
				if (application.getOfferSalaryBandConfirmed() != null) {
					x.setOfferSalaryBandConfirmed(application.getOfferSalaryBandConfirmed());
				}
				if (application.getOfferApprovalsDone() != null) {
					x.setOfferApprovalsDone(application.getOfferApprovalsDone());
				}
				if (application.getOfferStartDateConfirmed() != null) {
					x.setOfferStartDateConfirmed(application.getOfferStartDateConfirmed());
				}
				if (application.getRejectionReason() != null) {
					x.setRejectionReason(application.getRejectionReason());
				}
				if (application.getApplicationStatus() != null
						&& application.getApplicationStatus().equals(ApplicationStatus.INTERVIEWING)) {
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

		String rawContentType = file.getContentType();
		String contentType = rawContentType == null ? "" : rawContentType.toLowerCase();
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

			Resource resource = new UrlResource(Objects.requireNonNull(filePath.toUri()));
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

	private void ensureEmployerWriteAccess(CurrentUserService.CurrentUser currentUser) throws JobPortalException {
		if (currentUser.accountType() == AccountType.ADMIN) {
			return;
		}
		if (currentUser.accountType() != AccountType.EMPLOYER) {
			throw new JobPortalException("Employer access required");
		}
		EmployerRole role = currentUser.employerRole();
		if (role == EmployerRole.VIEWER) {
			throw new JobPortalException("Insufficient permission for this action");
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
		List<Long> portalPosterIds = resolveEmployerPortalUserIds(currentUser);
		if (job.getPostedBy() == null || !portalPosterIds.contains(job.getPostedBy())) {
			throw new JobPortalException("You are not authorized to modify this job");
		}
	}

	private void ensurePostedByAccess(Long postedBy, CurrentUserService.CurrentUser currentUser) throws JobPortalException {
		if (currentUser.accountType() == AccountType.ADMIN) {
			return;
		}
		ensureEmployerAccess(currentUser);
		List<Long> portalPosterIds = resolveEmployerPortalUserIds(currentUser);
		if (postedBy == null || !portalPosterIds.contains(postedBy)) {
			throw new JobPortalException("You are not authorized to view these posted jobs");
		}
	}

	private List<Long> resolveEmployerPortalUserIds(CurrentUserService.CurrentUser currentUser) {
		if (currentUser.profileId() == null) {
			return List.of(currentUser.id());
		}
		List<Long> ids = userRepository.findByProfileIdAndAccountType(currentUser.profileId(), AccountType.EMPLOYER)
				.stream()
				.map(User::getId)
				.filter(Objects::nonNull)
				.distinct()
				.toList();
		return ids.isEmpty() ? List.of(currentUser.id()) : ids;
	}

	private List<Long> resolveEmployerPortalUserIdsForPoster(Long postedBy) {
		if (postedBy == null) {
			return List.of();
		}
		User owner = userRepository.findById(postedBy).orElse(null);
		if (owner == null || owner.getProfileId() == null || owner.getAccountType() != AccountType.EMPLOYER) {
			return List.of(postedBy);
		}
		List<Long> ids = userRepository.findByProfileIdAndAccountType(owner.getProfileId(), AccountType.EMPLOYER)
				.stream()
				.map(User::getId)
				.filter(Objects::nonNull)
				.distinct()
				.toList();
		return ids.isEmpty() ? List.of(postedBy) : ids;
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

	private JobDTO toEmployerSafeJobDTO(Job job) {
		JobDTO dto = job.toDTO();
		if (dto.getApplicants() != null) {
			dto.getApplicants().forEach(applicant -> applicant.setResume(null));
		}
		return dto;
	}

	private boolean isPublicCandidateSafeJob(Job job) {
		if (job == null || job.getJobStatus() != JobStatus.ACTIVE) {
			return false;
		}
		String title = normalizeName(job.getJobTitle());
		String company = normalizeName(job.getCompany());
		return !BLOCKED_PUBLIC_PLACEHOLDER_NAMES.contains(title)
				&& !BLOCKED_PUBLIC_PLACEHOLDER_NAMES.contains(company);
	}

	private String normalizeName(String value) {
		if (value == null) {
			return "";
		}
		return value.trim().toLowerCase(Locale.ROOT);
	}
}
