const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const DOMO_KEY = process.env.DOMO_API_KEY;
const PORT = process.env.PORT || 10000;

app.post('/cartoon/start', async (req, res) => {
  try {
    const { video_url, model } = req.body;

    // Télécharger la vidéo sur le serveur
    const videoRes = await fetch(video_url);
    const videoBuffer = await videoRes.buffer();
    const videoBase64 = videoBuffer.toString('base64');

    const startRes = await fetch('https://api.domoai.com/v1/video/video2video', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${DOMO_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || 'illustration-v20',
        prompt: 'Family Guy 2D cartoon animation style, thick black outlines, cel shading, vibrant colors, expressive funny face, comedy',
        video: { bytes_base64_encoded: videoBase64 },
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

app.get('/cartoon/status/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const pollRes = await fetch(`https://api.domoai.com/v1/tasks/${taskId}`, {
      headers: { 'Authorization': `Bearer ${DOMO_KEY}` }
    });
    const pollData = await pollRes.json();
    console.log('DomoAI poll:', JSON.stringify(pollData));
    const state = pollData.data?.state || pollData.data?.status;
console.log('DomoAI state:', state, JSON.stringify(pollData.data?.output_videos));
if (state === 'success' || state === 'COMPLETED') {
  const url = pollData.data?.output_url || pollData.data?.output_videos?.[0];
  return res.json({ status: 'done', url });
}
if (state === 'failed' || state === 'FAILED') return res.json({ status: 'error', error: 'DomoAI failed' });
return res.json({ status: 'pending' });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/', (req, res) => res.send('TrendAI Server OK'));
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
