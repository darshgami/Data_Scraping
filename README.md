# BDS PRO - Advanced Data Scraper

A scalable, production-ready data scraping system consisting of a React-based Chrome Extension and a Python Service Layer using Playwright.

## 🏗️ System Architecture

The system follows a clean 3-layer architecture:
1. **Client Layer (Chrome Extension)**: Captures URL, accepts user input (City/Pincode), and triggers the process.
2. **Service Layer (Backend API)**: Stateless Django API that orchestrates the scraping and CSV generation.
3. **Automation Layer (Scraping Engine)**: Playwright-powered engine with generic heuristics for extracting business data from any website.

## 🚀 Key Features
- **Generic Extraction**: Works on any directory or listing platform.
- **Playwright Powered**: Handles dynamic content and lazy loading with ease.
- **Stateless Design**: No database overhead for the core scraping flow.
- **CSV Output**: Generates a clean CSV with exact columns: `Company Name`, `Address`.
- **City & Pincode Filter**: Match results specifically to the user's target area.

## 📋 Quick Start
For detailed setup instructions, please refer to [SETUP.md](file:///d:/PROJECT2/SETUP.md).

1. **Start Backend**: Run `python manage.py runserver` in the `backend` folder.
2. **Build Extension**: Run `npm run build` in the `extension` folder.
3. **Load Extension**: Load `extension/dist` as an unpacked extension in Chrome.

## 🔄 Workflow
1. User searches for a product on any website.
2. User opens the BDS PRO extension.
3. User enters the target City.
4. User clicks **Extract & Download**.
5. Extension receives the CSV from the backend and triggers a download.

---
**Note**: Ensure you have Playwright browsers installed (`playwright install chromium`) before running the backend.
