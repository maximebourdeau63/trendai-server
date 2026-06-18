const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json({ limit: '100mb' }));

const GROQ_KEY = process.env.GROQ_API_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const DOMO_KEY = process.env.DOMO_API_KEY;
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
            model: 'gpt-4o', max_tokens: 300,
            messages: [{ role: 'user', content: [
              { type: 'image_url', image_url: { url: cover } },
              { type: 'text', text: 'Décris précisément le style visuel: couleurs, ambiance, cadrage, décor, éclairage en 3-4 phrases.' }
            ]}]
          })
        });
        const vd = await visionRes.json();
        imageAnalysis = vd.choices?.[0]?.message?.content || '';
      } catch(e) {}
    }
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'authorization': `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'Tu es un expert TikTok. Tu réponds UNIQUEMENT avec un objet JSON valide, sans backticks.' },
          { role: 'user', content: `Analyse cette vidéo TikTok.\nTexte: "${transcript}"\nAuteur: @${author}\n${imageAnalysis ? `Style: ${imageAnalysis}` : ''}\n\nJSON:\n{"style_visuel":"description","cartoon_prompt":"Family Guy 2D cartoon animation style, thick black outlines, cel shading, vibrant colors, expressive funny face, comedy, describe the scene precisely in english min 50 words","analyse":"pourquoi ca cartonne","voix_instructions":"ton rythme"}` }
        ],
        temperature: 0.5, max_tokens: 1000
      })
    });
    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Pas de JSON');
    res.json(JSON.parse(match[0]));
  } catch(e) {
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
    if (!response.ok) throw new Error(await response.text());
    const buffer = await response.buffer();
    res.set('Content-Type', 'audio/mpeg');
    res.send(buffer);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/cartoon', async (req, res) => {
  try {
    const { video_base64, prompt } = req.body;

    const startRes = await fetch('https://api.domoai.com/v1/video/video2video', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${DOMO_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'illustration-v2',
        prompt: prompt || 'Family Guy 2D cartoon animation style, thick black outlines, cel shading, vibrant colors, expressive funny face, comedy',
        video: { bytes_base64_encoded: video_base64 },
        seconds: 10
      })
    });

    if (!startRes.ok) {
      const err = await startRes.json();
      throw new Error(JSON.stringify(err));
    }

    const startData = await startRes.json();
    const taskId = startData.data?.task_id;

    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 5000));
      const pollRes = await fetch(`https://api.domoai.com/v1/task?task_id=${taskId}`, {
        headers: { 'Authorization': `Bearer ${DOMO_KEY}` }
      });
      const pollData = await pollRes.json();
      console.log('Poll status:', pollData.data?.state);
      if (pollData.data?.state === 'success') {
        return res.json({ url: pollData.data?.output_url || pollData.data?.video_url });
      }
      if (pollData.data?.state === 'failed') throw new Error('DomoAI failed');
    }
    throw new Error('Timeout');
  } catch(e) {
    console.error('Cartoon error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get('/', (req, res) => res.send('TrendAI Server OK'));
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
