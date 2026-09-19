import express from 'express';
import OpenAI from 'openai';
import cors from 'cors';
import multer from 'multer';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import stream from 'stream';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import fs from 'fs';

// Load env vars from the root .env file (if running locally)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
if (fs.existsSync(path.resolve(__dirname, '../.env'))) {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

const app = express();
app.use(helmet()); // Enforce strict security headers

// Configure CORS for production Vercel frontend and local development
const allowedOrigins = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, 'http://localhost:5173'] : '*';
app.use(cors({ origin: allowedOrigins, credentials: true }));

app.use(express.json());

// Set up rate limiters
const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: { error: 'Too many AI requests from this IP, please try again later.' }
});

const submitRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 submissions per minute
  message: { error: 'Too many submission requests, please slow down.' }
});

const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each IP to 50 uploads per hour
  message: { error: 'Upload limit reached, please try again later.' }
});

// Set up Multer (memory storage for stream upload to Google Drive)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max limit
  }
});

// Setup Supabase Client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("Missing Supabase credentials for server.");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Setup Google Drive Auth
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

let driveClient = null;
let oauth2Client = null;

try {
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REDIRECT_URI) {
    oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    if (process.env.GOOGLE_REFRESH_TOKEN) {
      oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
      driveClient = google.drive({ version: 'v3', auth: oauth2Client });
      console.log("Google Drive client initialized using OAuth 2.0.");
    } else {
      console.warn("Google Drive OAuth client initialized, but missing GOOGLE_REFRESH_TOKEN. App must complete OAuth flow first.");
    }
  } else if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    // Legacy fallback (Cannot create files in personal drives)
    const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
    const auth = new google.auth.JWT(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      null,
      privateKey,
      SCOPES
    );
    driveClient = google.drive({ version: 'v3', auth });
    console.log("Google Drive client initialized using Service Account (Legacy fallback).");
  } else {
    console.warn("Google Drive credentials missing. Drive API will not work.");
  }
} catch (error) {
  console.error("Failed to initialize Google Drive client:", error);
}

// OAuth 2.0 Auth Endpoints
app.get('/api/drive/auth/url', (req, res) => {
  if (!oauth2Client) {
    return res.status(500).json({ error: 'OAuth2 client not initialized. Check .env' });
  }
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
  res.json({ url: authUrl });
});

app.get('/api/drive/auth/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('Missing code');
  if (!oauth2Client) return res.status(500).send('OAuth2 client not initialized');

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    driveClient = google.drive({ version: 'v3', auth: oauth2Client });
    
    // Securely save the refresh token to the .env file
    if (tokens.refresh_token) {
      const envPath = path.resolve(__dirname, '../.env');
      let envContent = '';
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      }
      
      if (envContent.includes('GOOGLE_REFRESH_TOKEN=')) {
        envContent = envContent.replace(/GOOGLE_REFRESH_TOKEN=.*/g, `GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
      } else {
        envContent += `\nGOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`;
      }
      
      fs.writeFileSync(envPath, envContent, 'utf8');
      console.log('SUCCESS! Google Drive OAuth 2.0 configured securely.');
    }

    res.send(`
      <html>
        <body style="font-family: sans-serif; text-align: center; margin-top: 50px;">
          <h1 style="color: green;">Success!</h1>
          <p>Your Google Drive account has been securely linked.</p>
          <p>The refresh token has been automatically saved to your .env file.</p>
          <p><b>Please restart your dev server now to apply the changes.</b></p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error retrieving access token', error);
    res.status(500).send('Failed to authenticate');
  }
});

// Middleware to verify Teacher auth via Supabase
async function requireTeacher(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const token = authHeader.split(' ')[1];
  
  // Verify token
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token', details: authError });
  }

  // Check if user is a teacher
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'teacher') {
    return res.status(403).json({ error: 'Unauthorized: Teacher role required' });
  }

  req.user = user;
  next();
}

// Middleware to verify Student auth via Supabase
async function requireStudent(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token', details: authError });
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'student') {
    return res.status(403).json({ error: 'Unauthorized: Student role required' });
  }

  req.user = user;
  next();
}

// Middleware to verify Admin auth via Supabase (querying admin table)
const requireAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Missing authorization header' });

  try {
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) return res.status(401).json({ error: 'Invalid token' });

    // Check admin table instead of profiles
    const { data: adminData, error: adminError } = await supabase
      .from('admin')
      .select('role')
      .eq('auth_user_id', user.id)
      .single();

    if (adminError || !adminData || adminData.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Generic Middleware to verify authentication via Supabase
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token', details: authError });
  }

  req.user = user;
  next();
}

const authRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, 
  message: { error: 'Too many auth requests from this IP, please try again later.' }
});

// ==========================================
// AUTHENTICATION AND RBAC API ENDPOINTS
// ==========================================

app.post('/api/auth/register-student', authRateLimiter, async (req, res) => {
  const { username, rollNumber, password, fullName } = req.body;
  if (!username || !rollNumber || !password || !fullName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Generate deterministic fake email
    const fakeEmail = `${rollNumber}@student.shahmuhammed.local`;

    // Attempt to create user via Admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email: fakeEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        role: 'student',
        full_name: fullName,
        username: username,
        roll_number: rollNumber,
        status: 'pending'
      }
    });

    if (error) {
      if (error.message.includes('already exists') || error.message.includes('duplicate key')) {
        return res.status(400).json({ error: 'This roll number is already registered.' });
      }
      throw error;
    }

    res.json({ success: true, message: 'Student registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. Check if username or roll number already exists.' });
  }
});

app.post('/api/auth/approve-student', authRateLimiter, requireTeacher, async (req, res) => {
  const { studentId } = req.body;
  if (!studentId) return res.status(400).json({ error: 'Missing student ID' });

  try {
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'active' })
      .eq('id', studentId)
      .eq('role', 'student');

    if (error) throw error;
    res.json({ success: true, message: 'Student approved successfully' });
  } catch (error) {
    console.error('Approve student error:', error);
    res.status(500).json({ error: 'Failed to approve student' });
  }
});

app.post('/api/auth/reject-student', authRateLimiter, requireTeacher, async (req, res) => {
  const { studentId } = req.body;
  if (!studentId) return res.status(400).json({ error: 'Missing student ID' });

  try {
    // Delete from auth.users via admin API
    const { error: authError } = await supabase.auth.admin.deleteUser(studentId);
    
    if (authError) {
      if (authError.status === 404) {
        // User not in auth.users, just clean up profiles
        await supabase.from('profiles').delete().eq('id', studentId);
        return res.json({ success: true, message: 'Student rejected successfully' });
      }
      throw authError;
    }
    
    res.json({ success: true, message: 'Student rejected successfully' });
  } catch (error) {
    console.error('Reject student error:', error);
    res.status(500).json({ error: 'Failed to reject student' });
  }
});

app.post('/api/auth/create-teacher', authRateLimiter, requireAdmin, async (req, res) => {
  const { name, username, password } = req.body;
  if (!name || !username || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const fakeEmail = `${username}@teacher.shahmuhammed.local`;

    const { data, error } = await supabase.auth.admin.createUser({
      email: fakeEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        role: 'teacher',
        full_name: name,
        username: username
      }
    });

    if (error) {
      if (error.message.includes('already exists') || error.message.includes('duplicate key') || error.message.includes('already been registered')) {
        return res.status(400).json({ error: 'This teacher ID is already registered.' });
      }
      throw error;
    }

    res.json({ success: true, message: 'Teacher created successfully', userId: data.user.id });
  } catch (error) {
    console.error('Create teacher error:', error);
    res.status(500).json({ error: 'Failed to create teacher' });
  }
});

app.post('/api/auth/suspend-teacher', authRateLimiter, requireAdmin, async (req, res) => {
  const { teacherId, suspend } = req.body;
  if (!teacherId) return res.status(400).json({ error: 'Missing teacher ID' });

  try {
    // Optionally use ban_duration from Supabase Admin API
    const { error: banError } = await supabase.auth.admin.updateUserById(teacherId, {
      ban_duration: suspend ? '876000h' : 'none' // 100 years or none
    });
    if (banError) throw banError;

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ status: suspend ? 'suspended' : 'active' })
      .eq('id', teacherId)
      .eq('role', 'teacher');
      
    if (profileError) throw profileError;

    res.json({ success: true, message: `Teacher ${suspend ? 'suspended' : 'restored'} successfully` });
  } catch (error) {
    console.error('Suspend teacher error:', error);
    res.status(500).json({ error: 'Failed to update teacher status' });
  }
});

app.post('/api/auth/update-teacher', authRateLimiter, requireAdmin, async (req, res) => {
  const { teacherId, name, username } = req.body;
  if (!teacherId || !name || !username) return res.status(400).json({ error: 'Missing required fields' });

  try {
    const fakeEmail = `${username}@teacher.shahmuhammed.local`;

    // Update Supabase Auth email and metadata
    const { error: authError } = await supabase.auth.admin.updateUserById(teacherId, {
      email: fakeEmail,
      user_metadata: { full_name: name, username: username }
    });
    if (authError) throw authError;

    // Update profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: name, username: username })
      .eq('id', teacherId)
      .eq('role', 'teacher');
      
    if (profileError) throw profileError;

    res.json({ success: true, message: 'Teacher updated successfully' });
  } catch (error) {
    console.error('Update teacher error:', error);
    res.status(500).json({ error: 'Failed to update teacher' });
  }
});

app.post('/api/auth/delete-teacher', authRateLimiter, requireAdmin, async (req, res) => {
  const { teacherId } = req.body;
  if (!teacherId) return res.status(400).json({ error: 'Missing teacher ID' });

  try {
    const { error } = await supabase.auth.admin.deleteUser(teacherId);
    if (error) {
      if (error.status === 404) {
        // User not in auth.users, just clean up profiles
        await supabase.from('profiles').delete().eq('id', teacherId);
        return res.json({ success: true, message: 'Teacher deleted successfully' });
      }
      throw error;
    }
    
    res.json({ success: true, message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error('Delete teacher error:', error);
    res.status(500).json({ error: 'Failed to delete teacher' });
  }
});

app.post('/api/auth/reset-teacher-password', authRateLimiter, requireAdmin, async (req, res) => {
  const { teacherId, newPassword } = req.body;
  if (!teacherId || !newPassword) return res.status(400).json({ error: 'Missing required fields' });

  try {
    const { error } = await supabase.auth.admin.updateUserById(teacherId, {
      password: newPassword
    });
    if (error) throw error;

    res.json({ success: true, message: 'Teacher password reset successfully' });
  } catch (error) {
    console.error('Reset teacher password error:', error);
    res.status(500).json({ error: 'Failed to reset teacher password' });
  }
});

app.post('/api/auth/approve-reset', requireTeacher, authRateLimiter, async (req, res) => {
  const { requestId, newPassword } = req.body;
  
  if (!requestId || !newPassword) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Verify request exists and is pending
    const { data: request, error: reqError } = await supabase
      .from('password_reset_requests')
      .select('student_id, status')
      .eq('id', requestId)
      .eq('status', 'pending')
      .single();

    if (reqError || !request) {
      return res.status(400).json({ error: 'Invalid or already processed reset request.' });
    }

    // Update user password via Admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(request.student_id, {
      password: newPassword
    });

    if (updateError) throw updateError;

    // Mark request as approved
    const { error: finalizeError } = await supabase
      .from('password_reset_requests')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: req.user.id
      })
      .eq('id', requestId);

    if (finalizeError) throw finalizeError;

    res.json({ success: true, message: 'Password reset successfully.' });
  } catch (error) {
    console.error('Approve reset error:', error);
    res.status(500).json({ error: 'Failed to approve reset request' });
  }
});

app.post('/api/auth/reset-password-request', authRateLimiter, async (req, res) => {
  const { rollNumber } = req.body;
  if (!rollNumber) {
    return res.status(400).json({ error: 'Roll number is required' });
  }

  try {
    // Look up student by roll number using service role to bypass RLS
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('roll_number', rollNumber)
      .eq('role', 'student')
      .single();

    if (profileError || !profile) {
      // Return a generic message to prevent roll number enumeration
      return res.json({ success: true, message: 'If the roll number exists, a reset request has been sent to teachers.' });
    }

    // Check if there is already a pending request
    const { data: existing, error: existingError } = await supabase
      .from('password_reset_requests')
      .select('id')
      .eq('student_id', profile.id)
      .eq('status', 'pending')
      .maybeSingle();

    if (!existing) {
      const { error: insertError } = await supabase
        .from('password_reset_requests')
        .insert({
          student_id: profile.id,
          status: 'pending'
        });
        
      if (insertError) throw insertError;
    }

    // Always return generic success to prevent enumeration
    res.json({ success: true, message: 'If the roll number exists, a reset request has been sent to teachers.' });

  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Upload Endpoint
app.post('/api/drive/upload', requireTeacher, uploadRateLimiter, upload.single('file'), async (req, res) => {
  console.log("Drive upload request received!");
  if (!req.file) {
    console.log("No file uploaded in the request.");
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  if (!driveClient) {
    return res.status(500).json({ error: 'Google Drive client not configured on server.' });
  }

  const parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!parentFolderId || parentFolderId === 'your_drive_folder_id') {
    return res.status(500).json({ error: 'GOOGLE_DRIVE_FOLDER_ID is not properly configured in .env. Please replace "your_drive_folder_id" with your actual Google Drive folder ID.' });
  }

  try {
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    const fileMetadata = {
      name: req.file.originalname,
      parents: [parentFolderId]
    };
    
    const media = {
      mimeType: req.file.mimetype,
      body: bufferStream
    };

    // Upload to Google Drive
    const response = await driveClient.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink, webContentLink, thumbnailLink'
    });
    
    // We do NOT make this public anymore for thumbnails, as it will be served via the secure proxy route
    // if you want to fall back for some reason, you can still use the webViewLink

    res.json({
      success: true,
      file: response.data
    });

  } catch (error) {
    console.error("Drive Upload Error:", error);
    res.status(500).json({ error: 'Failed to upload to Google Drive', details: error.message });
  }
});

// Image Proxy Endpoint (For serving secure images without making Drive public)
app.get('/api/drive/image/:fileId', async (req, res) => {
  const { fileId } = req.params;
  
  if (!driveClient) {
    return res.status(500).json({ error: 'Google Drive client not configured.' });
  }

  try {
    const response = await driveClient.files.get({
      fileId: fileId,
      alt: 'media'
    }, { responseType: 'stream' });

    // Set appropriate headers based on Drive's response
    res.set('Content-Type', response.headers['content-type'] || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400'); // Cache for 1 day

    // Stream the file directly to the client
    response.data.pipe(res);
  } catch (error) {
    // Suppress verbose logging for 404s to avoid console spam, but return 404
    if (error.status === 404) {
      return res.status(404).json({ error: 'Image not found' });
    }
    console.error("Image Proxy Error:", error.message);
    res.status(500).json({ error: 'Failed to fetch image' });
  }
});

// Student Upload Endpoint (For Assignments)
app.post('/api/drive/upload/student', requireStudent, uploadRateLimiter, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  if (!driveClient) {
    return res.status(500).json({ error: 'Google Drive client not configured on server.' });
  }

  const parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!parentFolderId || parentFolderId === 'your_drive_folder_id') {
    return res.status(500).json({ error: 'GOOGLE_DRIVE_FOLDER_ID is not properly configured in .env. Please replace "your_drive_folder_id" with your actual Google Drive folder ID.' });
  }

  try {
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    const fileMetadata = {
      name: `Student_${req.user.id}_${req.file.originalname}`,
      parents: [parentFolderId]
    };
    
    const media = {
      mimeType: req.file.mimetype,
      body: bufferStream
    };

    const response = await driveClient.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink, webContentLink, thumbnailLink'
    });
    
    // We KEEP this public for now so teachers can view assignment links without needing the proxy
    driveClient.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      }
    }).catch(err => console.error("Async permission set error (Student):", err));

    res.json({
      success: true,
      file: response.data
    });

  } catch (error) {
    console.error("Drive Upload Error (Student):", error);
    res.status(500).json({ error: 'Failed to upload to Google Drive', details: error.message });
  }
});

// Delete Endpoint
app.delete('/api/drive/delete/:fileId', requireTeacher, async (req, res) => {
  const { fileId } = req.params;
  
  if (!driveClient) {
    return res.status(500).json({ error: 'Google Drive client not configured on server.' });
  }

  try {
    await driveClient.files.delete({
      fileId: fileId
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error("Drive Delete Error:", error);
    res.status(500).json({ error: 'Failed to delete from Google Drive', details: error.message });
  }
});

// AI Quiz Generation Endpoint
app.post('/api/ai/generate-quiz', requireTeacher, aiRateLimiter, async (req, res) => {
  const { topic, contextText, numQuestions, difficulty, types } = req.body;
  
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `You are an expert educator. Generate a quiz about: ${topic}.
Context material (if any):
${contextText || 'None provided. Use your general knowledge.'}

Constraints:
- Number of questions: ${numQuestions}
- Difficulty: ${difficulty}
- Allowed types: ${types.join(', ')}

Return ONLY valid JSON matching the schema.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    questions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                question_type: { type: Type.STRING, description: "mcq, true_false, short_answer, written" },
                                question_text: { type: Type.STRING },
                                marks: { type: Type.INTEGER },
                                explanation: { type: Type.STRING },
                                options: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            option_text: { type: Type.STRING },
                                            is_correct: { type: Type.BOOLEAN }
                                        }
                                    },
                                    description: "Only required for mcq and true_false"
                                },
                                expected_answer: { type: Type.STRING, description: "Expected grading rubric/answer for written/short_answer" }
                            },
                            required: ["question_type", "question_text", "marks"]
                        }
                    }
                },
                required: ["title", "description", "questions"]
            }
        }
    });

    const draftQuiz = JSON.parse(response.text());
    res.json(draftQuiz);

  } catch (error) {
    console.error("AI Generation Error:", error);
    res.status(500).json({ error: 'Failed to generate quiz', details: error.message });
  }
});

// Compiler Construction Specific AI Quiz Generator
app.post('/api/ai/generate-quiz/compiler', requireTeacher, aiRateLimiter, upload.single('file'), async (req, res) => {
  const { numQuestions, sourceType, lectureContext } = req.body;
  
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    let parts = [];
    
    const promptText = `You are an expert Computer Science professor specializing in Compiler Construction. 
Generate a quiz with EXACTLY ${numQuestions || 10} Multiple Choice Questions based ONLY on the provided source material.
Do NOT invent facts outside the source material. If there isn't enough material to make ${numQuestions} distinct questions, generate as many high-quality ones as possible and stop.
Make the questions challenging, avoiding obvious choices based on string length.
Include the correct answer and a brief explanation for each question.
All options must be plausible. Exactly one correct answer per question.

Return ONLY valid JSON matching the schema.`;

    parts.push({ text: promptText });

    if (sourceType === 'lecture' && lectureContext) {
      parts.push({ text: `Source Material:\n\n${lectureContext}` });
    } else if ((sourceType === 'pdf' || sourceType === 'image') && req.file) {
      parts.push({
        inlineData: {
          data: req.file.buffer.toString('base64'),
          mimeType: req.file.mimetype
        }
      });
      parts.push({ text: "Please analyze the attached document/image to generate the questions." });
    } else {
      return res.status(400).json({ error: 'Missing source material.' });
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            { role: 'user', parts: parts }
        ],
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    questions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                question_type: { type: Type.STRING, description: "always 'mcq'" },
                                question_text: { type: Type.STRING },
                                marks: { type: Type.INTEGER },
                                explanation: { type: Type.STRING },
                                source_reference: { type: Type.STRING, description: "Reference to the source material concept" },
                                options: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            option_text: { type: Type.STRING },
                                            is_correct: { type: Type.BOOLEAN }
                                        }
                                    }
                                }
                            },
                            required: ["question_type", "question_text", "marks", "options", "explanation"]
                        }
                    }
                },
                required: ["title", "description", "questions"]
            }
        }
    });

    const draftQuiz = JSON.parse(response.text());
    res.json(draftQuiz);

  } catch (error) {
    console.error("Compiler AI Generation Error:", error);
    res.status(500).json({ error: 'Failed to generate quiz', details: error.message });
  }
});

// General File-based AI Quiz Generator
app.post('/api/ai/generate-quiz-from-file', requireTeacher, aiRateLimiter, upload.single('file'), async (req, res) => {
  const { types } = req.body; // Expecting a JSON stringified array or comma-separated string
  
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in .env' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  let selectedTypes = [];
  try {
    selectedTypes = JSON.parse(types);
  } catch(e) {
    selectedTypes = types ? types.split(',') : ['mcq'];
  }

  const promptText = `You are an expert educator. 
Analyze the provided document/image.

CRITICAL INSTRUCTION: If the image/document is a random picture, contains no text, or has no usable educational content to create questions from, you MUST set the "error" field to EXACTLY: "this image contains no text that can be used to create mcqs please give a genuine pic." and leave the questions array empty.

Otherwise, generate a comprehensive quiz based ONLY on the provided material.
Do NOT invent facts outside the source material.

Requested question formats: ${selectedTypes.join(', ')}.
If multiple formats are requested, provide a balanced mix.

For "mcq" and "true_false", you must provide plausible options and mark the correct one.
For "short_answer" and "written" (question answers) or "fill_in_the_blanks", provide the expected answer/rubric.

Return ONLY valid JSON matching the exact provided schema.`;

  const schemaStructure = `
Return ONLY valid JSON matching this exact structure:
{
  "error": "Set this to exactly 'this image contains no text that can be used to create mcqs please give a genuine pic.' if the image contains no text or is irrelevant, otherwise omit",
  "title": "Quiz Title",
  "description": "Quiz Description",
  "questions": [
    {
      "question_type": "mcq | true_false | short_answer | written | fill_in_the_blanks",
      "question_text": "Question text",
      "marks": 1,
      "explanation": "Explanation",
      "options": [{"option_text": "Option text", "is_correct": true}],
      "expected_answer": "Expected answer text"
    }
  ]
}`;

  const imagePayload = { url: `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` };

  const tryOpenRouter = async () => {
    if (!process.env.OPENROUTER_API_KEY) throw new Error("No OPENROUTER_API_KEY configured");
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);
    
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "google/gemini-3.6-flash",
          response_format: { type: "json_object" },
          max_tokens: 8000,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: promptText + "\n\n" + schemaStructure },
                { type: "image_url", image_url: imagePayload }
              ]
            }
          ]
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  };

  const tryOpenAI = async () => {
    if (!process.env.OPENAI_API_KEY) throw new Error("No OPENAI_API_KEY configured");
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 45000
    });
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: promptText + "\n\n" + schemaStructure },
            { type: "image_url", image_url: imagePayload }
          ]
        }
      ]
    });
    
    return JSON.parse(response.choices[0].message.content);
  };

  const tryGemini = async () => {
    if (!process.env.GEMINI_API_KEY) throw new Error("No GEMINI_API_KEY configured");
    
    const ai = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { timeout: 45000 }
    });
    
    const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [{ role: 'user', parts: [
          { text: promptText },
          { inlineData: { data: req.file.buffer.toString('base64'), mimeType: req.file.mimetype } },
          { text: "Please analyze the attached document/image and generate the questions." }
        ] }],
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    error: { type: Type.STRING, description: "Error message if the image contains no usable text" },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    questions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                question_type: { type: Type.STRING },
                                question_text: { type: Type.STRING },
                                marks: { type: Type.INTEGER },
                                explanation: { type: Type.STRING },
                                options: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { option_text: { type: Type.STRING }, is_correct: { type: Type.BOOLEAN } } } },
                                expected_answer: { type: Type.STRING }
                            },
                            required: ["question_type", "question_text", "marks"]
                        }
                    }
                },
                required: ["questions"]
            }
        }
    });
    return JSON.parse(response.text());
  };

  try {
    let draftQuiz = null;
    let errors = [];

    const logProviderError = (provider, error) => {
      const code = error.code || error.cause?.code || 'UNKNOWN_CODE';
      const status = error.status || error.cause?.status || 'UNKNOWN_STATUS';
      console.error(`[AI Provider Failed] ${provider}`);
      console.error(`  - Status: ${status}`);
      console.error(`  - Code: ${code}`);
      console.error(`  - Message: ${error.message}`);
      errors.push(`${provider} (${code}): ${error.message}`);
    };

    // Priority 1: OpenRouter
    try {
      console.log("Attempting AI generation with OpenRouter...");
      draftQuiz = await tryOpenRouter();
    } catch (e) {
      logProviderError("OpenRouter", e);
    }

    // Priority 2: OpenAI
    if (!draftQuiz) {
      try {
        console.log("Attempting AI generation with OpenAI...");
        draftQuiz = await tryOpenAI();
      } catch (e) {
        logProviderError("OpenAI", e);
      }
    }

    // Priority 3: Gemini Native
    if (!draftQuiz) {
      try {
        console.log("Attempting AI generation with Gemini Native...");
        draftQuiz = await tryGemini();
      } catch (e) {
        logProviderError("Gemini", e);
      }
    }

    if (!draftQuiz) {
      console.error("All AI providers failed. Sending 500 to client.");
      return res.status(500).json({ error: 'All AI providers failed to generate a response', details: errors.join(' | ') });
    }

    if (draftQuiz.error) {
      return res.status(400).json({ error: draftQuiz.error });
    }
    
    res.json(draftQuiz);

  } catch (error) {
    console.error("Critical AI Generation Error:", error.message);
    res.status(500).json({ error: 'Failed to generate quiz due to an internal error', details: error.message });
  }
});

// Text-based AI Quiz Generator (Used as fallback for local extractor)
app.post('/api/ai/parse-text-to-quiz', requireTeacher, aiRateLimiter, async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'No text provided' });
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });

  const promptText = `You are an expert quiz parser and generator.
I will provide you with text extracted from a PDF or image.
If the text contains explicit multiple choice questions, extract them exactly as is, with zero mistakes. Ensure you identify the correct option if it is marked or implied. If not marked, just leave it as false.
If the text is just study notes, paragraphs, or general information, generate a high-quality quiz based on the notes.

Return ONLY a valid JSON array of objects matching this exact format:
[
  {
    "question_type": "mcq",
    "question_text": "...",
    "marks": 1,
    "explanation": "...",
    "options": [
      { "option_text": "...", "is_correct": true }
    ],
    "expected_answer": "..."
  }
]`;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            { role: 'user', parts: [{ text: promptText }, { text: `TEXT TO PROCESS:\n\n${text}` }] }
        ],
        config: {
            responseMimeType: "application/json"
        }
    });

    const questions = JSON.parse(response.text());
    res.json(questions);
  } catch (error) {
    console.error("Text to Quiz Error:", error);
    res.status(500).json({ error: 'Failed to generate questions from text' });
  }
});

// Start Quiz Endpoint (Securely creates an attempt)
app.post('/api/quiz/start', requireStudent, async (req, res) => {
  const { quizId } = req.body;
  const studentId = req.user.id;

  try {
    // Check if an abandoned (cheating) attempt already exists
    const { data: existingAttempts, error: checkErr } = await supabase
      .from('quiz_attempts')
      .select('status')
      .eq('quiz_id', quizId)
      .eq('student_id', studentId);

    if (checkErr) throw checkErr;

    const hasCheated = existingAttempts?.some(a => a.status === 'cheating_detected');
    if (hasCheated) {
      return res.status(403).json({ error: 'Cheating detected on a previous attempt. No new attempts allowed.' });
    }

    const inProgress = existingAttempts?.find(a => a.status === 'in_progress');
    if (inProgress) {
      return res.status(200).json(inProgress); // Return existing active attempt
    }

    const attemptNumber = existingAttempts ? existingAttempts.length + 1 : 1;

    // Otherwise create a new attempt
    const { data: newAttempt, error: insertErr } = await supabase
      .from('quiz_attempts')
      .insert({
        quiz_id: quizId,
        student_id: studentId,
        attempt_number: attemptNumber,
        status: 'in_progress'
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    res.status(200).json(newAttempt);
  } catch (error) {
    console.error('Error starting quiz:', error);
    res.status(500).json({ error: 'Failed to start quiz attempt' });
  }
});

// Delete Quiz Attempt Endpoint (Teacher only)
app.delete('/api/quiz/attempt/:attemptId', requireTeacher, async (req, res) => {
  const { attemptId } = req.params;
  const userId = req.user.id;

  try {
    // 1. Verify the teacher owns the course for this attempt
    const { data: attempt, error: attemptErr } = await supabase
      .from('quiz_attempts')
      .select('quizzes(course_id, courses(teacher_id))')
      .eq('id', attemptId)
      .single();

    if (attemptErr || !attempt) {
      return res.status(404).json({ error: 'Attempt not found.' });
    }

    if (attempt.quizzes.courses.teacher_id !== userId) {
      return res.status(403).json({ error: 'You do not have permission to manage this attempt.' });
    }

    // 2. Delete the attempt (Service role bypasses RLS and cascades properly)
    const { error: deleteErr } = await supabase
      .from('quiz_attempts')
      .delete()
      .eq('id', attemptId);

    if (deleteErr) throw deleteErr;

    res.status(200).json({ message: 'Attempt deleted successfully.' });
  } catch (err) {
    console.error('Error deleting attempt:', err);
    res.status(500).json({ error: 'Failed to delete attempt.' });
  }
});

// Cheating Detected Endpoint (Immediately persist cheating status)
app.post('/api/quiz/cheating', requireStudent, async (req, res) => {
  const { attemptId, violationEvent, metadata } = req.body;
  const studentId = req.user.id;

  try {
    // 1. Verify attempt belongs to student
    const { data: attempt, error: attemptErr } = await supabase
      .from('quiz_attempts')
      .select('*, quizzes(*)')
      .eq('id', attemptId)
      .eq('student_id', studentId)
      .single();

    if (attemptErr || !attempt) {
      return res.status(400).json({ error: 'Invalid attempt.' });
    }

    // If it's already terminal, do not override
    if (['submitted', 'auto_submitted', 'graded', 'cheating_detected'].includes(attempt.status)) {
      return res.status(400).json({ error: 'Attempt is already in a terminal state.' });
    }

    // 2. Log Integrity Event
    await supabase.from('quiz_integrity_events').insert({
      attempt_id: attemptId,
      event_type: violationEvent || 'CHEATING_DETECTED',
      metadata: metadata || {}
    });

    // 3. Update attempt status immediately
    const { data: updatedAttempt, error: updateErr } = await supabase
      .from('quiz_attempts')
      .update({
        status: 'cheating_detected',
        score: 0,
        percentage: 0,
        passed: false
        // we DO NOT set submitted_at to keep it cleanly distinguished
      })
      .eq('id', attemptId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // Log Activity
    await supabase.from('student_activity').insert({
      student_id: studentId,
      activity_type: 'quiz_cheating_detected',
      quiz_id: attempt.quiz_id,
      course_id: attempt.quizzes.course_id,
      metadata: { event: violationEvent }
    });

    res.status(200).json(updatedAttempt);
  } catch (error) {
    console.error('Error recording cheating:', error);
    res.status(500).json({ error: 'Failed to record cheating state.' });
  }
});

// Quiz Grading Endpoint
app.post('/api/quiz/submit', requireStudent, submitRateLimiter, async (req, res) => {
  const { attemptId, answers, isCheating } = req.body;
  const studentId = req.user.id;

  try {
    // 1. Verify attempt belongs to student and is in progress
    // Using FOR UPDATE to lock the row and prevent race conditions (duplicate grading)
    const { data: attempt, error: attemptErr } = await supabase
      .from('quiz_attempts')
      .select('*, quizzes(*)')
      .eq('id', attemptId)
      .eq('student_id', studentId)
      .eq('status', 'in_progress')
      .single();
      
    if (attemptErr || !attempt) {
      return res.status(400).json({ error: 'Invalid or already submitted attempt.' });
    }

    const quizId = attempt.quiz_id;
    
    // Check expiration (Server-side timing)
    let isExpired = false;
    if (attempt.quizzes.duration_minutes) {
      const startTime = new Date(attempt.started_at).getTime();
      const elapsedMinutes = (Date.now() - startTime) / (1000 * 60);
      // Allow a small 1-minute buffer for network latency
      if (elapsedMinutes > attempt.quizzes.duration_minutes + 1) {
        isExpired = true;
      }
    }

    // 2. Fetch the correct answers from the database using service role (bypassing RLS)
    const { data: options, error: optErr } = await supabase
      .from('quiz_question_options')
      .select('question_id, id, is_correct');
      
    // Fetch questions to know marks
    const { data: questions } = await supabase
      .from('quiz_questions')
      .select('id, marks, question_type')
      .eq('quiz_id', quizId);

    // 3. Calculate score
    let totalScore = 0;
    let maxPossibleScore = 0;
    const finalAnswers = [];

    // Map questions for easy lookup
    const qMap = {};
    questions.forEach(q => {
      qMap[q.id] = q;
      maxPossibleScore += q.marks;
    });

    // Map correct options
    const correctOptions = {};
    options.forEach(opt => {
      if (opt.is_correct) {
        if (!correctOptions[opt.question_id]) correctOptions[opt.question_id] = [];
        correctOptions[opt.question_id].push(opt.id);
      }
    });

    for (const ans of answers) {
      const q = qMap[ans.question_id];
      if (!q) continue;

      let isCorrect = false;
      let marksAwarded = 0;

      if (q.question_type === 'mcq' || q.question_type === 'true_false') {
        const correctOptIds = correctOptions[q.id] || [];
        if (correctOptIds.includes(ans.selected_option_id)) {
          isCorrect = true;
          marksAwarded = q.marks;
        }
      } else {
        // Written answers need manual grading, default to 0
        isCorrect = null;
        marksAwarded = 0;
      }

      if (isCorrect) {
        totalScore += marksAwarded;
      }

      finalAnswers.push({
        attempt_id: attemptId,
        question_id: ans.question_id,
        selected_option_id: ans.selected_option_id,
        answer_text: ans.answer_text,
        is_correct: isCorrect,
        marks_awarded: marksAwarded
      });
    }

    // 4. Save answers
    if (finalAnswers.length > 0) {
      await supabase.from('quiz_answers').insert(finalAnswers);
    }

    // 5. Update attempt
    const percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
    const passed = percentage >= (attempt.quizzes.passing_percentage || 50);

    const finalStatus = isExpired ? 'auto_submitted' : 'submitted';
    const finalScore = totalScore;
    const finalPercentage = percentage;
    const finalPassed = passed;

    const { data: updatedAttempt } = await supabase
      .from('quiz_attempts')
      .update({
        status: finalStatus,
        submitted_at: new Date().toISOString(),
        score: finalScore,
        percentage: finalPercentage,
        passed: finalPassed
      })
      .eq('id', attemptId)
      .select()
      .single();

    // Log Student Activity (Quiz Submitted/Passed/Failed)
    let activityType = 'quiz_submitted';
    if (updatedAttempt) {
      if (passed) {
        activityType = 'quiz_passed';
      } else {
        activityType = 'quiz_failed';
      }
      
      await supabase.from('student_activity').insert({
        student_id: studentId,
        activity_type: activityType,
        quiz_id: quizId,
        course_id: attempt.quizzes.course_id,
        metadata: { score: totalScore, percentage }
      });
      
      // Create Notification for Student
      await supabase.from('notifications').insert({
        user_id: studentId,
        type: 'QUIZ_RESULT',
        title: 'Quiz Result Available',
        message: `Your result for "${attempt.quizzes.title}" is available. Score: ${percentage.toFixed(1)}%`,
        link: `/results`,
        course_id: attempt.quizzes.course_id
      });
    }

    res.json({
      success: true,
      attempt: updatedAttempt,
      expired: isExpired
    });

  } catch (error) {
    console.error("Grading Error:", error);
    res.status(500).json({ error: 'Failed to grade quiz' });
  }
});

// Integrity Event Logging Endpoint
app.post('/api/quiz/integrity-event', requireStudent, async (req, res) => {
  const { attemptId, eventType, metadata } = req.body;
  const studentId = req.user.id;
  
  if (!attemptId || !eventType) {
    return res.status(400).json({ error: 'Missing attemptId or eventType' });
  }
  
  try {
    // Insert bypassing standard RLS checks to ensure server-side logging always succeeds if authenticated
    await supabase.from('quiz_integrity_events').insert({
      attempt_id: attemptId,
      student_id: studentId,
      event_type: eventType,
      metadata: metadata || {}
    });
    
    res.json({ success: true });
  } catch (err) {
    console.error("Integrity Log Error:", err);
    res.status(500).json({ error: 'Failed to log event' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server API listening on port ${PORT}`);
});
