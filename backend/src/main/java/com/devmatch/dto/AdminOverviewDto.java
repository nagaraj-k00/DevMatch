package com.devmatch.dto;

import com.devmatch.model.PaymentRecord;
import com.devmatch.model.Project;
import com.devmatch.model.User;
import java.util.ArrayList;
import java.util.List;

public class AdminOverviewDto {
    private long totalUsers;
    private long totalFounders;
    private long totalDevelopers;
    private long totalProjects;
    private long completedProjects;
    private long inProgressProjects;
    private double totalEscrowHeld;
    private double totalEscrowReleased;
    private double totalTransactionVolume;
    private long totalDisputes;
    private double platformRevenue;

    private List<User> recentUsers = new ArrayList<>();
    private List<Project> recentProjects = new ArrayList<>();
    private List<PaymentRecord> recentPayments = new ArrayList<>();

    public AdminOverviewDto() {}

    public long getTotalUsers() { return totalUsers; }
    public void setTotalUsers(long totalUsers) { this.totalUsers = totalUsers; }

    public long getTotalFounders() { return totalFounders; }
    public void setTotalFounders(long totalFounders) { this.totalFounders = totalFounders; }

    public long getTotalDevelopers() { return totalDevelopers; }
    public void setTotalDevelopers(long totalDevelopers) { this.totalDevelopers = totalDevelopers; }

    public long getTotalProjects() { return totalProjects; }
    public void setTotalProjects(long totalProjects) { this.totalProjects = totalProjects; }

    public long getCompletedProjects() { return completedProjects; }
    public void setCompletedProjects(long completedProjects) { this.completedProjects = completedProjects; }

    public long getInProgressProjects() { return inProgressProjects; }
    public void setInProgressProjects(long inProgressProjects) { this.inProgressProjects = inProgressProjects; }

    public double getTotalEscrowHeld() { return totalEscrowHeld; }
    public void setTotalEscrowHeld(double totalEscrowHeld) { this.totalEscrowHeld = totalEscrowHeld; }

    public double getTotalEscrowReleased() { return totalEscrowReleased; }
    public void setTotalEscrowReleased(double totalEscrowReleased) { this.totalEscrowReleased = totalEscrowReleased; }

    public double getTotalTransactionVolume() { return totalTransactionVolume; }
    public void setTotalTransactionVolume(double totalTransactionVolume) { this.totalTransactionVolume = totalTransactionVolume; }

    public long getTotalDisputes() { return totalDisputes; }
    public void setTotalDisputes(long totalDisputes) { this.totalDisputes = totalDisputes; }

    public double getPlatformRevenue() { return platformRevenue; }
    public void setPlatformRevenue(double platformRevenue) { this.platformRevenue = platformRevenue; }

    public List<User> getRecentUsers() { return recentUsers; }
    public void setRecentUsers(List<User> recentUsers) { this.recentUsers = recentUsers; }

    public List<Project> getRecentProjects() { return recentProjects; }
    public void setRecentProjects(List<Project> recentProjects) { this.recentProjects = recentProjects; }

    public List<PaymentRecord> getRecentPayments() { return recentPayments; }
    public void setRecentPayments(List<PaymentRecord> recentPayments) { this.recentPayments = recentPayments; }
}
