const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

const GROQ_KEY = process.env.GROQ_API_KEY;
const ELEVENLABS_KEY = process.env.ELEVENLABS_API_KEY;
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
          { role: 'user', content: `Analyse cette vidéo TikTok virale.\nTexte: "${transcript}"\nAuteur: @${author}\n\nRéponds avec ce JSON:\n{"style_visuel":"description 2 phrases","runway_prompt":"prompt anglais Runway max 80 mots","analyse":"pourquoi ca cartonne 2 phrases","voix_instructions":"ton rythme emotion ElevenLabs"}` }
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
    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
      method: 'POST',
      headers: { 'xi-api-key': ELEVENLABS_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({
        text: text.slice(0, 500),
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.8 }
      })
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

app.get('/', (req, res) => res.send('TrendAI Server OK'));
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
