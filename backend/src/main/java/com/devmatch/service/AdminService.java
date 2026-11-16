package com.devmatch.service;

import com.devmatch.dto.AdminOverviewDto;
import com.devmatch.model.*;
import com.devmatch.repository.MilestoneRepository;
import com.devmatch.repository.PaymentRecordRepository;
import com.devmatch.repository.ProjectRepository;
import com.devmatch.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private PaymentRecordRepository paymentRecordRepository;

    @Autowired
    private MilestoneRepository milestoneRepository;

    @Value("${platform.fee.percent:10.0}")
    private double platformFeePercent;

    public AdminOverviewDto getOverview() {
        AdminOverviewDto dto = new AdminOverviewDto();

        List<User> allUsers = userRepository.findAll();
        dto.setTotalUsers(allUsers.size());
        dto.setTotalFounders(allUsers.stream().filter(u -> u.getRole() == Role.FOUNDER).count());
        dto.setTotalDevelopers(allUsers.stream().filter(u -> u.getRole() == Role.DEVELOPER).count());

        List<Project> allProjects = projectRepository.findAll();
        dto.setTotalProjects(allProjects.size());
        dto.setCompletedProjects(allProjects.stream().filter(p -> p.getStatus() == ProjectStatus.COMPLETED).count());
        dto.setInProgressProjects(allProjects.stream().filter(p -> p.getStatus() == ProjectStatus.IN_PROGRESS).count());

        List<PaymentRecord> allPayments = paymentRecordRepository.findAll();
        double held = allPayments.stream().filter(p -> p.getStatus() == PaymentStatus.HELD).mapToDouble(PaymentRecord::getAmount).sum();
        double released = allPayments.stream().filter(p -> p.getStatus() == PaymentStatus.RELEASED).mapToDouble(PaymentRecord::getAmount).sum();
        double totalVolume = allPayments.stream().filter(p -> p.getStatus() == PaymentStatus.HELD || p.getStatus() == PaymentStatus.RELEASED).mapToDouble(PaymentRecord::getAmount).sum();
        double platformRev = allPayments.stream().filter(p -> p.getStatus() == PaymentStatus.RELEASED).mapToDouble(PaymentRecord::getPlatformFee).sum();
        if (platformRev == 0.0 && released > 0.0) {
            platformRev = released * (platformFeePercent / 100.0);
        }

        List<Milestone> disputedMilestones = milestoneRepository.findByStatus(MilestoneStatus.DISPUTED);
        dto.setTotalDisputes(disputedMilestones.size());
        dto.setPlatformRevenue(platformRev);

        dto.setTotalEscrowHeld(held);
        dto.setTotalEscrowReleased(released);
        dto.setTotalTransactionVolume(totalVolume);

        dto.setRecentUsers(allUsers.stream().limit(10).toList());
        dto.setRecentProjects(allProjects.stream().limit(10).toList());
        dto.setRecentPayments(allPayments.stream().limit(10).toList());

        return dto;
    }

    public User toggleUserActive(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        user.setActive(!user.isActive());
        return userRepository.save(user);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public List<PaymentRecord> getAllPayments() {
        return paymentRecordRepository.findAll();
    }

    public List<Milestone> getAllDisputes() {
        return milestoneRepository.findByStatus(MilestoneStatus.DISPUTED);
    }

    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }
}
