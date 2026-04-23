package com.jobportal.dto;

import java.util.ArrayList;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class StudentAdvisorChatRequestDTO {

    @NotBlank(message = "{student.chat.message.required}")
    @Size(max = 1000, message = "{student.chat.message.max}")
    private String message;

    @Size(max = 20, message = "{student.intake.decisionMode.max}")
    private String decisionMode;

    @Size(max = 120, message = "{student.intake.targetRole.max}")
    private String targetRole;

    @Size(max = 120, message = "{student.intake.primaryInterest.max}")
    private String primaryInterest;

    @Size(max = 120, message = "{student.intake.primaryField.max}")
    private String primaryField;

    @Size(max = 120, message = "{student.intake.backgroundLevel.max}")
    private String backgroundLevel;

    @Size(max = 60, message = "{student.intake.timeline.max}")
    private String timeline;

    @Size(max = 500, message = "{student.intake.skills.max}")
    private String skills;

    @Size(max = 600, message = "{student.chat.recommendationSummary.max}")
    private String recommendationSummary;

    @Size(max = 6, message = "{student.chat.recommendedRoles.max}")
    private List<@Size(max = 120, message = "{student.chat.recommendedRole.item.max}") String> recommendedRoles = new ArrayList<>();

    @Valid
    @Size(max = 12, message = "{student.chat.history.max}")
    private List<StudentAdvisorChatMessageDTO> history = new ArrayList<>();

    @Size(max = 80, message = "{student.chat.model.max}")
    private String model;

    @DecimalMin(value = "0.0", message = "{student.chat.temperature.min}")
    @DecimalMax(value = "1.0", message = "{student.chat.temperature.max}")
    private Double temperature;

    @Min(value = 64, message = "{student.chat.maxTokens.min}")
    @Max(value = 1200, message = "{student.chat.maxTokens.max}")
    private Integer maxTokens;

    @Min(value = 20, message = "{student.chat.maxWords.min}")
    @Max(value = 300, message = "{student.chat.maxWords.max}")
    private Integer maxResponseWords;

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getDecisionMode() {
        return decisionMode;
    }

    public void setDecisionMode(String decisionMode) {
        this.decisionMode = decisionMode;
    }

    public String getTargetRole() {
        return targetRole;
    }

    public void setTargetRole(String targetRole) {
        this.targetRole = targetRole;
    }

    public String getPrimaryInterest() {
        return primaryInterest;
    }

    public void setPrimaryInterest(String primaryInterest) {
        this.primaryInterest = primaryInterest;
    }

    public String getPrimaryField() {
        return primaryField;
    }

    public void setPrimaryField(String primaryField) {
        this.primaryField = primaryField;
    }

    public String getBackgroundLevel() {
        return backgroundLevel;
    }

    public void setBackgroundLevel(String backgroundLevel) {
        this.backgroundLevel = backgroundLevel;
    }

    public String getTimeline() {
        return timeline;
    }

    public void setTimeline(String timeline) {
        this.timeline = timeline;
    }

    public String getSkills() {
        return skills;
    }

    public void setSkills(String skills) {
        this.skills = skills;
    }

    public String getRecommendationSummary() {
        return recommendationSummary;
    }

    public void setRecommendationSummary(String recommendationSummary) {
        this.recommendationSummary = recommendationSummary;
    }

    public List<String> getRecommendedRoles() {
        return recommendedRoles;
    }

    public void setRecommendedRoles(List<String> recommendedRoles) {
        this.recommendedRoles = recommendedRoles;
    }

    public List<StudentAdvisorChatMessageDTO> getHistory() {
        return history;
    }

    public void setHistory(List<StudentAdvisorChatMessageDTO> history) {
        this.history = history;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public Double getTemperature() {
        return temperature;
    }

    public void setTemperature(Double temperature) {
        this.temperature = temperature;
    }

    public Integer getMaxTokens() {
        return maxTokens;
    }

    public void setMaxTokens(Integer maxTokens) {
        this.maxTokens = maxTokens;
    }

    public Integer getMaxResponseWords() {
        return maxResponseWords;
    }

    public void setMaxResponseWords(Integer maxResponseWords) {
        this.maxResponseWords = maxResponseWords;
    }
}