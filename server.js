const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json({ limit: '100mb' }));

const DOMO_KEY = process.env.DOMO_API_KEY;
const PORT = process.env.PORT || 10000;

app.post('/cartoon', async (req, res) => {
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
    const taskId = startData.data?.task_id;
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 5000));
      const pollRes = await fetch(`https://api.domoai.com/v1/task?task_id=${taskId}`, {
        headers: { 'Authorization': `Bearer ${DOMO_KEY}` }
      });
      const pollData = await pollRes.json();
      console.log('DomoAI status:', pollData.data?.state);
      if (pollData.data?.state === 'success') return res.json({ url: pollData.data?.output_url });
      if (pollData.data?.state === 'failed') throw new Error('DomoAI failed: ' + JSON.stringify(pollData));
    }
    throw new Error('Timeout');
  } catch(e) {
    console.error('Cartoon error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get('/', (req, res) => res.send('TrendAI Server OK'));
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
