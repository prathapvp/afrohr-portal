package com.jobportal.service;

import java.util.Map;

public interface SalaryAnalyticsService {
    Map<String, Object> getCandidateSalaryTrends(String range, String industry, String location, String experience);
}
