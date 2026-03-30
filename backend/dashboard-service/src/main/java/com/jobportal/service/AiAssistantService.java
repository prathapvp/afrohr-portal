package com.jobportal.service;

import com.jobportal.exception.JobPortalException;

public interface AiAssistantService {
	String getProfileAssistantReply(String message, String accountType, String profileContext) throws JobPortalException;
}
