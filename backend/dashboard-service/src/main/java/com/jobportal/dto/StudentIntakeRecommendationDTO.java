package com.jobportal.dto;

import java.util.List;
import java.util.Map;

public class StudentIntakeRecommendationDTO {

    private String summary;
    private String pathwayMode;
    private List<String> recommendedRoles;
    private Map<String, Integer> roleConfidence;
    private Map<String, List<String>> roleReasons;
    private List<String> focusAreas;
    private List<String> nextSteps;

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getPathwayMode() {
        return pathwayMode;
    }

    public void setPathwayMode(String pathwayMode) {
        this.pathwayMode = pathwayMode;
    }

    public List<String> getRecommendedRoles() {
        return recommendedRoles;
    }

    public void setRecommendedRoles(List<String> recommendedRoles) {
        this.recommendedRoles = recommendedRoles;
    }

    public Map<String, Integer> getRoleConfidence() {
        return roleConfidence;
    }

    public void setRoleConfidence(Map<String, Integer> roleConfidence) {
        this.roleConfidence = roleConfidence;
    }

    public Map<String, List<String>> getRoleReasons() {
        return roleReasons;
    }

    public void setRoleReasons(Map<String, List<String>> roleReasons) {
        this.roleReasons = roleReasons;
    }

    public List<String> getFocusAreas() {
        return focusAreas;
    }

    public void setFocusAreas(List<String> focusAreas) {
        this.focusAreas = focusAreas;
    }

    public List<String> getNextSteps() {
        return nextSteps;
    }

    public void setNextSteps(List<String> nextSteps) {
        this.nextSteps = nextSteps;
    }
}
