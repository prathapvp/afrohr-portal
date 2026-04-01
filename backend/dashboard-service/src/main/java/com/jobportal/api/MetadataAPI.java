package com.jobportal.api;

import java.util.List;
import java.util.Locale;
import java.util.Objects;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jobportal.entity.MetadataEntry;
import com.jobportal.entity.MetadataType;
import com.jobportal.exception.JobPortalException;
import com.jobportal.repository.MetadataEntryRepository;
import com.jobportal.service.CurrentUserService;

@RestController
@CrossOrigin
@RequestMapping("/api/ahrm/v3")
public class MetadataAPI {

    private final MetadataEntryRepository metadataEntryRepository;
    private final CurrentUserService currentUserService;

    public MetadataAPI(MetadataEntryRepository metadataEntryRepository, CurrentUserService currentUserService) {
        this.metadataEntryRepository = metadataEntryRepository;
        this.currentUserService = currentUserService;
    }

    record MetadataRequest(String name, String description) {}
    record MessageResponse(String message) {}

    private MetadataType resolveType(String path) {
        return switch (path) {
            case "departments" -> MetadataType.DEPARTMENT;
            case "industries" -> MetadataType.INDUSTRY;
            case "employment-types" -> MetadataType.EMPLOYMENT_TYPE;
            case "work-modes" -> MetadataType.WORK_MODE;
            default -> throw new IllegalArgumentException("Unsupported metadata path");
        };
    }

    private String normalizeName(String value) {
        return Objects.toString(value, "").trim();
    }

    private String normalizeDescription(String value) {
        return Objects.toString(value, "").trim();
    }

    private ResponseEntity<?> validatePayload(MetadataRequest request) {
        String name = normalizeName(request.name());
        if (name.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Name is required."));
        }
        return null;
    }

    private void enforceAdminAccess() throws JobPortalException {
        CurrentUserService.CurrentUser currentUser = currentUserService.getCurrentUser();
        if (!currentUser.isAdmin()) {
            throw new JobPortalException("Admin access required for metadata operations");
        }
    }

    private String titleCasePath(String path) {
        String normalized = path.replace('-', ' ');
        if (normalized.isEmpty()) {
            return "Metadata";
        }
        return normalized.substring(0, 1).toUpperCase(Locale.ROOT) + normalized.substring(1);
    }

    @GetMapping("/departments")
    public ResponseEntity<List<MetadataEntry>> getDepartments() {
        return ResponseEntity.ok(metadataEntryRepository.findByTypeOrderByNameAsc(MetadataType.DEPARTMENT));
    }

    @GetMapping("/departments/{id}")
    public ResponseEntity<?> getDepartment(@PathVariable Long id) {
        return metadataEntryRepository.findByIdAndType(id, MetadataType.DEPARTMENT)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse("Department not found.")));
    }

    @PostMapping("/departments")
    public ResponseEntity<?> createDepartment(@RequestBody MetadataRequest request) throws JobPortalException {
        enforceAdminAccess();
        ResponseEntity<?> validation = validatePayload(request);
        if (validation != null) {
            return validation;
        }

        String name = normalizeName(request.name());
        if (metadataEntryRepository.existsByTypeAndNameIgnoreCase(MetadataType.DEPARTMENT, name)) {
            return ResponseEntity.badRequest().body(new MessageResponse("Department already exists."));
        }

        MetadataEntry entry = new MetadataEntry();
        entry.setType(MetadataType.DEPARTMENT);
        entry.setName(name);
        entry.setDescription(normalizeDescription(request.description()));
        metadataEntryRepository.save(entry);
        return ResponseEntity.status(HttpStatus.CREATED).body(new MessageResponse("Department created successfully."));
    }

    @PutMapping("/departments/{id}")
    public ResponseEntity<?> updateDepartment(@PathVariable Long id, @RequestBody MetadataRequest request) throws JobPortalException {
        enforceAdminAccess();
        ResponseEntity<?> validation = validatePayload(request);
        if (validation != null) {
            return validation;
        }

        return metadataEntryRepository.findByIdAndType(id, MetadataType.DEPARTMENT)
                .<ResponseEntity<?>>map(entry -> {
                    entry.setName(normalizeName(request.name()));
                    entry.setDescription(normalizeDescription(request.description()));
                    metadataEntryRepository.save(entry);
                    return ResponseEntity.ok(new MessageResponse("Department updated successfully."));
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse("Department not found.")));
    }

    @DeleteMapping("/departments/{id}")
    public ResponseEntity<?> deleteDepartment(@PathVariable Long id) throws JobPortalException {
        enforceAdminAccess();
        return metadataEntryRepository.findByIdAndType(id, MetadataType.DEPARTMENT)
                .<ResponseEntity<?>>map(entry -> {
                    metadataEntryRepository.delete(entry);
                    return ResponseEntity.ok(new MessageResponse("Department deleted successfully."));
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse("Department not found.")));
    }

    @GetMapping("/industries")
    public ResponseEntity<List<MetadataEntry>> getIndustries() {
        return ResponseEntity.ok(metadataEntryRepository.findByTypeOrderByNameAsc(MetadataType.INDUSTRY));
    }

    @GetMapping("/industries/{id}")
    public ResponseEntity<?> getIndustry(@PathVariable Long id) {
        return metadataEntryRepository.findByIdAndType(id, MetadataType.INDUSTRY)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse("Industry not found.")));
    }

    @PostMapping("/industries")
    public ResponseEntity<?> createIndustry(@RequestBody MetadataRequest request) throws JobPortalException {
        enforceAdminAccess();
        return createByType("industries", request);
    }

    @PutMapping("/industries/{id}")
    public ResponseEntity<?> updateIndustry(@PathVariable Long id, @RequestBody MetadataRequest request) throws JobPortalException {
        enforceAdminAccess();
        return updateByType("industries", id, request);
    }

    @DeleteMapping("/industries/{id}")
    public ResponseEntity<?> deleteIndustry(@PathVariable Long id) throws JobPortalException {
        enforceAdminAccess();
        return deleteByType("industries", id);
    }

    @GetMapping("/employment-types")
    public ResponseEntity<List<MetadataEntry>> getEmploymentTypes() {
        return ResponseEntity.ok(metadataEntryRepository.findByTypeOrderByNameAsc(MetadataType.EMPLOYMENT_TYPE));
    }

    @GetMapping("/employment-types/{id}")
    public ResponseEntity<?> getEmploymentType(@PathVariable Long id) {
        return metadataEntryRepository.findByIdAndType(id, MetadataType.EMPLOYMENT_TYPE)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse("Employment type not found.")));
    }

    @PostMapping("/employment-types")
    public ResponseEntity<?> createEmploymentType(@RequestBody MetadataRequest request) throws JobPortalException {
        enforceAdminAccess();
        return createByType("employment-types", request);
    }

    @PutMapping("/employment-types/{id}")
    public ResponseEntity<?> updateEmploymentType(@PathVariable Long id, @RequestBody MetadataRequest request) throws JobPortalException {
        enforceAdminAccess();
        return updateByType("employment-types", id, request);
    }

    @DeleteMapping("/employment-types/{id}")
    public ResponseEntity<?> deleteEmploymentType(@PathVariable Long id) throws JobPortalException {
        enforceAdminAccess();
        return deleteByType("employment-types", id);
    }

    @GetMapping("/work-modes")
    public ResponseEntity<List<MetadataEntry>> getWorkModes() {
        return ResponseEntity.ok(metadataEntryRepository.findByTypeOrderByNameAsc(MetadataType.WORK_MODE));
    }

    @GetMapping("/work-modes/{id}")
    public ResponseEntity<?> getWorkMode(@PathVariable Long id) {
        return metadataEntryRepository.findByIdAndType(id, MetadataType.WORK_MODE)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse("Work mode not found.")));
    }

    @PostMapping("/work-modes")
    public ResponseEntity<?> createWorkMode(@RequestBody MetadataRequest request) throws JobPortalException {
        enforceAdminAccess();
        return createByType("work-modes", request);
    }

    @PutMapping("/work-modes/{id}")
    public ResponseEntity<?> updateWorkMode(@PathVariable Long id, @RequestBody MetadataRequest request) throws JobPortalException {
        enforceAdminAccess();
        return updateByType("work-modes", id, request);
    }

    @DeleteMapping("/work-modes/{id}")
    public ResponseEntity<?> deleteWorkMode(@PathVariable Long id) throws JobPortalException {
        enforceAdminAccess();
        return deleteByType("work-modes", id);
    }

    private ResponseEntity<?> createByType(String path, MetadataRequest request) {
        ResponseEntity<?> validation = validatePayload(request);
        if (validation != null) {
            return validation;
        }

        MetadataType type = resolveType(path);
        String name = normalizeName(request.name());
        if (metadataEntryRepository.existsByTypeAndNameIgnoreCase(type, name)) {
            return ResponseEntity.badRequest().body(new MessageResponse(titleCasePath(path) + " already exists."));
        }

        MetadataEntry entry = new MetadataEntry();
        entry.setType(type);
        entry.setName(name);
        entry.setDescription(normalizeDescription(request.description()));
        metadataEntryRepository.save(entry);
        return ResponseEntity.status(HttpStatus.CREATED).body(new MessageResponse(titleCasePath(path) + " created successfully."));
    }

    private ResponseEntity<?> updateByType(String path, Long id, MetadataRequest request) {
        ResponseEntity<?> validation = validatePayload(request);
        if (validation != null) {
            return validation;
        }

        MetadataType type = resolveType(path);
        return metadataEntryRepository.findByIdAndType(id, type)
                .<ResponseEntity<?>>map(entry -> {
                    entry.setName(normalizeName(request.name()));
                    entry.setDescription(normalizeDescription(request.description()));
                    metadataEntryRepository.save(entry);
                    return ResponseEntity.ok(new MessageResponse(titleCasePath(path) + " updated successfully."));
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(titleCasePath(path) + " not found.")));
    }

    private ResponseEntity<?> deleteByType(String path, Long id) {
        MetadataType type = resolveType(path);
        return metadataEntryRepository.findByIdAndType(id, type)
                .<ResponseEntity<?>>map(entry -> {
                    metadataEntryRepository.delete(entry);
                    return ResponseEntity.ok(new MessageResponse(titleCasePath(path) + " deleted successfully."));
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(titleCasePath(path) + " not found.")));
    }
}
