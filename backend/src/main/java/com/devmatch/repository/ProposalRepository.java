package com.devmatch.repository;

import com.devmatch.model.Proposal;
import com.devmatch.model.ProposalStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProposalRepository extends MongoRepository<Proposal, String> {
    List<Proposal> findByProjectId(String projectId);
    List<Proposal> findByDeveloperId(String developerId);
    Optional<Proposal> findByProjectIdAndDeveloperId(String projectId, String developerId);
    List<Proposal> findByProjectIdAndStatus(String projectId, ProposalStatus status);
}

