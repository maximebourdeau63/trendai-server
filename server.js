
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
            text: `Tu es un expert TikTok. Analyse cette vidéo virale.\nTexte: "${transcript}"\nAuteur: @${author}\n\nRéponds avec UNIQUEMENT un objet JSON valide, rien d'autre, pas de backticks, pas d'explication:\n{"style_visuel":"description 2 phrases","runway_prompt":"prompt anglais Runway max 80 mots","analyse":"pourquoi ca cartonne 2 phrases","voix_instructions":"ton rythme emotion ElevenLabs"}`
          }]
        }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 800,
          responseMimeType: "application/json"
        }
      })
    });

    const data = await response.json();
    console.log('Gemini raw:', JSON.stringify(data).slice(0, 500));

    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('Raw text:', raw.slice(0, 300));

    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Pas de JSON trouvé dans la réponse Gemini');

    const parsed = JSON.parse(match[0]);
    res.json(parsed);
  } catch (e) {
    console.error('Erreur:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get('/', (req, res) => res.send('TrendAI Server OK'));

app.listen(process.env.PORT || 3000, () => console.log('Server running'));
