# Shah Muhammed Sab Website

This project is an educational platform designed for college teachers to manage courses, share lectures, upload assignments and resources, and track student progress.

## Phase 0

This repository is currently at Phase 0, meaning it contains **only the architectural foundation**. Features such as Supabase authentication, Google Drive uploads, and AI integration are structurally planned but not functionally implemented.

## Tech Stack
- React 18
- TypeScript
- Vite
- React Router DOM
- Tailwind CSS v4 (Glassmorphism theme)

## Architecture Overview
The platform follows a modular, feature-based architecture to accommodate future growth and complexity. For full architectural details, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Setup:**
   - Copy `.env.example` to `.env`
   - Fill in the required Supabase placeholders.
   - For Google Drive configuration, see [Google Drive Setup Guide](docs/GOOGLE_DRIVE_SETUP.md).

3. **Development Server:**
   ```bash
   npm run dev
   ```

4. **Production Build:**
   ```bash
   npm run build
   ```
