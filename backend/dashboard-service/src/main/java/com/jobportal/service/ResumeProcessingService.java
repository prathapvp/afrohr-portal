package com.jobportal.service;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.tika.metadata.Metadata;
import org.apache.tika.metadata.TikaCoreProperties;
import org.apache.tika.parser.AutoDetectParser;
import org.apache.tika.parser.ParseContext;
import org.apache.tika.sax.BodyContentHandler;
import org.springframework.stereotype.Service;

@Service
public class ResumeProcessingService {

	private static final Pattern EMAIL_PATTERN = Pattern
			.compile("\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b");
	private static final Pattern PHONE_PATTERN = Pattern.compile("(?:\\+?\\d[\\d\\s().-]{8,}\\d)");
	private static final Pattern EXPERIENCE_PATTERN = Pattern.compile("(\\d{1,2})\\s*\\+?\\s*(?:years|year|yrs|yr)",
			Pattern.CASE_INSENSITIVE);
	private static final Pattern LOCATION_LINE_PATTERN = Pattern.compile("(?:location|city|based in)\\s*[:\\-]\\s*(.+)",
			Pattern.CASE_INSENSITIVE);

	private static final List<String> KNOWN_SKILLS = List.of("java", "spring", "spring boot", "postgresql", "sql",
			"python", "javascript", "typescript", "react", "node", "docker", "kubernetes", "aws", "azure", "power bi",
			"tableau", "figma", "communication", "recruitment", "hr", "machine learning", "data analysis", "rest api");

	public Map<String, Object> parseResume(String fileData, String fileName) {
		byte[] bytes = decodeBase64(fileData);
		String text = extractText(bytes, fileName);

		Map<String, Object> result = new LinkedHashMap<>();
		result.put("name", extractName(text));
		result.put("email", extractFirstMatch(text, EMAIL_PATTERN));
		result.put("phone", sanitizePhone(extractFirstMatch(text, PHONE_PATTERN)));
		result.put("jobTitle", extractJobTitle(text));
		result.put("company", "");
		result.put("location", extractLocation(text));
		result.put("about", summarize(text, 400));
		result.put("profileSummary", summarize(text, 280));
		result.put("totalExp", extractYears(text));
		result.put("skills", extractSkills(text));
		result.put("experiences", List.of());
		result.put("certifications", List.of());
		result.put("education", List.of());
		result.put("personalDetails", Map.of("languagesKnown", List.of()));
		return result;
	}

	private byte[] decodeBase64(String fileData) {
		if (fileData == null || fileData.isBlank()) {
			return new byte[0];
		}

		String normalized = fileData;
		int commaIndex = normalized.indexOf(',');
		if (commaIndex >= 0) {
			normalized = normalized.substring(commaIndex + 1);
		}
		return Base64.getDecoder().decode(normalized);
	}

	private String extractText(byte[] bytes, String fileName) {
		if (bytes.length == 0) {
			return "";
		}

		try (ByteArrayInputStream input = new ByteArrayInputStream(bytes)) {
			BodyContentHandler handler = new BodyContentHandler(-1);
			Metadata metadata = new Metadata();
			if (fileName != null && !fileName.isBlank()) {
				metadata.set(TikaCoreProperties.RESOURCE_NAME_KEY, fileName);
			}
			AutoDetectParser parser = new AutoDetectParser();
			parser.parse(input, handler, metadata, new ParseContext());
			String parsed = handler.toString();
			if (parsed != null && !parsed.isBlank()) {
				return parsed;
			}
		} catch (Exception e) {
			// Log the error and fallback to raw text.
			System.err.println("Error parsing resume: " + e.getMessage());
		}

		return new String(bytes, StandardCharsets.UTF_8);
	}

	private String extractName(String text) {
		for (String rawLine : text.split("\\R")) {
			String line = rawLine.trim();
			if (line.isBlank()) {
				continue;
			}
			if (line.length() > 80) {
				continue;
			}
			if (!line.matches("[A-Za-z][A-Za-z .'-]{1,79}")) {
				continue;
			}
			String lower = line.toLowerCase(Locale.ROOT);
			if (lower.contains("resume") || lower.contains("curriculum")) {
				continue;
			}
			return line;
		}
		return "";
	}

	private String extractJobTitle(String text) {
		String lower = text.toLowerCase(Locale.ROOT);
		List<String> titles = List.of("software engineer", "backend engineer", "frontend engineer", "data analyst",
				"data scientist", "product manager", "ui/ux designer", "hr specialist", "developer");

		for (String title : titles) {
			if (lower.contains(title)) {
				return toTitleCase(title);
			}
		}

		for (String rawLine : text.split("\\R")) {
			String line = rawLine.trim();
			if (line.length() < 3 || line.length() > 90) {
				continue;
			}
			String l = line.toLowerCase(Locale.ROOT);
			if (l.contains("engineer") || l.contains("developer") || l.contains("analyst") || l.contains("manager")
					|| l.contains("designer")) {
				return line;
			}
		}

		return "";
	}

	private String extractLocation(String text) {
		for (String rawLine : text.split("\\R")) {
			String line = rawLine.trim();
			Matcher matcher = LOCATION_LINE_PATTERN.matcher(line);
			if (matcher.find()) {
				return matcher.group(1).trim();
			}
		}

		List<String> cities = List.of("lagos", "nairobi", "accra", "kigali", "abuja", "cairo", "remote");
		String lower = text.toLowerCase(Locale.ROOT);
		for (String city : cities) {
			if (lower.contains(city)) {
				return toTitleCase(city);
			}
		}
		return "";
	}

	private Long extractYears(String text) {
		Matcher matcher = EXPERIENCE_PATTERN.matcher(text);
		long maxYears = 0;
		while (matcher.find()) {
			try {
				long years = Long.parseLong(matcher.group(1));
				if (years > maxYears) {
					maxYears = years;
				}
			} catch (NumberFormatException ignored) {
				// Continue scanning.
			}
		}
		return maxYears;
	}

	private List<String> extractSkills(String text) {
		String lower = text.toLowerCase(Locale.ROOT);
		Set<String> found = new LinkedHashSet<>();
		for (String skill : KNOWN_SKILLS) {
			if (lower.contains(skill)) {
				found.add(toTitleCase(skill));
			}
		}
		return new ArrayList<>(found);
	}

	private String summarize(String text, int maxLen) {
		String compact = text.replaceAll("\\s+", " ").trim();
		if (compact.isEmpty()) {
			return "";
		}
		if (compact.length() <= maxLen) {
			return compact;
		}
		return compact.substring(0, maxLen - 3) + "...";
	}

	private String extractFirstMatch(String text, Pattern pattern) {
		Matcher matcher = pattern.matcher(text);
		return matcher.find() ? matcher.group().trim() : "";
	}

	private String sanitizePhone(String value) {
		if (value == null || value.isBlank()) {
			return "";
		}
		return value.replaceAll("\\s+", " ").trim();
	}

	private String toTitleCase(String value) {
		String[] parts = value.split(" ");
		StringBuilder builder = new StringBuilder();
		for (String part : parts) {
			if (part.isBlank()) {
				continue;
			}
			if (!builder.isEmpty()) {
				builder.append(' ');
			}
			builder.append(Character.toUpperCase(part.charAt(0)));
			if (part.length() > 1) {
				builder.append(part.substring(1));
			}
		}
		return builder.toString();
	}
}
