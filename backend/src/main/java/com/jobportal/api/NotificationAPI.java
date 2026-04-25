package com.jobportal.api;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jobportal.dto.ResponseDTO;
import com.jobportal.entity.Notification;
import com.jobportal.exception.JobPortalException;
import com.jobportal.service.CurrentUserService;
import com.jobportal.service.NotificationService;

@RestController
@CrossOrigin
@RequestMapping("/api/ahrm/v3/notification")
@Validated
public class NotificationAPI {
	@Autowired
	private NotificationService notificationService;

	@Autowired
	private CurrentUserService currentUserService;

	@GetMapping("/get/{userId}")
	public ResponseEntity<List<Notification>> getNotifications(@PathVariable Long userId) throws JobPortalException {
		enforceNotificationAccess(userId);
		return new ResponseEntity<>(notificationService.getUnreadNotifications(userId), HttpStatus.OK);
	}

	@GetMapping("/me")
	public ResponseEntity<List<Notification>> getMyNotifications() {
		Long userId = currentUserService.getCurrentUser().id();
		return new ResponseEntity<>(notificationService.getUnreadNotifications(userId), HttpStatus.OK);
	}

	@PutMapping("/read/{id}")
	public ResponseEntity<ResponseDTO> readNotification(@PathVariable Long id) throws JobPortalException {
		notificationService.readNotification(id, currentUserService.getCurrentUser());
		return new ResponseEntity<>(new ResponseDTO("Success"), HttpStatus.OK);
	}

	private void enforceNotificationAccess(Long userId) throws JobPortalException {
		CurrentUserService.CurrentUser currentUser = currentUserService.getCurrentUser();
		if (!currentUser.isAdmin() && !userId.equals(currentUser.id())) {
			throw new JobPortalException("You are not authorized to access these notifications");
		}
	}
}
