const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const GROQ_KEY = process.env.GROQ_API_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const PORT = process.env.PORT || 10000;

app.post('/analyze', async (req, res) => {
  try {
    const { transcript, author, cover } = req.body;
    let imageAnalysis = '';
    if (cover) {
      try {
        const visionRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'authorization': `Bearer ${OPENAI_KEY}`, 'content-type': 'application/json' },
          body: JSON.stringify({
            model: 'gpt-4o',
            max_tokens: 300,
            messages: [{ role: 'user', content: [
              { type: 'image_url', image_url: { url: cover } },
              { type: 'text', text: 'Décris précisément le style visuel de cette vidéo TikTok: couleurs dominantes, ambiance, cadrage, style vestimentaire, décor, éclairage, effets visuels. Sois très précis en 3-4 phrases.' }
            ]}]
          })
        });
        const vd = await visionRes.json();
        imageAnalysis = vd.choices?.[0]?.message?.content || '';
      } catch(e) { console.log('Vision error:', e.message); }
    }
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'authorization': `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'Tu es un expert TikTok. Tu réponds UNIQUEMENT avec un objet JSON valide, sans backticks, sans explication.' },
         { role: 'user', content: `Tu es un expert en création de contenu TikTok et en génération vidéo IA.\n\nVidéo TikTok virale à recréer:\nTexte dit dans la vidéo: "${transcript}"\nAuteur: @${author}\n${imageAnalysis ? `Style visuel détecté: ${imageAnalysis}` : ''}\n\nGénère un prompt Runway ML TRÈS détaillé pour recréer visuellement cette vidéo. Le prompt doit décrire précisément: le type de shot (selfie, face cam, plan large...), l'éclairage (naturel, LED, studio...), l'ambiance (détendu, professionnel, drôle...), les couleurs dominantes, le décor, le style vestimentaire probable, les mouvements de caméra, le rythme visuel. Inspiré du texte et du contexte.\n\nRéponds avec ce JSON:\n{"style_visuel":"description précise du style en français","runway_prompt":"prompt anglais ultra détaillé pour Runway ML, minimum 80 mots, très fidèle au style TikTok original","analyse":"pourquoi ca cartonne 2 phrases","voix_instructions":"ton rythme emotion pour la voix off"}` }
        temperature: 0.5,
        max_tokens: 1000
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
    if (!response.ok) { const err = await response.json(); throw new Error(JSON.stringify(err)); }
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
