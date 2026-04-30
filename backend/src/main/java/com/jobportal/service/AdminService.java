package com.jobportal.service;

import com.jobportal.dto.AdminOverviewDTO;

import java.util.List;
import com.jobportal.dto.AdminProfileCompletionDTO;

public interface AdminService {
    AdminOverviewDTO getOverview();
    List<AdminProfileCompletionDTO> getProfileCompletionList();
}
