# Google Drive Storage Setup

This project uses Google Drive as the primary storage layer for educational resources (PDFs, videos, images, etc.). For security and isolation, the application uses a **Google Cloud Service Account** approach, where the application backend handles all uploads.

## Prerequisites

1. A Google Cloud Platform (GCP) Account.
2. A Google Drive folder you wish to use as the root for course uploads.

## Step 1: Enable Google Drive API

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Navigate to **APIs & Services > Library**.
4. Search for **Google Drive API** and click **Enable**.

## Step 2: Create a Service Account

1. Navigate to **APIs & Services > Credentials**.
2. Click **Create Credentials** -> **Service Account**.
3. Name the service account (e.g., `edu-platform-drive`) and click **Create and Continue**.
4. You do not need to assign any special project-level roles. Click **Done**.
5. Find the newly created Service Account in the list, click on it, and go to the **Keys** tab.
6. Click **Add Key** -> **Create new key**.
7. Choose **JSON** and click **Create**. The key file will download to your computer.

## Step 3: Configure Environment Variables

Open the downloaded JSON file. You need two critical pieces of information for your `.env` file:
- `client_email` -> Maps to `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `private_key` -> Maps to `GOOGLE_PRIVATE_KEY` (ensure you preserve the `\n` characters)

Also, locate the ID of your Google Drive root folder. (The ID is the alphanumeric string in the folder's URL: `https://drive.google.com/drive/folders/[THIS_IS_THE_ID]`).

Update your project's `.env` file:

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email@gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID=your_drive_folder_id
```

## Step 4: Share Drive Folder with Service Account

**CRITICAL STEP:** The Service Account acts as a separate "user". It cannot see your Drive folders unless you share them.

1. Open your target Google Drive folder in your browser.
2. Click the folder name at the top -> **Share**.
3. Paste the `GOOGLE_SERVICE_ACCOUNT_EMAIL` into the share box.
4. Give it **Editor** permissions.
5. Click **Send**.

## Step 5: Running the Backend

Because Google Drive requires private keys to interact securely, the integration is built via a lightweight Express API.

To run the full stack locally:

1. Terminal 1: Run the backend
```bash
cd server
npm start
```

2. Terminal 2: Run the frontend
```bash
npm run dev
```

The Vite frontend automatically proxies `/api` requests to the local backend.

## Security Considerations

- **Never** expose `GOOGLE_PRIVATE_KEY` to the browser or frontend source code.
- **Never** commit your `.env` file to version control.
- File uploads are streamed directly to Drive using memory buffers up to 100MB (configurable in `server/index.js`).
- Ownership remains centralized. The Service Account creates files and grants public "reader" permissions so students can view them via `webViewLink` without needing their own Google login.
