# BDS - Business Data Scraper

A complete Chrome Extension and Django Backend system for business data extraction from Google search results.

## 🚀 Features
- **Keyword Search**: Search for businesses by keyword, country, and city.
- **Smart Extraction**: Detects Ads, Organic results, and Maps listings.
- **Backend Enrichment**: Automatically visits found websites to extract emails and phone numbers.
- **Excel Export**: Download structured data in Excel format (.xlsx).
- **Search History**: Keep track of previous scraping sessions.

## 🛠️ Tech Stack
- **Frontend**: React, Tailwind CSS, Vite, Axios, Lucide Icons.
- **Backend**: Python, Django, Django REST Framework, BeautifulSoup, Pandas.
- **Database**: SQLite (Production-ready for PostgreSQL).

## 🔐 Environment Configuration

Both the backend and frontend use `.env` files for configuration.

### Backend (.env)
Create `backend/.env` with:
```env
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
CORS_ALLOW_ALL_ORIGINS=True
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

### Extension (.env)
Create `extension/.env` with:
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

## 📋 Setup Guide

### 1. Backend Setup
1. Open a terminal in the `backend` directory.
2. Activate the virtual environment:
   ```powershell
   .\venv\Scripts\activate
   ```
3. Run migrations:
   ```powershell
   python manage.py migrate
   ```
4. Start the Django server:
   ```powershell
   python manage.py runserver
   ```
   The backend will be available at `http://localhost:8000`.

### 2. Extension Setup
1. Open a terminal in the `extension` directory.
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Build the extension:
   ```powershell
   npm run build
   ```
4. Load the extension in Chrome:
   - Go to `chrome://extensions/`
   - Enable **Developer mode**.
   - Click **Load unpacked**.
   - Select the `extension/dist` folder.

### 3. Usage
1. Click the extension icon in your browser.
2. Enter a keyword (e.g., "kitchen ware suppliers").
3. Select a country and enter a city (e.g., "Rajkot").
4. Click **Start Scraping**.
5. Once finished, click **Download Excel**.

## 🧪 Sample Output (Excel)
| Company Name | Website URL | Email | Phone | Source Platform | Location |
|--------------|-------------|-------|-------|-----------------|----------|
| Kitchen Hub  | https://... | info@kh.com | +91 98... | Organic | Rajkot, India |
| Steel Wares  | https://... | sales@sw.in | +91 28... | Ad | Rajkot, India |

---
**Note**: This tool is for educational purposes. Always respect website terms of service and robots.txt.
