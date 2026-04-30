# Meal Distribution System (API-First Architecture + Functional Specification)

Design and define a QR-based meal distribution system using an API-first approach.

---

## Tech Stack
- **Backend:** Laravel (API only)  
- **Admin Panel:** React (Vite) + Tailwind  
- **Counter App:** React (Vite) + Tailwind (single-screen scanner)  

---

## Goal
Build a fast, reliable system for meal distribution where staff scan employee QR codes and instantly get a clear decision.

The system must support **high-speed, continuous scanning** in real-world environments.

---

# 0. Backend Setup (Laravel – Windows)

## Install PHP + Laravel Environment
```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://php.new/install/windows/8.4'))

composer global require laravel/installer


1. System Architecture
Backend (Laravel API)
Centralized API layer
Handles all validation, business logic, and logging
Serves both Admin Panel and Counter App
Frontend Applications
Admin Panel
Built with React (Vite) + Tailwind
Used for managing employees, meal rules, and logs
Counter Application
Built with React (Vite) + Tailwind
Single-screen scanner interface
Used by staff at meal distribution counters
2. Counter Application (Scanner)
Overview
Single-screen only
No navigation
Always ready to scan
Core Flow
App opens directly in scanner mode
Staff scans QR code
QR is sent to API
API returns decision
Full-screen result is displayed
Auto-reset to scanner within 2–3 seconds
Result States
Allowed
Green full screen
Message: Meal Allowed
Denied
Red full screen
Reason displayed:
Not Registered
Already Received Meal
Outside Allowed Time
Error
Invalid QR Code
Try Again
UX Requirements
Full-screen camera view
Center scan frame overlay
Large, bold text visible from distance
No clutter, no extra buttons
Instant visual feedback
Designed for rapid repeated scanning
Behavior Rules
Always show a result
No manual input required
Automatically reset after each scan
No delays or loading interruptions
3. Admin Panel
Overview

Web-based system for managing employees, rules, and logs.

Employee Management
Create, update, delete employees
Assign unique QR code to each employee
Store basic details (name, identifier)
Meal Rules Configuration
Define meal limits (once per day or per session)
Configure time windows (breakfast / lunch / dinner)
Optional: special employees with unlimited access
Logs & Monitoring
View all scan logs
Each log must include:
Employee
Timestamp
Result (allowed / denied)
Reason (if denied)
Filtering & Export
Filter logs by:
Date
Employee
Result
Export logs in CSV format
UI Requirements
Clean and modern design
Simple navigation:
Employees
Logs
Settings
Responsive layout
Efficient handling of large datasets
4. API Behavior (Core Logic)
Scan Processing
Receive QR code input
Identify employee
Validate:
QR validity
Employee registration
Time window
Meal usage status
Response Rules

Every scan must return exactly one result:

Allowed
Denied (with reason)
Error
Logging Rules
Every scan must be recorded:
Allowed
Denied
Invalid
5. Functional Behavior Summary
Main Flow
Scan QR code
Identify employee
Validate eligibility
Show result
Log scan
Reset system
Eligibility Rules
Limited meals per employee (daily/session-based)
Time-based restrictions
Only registered employees allowed
Duplicate scans denied
Optional: VIP/unlimited users
Error Handling
Invalid QR → “Invalid QR Code”
System issue → “Try Again”
System must never freeze
Reset Behavior
Auto return to scanner after result
No user interaction required
6. System Flow

Scan → API Request → Validate → Decide → Respond → Display → Auto Reset

Continuous loop with no interruption.

7. Performance Requirements
Near-instant response time
Supports high-frequency scanning
No blocking UI or delays
8. QR Code Design
Each employee has a unique QR code
QR contains a simple identifier
No encryption required initially
9. Optional Enhancements (Future)
Sound/vibration feedback
Offline mode with sync
Analytics dashboard (meals served, trends)
Multi-counter support
10. Core Principle

The system acts as a real-time validation gateway:

Scan → Decide → Show → Reset

No delays
No confusion
No extra steps