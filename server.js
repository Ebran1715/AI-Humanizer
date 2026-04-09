const express = require('express');
const cors = require('cors');
const path = require('path');
const { humanize } = require('./humanizer');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// Word limit: 3000 words (~20,000 characters)
const MAX_WORDS = 3000;

app.post('/api/humanize', (req, res) => {
  try {
    const { text, tone = 'casual', intensity = 0.8 } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Text is required"
      });
    }

    // Count words
    const wordCount = text.trim().split(/\s+/).length;
    
    if (wordCount > MAX_WORDS) {
      return res.status(400).json({
        success: false,
        error: `Text too long. Maximum ${MAX_WORDS} words. Current: ${wordCount} words.`
      });
    }

    const result = humanize(text, { tone, intensity });

    res.json({
      success: true,
      input: text,
      output: result.text,
      metrics: result.metrics,
      meta: {
        tone: tone,
        intensity: intensity,
        engine: "high-perplexity-v3"
      }
    });

  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({
      success: false,
      error: "Server error. Please try again."
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    engine: 'high-perplexity-v3',
    maxWords: MAX_WORDS
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════════════════════╗
  ║     🚀 HIGH PERPLEXITY HUMANIZER - RUNNING                   ║
  ╠══════════════════════════════════════════════════════════════╣
  ║  🌐 Server:    http://localhost:${PORT}                        ║
  ║  📡 API:       http://localhost:${PORT}/api/humanize           ║
  ╠══════════════════════════════════════════════════════════════╣
  ║  🧠 Engine:    High Perplexity v3                             ║
  ║  📝 Max Words: ${MAX_WORDS} words                                ║
  ║  🎯 Target:    95%+ Human-like                                ║
  ║  💰 Cost:      COMPLETELY FREE                                ║
  ╚══════════════════════════════════════════════════════════════╝
  `);
});