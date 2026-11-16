package com.devmatch.service;

import com.devmatch.model.*;
import com.devmatch.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DeveloperProfileRepository developerProfileRepository;

    @Autowired
    private FounderProfileRepository founderProfileRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectBriefRepository projectBriefRepository;

    @Autowired
    private MilestoneRepository milestoneRepository;

    @Autowired
    private TaskItemRepository taskItemRepository;

    @Autowired
    private ProposalRepository proposalRepository;

    @Autowired
    private MatchingService matchingService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            logger.info("Database already initialized with users.");
            return;
        }

        logger.info("Pre-seeding database with demo users, developers, and starter projects...");

        String defaultPass = passwordEncoder.encode("Password@123");
        String adminPass = passwordEncoder.encode("Admin@123");

        // 1. Admin
        User admin = new User("System Admin", "admin@devmatch.ai", adminPass, Role.ADMIN);
        admin.setProfileImage("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150");
        userRepository.save(admin);

        // 2. Founder
        User founder = new User("Sarah Chen", "founder@devmatch.ai", defaultPass, Role.FOUNDER);
        founder.setProfileImage("https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150");
        founder = userRepository.save(founder);

        FounderProfile founderProfile = new FounderProfile(founder.getId(), "NextGen HealthTech", "Building next-generation digital healthcare tele-consultation and diagnostic collaboration portals.");
        founderProfileRepository.save(founderProfile);

        // 3. Developers
        // Dev 1: Raj Sharma (Full Stack Java + React)
        User dev1 = new User("Raj Sharma", "dev.raj@devmatch.ai", defaultPass, Role.DEVELOPER);
        dev1.setProfileImage("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150");
        dev1 = userRepository.save(dev1);

        DeveloperProfile p1 = new DeveloperProfile(dev1.getId());
        p1.setSkills(List.of("Java", "Spring Boot", "React", "MongoDB", "WebSocket", "Payment Gateway"));
        p1.setYearsOfExperience(3);
        p1.setExpectedRate(45.0);
        p1.setBio("Full-stack engineer with 3+ years architecting scalable Spring Boot backends and interactive React dashboards.");
        p1.setPortfolioLinks(List.of("https://github.com/rajsharma-dev", "https://raj-portfolio.dev"));
        p1.setAvailability("AVAILABLE");
        p1.setAverageRating(4.8);
        p1.setRatingCount(8);
        p1.setCompletedProjects(8);
        developerProfileRepository.save(p1);

        // Dev 2: Priya Patel (Frontend & React Specialist)
        User dev2 = new User("Priya Patel", "dev.priya@devmatch.ai", defaultPass, Role.DEVELOPER);
        dev2.setProfileImage("https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150");
        dev2 = userRepository.save(dev2);

        DeveloperProfile p2 = new DeveloperProfile(dev2.getId());
        p2.setSkills(List.of("React", "Tailwind CSS", "TypeScript", "Next.js", "Node.js"));
        p2.setYearsOfExperience(4);
        p2.setExpectedRate(50.0);
        p2.setBio("Passionate UI/UX frontend specialist crafting responsive modern single page web apps.");
        p2.setPortfolioLinks(List.of("https://github.com/priyapatel-ui"));
        p2.setAvailability("AVAILABLE");
        p2.setAverageRating(4.9);
        p2.setRatingCount(12);
        p2.setCompletedProjects(12);
        developerProfileRepository.save(p2);

        // Dev 3: Alex Morgan (Backend Specialist)
        User dev3 = new User("Alex Morgan", "dev.alex@devmatch.ai", defaultPass, Role.DEVELOPER);
        dev3.setProfileImage("https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150");
        dev3 = userRepository.save(dev3);

        DeveloperProfile p3 = new DeveloperProfile(dev3.getId());
        p3.setSkills(List.of("Java", "Spring Boot", "Microservices", "Docker", "AWS", "MongoDB"));
        p3.setYearsOfExperience(5);
        p3.setExpectedRate(65.0);
        p3.setBio("Senior backend engineer specializing in high-throughput REST APIs and cloud architecture.");
        p3.setPortfolioLinks(List.of("https://github.com/alexmorgan-cloud"));
        p3.setAvailability("AVAILABLE");
        p3.setAverageRating(4.7);
        p3.setRatingCount(15);
        p3.setCompletedProjects(15);
        developerProfileRepository.save(p3);

        // Dev 4: Ananya Verma (Junior Full Stack)
        User dev4 = new User("Ananya Verma", "dev.ananya@devmatch.ai", defaultPass, Role.DEVELOPER);
        dev4.setProfileImage("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150");
        dev4 = userRepository.save(dev4);

        DeveloperProfile p4 = new DeveloperProfile(dev4.getId());
        p4.setSkills(List.of("Java", "Spring Boot", "React", "MongoDB"));
        p4.setYearsOfExperience(2);
        p4.setExpectedRate(30.0);
        p4.setBio("Enthusiastic full-stack developer with hands-on experience in Spring Boot and React applications.");
        p4.setPortfolioLinks(List.of("https://github.com/ananya-v"));
        p4.setAvailability("AVAILABLE");
        p4.setAverageRating(4.5);
        p4.setRatingCount(4);
        p4.setCompletedProjects(4);
        developerProfileRepository.save(p4);

        // 4. Seed a Project for Sarah
        Project project = new Project();
        project.setFounderId(founder.getId());
        project.setTitle("HealthHub Tele-Consultation Platform");
        project.setDescription("An AI-powered telemedicine web portal where patients describe symptoms in plain English, and the platform matches them with specialist doctors. Includes real-time chat, video booking, digital prescription management, and Razorpay payment integration.");
        project.setCategory("Healthcare & AI");
        project.setBudgetMin(1500.0);
        project.setBudgetMax(3000.0);
        project.setTimeline("4-6 weeks");
        project.setStatus(ProjectStatus.OPEN);
        project = projectRepository.save(project);

        // Project Brief
        ProjectBrief brief = new ProjectBrief();
        brief.setProjectId(project.getId());
        brief.setSummary("A high-availability healthcare web portal combining symptom intelligence, specialist matching, end-to-end appointment scheduling, and secure digital consultation workflows.");
        brief.setCoreFeatures(List.of(
                "Patient symptom description & specialist triage",
                "Real-time encrypted chat with doctor and file attachment",
                "Razorpay milestone payment processing for consultation packages",
                "Role-based dashboards for Patients, Doctors, and Platform Admins"
        ));
        brief.setOptionalFeatures(List.of(
                "Automated WhatsApp appointment reminders",
                "Digital signature generation for pharmacy prescriptions"
        ));
        brief.setRequiredSkills(List.of("Java", "Spring Boot", "React", "MongoDB", "WebSocket", "Payment Gateway"));
        brief.setSuggestedStack(List.of("Spring Boot 3 REST", "React.js + Tailwind CSS", "MongoDB", "Spring WebSocket STOMP", "Razorpay API"));
        brief.setComplexity("Medium");
        brief.setConfirmedByFounder(true);

        List<ProjectBrief.SuggestedMilestone> suggestedMilestones = new ArrayList<>();
        suggestedMilestones.add(new ProjectBrief.SuggestedMilestone("Milestone 1: Database & Auth Setup", "MongoDB user schema, JWT authentication, and profile management", 700.0, 10));
        suggestedMilestones.add(new ProjectBrief.SuggestedMilestone("Milestone 2: Real-time Consultation Chat & Matching", "WebSocket STOMP messaging, doctor matching engine", 1200.0, 15));
        suggestedMilestones.add(new ProjectBrief.SuggestedMilestone("Milestone 3: Razorpay Payments & Closure", "Payment escrow flow, final reviews, and deployment", 900.0, 7));
        brief.setSuggestedMilestones(suggestedMilestones);
        projectBriefRepository.save(brief);

        // Generate matching records for this project
        matchingService.findMatchesForProject(project.getId());

        // Milestones
        Milestone m1 = new Milestone();
        m1.setProjectId(project.getId());
        m1.setTitle("Milestone 1: Database & Auth Setup");
        m1.setDescription("MongoDB user schema, JWT authentication, and profile management");
        m1.setAmount(700.0);
        m1.setDueDate("2026-11-25");
        m1.setStatus(MilestoneStatus.PENDING);
        milestoneRepository.save(m1);

        Milestone m2 = new Milestone();
        m2.setProjectId(project.getId());
        m2.setTitle("Milestone 2: Real-time Consultation Chat & Matching");
        m2.setDescription("WebSocket STOMP messaging, doctor matching engine");
        m2.setAmount(1200.0);
        m2.setDueDate("2026-12-10");
        m2.setStatus(MilestoneStatus.PENDING);
        milestoneRepository.save(m2);

        Milestone m3 = new Milestone();
        m3.setProjectId(project.getId());
        m3.setTitle("Milestone 3: Razorpay Payments & Closure");
        m3.setDescription("Payment escrow flow, final reviews, and deployment");
        m3.setAmount(900.0);
        m3.setDueDate("2026-12-20");
        m3.setStatus(MilestoneStatus.PENDING);
        milestoneRepository.save(m3);

        // Tasks
        TaskItem t1 = new TaskItem();
        t1.setProjectId(project.getId());
        t1.setMilestoneId(m1.getId());
        t1.setTitle("Design MongoDB schema for User & Doctor profiles");
        t1.setDescription("Write Spring Data MongoDB entities and compound indexes");
        t1.setStatus(TaskStatus.DONE);
        t1.setAssignedTo("Raj Sharma");
        taskItemRepository.save(t1);

        TaskItem t2 = new TaskItem();
        t2.setProjectId(project.getId());
        t2.setMilestoneId(m1.getId());
        t2.setTitle("Implement Spring Security JWT filter and endpoint guards");
        t2.setDescription("Configure SecurityFilterChain and stateless session management");
        t2.setStatus(TaskStatus.IN_PROGRESS);
        t2.setAssignedTo("Raj Sharma");
        taskItemRepository.save(t2);

        TaskItem t3 = new TaskItem();
        t3.setProjectId(project.getId());
        t3.setMilestoneId(m2.getId());
        t3.setTitle("Setup WebSocket STOMP endpoint for consultation chat");
        t3.setDescription("Connect frontend React client with sockjs / stompjs broker");
        t3.setStatus(TaskStatus.TODO);
        taskItemRepository.save(t3);

        // Seed sample proposals for founder review
        Proposal prop1 = new Proposal();
        prop1.setProjectId(project.getId());
        prop1.setDeveloperId(dev1.getId());
        prop1.setDeveloperName(dev1.getName());
        prop1.setDeveloperEmail(dev1.getEmail());
        prop1.setDeveloperImage(dev1.getProfileImage());
        prop1.setDeveloperSkills(p1.getSkills());
        prop1.setDeveloperRate(p1.getExpectedRate());
        prop1.setDeveloperRating(p1.getAverageRating());
        prop1.setCoverLetter("I have extensive experience building Spring Boot backends and interactive React tele-health portals with Razorpay escrow.");
        prop1.setBidAmount(2600.0);
        prop1.setEstimatedDays(30);
        prop1.setStatus(ProposalStatus.PENDING);
        proposalRepository.save(prop1);

        Proposal prop2 = new Proposal();
        prop2.setProjectId(project.getId());
        prop2.setDeveloperId(dev2.getId());
        prop2.setDeveloperName(dev2.getName());
        prop2.setDeveloperEmail(dev2.getEmail());
        prop2.setDeveloperImage(dev2.getProfileImage());
        prop2.setDeveloperSkills(p2.getSkills());
        prop2.setDeveloperRate(p2.getExpectedRate());
        prop2.setDeveloperRating(p2.getAverageRating());
        prop2.setCoverLetter("Experienced UI engineer ready to craft responsive telemedicine patient interfaces and chat workflows.");
        prop2.setBidAmount(2800.0);
        prop2.setEstimatedDays(35);
        prop2.setStatus(ProposalStatus.PENDING);
        proposalRepository.save(prop2);

        logger.info("Database initialized successfully with sample data.");
    }
}

