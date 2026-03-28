package com.afrohr.portal.controller;

import com.afrohr.portal.model.Metadata;
import com.afrohr.portal.repository.MetadataRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/metadata")
@RequiredArgsConstructor
public class MetadataController {

    private final MetadataRepository metadataRepository;

    /** Public: get active metadata items by category */
    @GetMapping
    public ResponseEntity<List<Metadata>> getByCategory(@RequestParam String category) {
        return ResponseEntity.ok(
                metadataRepository.findByCategoryAndActiveTrue(category.toUpperCase()));
    }

    /** Admin: create a metadata item */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Metadata> create(@RequestBody Metadata metadata) {
        return ResponseEntity.ok(metadataRepository.save(metadata));
    }

    /** Admin: toggle active flag */
    @PatchMapping("/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Metadata> toggle(@PathVariable Long id) {
        return metadataRepository.findById(id)
                .map(m -> {
                    m.setActive(!m.isActive());
                    return ResponseEntity.ok(metadataRepository.save(m));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
