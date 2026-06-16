const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_KEY = process.env.GEMINI_API_KEY;

app.post('/analyze', async (req, res) => {
  try {
    const { transcript, author } = req.body;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Analyse cette vidéo TikTok virale.\nTexte: "${transcript}"\nAuteur: @${author}\n\nRéponds UNIQUEMENT en JSON sans markdown ni backticks:\n{"style_visuel":"description 2 phrases","runway_prompt":"prompt anglais Runway ML vidéo similaire visuellement différente max 80 mots","analyse":"pourquoi ça cartonne 2 phrases","voix_instructions":"ton rythme émotion pour ElevenLabs"}`
          }]
        }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
      })
    });
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const clean = text.replace(/```json|```/g, '').trim();
    res.json(JSON.parse(clean));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/', (req, res) => res.send('TrendAI Server OK'));

app.listen(process.env.PORT || 3000, () => console.log('Server running'));
