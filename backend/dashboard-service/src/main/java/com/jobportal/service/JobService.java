package com.jobportal.service;

import java.util.List;

import com.jobportal.dto.ApplicantDTO;
import com.jobportal.dto.Application;
import com.jobportal.dto.ApplicationStatus;
import com.jobportal.dto.JobImageUploadResponseDTO;
import com.jobportal.dto.JobDTO;
import com.jobportal.exception.JobPortalException;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface JobService {
	public JobDTO postJob(JobDTO jobDTO) throws JobPortalException;
	public List<JobDTO> getAllJobs() throws JobPortalException;
	public JobDTO getJob(Long id) throws JobPortalException;
	public void deleteJob(Long id) throws JobPortalException;
	public void applyJob(Long id, ApplicantDTO applicantDTO) throws JobPortalException;
	public void applyCurrentUserToJob(Long id, ApplicantDTO applicantDTO) throws JobPortalException;
	public List<JobDTO> getHistory(Long id, ApplicationStatus applicationStatus) throws JobPortalException;
	public List<JobDTO> getMyHistory(ApplicationStatus applicationStatus) throws JobPortalException;
	public List<JobDTO> getJobsPostedBy(Long id) throws JobPortalException;
	public List<JobDTO> getMyPostedJobs() throws JobPortalException;
	public void changeAppStatus(Application application) throws JobPortalException;
	public JobImageUploadResponseDTO uploadJobImage(MultipartFile file) throws JobPortalException;
	public Resource getJobImage(String fileName) throws JobPortalException;
}
