package com.jobportal.entity;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.jobportal.dto.Certification;
import com.jobportal.dto.Experience;
import com.jobportal.dto.OnlineProfileLink;
import com.jobportal.dto.ProfileDTO;
import com.jobportal.dto.ProfileDTO.DesiredJob;
import com.jobportal.dto.ProfileDTO.Education;
import com.jobportal.dto.ProfileDTO.PersonalDetails;
import com.jobportal.dto.WorkSample;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "profiles")
public class Profile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String email;
    private String jobTitle;
    private String company;
    private String location;

    @Column(length = 2000)
    private String about;

    @Column(columnDefinition = "bytea")
    private byte[] picture;

    @Column(columnDefinition = "bytea")
    private byte[] banner;

    private Long totalExp;
    private String cvHeadline;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<String> skills;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<Experience> experiences;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<Certification> certifications;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<String> itSkills;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<OnlineProfileLink> onlineProfiles;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<WorkSample> workSamples;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<Education> education;

    @Column(length = 4000)
    private String profileSummary;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private PersonalDetails personalDetails;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private DesiredJob desiredJob;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<Long> savedJobs;

    private String cvFileName;
    private String cvLastUpdated;

    // Account/Employee Details
    private String reportingManager;
    private String mobileNumber;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private Long createdBy;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    private Long updatedBy;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    private String username;
    @Column(name = "user_group")
    private String group;
    private String role;

    // Company Details (for EMPLOYER type)
    private String companyType;
    private String industryType;
    private String contactPerson;
    private String alias;
    private String contactDesignation;
    private String websiteUrl;
    private String profileHotVacancies;
    private String profileClassifieds;
    private String phone1;
    private String phone2;
    private String fax;

    // Address Details
    private String addressLabel;
    private String address;
    private String country;
    private String city;
    private String pincode;

    private Integer resumeViewCount;

    public ProfileDTO toDTO() {
        String pictureBase64 = null;
        if (this.picture != null && this.picture.length > 0) {
            try {
                pictureBase64 = Base64.getEncoder().encodeToString(this.picture);
            } catch (Exception e) {
                System.err.println("Failed to encode picture for profile ID: " + this.id + " - " + e.getMessage());
            }
        }

        String bannerBase64 = null;
        if (this.banner != null && this.banner.length > 0) {
            try {
                bannerBase64 = Base64.getEncoder().encodeToString(this.banner);
            } catch (Exception e) {
                System.err.println("Failed to encode banner for profile ID: " + this.id + " - " + e.getMessage());
            }
        }

        ProfileDTO dto = new ProfileDTO();
        dto.setId(this.id);
        dto.setName(this.name);
        dto.setEmail(this.email);
        dto.setJobTitle(this.jobTitle);
        dto.setCompany(this.company);
        dto.setLocation(this.location);
        dto.setAbout(this.about);
        dto.setPicture(pictureBase64);
        dto.setBanner(bannerBase64);
        dto.setTotalExp(this.totalExp);
        dto.setCvHeadline(this.cvHeadline);
        dto.setSkills(this.skills);
        dto.setExperiences(this.experiences);
        dto.setCertifications(this.certifications);
        dto.setItSkills(this.itSkills);
        dto.setOnlineProfiles(this.onlineProfiles);
        dto.setWorkSamples(this.workSamples);
        dto.setEducation(this.education);
        dto.setProfileSummary(this.profileSummary);
        dto.setPersonalDetails(this.personalDetails);
        dto.setDesiredJob(this.desiredJob);
        dto.setSavedJobs(this.savedJobs);
        dto.setCvFileName(this.cvFileName);
        dto.setCvLastUpdated(this.cvLastUpdated);
        dto.setReportingManager(this.reportingManager);
        dto.setMobileNumber(this.mobileNumber);
        dto.setUsername(this.username);
        dto.setGroup(this.group);
        dto.setRole(this.role);
        dto.setCompanyType(this.companyType);
        dto.setIndustryType(this.industryType);
        dto.setContactPerson(this.contactPerson);
        dto.setAlias(this.alias);
        dto.setContactDesignation(this.contactDesignation);
        dto.setWebsiteUrl(this.websiteUrl);
        dto.setProfileHotVacancies(this.profileHotVacancies);
        dto.setProfileClassifieds(this.profileClassifieds);
        dto.setPhone1(this.phone1);
        dto.setPhone2(this.phone2);
        dto.setFax(this.fax);
        dto.setAddressLabel(this.addressLabel);
        dto.setAddress(this.address);
        dto.setCountry(this.country);
        dto.setCity(this.city);
        dto.setPincode(this.pincode);
        dto.setResumeViewCount(this.resumeViewCount);
        dto.setCreatedAt(this.createdAt);
        dto.setCreatedBy(this.createdBy);
        dto.setUpdatedAt(this.updatedAt);
        dto.setUpdatedBy(this.updatedBy);
        return dto;
    }
}
