package com.jobportal.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.jobportal.dto.NotificationDTO;
import com.jobportal.dto.NotificationStatus;
import com.jobportal.entity.Notification;
import com.jobportal.exception.JobPortalException;
import com.jobportal.repository.NotificationRepository;
import com.jobportal.service.CurrentUserService.CurrentUser;

@Service("notificationService")
public class NotificationServiceImpl implements NotificationService {
	@Autowired
	private NotificationRepository notificationRepository;

	@Override
	public void sendNotification(NotificationDTO notificationDTO) throws JobPortalException {
		notificationDTO.setStatus(NotificationStatus.UNREAD);
		notificationDTO.setTimestamp(LocalDateTime.now());
		notificationRepository.save(notificationDTO.toEntity());
	}

	@Override
	public List<Notification> getUnreadNotifications(Long userId) {
		return notificationRepository.findByUserIdAndStatus(userId, NotificationStatus.UNREAD);
	}

	@Override
	public void readNotification(Long id, CurrentUser currentUser) throws JobPortalException {
		Notification noti = notificationRepository.findById(id)
				.orElseThrow(() -> new JobPortalException("No Notification found"));
		if (!currentUser.isAdmin() && !noti.getUserId().equals(currentUser.id())) {
			throw new JobPortalException("You are not authorized to update this notification");
		}
		noti.setStatus(NotificationStatus.READ);
		notificationRepository.save(noti);
	}
}
