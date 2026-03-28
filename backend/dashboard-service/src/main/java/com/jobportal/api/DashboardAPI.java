package com.jobportal.api;

import com.jobportal.service.DashboardDataService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class DashboardAPI {

    private final DashboardDataService dashboardDataService;

    public DashboardAPI(DashboardDataService dashboardDataService) {
        this.dashboardDataService = dashboardDataService;
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
}
