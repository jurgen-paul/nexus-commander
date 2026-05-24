import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Initialize Gemini safely
const getGeminiClient = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.warn('Warning: GEMINI_API_KEY is not defined in the environment.');
  }
  return new GoogleGenAI({
    apiKey: key || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

const ai = getGeminiClient();

// API endpoint for server-side Gemini generation
app.post('/api/gemini', async (req, res) => {
  try {
    const { prompt, systemInstruction } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt parameter' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction || 'You are a professional copywriter.',
        temperature: 0.7,
      }
    });

    res.json({ text: response.text });
  } catch (err: any) {
    console.error('Error invoking Gemini:', err);
    res.status(500).json({ error: err.message || 'Internal server error from Gemini' });
  }
});

// Serving Web interface
if (process.env.NODE_ENV === 'production') {
  console.log('Running in PRODUCTION mode');
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  console.log('Running in DEVELOPMENT mode with Vite Middleware');
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Unified Server] Live on http://0.0.0.0:${PORT}`);
});
export default app;
