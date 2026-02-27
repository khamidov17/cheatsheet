const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;
const MAX_AI_SHEETS = 5;

// Admin credentials (can override via env vars on Vercel)
const ADMIN_USER = process.env.ADMIN_USER || 'admin123';
const ADMIN_PASS = process.env.ADMIN_PASS || 'A20051017avazbekCheetsheet';

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const uploadDir = process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir, limits: { fileSize: 20 * 1024 * 1024 } });

// ============================================================
// DATABASE (JSON file local, in-memory on Vercel)
// ============================================================
const DB_FILE = process.env.VERCEL ? '/tmp/db.json' : path.join(__dirname, 'db.json');
let db = { users: {}, devices: {} };
try {
    if (fs.existsSync(DB_FILE)) {
        const raw = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        if (raw.users) db.users = raw.users;
        if (raw.devices) db.devices = raw.devices;
    }
} catch (e) { db = { users: {}, devices: {} }; }

function saveDb() {
    try { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); } catch (e) { }
}

// ============================================================
// ADMIN AUTH
// ============================================================
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USER && password === ADMIN_PASS) {
        // Generate a simple session token
        const token = Buffer.from(`${ADMIN_USER}:${Date.now()}`).toString('base64');
        res.json({ success: true, token });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

function adminAuth(req, res, next) {
    const auth = req.headers['x-admin-token'];
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const decoded = Buffer.from(auth, 'base64').toString();
        if (decoded.startsWith(ADMIN_USER + ':')) return next();
    } catch (e) { }
    res.status(401).json({ error: 'Unauthorized' });
}

// ============================================================
// DEVICE STATE (Free tier)
// ============================================================
app.get('/api/device/:deviceId', (req, res) => {
    const { deviceId } = req.params;
    const device = db.devices[deviceId];
    res.json({ history: device ? device.history : [] });
});

app.post('/api/device/:deviceId/history', (req, res) => {
    const { deviceId } = req.params;
    if (!db.devices[deviceId]) {
        db.devices[deviceId] = { history: [], createdAt: Date.now() };
    }
    db.devices[deviceId].history = req.body;
    saveDb();
    res.json({ success: true });
});

// ============================================================
// GOOGLE AUTH
// ============================================================
function decodeGoogleJWT(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
        return { email: payload.email, name: payload.name, picture: payload.picture, sub: payload.sub };
    } catch (e) { return null; }
}

app.post('/api/auth/google', (req, res) => {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'No credential' });

    const user = decodeGoogleJWT(credential);
    if (!user || !user.email) return res.status(400).json({ error: 'Invalid token' });

    if (!db.users[user.email]) {
        db.users[user.email] = {
            email: user.email, name: user.name, picture: user.picture,
            isApproved: false, generationCount: 0, history: [], createdAt: Date.now()
        };
    } else {
        db.users[user.email].name = user.name;
        db.users[user.email].picture = user.picture;
    }
    saveDb();

    const u = db.users[user.email];
    res.json({
        success: true,
        user: {
            email: u.email, name: u.name, picture: u.picture,
            isApproved: u.isApproved,
            generationCount: u.generationCount || 0,
            maxGenerations: MAX_AI_SHEETS
        }
    });
});

app.get('/api/user/:email', (req, res) => {
    const email = decodeURIComponent(req.params.email);
    const u = db.users[email];
    if (!u) return res.json({ user: null });
    res.json({
        user: {
            email: u.email, name: u.name, picture: u.picture,
            isApproved: u.isApproved,
            generationCount: u.generationCount || 0,
            maxGenerations: MAX_AI_SHEETS
        },
        history: u.history || []
    });
});

app.post('/api/user/:email/history', (req, res) => {
    const email = decodeURIComponent(req.params.email);
    if (!db.users[email]) return res.status(404).json({ error: 'User not found' });
    db.users[email].history = req.body;
    saveDb();
    res.json({ success: true });
});

app.post('/api/user/:email/increment', (req, res) => {
    const email = decodeURIComponent(req.params.email);
    if (!db.users[email]) return res.status(404).json({ error: 'User not found' });
    db.users[email].generationCount = (db.users[email].generationCount || 0) + 1;
    saveDb();
    res.json({ success: true, count: db.users[email].generationCount });
});

// ============================================================
// ADMIN (protected)
// ============================================================
app.get('/api/admin/users', adminAuth, (req, res) => {
    const users = Object.values(db.users).map(u => ({
        email: u.email, name: u.name, picture: u.picture,
        isApproved: u.isApproved,
        generationCount: u.generationCount || 0,
        historyCount: (u.history || []).length,
        createdAt: u.createdAt
    }));
    res.json({ users });
});

app.post('/api/admin/approve', adminAuth, (req, res) => {
    const { email } = req.body;
    if (!email || !db.users[email]) return res.status(404).json({ error: 'User not found' });
    db.users[email].isApproved = true;
    saveDb();
    res.json({ success: true });
});

app.post('/api/admin/deny', adminAuth, (req, res) => {
    const { email } = req.body;
    if (!email || !db.users[email]) return res.status(404).json({ error: 'User not found' });
    db.users[email].isApproved = false;
    saveDb();
    res.json({ success: true });
});

// ============================================================
// FILE EXTRACTION
// ============================================================
app.post('/api/extract/url', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: 'URL required' });
        const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const $ = cheerio.load(response.data);
        $('script, style, noscript, nav, footer, header').remove();
        let text = $('body').text().replace(/\s+/g, ' ').trim();
        res.json({ text: text.substring(0, 50000) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/extract/file', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file' });
        const text = await extractTextFromFile(req.file);
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.json({ text: text.substring(0, 50000) });
    } catch (e) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: e.message });
    }
});

async function extractTextFromFile(file) {
    const ext = file.originalname.toLowerCase();
    if (ext.endsWith('.pdf')) {
        const buf = fs.readFileSync(file.path);
        const data = await pdfParse(buf);
        return data.text;
    } else if (ext.endsWith('.docx')) {
        const result = await mammoth.extractRawText({ path: file.path });
        return result.value;
    } else {
        return fs.readFileSync(file.path, 'utf8');
    }
}

// ============================================================
// GEMINI — CLI (local) or API (Vercel)
// ============================================================
function getCleanEnv() {
    const env = { ...process.env };
    delete env.CLAUDECODE;
    return env;
}

function runGeminiCLI(prompt) {
    return new Promise((resolve, reject) => {
        const env = getCleanEnv();
        const child = spawn('gemini', ['-p', prompt, '--yolo'], { env, timeout: 120000 });
        let output = '', errorOutput = '';
        child.stdout.on('data', (d) => { output += d.toString(); });
        child.stderr.on('data', (d) => { errorOutput += d.toString(); });
        child.on('close', (code) => {
            const clean = output.replace(/\x1b\[[0-9;]*[mGKHF]/g, '').trim();
            if (code !== 0 && !clean) reject(new Error(errorOutput || 'Gemini CLI failed'));
            else resolve(clean);
        });
        child.on('error', (err) => reject(new Error('Could not start gemini: ' + err.message)));
    });
}

async function runGeminiAPI(prompt) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not set');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const response = await axios.post(url, {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 8192, temperature: 0.7 }
    }, { timeout: 120000 });
    const candidates = response.data.candidates;
    if (!candidates || candidates.length === 0) throw new Error('No response from Gemini API');
    return candidates[0].content.parts.map(p => p.text).join('');
}

async function runGemini(prompt) {
    // Use API if key is available (Vercel), otherwise fall back to CLI (local)
    if (process.env.GEMINI_API_KEY) {
        return runGeminiAPI(prompt);
    }
    return runGeminiCLI(prompt);
}

// ============================================================
// TOPIC SUMMARIZATION
// ============================================================
app.post('/api/summarize-topic', async (req, res) => {
    const { topic } = req.body;
    if (!topic) return res.status(400).json({ name: 'Cheatsheet' });
    if (topic.length <= 40) return res.json({ name: topic });
    try {
        const result = await runGemini(
            `Summarize this into a short cheatsheet title (2-5 words max, no quotes, no explanation, just the title): "${topic}"`
        );
        const name = result.replace(/["']/g, '').trim().substring(0, 50) || topic.substring(0, 40);
        res.json({ name });
    } catch (e) {
        res.json({ name: topic.substring(0, 40) });
    }
});

// ============================================================
// GENERATE & CHAT
// ============================================================
app.post('/api/generate', upload.array('files', 3), async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt required' });
    try {
        let fileContext = '';
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                try {
                    const text = await extractTextFromFile(file);
                    fileContext += `\n\n--- Source Material (${file.originalname}) ---\n${text.substring(0, 50000)}`;
                } catch (e) {
                    fileContext += `\n\n--- File: ${file.originalname} (could not read: ${e.message}) ---`;
                } finally {
                    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
                }
            }
        }
        const fullPrompt = `${fileContext ? 'Analyze the following source material carefully and extract all relevant exam notes:\n' + fileContext + '\n\n' : ''}${prompt}`;
        const result = await runGemini(fullPrompt);
        res.json({ result });
    } catch (err) {
        console.error('Generate error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/chat', upload.array('files', 3), async (req, res) => {
    try {
        const prompt = req.body.prompt;
        const context = req.body.context || '';
        if (!prompt) return res.status(400).json({ error: 'Prompt required' });
        let fileContext = '';
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                try {
                    const text = await extractTextFromFile(file);
                    fileContext += `\n\n--- File: ${file.originalname} ---\n${text.substring(0, 10000)}`;
                } catch (e) {
                    fileContext += `\n\n--- File: ${file.originalname} (could not read: ${e.message}) ---`;
                } finally {
                    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
                }
            }
        }
        const fullPrompt = `You are a helpful AI assistant for a cheatsheet app.
Task: ${prompt}
${fileContext ? 'Uploaded file content:' + fileContext : ''}
${context ? '\nCurrent Cheatsheet content:\n' + context : ''}

Please respond clearly and helpfully. If asked to update/modify the cheatsheet, output the updated sections as JSON array in the format: [{"title": "...", "body": "...HTML..."}]. Otherwise, just answer the question directly.`;
        const result = await runGemini(fullPrompt);
        res.json({ result });
    } catch (err) {
        console.error('Chat error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/info', (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    res.json({ ip, port: PORT });
});

// Only listen when not running as Vercel serverless
if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`\n✅ CheatsheetAI Server running!`);
        console.log(`   Local:   http://localhost:${PORT}`);
        try {
            const { networkInterfaces } = require('os');
            const nets = networkInterfaces();
            for (const name of Object.keys(nets)) {
                for (const net of nets[name]) {
                    if (net.family === 'IPv4' && !net.internal)
                        console.log(`   Network: http://${net.address}:${PORT}`);
                }
            }
        } catch (e) { }
        console.log('');
    });
}

// Export for Vercel serverless
module.exports = app;
