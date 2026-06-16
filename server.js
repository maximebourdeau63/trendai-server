const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

const GROQ_KEY = process.env.GROQ_API_KEY;

app.post('/analyze', async (req, res) => {
  try {
    const { transcript, author } = req.body;
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${GROQ_KEY}`
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert TikTok. Tu réponds UNIQUEMENT avec un objet JSON valide, sans backticks, sans explication, sans markdown.'
          },
          {
            role: 'user',
            content: `Analyse cette vidéo TikTok virale.\nTexte: "${transcript}"\nAuteur: @${author}\n\nRéponds avec ce JSON exactement:\n{"style_visuel":"description 2 phrases","runway_prompt":"prompt anglais Runway max 80 mots","analyse":"pourquoi ca cartonne 2 phrases","voix_instructions":"ton rythme emotion ElevenLabs"}`
          }
        ],
        temperature: 0.5,
        max_tokens: 800
      })
    });

    const data = await response.json();
    console.log('Groq raw:', JSON.stringify(data).slice(0, 300));

    const raw = data.choices?.[0]?.message?.content || '';
    console.log('Raw text:', raw.slice(0, 300));

    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Pas de JSON dans la réponse');

    const parsed = JSON.parse(match[0]);
    res.json(parsed);
  } catch (e) {
    console.error('Erreur:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get('/', (req, res) => res.send('TrendAI Server OK'));

app.listen(process.env.PORT || 3000, () => console.log('Server running'));
