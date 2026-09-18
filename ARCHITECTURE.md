# Architecture Overview - Phase 0

This document outlines the planned architecture for the Shah Muhammed Sab Website. The project relies on modular front-end architecture, decoupled service layers, and standard SaaS infrastructure.

## Frontend Architecture
- **Framework:** React + TypeScript + Vite.
- **Routing:** React Router handles navigation across public routes, student-facing routes, and protected admin routes.
- **Design System:** A premium, fully responsive Glassmorphism design system using TailwindCSS v4 and custom CSS `@theme` variables.
- **Modularity:**
  - `src/components/ui`: Reusable primitive components (e.g., `GlassCard`, `GlassButton`).
  - `src/features`: Complex domain-specific features (e.g., Auth, Courses, Admin).
  - `src/layouts`: Page-level structural layouts (e.g., AdminSidebarLayout).

## Service Layer Architecture
To keep business logic separated from the UI, API interaction is abstracted into service modules:

### 1. Supabase (Database & Auth)
- **Role:** Handles core user authentication, session management, Row Level Security (RLS), and stores relational data (course metadata, relationships, student progress).
- **Status:** Architecture placeholder setup in `src/services/supabase`. No tables or live auth implemented yet.

### 2. Google Drive API (File Storage)
- **Role:** Acts as the primary file repository for large educational resources (videos, PDFs, images).
- **Security:** Drive API interactions will remain securely on the server-side. The frontend will only communicate with a secure custom endpoint to retrieve metadata or stream URLs.
- **Status:** Conceptual placeholder created in `src/services/googleDrive`.

### 3. AI Service (Quiz Generation & Analysis)
- **Role:** AI features (like generating a draft quiz from a PDF) will be facilitated through a secure server-side proxy to protect API keys.
- **Status:** Conceptual placeholder created in `src/services/ai`.

## Security Principles
- **No Client-Side Secrets:** Drive API and AI API keys are explicitly forbidden from the frontend.
- **Environment Variables:** Handled via `.env` files and strictly excluded from version control.
