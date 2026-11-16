package com.devmatch.model;

public enum MilestoneStatus {
    DRAFT,
    PENDING_FUNDING,
    FUNDED,
    IN_PROGRESS,
    SUBMITTED,
    APPROVED,
    RELEASED,
    REVISION_REQUESTED,
    DISPUTED,
    CANCELLED,
    REFUNDED,
    OVERDUE,

    // Legacy values mapped for backward compatibility
    PENDING,
    PAID_HELD,
    COMPLETED,
    APPROVED_RELEASED,
    REJECTED
}
