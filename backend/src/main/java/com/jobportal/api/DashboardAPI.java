package com.jobportal.api;

import com.jobportal.dto.StudentAdvisorChatRequestDTO;
import com.jobportal.dto.StudentAdvisorChatResponseDTO;
import com.jobportal.dto.StudentIntakeRecommendationDTO;
import com.jobportal.dto.StudentIntakeRequestDTO;
import com.jobportal.exception.JobPortalException;
import com.jobportal.service.AiAssistantService;
import com.jobportal.service.DashboardDataService;
import com.jobportal.service.SalaryAnalyticsService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api", "/api/ahrm/v3"})
public class DashboardAPI {

    private final DashboardDataService dashboardDataService;
    private final SalaryAnalyticsService salaryAnalyticsService;
    private final AiAssistantService aiAssistantService;

    public DashboardAPI(DashboardDataService dashboardDataService, SalaryAnalyticsService salaryAnalyticsService, AiAssistantService aiAssistantService) {
        this.dashboardDataService = dashboardDataService;
        this.salaryAnalyticsService = salaryAnalyticsService;
        this.aiAssistantService = aiAssistantService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardRoot() {
        return ResponseEntity.ok(dashboardDataService.getDashboardRoot());
    }

    @GetMapping("/dashboard/{audience}")
    public ResponseEntity<Map<String, Object>> getDashboardByAudience(@PathVariable String audience) {
        return ResponseEntity.ok(dashboardDataService.getDashboardByAudience(audience));
    }

    @GetMapping("/audiences")
    public ResponseEntity<List<String>> getAudiences() {
        return ResponseEntity.ok(dashboardDataService.getAudienceIds());
    }

    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> search(
            @RequestParam(defaultValue = "candidates") String audience,
            @RequestParam(defaultValue = "") String q) {
        return ResponseEntity.ok(dashboardDataService.searchCollection(audience, q));
    }

    @GetMapping("/dashboard/candidates/salary-trends")
    public ResponseEntity<Map<String, Object>> getCandidateSalaryTrends(
            @RequestParam(defaultValue = "1Y") String range,
            @RequestParam(defaultValue = "") String industry,
            @RequestParam(defaultValue = "All Regions") String location,
            @RequestParam(defaultValue = "All Levels") String experience) {
        return ResponseEntity.ok(salaryAnalyticsService.getCandidateSalaryTrends(range, industry, location, experience));
    }

    @PostMapping("/dashboard/students/intake-recommendation")
    public ResponseEntity<StudentIntakeRecommendationDTO> getStudentIntakeRecommendation(
            @RequestBody @Valid StudentIntakeRequestDTO request) throws JobPortalException {
        return ResponseEntity.ok(aiAssistantService.getStudentIntakeRecommendation(request));
    }

    @PostMapping("/dashboard/students/chatbot")
    public ResponseEntity<StudentAdvisorChatResponseDTO> chatWithStudentAdvisor(
            @RequestBody @Valid StudentAdvisorChatRequestDTO request) throws JobPortalException {
        return ResponseEntity.ok(aiAssistantService.chatWithStudentAdvisor(request));
    }

    @PostMapping(value = "/dashboard/students/chatbot/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamStudentAdvisorChat(
            @RequestBody @Valid StudentAdvisorChatRequestDTO request) {
        SseEmitter emitter = new SseEmitter(0L);
        aiAssistantService.streamStudentAdvisorChat(request).subscribe(
                chunk -> {
                    try {
                        emitter.send(SseEmitter.event().name("message").data(chunk));
                    } catch (Exception ex) {
                        emitter.completeWithError(ex);
                    }
                },
                error -> {
                    try {
                        emitter.send(SseEmitter.event().name("error").data("Student advisor stream failed."));
                    } catch (Exception ignored) {
                        // ignore send failures while closing stream
                    }
                    emitter.completeWithError(error);
                },
                () -> {
                    try {
                        emitter.send(SseEmitter.event().name("done").data("[DONE]"));
                    } catch (Exception ignored) {
                        // ignore send failures while closing stream
                    }
                    emitter.complete();
                }
        );
        return emitter;
    }
}
