package com.devmatch.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;

@Document(collection = "reviews")
@CompoundIndex(name = "rev_proj_rev_idx", def = "{'projectId': 1, 'reviewerId': 1}", unique = true)
public class Review {
    @Id
    private String id;

    @Indexed
    private String projectId;

    @Indexed
    private String reviewerId;

    @Indexed
    private String revieweeId;

    private String reviewerName;
    private Role reviewerRole;
    private int rating; // 1 to 5
    private String comment;
    private Instant createdAt = Instant.now();

    public Review() {}

    public Review(String projectId, String reviewerId, String revieweeId, String reviewerName, Role reviewerRole, int rating, String comment) {
        this.projectId = projectId;
        this.reviewerId = reviewerId;
        this.revieweeId = revieweeId;
        this.reviewerName = reviewerName;
        this.reviewerRole = reviewerRole;
        this.rating = rating;
        this.comment = comment;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }

    public String getReviewerId() { return reviewerId; }
    public void setReviewerId(String reviewerId) { this.reviewerId = reviewerId; }

    public String getRevieweeId() { return revieweeId; }
    public void setRevieweeId(String revieweeId) { this.revieweeId = revieweeId; }

    public String getReviewerName() { return reviewerName; }
    public void setReviewerName(String reviewerName) { this.reviewerName = reviewerName; }

    public Role getReviewerRole() { return reviewerRole; }
    public void setReviewerRole(Role reviewerRole) { this.reviewerRole = reviewerRole; }

    public int getRating() { return rating; }
    public void setRating(int rating) { this.rating = rating; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}

