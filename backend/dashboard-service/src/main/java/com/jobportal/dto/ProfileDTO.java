package com.jobportal.dto;

import java.util.Base64;
import java.util.Collections;
import java.util.List;

import com.jobportal.entity.Profile;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProfileDTO {

    private Long id;

    @NotBlank(message = "{profile.name.required}")
    @Size(max = 120, message = "{profile.name.max}")
    private String name;

    @NotBlank(message = "{profile.email.required}")
    @Email(message = "{profile.email.invalid}")
    private String email;

    @Size(max = 120, message = "{profile.jobTitle.max}")
    private String jobTitle;

    @Size(max = 120, message = "{profile.company.max}")
    private String company;

    @Size(max = 120, message = "{profile.location.max}")
    private String location;

    @Size(max = 2000, message = "{profile.about.max}")
    private String about;
    private String picture;
    private String banner;

    @PositiveOrZero(message = "{profile.totalExp.invalid}")
    private Long totalExp;

    @Size(max = 200, message = "{profile.cvHeadline.max}")
    private String cvHeadline;

    @Size(max = 100, message = "{profile.skills.max}")
    private List<@Size(max = 80, message = "{profile.skill.item.max}") String> skills;

    @Valid
    private List<Experience> experiences;

    @Valid
    private List<Certification> certifications;

    @Size(max = 100, message = "{profile.itSkills.max}")
    private List<@Size(max = 80, message = "{profile.itSkill.item.max}") String> itSkills;

    @Size(max = 20, message = "{profile.onlineProfiles.max}")
    private List<@Valid OnlineProfileLink> onlineProfiles;

    @Size(max = 20, message = "{profile.workSamples.max}")
    private List<@Valid WorkSample> workSamples;

    @Valid
    private List<Education> education;

    @Size(max = 4000, message = "{profile.summary.max}")
    private String profileSummary;

    @Valid
    private PersonalDetails personalDetails;

    @Valid
    private DesiredJob desiredJob;

    private List<Long> savedJobs;

    @Size(max = 255, message = "{profile.cvFileName.max}")
    private String cvFileName;

    @Size(max = 50, message = "{profile.cvLastUpdated.max}")
    private String cvLastUpdated;

    @Size(max = 120, message = "{profile.reportingManager.max}")
    private String reportingManager;

    @Size(max = 20, message = "{profile.mobileNumber.max}")
    private String mobileNumber;

    @Size(max = 80, message = "{profile.username.max}")
    private String username;

    @Size(max = 100, message = "{profile.group.max}")
    private String group;

    @Size(max = 80, message = "{profile.role.max}")
    private String role;

    @Size(max = 100, message = "{profile.companyType.max}")
    private String companyType;

    @Size(max = 100, message = "{profile.industryType.max}")
    private String industryType;

    @Size(max = 120, message = "{profile.contactPerson.max}")
    private String contactPerson;

    @Size(max = 120, message = "{profile.alias.max}")
    private String alias;

    @Size(max = 120, message = "{profile.contactDesignation.max}")
    private String contactDesignation;

    @Size(max = 255, message = "{profile.websiteUrl.max}")
    private String websiteUrl;

    @Size(max = 200, message = "{profile.profileHotVacancies.max}")
    private String profileHotVacancies;

    @Size(max = 200, message = "{profile.profileClassifieds.max}")
    private String profileClassifieds;

    @Size(max = 20, message = "{profile.phone1.max}")
    private String phone1;

    @Size(max = 20, message = "{profile.phone2.max}")
    private String phone2;

    @Size(max = 20, message = "{profile.fax.max}")
    private String fax;

    @Size(max = 100, message = "{profile.addressLabel.max}")
    private String addressLabel;

    @Size(max = 500, message = "{profile.address.max}")
    private String address;

    @Size(max = 80, message = "{profile.country.max}")
    private String country;

    @Size(max = 80, message = "{profile.city.max}")
    private String city;

    @Size(max = 10, message = "{profile.pincode.max}")
    private String pincode;

    private Integer resumeViewCount;

    public Profile toEntity() {
        byte[] pictureBytes = null;
        if (this.picture != null && !this.picture.isEmpty()) {
            try {
                pictureBytes = Base64.getDecoder().decode(this.picture);
            } catch (IllegalArgumentException e) {
                System.err.println("Failed to decode picture Base64 for profile ID: " + this.id + " - " + e.getMessage());
            }
        }

        byte[] bannerBytes = null;
        if (this.banner != null && !this.banner.isEmpty()) {
            try {
                bannerBytes = Base64.getDecoder().decode(this.banner);
            } catch (IllegalArgumentException e) {
                System.err.println("Failed to decode banner Base64 for profile ID: " + this.id + " - " + e.getMessage());
            }
        }

        return new Profile(
                this.id, this.name, this.email, this.jobTitle, this.company,
                this.location, this.about, pictureBytes, bannerBytes,
                this.totalExp != null ? this.totalExp : 0L,
                this.cvHeadline,
                this.skills != null ? this.skills : Collections.emptyList(),
                this.experiences != null ? this.experiences : Collections.emptyList(),
                this.certifications != null ? this.certifications : Collections.emptyList(),
                this.itSkills != null ? this.itSkills : Collections.emptyList(),
                this.onlineProfiles != null ? this.onlineProfiles : Collections.emptyList(),
                this.workSamples != null ? this.workSamples : Collections.emptyList(),
                this.education != null ? this.education : Collections.emptyList(),
                this.profileSummary, this.personalDetails, this.desiredJob,
                this.savedJobs != null ? this.savedJobs : Collections.emptyList(),
                this.cvFileName, this.cvLastUpdated,
                this.reportingManager, this.mobileNumber, this.username, this.group, this.role,
                this.companyType, this.industryType, this.contactPerson, this.alias,
                this.contactDesignation, this.websiteUrl, this.profileHotVacancies,
                this.profileClassifieds, this.phone1, this.phone2, this.fax,
                    this.addressLabel, this.address, this.country, this.city, this.pincode,
                    this.resumeViewCount != null ? this.resumeViewCount : 0);
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PersonalDetails {
        @Size(max = 10, message = "{profile.dob.max}")
        private String dateOfBirth;
        @Size(max = 50, message = "{profile.gender.max}")
        private String gender;
        @Size(max = 80, message = "{profile.nationality.max}")
        private String nationality;
        @Size(max = 50, message = "{profile.maritalStatus.max}")
        private String maritalStatus;
        @Size(max = 80, message = "{profile.drivingLicense.max}")
        private String drivingLicense;
        @Size(max = 120, message = "{profile.currentLocation.max}")
        private String currentLocation;
        @Size(max = 10, message = "{profile.languages.max}")
        private List<@Size(max = 40, message = "{profile.language.item.max}") String> languagesKnown;
        @Size(max = 80, message = "{profile.visaStatus.max}")
        private String visaStatus;
        @Size(max = 80, message = "{profile.religion.max}")
        private String religion;
        @Email(message = "{profile.alternateEmail.invalid}")
        @Size(max = 120, message = "{profile.alternateEmail.max}")
        private String alternateEmail;
        @Size(max = 20, message = "{profile.alternateContact.max}")
        private String alternateContact;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DesiredJob {
        @Size(max = 20, message = "{profile.designations.max}")
        private List<@Size(max = 120, message = "{profile.designation.item.max}") String> preferredDesignations;
        @Size(max = 20, message = "{profile.locations.max}")
        private List<@Size(max = 120, message = "{profile.location.item.max}") String> preferredLocations;
        @Size(max = 20, message = "{profile.industries.max}")
        private List<@Size(max = 120, message = "{profile.industry.item.max}") String> preferredIndustries;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Education {
        @Size(max = 120, message = "{profile.degree.max}")
        private String degree;
        @Size(max = 120, message = "{profile.field.max}")
        private String field;
        @Size(max = 200, message = "{profile.college.max}")
        private String college;
        @Size(max = 4, message = "{profile.year.max}")
        private String yearOfPassing;
    }
}
