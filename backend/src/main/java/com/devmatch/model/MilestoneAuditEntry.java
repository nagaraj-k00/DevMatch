package com.devmatch.model;

import java.time.Instant;

public class MilestoneAuditEntry {
    private Instant timestamp = Instant.now();
    private String userId;
    private String userName;
    private String userRole;
    private String fromStatus;
    private String toStatus;
    private double amount;
    private String note;

    public MilestoneAuditEntry() {}

    public MilestoneAuditEntry(String userId, String userName, String userRole, String fromStatus, String toStatus, double amount, String note) {
        this.timestamp = Instant.now();
        this.userId = userId;
        this.userName = userName;
        this.userRole = userRole;
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
        this.amount = amount;
        this.note = note;
    }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getUserRole() { return userRole; }
    public void setUserRole(String userRole) { this.userRole = userRole; }

    public String getFromStatus() { return fromStatus; }
    public void setFromStatus(String fromStatus) { this.fromStatus = fromStatus; }

    public String getToStatus() { return toStatus; }
    public void setToStatus(String toStatus) { this.toStatus = toStatus; }

    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}

