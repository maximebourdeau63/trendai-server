const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json({ limit: '100mb' }));

const DOMO_KEY = process.env.DOMO_API_KEY;
const PORT = process.env.PORT || 10000;

// Lance la transformation et retourne le task_id immédiatement
app.post('/cartoon/start', async (req, res) => {
  try {
    const { video_base64, model } = req.body;
    const startRes = await fetch('https://api.domoai.com/v1/video/video2video', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${DOMO_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || 'illustration-v20',
        prompt: 'Family Guy 2D cartoon animation style, thick black outlines, cel shading, vibrant colors, expressive funny face, comedy',
        video: { bytes_base64_encoded: video_base64 },
        seconds: 10
      })
    });
    if (!startRes.ok) {
      const err = await startRes.json();
      throw new Error(JSON.stringify(err));
    }
    const startData = await startRes.json();
    console.log('DomoAI start:', JSON.stringify(startData));
    const taskId = startData.data?.task_id;
    if (!taskId) throw new Error('Pas de task_id: ' + JSON.stringify(startData));
    res.json({ task_id: taskId });
  } catch(e) {
    console.error('Start error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Vérifie le statut d'une tâche
app.get('/cartoon/status/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const pollRes = await fetch(`https://api.domoai.com/v1/task?task_id=${taskId}`, {
      headers: { 'Authorization': `Bearer ${DOMO_KEY}` }
    });
    const pollData = await pollRes.json();
    console.log('DomoAI poll:', JSON.stringify(pollData));
    const state = pollData.data?.state;
    if (state === 'success') {
      return res.json({ status: 'done', url: pollData.data?.output_url });
    } else if (state === 'failed') {
      return res.json({ status: 'error', error: 'DomoAI failed' });
    } else {
      return res.json({ status: 'pending' });
    }
  } catch(e) {
    console.error('Status error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get('/', (req, res) => res.send('TrendAI Server OK'));
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
