const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const DOMO_KEY = process.env.DOMO_API_KEY;
const PORT = process.env.PORT || 10000;
const TMP = '/tmp/trendai';

if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function domoTransform(videoPath, model) {
  const videoBuffer = fs.readFileSync(videoPath);
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
    throw new Error('DomoAI start failed: ' + JSON.stringify(err));
  }

  const startData = await startRes.json();
  const taskId = startData.data?.task_id;
  if (!taskId) throw new Error('No task_id: ' + JSON.stringify(startData));
  console.log('DomoAI task started:', taskId);

  for (let i = 0; i < 60; i++) {
    await sleep(10000);
    const pollRes = await fetch(`https://api.domoai.com/v1/tasks/${taskId}`, {
      headers: { 'Authorization': `Bearer ${DOMO_KEY}` }
    });
    const pollData = await pollRes.json();
    const status = pollData.data?.status;
    console.log(`DomoAI poll ${i+1}: ${status}`);
    if (status === 'SUCCESS') {
      return pollData.data?.output_videos?.[0]?.url;
    }
    if (status === 'FAILED') throw new Error('DomoAI task failed');
  }
  throw new Error('DomoAI timeout');
}

function cutVideo(inputPath, outputPath, start, duration) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(start)
      .setDuration(duration)
      .output(outputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
}

function getVideoDuration(inputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) reject(err);
      else resolve(metadata.format.duration);
    });
  });
}

function mergeVideos(listPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(listPath)
      .inputOptions(['-f concat', '-safe 0'])
      .outputOptions('-c copy')
      .output(outputPath)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
}

function addAudio(videoPath, audioPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(videoPath)
      .input(audioPath)
      .outputOptions(['-map 0:v', '-map 1:a', '-c:v copy', '-c:a aac', '-shortest'])
      .output(outputPath)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
}

app.post('/cartoon/start', async (req, res) => {
  const jobId = Date.now().toString();
  const jobDir = path.join(TMP, jobId);
  fs.mkdirSync(jobDir);

  res.json({ job_id: jobId });

  (async () => {
    try {
      const { video_url, model } = req.body;
      console.log('Starting job:', jobId);

      const videoRes = await fetch(video_url);
      const videoBuffer = await videoRes.buffer();
      const inputPath = path.join(jobDir, 'input.mp4');
      fs.writeFileSync(inputPath, videoBuffer);
      console.log('Video downloaded:', videoBuffer.length, 'bytes');

      const duration = await getVideoDuration(inputPath);
      console.log('Video duration:', duration, 's');

      const segments = [];
      const segmentDuration = 9;
      let start = 0;
      let segIdx = 0;
      while (start < duration) {
        const segPath = path.join(jobDir, `seg_${segIdx}.mp4`);
        await cutVideo(inputPath, segPath, start, segmentDuration);
        segments.push(segPath);
        start += segmentDuration;
        segIdx++;
      }
      console.log('Segments created:', segments.length);

      const cartoonSegments = [];
      for (let i = 0; i < segments.length; i++) {
        console.log(`Transforming segment ${i+1}/${segments.length}`);
        const cartoonUrl = await domoTransform(segments[i], model);
        if (!cartoonUrl) throw new Error(`No URL for segment ${i+1}`);
        const cartoonRes = await fetch(cartoonUrl);
        const cartoonBuf = await cartoonRes.buffer();
        const cartoonPath = path.join(jobDir, `cartoon_${i}.mp4`);
        fs.writeFileSync(cartoonPath, cartoonBuf);
        cartoonSegments.push(cartoonPath);
        console.log(`Segment ${i+1} done`);
      }

      const listPath = path.join(jobDir, 'list.txt');
      fs.writeFileSync(listPath, cartoonSegments.map(p => `file '${p}'`).join('\n'));
      const mergedPath = path.join(jobDir, 'merged.mp4');
      await mergeVideos(listPath, mergedPath);

      const finalPath = path.join(jobDir, 'final.mp4');
      await addAudio(mergedPath, inputPath, finalPath);

      fs.writeFileSync(path.join(jobDir, 'status.json'), JSON.stringify({ status: 'done', path: finalPath }));
      console.log('Job complete:', jobId);
    } catch(e) {
      console.error('Job error:', e.message);
      fs.writeFileSync(path.join(jobDir, 'status.json'), JSON.stringify({ status: 'error', error: e.message }));
    }
  })();
});

app.get('/cartoon/status/:jobId', async (req, res) => {
  const { jobId } = req.params;
  const jobDir = path.join(TMP, jobId);
  const statusFile = path.join(jobDir, 'status.json');

  if (!fs.existsSync(statusFile)) {
    return res.json({ status: 'pending' });
  }

  const statusData = JSON.parse(fs.readFileSync(statusFile));
  if (statusData.status === 'done') {
    const videoBuffer = fs.readFileSync(statusData.path);
    const videoBase64 = videoBuffer.toString('base64');
    return res.json({ status: 'done', video_base64: videoBase64 });
  }
  return res.json(statusData);
});

app.get('/', (req, res) => res.send('TrendAI Server OK'));
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
