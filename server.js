const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

app.post('/analyze', async (req, res) => {
  try {
    const { transcript, author } = req.body;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Analyse cette vidéo TikTok virale.\nTexte: "${transcript}"\nAuteur: @${author}\n\nRéponds UNIQUEMENT en JSON sans markdown:\n{"style_visuel":"description 2 phrases","runway_prompt":"prompt anglais Runway ML vidéo similaire visuellement différente max 80 mots","analyse":"pourquoi ça cartonne 2 phrases","voix_instructions":"ton rythme émotion pour ElevenLabs"}`
        }]
      })
    });
    const data = await response.json();
    const text = data.content.map(c => c.text || '').join('').replace(/```json|```/g, '').trim();
    res.json(JSON.parse(text));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/', (req, res) => res.send('TrendAI Server OK'));

app.listen(process.env.PORT || 3000, () => console.log('Server running'));
