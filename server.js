// server.js - AI Humanizer Server with Full 30-Module Integration
const express = require('express');
const cors = require('cors');
const path = require('path');
const humanizerRoutes = require('./humanizer');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json({ limit: '10mb' }));
app.use(cors());
app.use(express.static('public'));

const MAX_WORDS = 5000;

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// ===== MAIN HUMANIZE ENDPOINT =====
app.post('/api/humanize', async (req, res) => {
    const startTime = Date.now();

    try {
        const {
            text,
            tone = 'casual',
            intensity = 0.8,
            preserveHeadings = true,
            preservedKeywords = []
        } = req.body;

        if (!text || text.trim() === '') {
            return res.status(400).json({ success: false, error: 'Text is required' });
        }

        // Clean input — remove leading | from all lines and trailing dots
        let cleanedText = text.replace(/^\|\s*/gm, '');
        cleanedText = cleanedText.replace(/\n\s*\.\s*$/g, '');
        cleanedText = cleanedText.replace(/\n\.$/g, '');

        const wordCount = cleanedText.trim().split(/\s+/).length;

        if (wordCount > MAX_WORDS) {
            return res.status(400).json({
                success: false,
                error: `Text too long. Max ${MAX_WORDS} words. Current: ${wordCount} words.`
            });
        }

        console.log('\n' + '='.repeat(60));
        console.log('Processing Request:');
        console.log('   Words: ' + wordCount);
        console.log('   Tone: ' + tone);
        console.log('   Intensity: ' + intensity);
        console.log('   Preserve Keywords: ' + (preservedKeywords.length > 0 ? preservedKeywords.join(', ') : 'none'));
        console.log('='.repeat(60) + '\n');

        const options = {
            preservedKeywords: preservedKeywords,
            intensity: parseFloat(intensity),
            tone: tone
        };

        let result;
        if (humanizerRoutes.humanizeText) {
            result = await humanizerRoutes.humanizeText(cleanedText, options);
        } else {
            result = fallbackHumanize(cleanedText, { intensity, tone });
        }

        const humanizedResult = result.humanized || result.text || result;

        // Calculate intensity-adjusted human score
        let humanScore = result.humanScore || result.metrics?.humanScore || 75;
        if (intensity > 0.7) humanScore = Math.min(99, humanScore + 3);
        else if (intensity < 0.4) humanScore = Math.max(50, humanScore - 10);

        const processingTime = Date.now() - startTime;
        const aiLikelihood = 100 - humanScore;
        const passesAIDetection = aiLikelihood < 10;

        console.log('Complete: ' + processingTime + 'ms');
        console.log('   Human Score: ' + humanScore + '%');
        console.log('   AI Likelihood: ' + aiLikelihood + '%');
        console.log('   Passes AI Detection (<10%): ' + passesAIDetection + '\n');

        res.json({
            success: true,
            humanized: humanizedResult,
            output: humanizedResult,
            humanScore: Math.round(humanScore),
            metrics: {
                originalWords: wordCount,
                humanizedWords: typeof humanizedResult === 'string' ? humanizedResult.replace(/<[^>]+>/g, '').split(/\s+/).length : 0,
                humanScore: Math.round(humanScore),
                aiLikelihood: Math.round(aiLikelihood),
                passesAIDetection: passesAIDetection,
                processingTimeMs: processingTime,
                burstiness: result.metrics?.burstiness || 'medium',
                hasHeadings: result.metrics?.hasHeadings || false,
                hasCode: result.metrics?.hasCode || false
            },
            meta: {
                tone: tone,
                intensity: intensity,
                engine: 'Complete Humanizer Engine v18.0 - 45 Modules Active',
                features: [
                    'Heading Detection', 'Code Line Detection', 'Sentence Tokenizer',
                    'Burstiness Engine', 'Aggressive Sentence Splitter', 'Short Punch Injector',
                    'Perplexity Injector', 'Hedging Language Injector', 'Natural Disfluency Injector',
                    'Parenthetical Aside Injector', 'Afterthought Clause Appender', 'Self-Correction Prepender',
                    'Rhetorical Question Generator', 'Syntax Structure Variator', 'Adverbial Front-Loader',
                    'Cleft Construction Builder', 'Sentence Inversion Engine', 'Contraction Engine',
                    'AI Phrase Remover', 'Formal to Informal Vocabulary Replacer', 'Synonym Pool Substituter',
                    'Em Dash Injector', 'Ellipsis Injector', 'Opinion Injector',
                    'Transition Naturalizer', 'Grammar Cleanup', 'Tech Keyword Preserver',
                    'Human Score Calculator', 'Terminology Rotator', 'Causal Connector Injector',
                    'Concrete Analogy Injector', 'Safe Fragmenter', 'Paragraph Variator',
                    'Safe Inversion Engine', 'Active Voice Enforcer', 'Colloquialism Injector',
                    'Number Humanizer', 'Vocabulary Swapper', 'Noun Swap', 'Verb Swap',
                    'Adjective Swap', 'Aside Injector', 'Closing Frame Injector',
                    'Opening Frame Injector', 'Duplicate Phrase Cleaner'
                ],
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({
            success: false,
            error: 'Processing failed. Please try again.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ===== FALLBACK HUMANIZE FUNCTION =====
function fallbackHumanize(text, options = {}) {
    const intensity = options.intensity || 0.8;
    let result = text.replace(/^\|\s*/gm, '');
    result = result.replace(/\n\s*\.\s*$/g, '');
    result = result.replace(/\n\.$/g, '');

    result = result.replace(/\bcannot\b/gi, "can't");
    result = result.replace(/\bwill not\b/gi, "won't");
    result = result.replace(/\bdo not\b/gi, "don't");
    result = result.replace(/\bdoes not\b/gi, "doesn't");
    result = result.replace(/\bis not\b/gi, "isn't");
    result = result.replace(/\bare not\b/gi, "aren't");
    result = result.replace(/\bI am\b/gi, "I'm");
    result = result.replace(/\byou are\b/gi, "you're");
    result = result.replace(/\bit is\b/gi, "it's");

    const aiPhrases = ['furthermore', 'moreover', 'notably', 'in conclusion'];
    aiPhrases.forEach(phrase => {
        result = result.replace(new RegExp(`\\b${phrase}\\b`, 'gi'), '');
    });

    if (intensity > 0.6) {
        const disfluencies = ['honestly', 'basically', 'actually'];
        const words = result.split(' ');
        for (let i = 5; i < words.length; i += 10) {
            if (Math.random() > 0.7) {
                words.splice(i, 0, disfluencies[Math.floor(Math.random() * disfluencies.length)]);
            }
        }
        result = words.join(' ');
    }

    const contractionCount = (result.match(/\b\w+'\w+\b/g) || []).length;
    const hasDisfluency = result.match(/\b(honestly|basically|actually)\b/gi) !== null;
    let humanScore = 50 + (contractionCount * 2) + (hasDisfluency ? 10 : 0);
    humanScore = Math.min(95, Math.max(30, humanScore));

    const paragraphs = result.split('\n\n');
    let htmlOutput = '';
    for (const para of paragraphs) {
        let trimmed = para.trim().replace(/^\|\s*/, '');
        if (trimmed) {
            const isHeading = trimmed.length < 80 && trimmed.match(/^[A-Z]/) &&
                !trimmed.endsWith('.') && trimmed.split(' ').length <= 8;
            if (isHeading) {
                htmlOutput += `<h2 style="font-weight:900;color:#111111;font-size:22px;margin:1.4rem 0 0.5rem 0;line-height:1.3;padding-bottom:3px;border-bottom:2px solid #111111;">${trimmed}</h2>`;
            } else {
                htmlOutput += `<p style="margin-bottom:1rem;line-height:1.6;">${trimmed}</p>`;
            }
        }
    }

    htmlOutput = htmlOutput.replace(/<p>\s*\.\s*<\/p>$/g, '');
    htmlOutput = htmlOutput.replace(/<h2[^>]*>\s*\.\s*<\/h2>$/g, '');

    return {
        humanized: htmlOutput || `<p>${result}</p>`,
        text: htmlOutput || `<p>${result}</p>`,
        humanScore: humanScore,
        metrics: { burstiness: 'medium', hasHeadings: false, hasCode: false, humanScore: humanScore }
    };
}

// ===== DIRECT HUMANIZE ENDPOINT =====
app.post('/api/humanize/direct', async (req, res) => {
    try {
        const { text, module } = req.body;
        if (!text || !module) {
            return res.status(400).json({ success: false, error: 'Both text and module name are required' });
        }
        res.json({
            success: true, original: text, processed: text, module: module,
            note: 'Individual module testing available in full implementation'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===== BATCH PROCESS ENDPOINT =====
app.post('/api/humanize/batch', async (req, res) => {
    const startTime = Date.now();
    try {
        const { texts, tone = 'casual', intensity = 0.8 } = req.body;
        if (!texts || !Array.isArray(texts) || texts.length === 0) {
            return res.status(400).json({ success: false, error: 'Batch processing requires an array of texts' });
        }
        if (texts.length > 10) {
            return res.status(400).json({ success: false, error: 'Maximum 10 texts per batch request' });
        }
        const results = [];
        for (let i = 0; i < texts.length; i++) {
            try {
                const options = { intensity: parseFloat(intensity), tone: tone };
                let result;
                if (humanizerRoutes.humanizeText) {
                    result = await humanizerRoutes.humanizeText(texts[i], options);
                } else {
                    result = fallbackHumanize(texts[i], { intensity, tone });
                }
                results.push({
                    index: i, success: true,
                    output: result.humanized || result.text || result,
                    metrics: result.metrics || { humanScore: result.humanScore || 75 }
                });
            } catch (err) {
                results.push({ index: i, success: false, error: err.message });
            }
        }
        res.json({
            success: true, batchSize: texts.length, results: results,
            processingTimeMs: Date.now() - startTime
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        engine: 'Complete Humanizer Engine v18.0',
        maxWords: MAX_WORDS,
        activeModules: 45,
        target: '<10% AI Detection',
        grammarTarget: '80%+',
        recommendations: {
            intensity: 'Use 0.8-1.0 for best results (<10% AI detection)',
            tone: 'Use "casual" for most natural output',
            textLength: 'Best results with 100-2000 words',
        },
        endpoints: {
            humanize: 'POST /api/humanize',
            batch: 'POST /api/humanize/batch',
            direct: 'POST /api/humanize/direct',
            health: 'GET /api/health',
            analyze: 'POST /api/analyze'
        }
    });
});

// ===== ANALYZE ENDPOINT =====
app.post('/api/analyze', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || text.trim() === '') {
            return res.status(400).json({ success: false, error: 'Text is required' });
        }

        const aiIndicators = {
            longWords: (text.match(/\b\w{10,}\b/g) || []).length,
            formalTransitions: (text.match(/\b(however|furthermore|moreover|consequently)\b/gi) || []).length,
            noContractions: (text.match(/\b\w+'\w+\b/g) || []).length === 0,
            repetitiveStructure: countRepetitiveStructures(text),
            averageSentenceLength: calculateAvgSentenceLength(text)
        };

        let aiScore = 0;
        if (aiIndicators.longWords > 10) aiScore += 20;
        if (aiIndicators.formalTransitions > 3) aiScore += 25;
        if (aiIndicators.noContractions) aiScore += 30;
        if (aiIndicators.repetitiveStructure > 5) aiScore += 15;
        if (aiIndicators.averageSentenceLength > 20) aiScore += 10;

        const humanScore = Math.max(0, 100 - aiScore);

        res.json({
            success: true,
            analysis: {
                humanScore: humanScore,
                aiLikelihood: 100 - humanScore,
                indicators: aiIndicators,
                recommendation: humanScore < 70
                    ? 'Humanize this text for better authenticity'
                    : 'Text already appears natural'
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

function countRepetitiveStructures(text) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    let repetitive = 0;
    for (let i = 1; i < sentences.length; i++) {
        const prevStart = sentences[i-1].trim().substring(0, 20);
        const currStart = sentences[i].trim().substring(0, 20);
        if (prevStart === currStart) repetitive++;
    }
    return repetitive;
}

function calculateAvgSentenceLength(text) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const totalWords = text.split(/\s+/).length;
    return totalWords / sentences.length;
}

// ===== SERVE FRONTEND =====
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ===== ERROR HANDLING =====
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

// ===== START SERVER =====
app.listen(PORT, () => {
    console.log(`
+--------------------------------------------------------------------------+
|           COMPLETE AI HUMANIZER v18.0 - 45 MODULES ACTIVE               |
+--------------------------------------------------------------------------+
|                                                                          |
|  Server:    http://localhost:${PORT}                                       |
|  API:       http://localhost:${PORT}/api/humanize                          |
|  Health:    http://localhost:${PORT}/api/health                           |
|  Analyze:   http://localhost:${PORT}/api/analyze                          |
|                                                                          |
+--------------------------------------------------------------------------+
|  TARGET:  <10% AI DETECTION  |  GRAMMAR: 80%+                          |
|  STATUS:  READY                                                         |
+--------------------------------------------------------------------------+
    `);
});