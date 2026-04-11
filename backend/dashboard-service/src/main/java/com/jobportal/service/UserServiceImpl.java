package com.jobportal.service;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.jobportal.dto.LoginDTO;
import com.jobportal.dto.AccountType;
import com.jobportal.dto.EmployerRole;
import com.jobportal.dto.NotificationDTO;
import com.jobportal.dto.ResponseDTO;
import com.jobportal.dto.UserDTO;
import com.jobportal.entity.OTP;
import com.jobportal.entity.User;
import com.jobportal.exception.JobPortalException;
import com.jobportal.repository.OTPRepository;
import com.jobportal.repository.UserRepository;
import com.jobportal.utility.Data;
import com.jobportal.utility.Utilities;

import jakarta.mail.internet.MimeMessage;

@Service("userService")
public class UserServiceImpl implements UserService {
	@Autowired
	private UserRepository userRepository;

	@Autowired
	private OTPRepository otpRepository;

	@Autowired
	private ProfileService profileService;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@Autowired
	private JavaMailSender mailSender;

	@Autowired
	private NotificationService notificationService;

	@Autowired
	private CurrentUserService currentUserService;

	@Override
	@SuppressWarnings("null")
	public UserDTO registerUser(UserDTO userDTO) throws JobPortalException {
		Optional<User> optional = userRepository.findByEmailIgnoreCase(userDTO.getEmail());
		if (optional.isPresent())
			throw new JobPortalException("User with email " + userDTO.getEmail() + " already exists");
		userDTO.setPassword(passwordEncoder.encode(userDTO.getPassword()));
		if (userDTO.getAccountType() == AccountType.EMPLOYER && userDTO.getEmployerRole() == null) {
			userDTO.setEmployerRole(EmployerRole.OWNER);
		}
		userDTO.setProfileId(profileService.createProfile(userDTO));
		User user = userRepository.save(userDTO.toEntity());
		user.setPassword(null);
		return user.toDTO();
	}

	@Override
	public UserDTO loginUser(LoginDTO loginDTO) throws JobPortalException {
		User user = userRepository.findByEmailIgnoreCase(loginDTO.getEmail())
				.orElseThrow(() -> new JobPortalException("User not found with email: " + loginDTO.getEmail()));
		if (!passwordEncoder.matches(loginDTO.getPassword(), user.getPassword()))
			throw new JobPortalException("Invalid email or password");
		user.setPassword(null);
		return user.toDTO();
	}

	@Override
	public UserDTO linkEmployerMember(String email) throws JobPortalException {
		CurrentUserService.CurrentUser currentUser = currentUserService.getCurrentUser();
		if (currentUser.accountType() != AccountType.EMPLOYER && currentUser.accountType() != AccountType.ADMIN) {
			throw new JobPortalException("Employer access required");
		}

		if (currentUser.accountType() == AccountType.EMPLOYER && currentUser.employerRole() != EmployerRole.OWNER) {
			throw new JobPortalException("Only OWNER can add employer members");
		}

		if (currentUser.profileId() == null) {
			throw new JobPortalException("Current employer profile is not configured");
		}

		String safeEmail = Objects.requireNonNull(email, "Email is required").trim();
		if (safeEmail.isBlank()) {
			throw new JobPortalException("Email is required");
		}

		User target = userRepository.findByEmailIgnoreCase(safeEmail)
				.orElseGet(() -> {
					User invited = new User();
					invited.setName(deriveDisplayNameFromEmail(safeEmail));
					invited.setEmail(safeEmail);
					invited.setPassword(passwordEncoder.encode(generateInviteTemporaryPassword()));
					invited.setAccountType(AccountType.EMPLOYER);
					invited.setEmployerRole(EmployerRole.RECRUITER);
					invited.setProfileId(currentUser.profileId());
					return userRepository.save(invited);
				});

		if (target.getId() != null && target.getId().equals(currentUser.id())) {
			throw new JobPortalException("Current employer user is already linked");
		}

		target.setAccountType(AccountType.EMPLOYER);
		target.setEmployerRole(EmployerRole.RECRUITER);
		target.setProfileId(currentUser.profileId());
		target = userRepository.save(target);

		NotificationDTO noti = new NotificationDTO();
		noti.setUserId(target.getId());
		noti.setAction("Employer Access Granted");
		noti.setMessage("You were added to an employer portal workspace");
		noti.setRoute("/dashboard?tab=employers");
		notificationService.sendNotification(noti);

		UserDTO dto = target.toDTO();
		dto.setPassword(null);
		return dto;
	}

	@Override
	public Boolean sendEmployerInviteOTP(String email) throws Exception {
		CurrentUserService.CurrentUser currentUser = currentUserService.getCurrentUser();
		if (currentUser.accountType() != AccountType.EMPLOYER && currentUser.accountType() != AccountType.ADMIN) {
			throw new JobPortalException("Employer access required");
		}

		if (currentUser.accountType() == AccountType.EMPLOYER && currentUser.employerRole() != EmployerRole.OWNER) {
			throw new JobPortalException("Only OWNER can trigger invite OTP");
		}

		if (currentUser.profileId() == null) {
			throw new JobPortalException("Current employer profile is not configured");
		}

		String safeEmail = Objects.requireNonNull(email, "Email is required").trim();
		if (safeEmail.isBlank()) {
			throw new JobPortalException("Email is required");
		}

		User target = userRepository.findByEmailIgnoreCase(safeEmail)
				.orElseThrow(() -> new JobPortalException("User not found with email: " + safeEmail));

		if (target.getAccountType() != AccountType.EMPLOYER || !currentUser.profileId().equals(target.getProfileId())) {
			throw new JobPortalException("User is not part of this employer workspace");
		}

		return sendOTP(target.getEmail());
	}

	private String deriveDisplayNameFromEmail(String email) {
		int atIndex = email.indexOf('@');
		String local = atIndex > 0 ? email.substring(0, atIndex) : email;
		String normalized = local.replaceAll("[^A-Za-z0-9._-]", " ").replace('.', ' ').replace('_', ' ').replace('-', ' ').trim();
		if (normalized.isBlank()) {
			return "Invited Member";
		}
		String[] tokens = normalized.split("\\s+");
		StringBuilder name = new StringBuilder();
		for (String token : tokens) {
			if (token.isBlank()) {
				continue;
			}
			if (name.length() > 0) {
				name.append(' ');
			}
			String lower = token.toLowerCase(Locale.ROOT);
			name.append(Character.toUpperCase(lower.charAt(0)));
			if (lower.length() > 1) {
				name.append(lower.substring(1));
			}
		}
		return name.length() == 0 ? "Invited Member" : name.toString();
	}

	private String generateInviteTemporaryPassword() {
		String token = UUID.randomUUID().toString().replace("-", "");
		return "Tmp@" + token.substring(0, 10) + "1a";
	}

	@Override
	public List<UserDTO> getEmployerMembers() throws JobPortalException {
		CurrentUserService.CurrentUser currentUser = currentUserService.getCurrentUser();
		if (currentUser.accountType() != AccountType.EMPLOYER && currentUser.accountType() != AccountType.ADMIN) {
			throw new JobPortalException("Employer access required");
		}
		if (currentUser.profileId() == null) {
			throw new JobPortalException("Current employer profile is not configured");
		}

		return userRepository.findByProfileIdAndAccountType(currentUser.profileId(), AccountType.EMPLOYER)
				.stream()
				.map(User::toDTO)
				.peek((dto) -> dto.setPassword(null))
				.toList();
	}

	@Override
	public UserDTO updateEmployerMemberRole(Long userId, EmployerRole employerRole) throws JobPortalException {
		CurrentUserService.CurrentUser currentUser = currentUserService.getCurrentUser();
		if (currentUser.accountType() != AccountType.EMPLOYER && currentUser.accountType() != AccountType.ADMIN) {
			throw new JobPortalException("Employer access required");
		}

		if (currentUser.accountType() == AccountType.EMPLOYER && currentUser.employerRole() != EmployerRole.OWNER) {
			throw new JobPortalException("Only OWNER can manage employer member roles");
		}

		if (currentUser.profileId() == null) {
			throw new JobPortalException("Current employer profile is not configured");
		}

		Long safeUserId = Objects.requireNonNull(userId, "User ID is required");
		EmployerRole safeRole = Objects.requireNonNull(employerRole, "Employer role is required");
		User target = userRepository.findById(safeUserId)
				.orElseThrow(() -> new JobPortalException("User not found"));

		if (!currentUser.profileId().equals(target.getProfileId()) || target.getAccountType() != AccountType.EMPLOYER) {
			throw new JobPortalException("User is not part of this employer workspace");
		}

		if (target.getId() != null && target.getId().equals(currentUser.id()) && safeRole == EmployerRole.VIEWER) {
			throw new JobPortalException("You cannot downgrade your own role to VIEWER");
		}

		if (target.getEmployerRole() == EmployerRole.OWNER && safeRole != EmployerRole.OWNER) {
			long ownerCount = userRepository.countByProfileIdAndAccountTypeAndEmployerRole(
					currentUser.profileId(),
					AccountType.EMPLOYER,
					EmployerRole.OWNER);
			if (ownerCount <= 1) {
				throw new JobPortalException("At least one OWNER must remain in the employer workspace");
			}
		}

		target.setEmployerRole(safeRole);
		target = userRepository.save(target);
		UserDTO dto = target.toDTO();
		dto.setPassword(null);
		return dto;
	}

	@Override
	public Boolean sendOTP(String email) throws Exception {
		if (email == null || email.isBlank()) {
			throw new JobPortalException("Email is required");
		}
		String safeEmail = Objects.requireNonNull(email).trim();
		// User may not exist yet during registration; use their name if available
		String recipientName = userRepository.findByEmailIgnoreCase(safeEmail)
				.map(User::getName)
				.orElse("there");
		MimeMessage mm = mailSender.createMimeMessage();
		MimeMessageHelper message = new MimeMessageHelper(mm, true);
		message.setTo(Objects.requireNonNull(safeEmail));
		message.setSubject("Your OTP Code");
		String generatedOtp = Utilities.generateOTP();
		OTP otp = new OTP(safeEmail, generatedOtp, LocalDateTime.now());
		otpRepository.save(otp);
		String mailBody = Data.getMessageBody(generatedOtp, recipientName);
		message.setText(mailBody != null ? mailBody : "", true);
		mailSender.send(mm);
		return true;
	}

	@Override
	public Boolean verifyOtp(String email, String otp) throws JobPortalException {
		String safeEmail = Objects.requireNonNull(email, "Email is required");
		OTP otpEntity = otpRepository.findById(safeEmail)
				.orElseThrow(() -> new JobPortalException("OTP not found or expired for email: " + email));
		if (!otpEntity.getOtpCode().equals(otp))
			throw new JobPortalException("Incorrect OTP. Please try again.");
		return true;
	}

	@Scheduled(fixedRate = 60000)
	public void removeExpiredOTPs() {
		LocalDateTime expiryTime = LocalDateTime.now().minusMinutes(5);
		List<OTP> expiredOTPs = otpRepository.findByCreationTimeBefore(expiryTime);
		if (!expiredOTPs.isEmpty()) {
			otpRepository.deleteAll(expiredOTPs);
			System.out.println("Removed " + expiredOTPs.size() + " expired OTPs");
		}
	}

	@Override
	public ResponseDTO changePassword(LoginDTO loginDTO) throws JobPortalException {
		User user = userRepository.findByEmailIgnoreCase(loginDTO.getEmail())
				.orElseThrow(() -> new JobPortalException("User not found with email: " + loginDTO.getEmail()));
		user.setPassword(passwordEncoder.encode(loginDTO.getPassword()));
		userRepository.save(user);
		NotificationDTO noti = new NotificationDTO();
		noti.setUserId(user.getId());
		noti.setMessage("Password Reset Successfull");
		noti.setAction("Password Reset");
		notificationService.sendNotification(noti);
		return new ResponseDTO("Password changed successfully.");
	}

	@Override
	public UserDTO getUserByEmail(String email) throws JobPortalException {
		return userRepository.findByEmailIgnoreCase(email)
				.orElseThrow(() -> new JobPortalException("User not found with email: " + email)).toDTO();
	}

	@Override
	public UserDTO getCurrentUser() throws JobPortalException {
		CurrentUserService.CurrentUser currentUser = currentUserService.getCurrentUser();
		UserDTO user = getUserByEmail(currentUser.email());
		user.setPassword(null);
		return user;
	}
}
