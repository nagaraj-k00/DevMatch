# DevMatch AI — Founder-Developer Matching Platform

> **Connecting Ideas with Developers — From Idea to Impact**  
> *Build Together. Grow Together.*

DevMatch AI is a full-stack, AI-powered web platform that connects non-technical founders who have a software idea with verified developers who can build it.

---

## 🏗️ System Architecture & Technology Stack

As specified in the **Product Requirements Document (PRD v1.0)**:

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React.js (Vite), Tailwind CSS, Lucide React, Bootstrap styling utilities | Single-page application for Founders, Developers, and Admins |
| **Backend** | Java 21, Spring Boot 3.3.4 (Spring Web REST controllers) | REST APIs, business logic, NLP analysis, and matching engine |
| **Security** | Spring Security 6, JWT (JJWT 0.12.5), BCrypt | Role-based authorization (`FOUNDER`, `DEVELOPER`, `ADMIN`), stateless tokens |
| **Database** | MongoDB (Spring Data MongoDB) | Documents for Users, Profiles, Projects, Briefs, Matches, Milestones, Tasks, Payments, Reviews |
| **Real-Time Chat** | Spring WebSocket with STOMP & SockJS | Live messaging and document sharing between founders and developers |
| **AI Requirement Engine** | OpenAI API + Fallback Built-in NLP Rule Engine | Converts raw text into structured briefs (features, tech stack, milestones, complexity) |
| **Payments & Escrow** | Razorpay REST API & Webhooks | Milestone-based payment holding (escrow-style) with release on founder approval |

---

## 📂 Project Structure

```text
├── backend/
│   ├── src/main/java/com/devmatch/
│   │   ├── config/             # SecurityConfig, JwtAuthFilter, WebSocketConfig
│   │   ├── controller/         # Auth, Project, DeveloperMatch, Milestone, Task, Chat, Admin
│   │   ├── dto/                # Request & response data transfer objects
│   │   ├── model/              # MongoDB collections (User, Project, Brief, Match, Milestone, Task, Payment, Review)
│   │   ├── repository/         # Spring Data MongoDB repositories
│   │   ├── service/            # AuthService, JwtService, AiBriefService, MatchingService, ChatService, MilestonePaymentService
│   │   ├── DevMatchApplication.java
│   ├── src/main/resources/
│   │   └── application.properties
│   ├── build.gradle
│   └── settings.gradle
│
├── frontend/
│   ├── src/
│   │   ├── api/client.js       # Axios with JWT bearer interceptor
│   │   ├── context/AuthContext.jsx
│   │   ├── components/         # Navbar, Footer
│   │   ├── pages/              # LandingPage, Login, Register, FounderDashboard, CreateProject, ProjectWorkspace, DeveloperDashboard, DeveloperProfile, Payments, AdminDashboard
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── start-backend.bat
├── start-frontend.bat
└── README.md
```

---

## ⚡ The 8-Step End-to-End Workflow

1. **User Registration & Authentication**: Sign up as Founder or Developer; secured with BCrypt password hashing & JWT.
2. **Project Requirement Input**: Founder provides title, description, category, budget range, and timeline.
3. **AI-Based Requirement Analysis (NLP)**: Automated extraction of technical summary, core vs optional features, recommended tech stack, complexity, and suggested milestone split.
4. **Developer Matching Engine**: Scored out of 100 points:
   - **Skills match (40 pts)**: Overlap between brief skills and developer profile.
   - **Experience (20 pts)**: Years of experience and completed project deliveries.
   - **Budget fit (15 pts)**: Developer hourly rate compared with founder budget range.
   - **Timeline / availability (15 pts)**: Full-time / part-time bandwidth.
   - **Rating and reviews (10 pts)**: Average customer satisfaction (new developers receive a neutral 5-pt base).
   *Scores ≥ 40 are ranked and presented to founders.*
5. **Communication & Collaboration**: Real-time STOMP WebSocket chat with file sharing and persistent chat history.
6. **Payment & Milestone Management**: Milestones funded through Razorpay test mode; amounts held in platform escrow.
7. **Project Management (Tasks)**: Kanban task boards (To Do, In Progress, Done) tied directly to project deliverables.
8. **Review, Rating & Completion**: Final approval releases escrow funds; both parties exchange 5-star ratings and written reviews.

---

## 🔑 Pre-Seeded Demo Credentials

The database auto-populates realistic starter accounts upon first launch:

| Role | Email | Password | Details |
|---|---|---|---|
| **Founder** | `founder@devmatch.ai` | `Password@123` | Sarah Chen (NextGen HealthTech) — Has live project with AI brief & milestones |
| **Developer** | `dev.raj@devmatch.ai` | `Password@123` | Raj Sharma (Full Stack Java, Spring Boot, React, MongoDB) — 4.8 ★ |
| **Developer** | `dev.priya@devmatch.ai` | `Password@123` | Priya Patel (Frontend React, Tailwind CSS, TypeScript) — 4.9 ★ |
| **Developer** | `dev.alex@devmatch.ai` | `Password@123` | Alex Morgan (Backend Java, Microservices, Cloud) — 4.7 ★ |
| **Admin** | `admin@devmatch.ai` | `Admin@123` | Platform Administrator — Full metrics & user moderation console |

---

## 🚀 How to Run

### 1. Prerequisites
- **Java 21** (`java -version`)
- **MongoDB** running locally on default port `27017`
- **Node.js** (v18+) & **npm**

### 2. Start Backend (Spring Boot)
```bash
cd backend
.\gradlew.bat bootRun --no-daemon
```
*Backend runs on `http://localhost:8080`. Health check endpoint: `http://localhost:8080/api/health`.*

### 3. Start Frontend (React + Vite)
```bash
cd frontend
npm run dev
```
*Frontend runs on `http://localhost:5173`.*





mongodb+srv://nagarajkamatagi5_db_user:adjU162E0QJZtLUN@cluster0.cylskjj.mongodb.net/


# Generated by MongoDB Atlas onboarding.
# This file contains sensitive credentials.
# DO NOT commit this file to version control.
# Store it securely (e.g. use a password manager or secrets vault).

MONGODB_USERNAME="nagarajkamatagi5_db_user"
MONGODB_PASSWORD="adjU162E0QJZtLUN"
MONGODB_URI="mongodb+srv://nagarajkamatagi5_db_user:adjU162E0QJZtLUN@cluster0.cylskjj.mongodb.net"