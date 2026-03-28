package com.jobportal.entity;

import java.util.Base64;
import java.util.List;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.jobportal.dto.Certification;
import com.jobportal.dto.Experience;
import com.jobportal.dto.ProfileDTO;
import com.jobportal.dto.ProfileDTO.DesiredJob;
import com.jobportal.dto.ProfileDTO.Education;
import com.jobportal.dto.ProfileDTO.PersonalDetails;

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
    private List<String> onlineProfiles;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<String> workSamples;

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

        return new ProfileDTO(
                this.id, this.name, this.email, this.jobTitle, this.company,
                this.location, this.about, pictureBase64, bannerBase64,
                this.totalExp, this.cvHeadline, this.skills, this.experiences,
                this.certifications, this.itSkills, this.onlineProfiles,
                this.workSamples, this.education, this.profileSummary,
                this.personalDetails, this.desiredJob, this.savedJobs,
                this.cvFileName, this.cvLastUpdated, this.reportingManager,
                this.mobileNumber, this.username, this.group, this.role,
                this.companyType, this.industryType, this.contactPerson,
                this.alias, this.contactDesignation, this.websiteUrl,
                this.profileHotVacancies, this.profileClassifieds,
                this.phone1, this.phone2, this.fax,
                this.addressLabel, this.address, this.country, this.city, this.pincode);
    }
}
