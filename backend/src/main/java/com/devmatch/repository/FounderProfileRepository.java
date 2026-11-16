package com.devmatch.repository;

import com.devmatch.model.FounderProfile;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FounderProfileRepository extends MongoRepository<FounderProfile, String> {
    Optional<FounderProfile> findByUserId(String userId);
    void deleteByUserId(String userId);
}

