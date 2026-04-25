package com.jobportal.service;

import java.util.List;

import com.jobportal.exception.JobPortalException;
import com.jobportal.dto.StudentAdvisorChatRequestDTO;
import com.jobportal.dto.StudentAdvisorChatResponseDTO;
import com.jobportal.dto.StudentIntakeRecommendationDTO;
import com.jobportal.dto.StudentIntakeRequestDTO;
import reactor.core.publisher.Flux;

public interface AiAssistantService {
	String getProfileAssistantReply(String message, String accountType, String profileContext) throws JobPortalException;
	List<String> getProfileSkillSuggestions(String accountType, String profileContext, List<String> existingSkills) throws JobPortalException;
	StudentIntakeRecommendationDTO getStudentIntakeRecommendation(StudentIntakeRequestDTO request) throws JobPortalException;
	StudentAdvisorChatResponseDTO chatWithStudentAdvisor(StudentAdvisorChatRequestDTO request) throws JobPortalException;
	Flux<String> streamStudentAdvisorChat(StudentAdvisorChatRequestDTO request);
}
