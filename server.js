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
const { kv } = require('@vercel/kv'); // Vercel KV Database

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
// DATABASE (Vercel KV or local fallback)
// ============================================================
const USE_KV = !!process.env.KV_URL;
const DB_FILE = path.join(__dirname, 'users.json');

// Local fallback memory
let localDb = { users: {}, devices: {} };
if (!USE_KV) {
    try {
        if (fs.existsSync(DB_FILE)) {
            const raw = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
            if (raw.users) localDb.users = raw.users;
            if (raw.devices) localDb.devices = raw.devices;
            // Migrate old deviceCounts if present
            if (raw.deviceCounts) {
                for (let k in raw.deviceCounts) {
                    if (!localDb.devices[k]) localDb.devices[k] = { count: raw.deviceCounts[k], history: [], createdAt: Date.now() };
                }
            }
        }
    } catch (e) { localDb = { users: {}, devices: {} }; }
}

function saveLocalDb() {
    if (USE_KV) return;
    try { fs.writeFileSync(DB_FILE, JSON.stringify(localDb, null, 2)); } catch (e) { }
}

async function getUser(email) {
    if (USE_KV) return await kv.hget('users', email);
    return localDb.users[email];
}
async function saveUser(email, data) {
    if (USE_KV) await kv.hset('users', { [email]: data });
    else { localDb.users[email] = data; saveLocalDb(); }
}
async function getAllUsers() {
    if (USE_KV) return (await kv.hgetall('users')) || {};
    return localDb.users;
}

async function getDevice(id) {
    if (USE_KV) return await kv.hget('devices', id);
    return localDb.devices[id];
}
async function saveDevice(id, data) {
    if (USE_KV) await kv.hset('devices', { [id]: data });
    else { localDb.devices[id] = data; saveLocalDb(); }
}
async function getAllDevices() {
    if (USE_KV) return (await kv.hgetall('devices')) || {};
    return localDb.devices;
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
app.get('/api/device/:deviceId', async (req, res) => {
    const { deviceId } = req.params;
    const device = await getDevice(deviceId);
    res.json({ history: device ? device.history : [], count: device ? device.count : 0 });
});

app.post('/api/device/:deviceId/history', async (req, res) => {
    const { deviceId } = req.params;
    let device = await getDevice(deviceId) || { history: [], count: 0, createdAt: Date.now() };
    device.history = req.body;
    await saveDevice(deviceId, device);
    res.json({ success: true });
});

app.post('/api/device/:deviceId/increment', async (req, res) => {
    const { deviceId } = req.params;
    let device = await getDevice(deviceId) || { history: [], count: 0, createdAt: Date.now() };
    device.count = (device.count || 0) + 1;
    await saveDevice(deviceId, device);
    res.json({ success: true, count: device.count });
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

app.post('/api/auth/google', async (req, res) => {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'No credential' });

    const user = decodeGoogleJWT(credential);
    if (!user || !user.email) return res.status(400).json({ error: 'Invalid token' });

    let u = await getUser(user.email);
    if (!u) {
        u = {
            email: user.email, name: user.name, picture: user.picture,
            isApproved: false, generationCount: 0, history: [], createdAt: Date.now()
        };
    } else {
        u.name = user.name;
        u.picture = user.picture;
    }
    await saveUser(user.email, u);

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

app.get('/api/user/:email', async (req, res) => {
    const email = decodeURIComponent(req.params.email);
    const u = await getUser(email);
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

app.post('/api/user/:email/history', async (req, res) => {
    const email = decodeURIComponent(req.params.email);
    const u = await getUser(email);
    if (!u) return res.status(404).json({ error: 'User not found' });
    u.history = req.body;
    await saveUser(email, u);
    res.json({ success: true });
});

app.post('/api/user/:email/increment', async (req, res) => {
    const email = decodeURIComponent(req.params.email);
    const u = await getUser(email);
    if (!u) return res.status(404).json({ error: 'User not found' });
    u.generationCount = (u.generationCount || 0) + 1;
    await saveUser(email, u);
    res.json({ success: true, count: u.generationCount });
});

// ============================================================
// ADMIN (protected)
// ============================================================
app.get('/api/admin/users', adminAuth, async (req, res) => {
    try {
        const dictUsers = await getAllUsers();
        const dictDevices = await getAllDevices();
        
        const users = Object.values(dictUsers || {}).map(u => ({
            email: u.email, name: u.name, picture: u.picture,
            isApproved: u.isApproved,
            generationCount: u.generationCount || 0,
            historyCount: (u.history || []).length,
            createdAt: u.createdAt
        }));
        
        const devices = Object.keys(dictDevices || {}).map(id => ({
            id: id,
            count: dictDevices[id].count || 0,
            historyCount: (dictDevices[id].history || []).length,
            createdAt: dictDevices[id].createdAt
        }));
        
        res.json({ users, devices });
    } catch(err) {
        console.error('Admin Fetch error: ', err);
        res.status(500).json({ error: 'Failed to fetch' });
    }
});

app.post('/api/admin/approve', adminAuth, async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(404).json({ error: 'User not found' });
    const u = await getUser(email);
    if (!u) return res.status(404).json({ error: 'User not found' });
    u.isApproved = true;
    await saveUser(email, u);
    res.json({ success: true });
});

app.post('/api/admin/deny', adminAuth, async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(404).json({ error: 'User not found' });
    const u = await getUser(email);
    if (!u) return res.status(404).json({ error: 'User not found' });
    u.isApproved = false;
    await saveUser(email, u);
    res.json({ success: true });
});

// ============================================================
// FILE EXTRACTION
// ============================================================
app.post('/api/extract/url', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: 'No URL provided' });
        const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 });
        const $ = cheerio.load(response.data);
        $('script, style, noscript, iframe, img, svg, video').remove();
        const text = $('body').text().replace(/\s+/g, ' ').trim();
        res.json({ text: text.substring(0, 50000) });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
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
        const child = spawn('gemini', ['-p', prompt, '--yolo'], { env, timeout: 120000, shell: true });
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
    try {
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 8192, temperature: 0.7 }
        }, { timeout: 120000 });
        const candidates = response.data.candidates;
        if (!candidates || candidates.length === 0) throw new Error('No response from Gemini API');
        return candidates[0].content.parts.map(p => p.text).join('');
    } catch (e) {
        if (e.response && e.response.data) {
            console.error('Gemini API Error Response:', JSON.stringify(e.response.data, null, 2));
            throw new Error(`Gemini API Error: ${e.response.data.error?.message || JSON.stringify(e.response.data)}`);
        }
        console.error('Gemini Request Error:', e.message);
        throw new Error(`Gemini Error: ${e.message}`);
    }
}

async function runGemini(prompt) {
    if (process.env.VERCEL) {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("🚨 Vercel Error: GEMINI_API_KEY is not set! Please go to your Vercel Dashboard -> Settings -> Environment Variables, add GEMINI_API_KEY, and redeploy.");
        }
        return runGeminiAPI(prompt);
    }

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
    const { prompt, deviceId } = req.body;
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
