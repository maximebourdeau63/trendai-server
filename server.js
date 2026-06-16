const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const GROQ_KEY = process.env.GROQ_API_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const RUNWAY_KEY = process.env.RUNWAY_API_KEY;
const PORT = process.env.PORT || 10000;

app.post('/analyze', async (req, res) => {
  try {
    const { transcript, author } = req.body;
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'authorization': `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'Tu es un expert TikTok. Tu réponds UNIQUEMENT avec un objet JSON valide, sans backticks, sans explication.' },
          { role: 'user', content: `Analyse cette vidéo TikTok virale.\nTexte: "${transcript}"\nAuteur: @${author}\n\nRéponds avec ce JSON:\n{"style_visuel":"description 2 phrases","runway_prompt":"prompt anglais Runway ML pour générer une vidéo similaire max 80 mots","analyse":"pourquoi ca cartonne 2 phrases","voix_instructions":"ton rythme emotion"}` }
        ],
        temperature: 0.5,
        max_tokens: 800
      })
    });
    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Pas de JSON: ' + raw.slice(0,100));
    res.json(JSON.parse(match[0]));
  } catch(e) {
    console.error('Analyze error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post('/voice', async (req, res) => {
  try {
    const { text } = req.body;
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { 'authorization': `Bearer ${OPENAI_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'tts-1', input: text.slice(0, 1000), voice: 'nova' })
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(JSON.stringify(err));
    }
    const buffer = await response.buffer();
    res.set('Content-Type', 'audio/mpeg');
    res.send(buffer);
  } catch(e) {
    console.error('Voice error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post('/video', async (req, res) => {
  try {
    const { prompt } = req.body;
    const startRes = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
      method: 'POST',
      headers: { 'authorization': `Bearer ${RUNWAY_KEY}`, 'content-type': 'application/json', 'X-Runway-Version': '2024-11-06' },
      body: JSON.stringify({ promptText: prompt, model: 'gen4_turbo', ratio: '720:1280', duration: 5 })
    });
    if (!startRes.ok) {
      const err = await startRes.json();
      throw new Error(JSON.stringify(err));
    }
    const startData = await startRes.json();
    const taskId = startData.id;
    for (let i = 0; i < 24; i++) {
      await new Promise(r => setTimeout(r, 5000));
      const pollRes = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, {
        headers: { 'authorization': `Bearer ${RUNWAY_KEY}`, 'X-Runway-Version': '2024-11-06' }
      });
      const pollData = await pollRes.json();
      if (pollData.status === 'SUCCEEDED') return res.json({ url: pollData.output?.[0] });
      if (pollData.status === 'FAILED') throw new Error('Runway generation failed');
    }
    throw new Error('Timeout — génération trop longue');
  } catch(e) {
    console.error('Video error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get('/', (req, res) => res.send('TrendAI Server OK'));
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
