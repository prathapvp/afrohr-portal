package com.jobportal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class StudentIntakeRequestDTO {

    @NotBlank(message = "{student.intake.decisionMode.required}")
    @Size(max = 20, message = "{student.intake.decisionMode.max}")
    private String decisionMode;

    @Size(max = 120, message = "{student.intake.targetRole.max}")
    private String targetRole;

    @NotBlank(message = "{student.intake.primaryInterest.required}")
    @Size(max = 120, message = "{student.intake.primaryInterest.max}")
    private String primaryInterest;

    @NotBlank(message = "{student.intake.primaryField.required}")
    @Size(max = 120, message = "{student.intake.primaryField.max}")
    private String primaryField;

    @Size(max = 120, message = "{student.intake.backgroundLevel.max}")
    private String backgroundLevel;

    @Size(max = 60, message = "{student.intake.timeline.max}")
    private String timeline;

    @Size(max = 500, message = "{student.intake.skills.max}")
    private String skills;

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
}
