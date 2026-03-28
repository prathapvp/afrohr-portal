package com.jobportal.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jobportal.entity.MetadataEntry;
import com.jobportal.entity.MetadataType;

public interface MetadataEntryRepository extends JpaRepository<MetadataEntry, Long> {

    List<MetadataEntry> findByTypeOrderByNameAsc(MetadataType type);

    Optional<MetadataEntry> findByIdAndType(Long id, MetadataType type);

    boolean existsByTypeAndNameIgnoreCase(MetadataType type, String name);
}
