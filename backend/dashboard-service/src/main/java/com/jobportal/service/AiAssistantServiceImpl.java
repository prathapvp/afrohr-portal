package com.jobportal.service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobportal.exception.JobPortalException;

@Service("aiAssistantService")
public class AiAssistantServiceImpl implements AiAssistantService {

	private static final Logger logger = LoggerFactory.getLogger(AiAssistantServiceImpl.class);
	private final HttpClient httpClient;
	private final ObjectMapper objectMapper;

	@Value("${openai.api.key:}")
	private String openAiApiKey;

	@Value("${openai.base-url:https://api.openai.com/v1/chat/completions}")
	private String openAiBaseUrl;

	@Value("${openai.model:gpt-4o-mini}")
	private String openAiModel;

	@Value("${openai.max-tokens:350}")
	private int maxTokens;

	public AiAssistantServiceImpl(ObjectMapper objectMapper) {
		this.objectMapper = objectMapper;
		this.httpClient = HttpClient.newBuilder()
				.connectTimeout(Duration.ofSeconds(20))
				.build();
	}

	@Override
	public String getProfileAssistantReply(String message, String accountType, String profileContext) throws JobPortalException {
		if (openAiApiKey == null || openAiApiKey.isBlank()) {
			throw new JobPortalException("Profile assistant is not configured. Set OPENAI_API_KEY on the backend.");
		}

		try {
			String requestBody = objectMapper.writeValueAsString(buildPayload(message, accountType, profileContext));
			HttpRequest request = HttpRequest.newBuilder()
					.uri(URI.create(openAiBaseUrl))
					.timeout(Duration.ofSeconds(45))
					.header("Authorization", "Bearer " + openAiApiKey)
					.header("Content-Type", "application/json")
					.POST(HttpRequest.BodyPublishers.ofString(requestBody))
					.build();

			HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
			if (response.statusCode() < 200 || response.statusCode() >= 300) {
				logger.error("OpenAI request failed with status {} and body {}", response.statusCode(), response.body());
				throw new JobPortalException("Profile assistant could not respond right now. Please try again later.");
			}

			JsonNode responseJson = objectMapper.readTree(response.body());
			String reply = responseJson.path("choices").path(0).path("message").path("content").asText("").trim();
			if (reply.isEmpty()) {
				throw new JobPortalException("Profile assistant returned an empty response. Please try again.");
			}
			return reply;
		} catch (JobPortalException e) {
			throw e;
		} catch (Exception e) {
			logger.error("Failed to fetch assistant response", e);
			throw new JobPortalException("Profile assistant is temporarily unavailable.");
		}
	}

	private Map<String, Object> buildPayload(String message, String accountType, String profileContext) {
		String systemPrompt = "You are AfroHR's profile assistant. Help users improve their profile, hiring summary, skills presentation, and recruiter-facing content. Be concise, practical, and action-oriented. When profile context is provided, tailor the advice to that context. Prefer short paragraphs or bullet points when useful.";
		String userPrompt = String.format(
				"Account type: %s\n\nProfile context:\n%s\n\nUser message:\n%s",
				clean(accountType, "Unknown"),
				truncate(clean(profileContext, "No profile context provided."), 6000),
				truncate(clean(message, ""), 2000)
		);

		Map<String, Object> payload = new LinkedHashMap<>();
		payload.put("model", openAiModel);
		payload.put("max_tokens", maxTokens);
		payload.put("temperature", 0.7);
		payload.put("messages", List.of(
				Map.of("role", "system", "content", systemPrompt),
				Map.of("role", "user", "content", userPrompt)
		));
		return payload;
	}

	private String clean(String value, String fallback) {
		if (value == null) {
			return fallback;
		}
		String trimmed = value.trim();
		return trimmed.isEmpty() ? fallback : trimmed;
	}

	private String truncate(String value, int maxLength) {
		if (value.length() <= maxLength) {
			return value;
		}
		return value.substring(0, maxLength);
	}
}
