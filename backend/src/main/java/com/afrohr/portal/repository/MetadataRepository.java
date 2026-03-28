package com.afrohr.portal.repository;

import com.afrohr.portal.model.Metadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MetadataRepository extends JpaRepository<Metadata, Long> {
    List<Metadata> findByCategoryAndActiveTrue(String category);
}
