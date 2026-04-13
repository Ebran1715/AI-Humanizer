// DOM Elements
const inputTextarea = document.getElementById('inputText');
const outputDiv = document.getElementById('outputText');
const humanizeBtn = document.getElementById('humanizeBtn');
const clearBtn = document.getElementById('clearBtn');
const exampleBtn = document.getElementById('exampleBtn');
const copyBtn = document.getElementById('copyBtn');
const wordCountSpan = document.getElementById('wordCount');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.querySelector('.progress-bar');
const progressText = document.querySelector('.progress-text');
const statsGrid = document.getElementById('statsGrid');
const intensitySlider = document.getElementById('intensitySlider');
const intensityValue = document.getElementById('intensityValue');

// Mode buttons
const modeBtns = document.querySelectorAll('.mode-btn');
let currentTone = 'casual';

modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTone = btn.dataset.tone;
    });
});

// Update intensity
intensitySlider.addEventListener('input', () => {
    intensityValue.textContent = intensitySlider.value;
});

// Count words instead of characters
function updateWordCount() {
    const text = inputTextarea.value;
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    const maxWords = 3000;
    wordCountSpan.textContent = `${words} / ${maxWords} words`;
    
    if (words > maxWords) {
        wordCountSpan.style.color = '#ef4444';
        humanizeBtn.disabled = true;
        humanizeBtn.style.opacity = '0.5';
    } else {
        wordCountSpan.style.color = '#ffffff';
        humanizeBtn.disabled = false;
        humanizeBtn.style.opacity = '1';
    }
}

inputTextarea.addEventListener('input', updateWordCount);

// Show progress
function showProgress() {
    progressContainer.style.display = 'block';
    let width = 0;
    const interval = setInterval(() => {
        width += Math.random() * 15;
        if (width >= 100) {
            width = 100;
            clearInterval(interval);
        }
        progressBar.style.width = width + '%';
    }, 50);
    return interval;
}

// Update stats
function updateStats(metrics) {
    statsGrid.style.display = 'grid';
    document.getElementById('originalWords').textContent = metrics.originalWords;
    document.getElementById('humanizedWords').textContent = metrics.humanizedWords;
    document.getElementById('changesCount').textContent = metrics.changes;
    document.getElementById('perplexityScore').textContent = metrics.uniquenessScore + '%';
    document.getElementById('processingTime').textContent = metrics.processingTimeMs + 'ms';
}

// Humanize text
async function humanizeText() {
    const text = inputTextarea.value.trim();
    const wordCount = text === '' ? 0 : text.split(/\s+/).length;
    
    if (!text) {
        outputDiv.innerHTML = '<div class="placeholder"><span>⚠️</span><p>Please paste some text to humanize.</p></div>';
        return;
    }
    
    if (wordCount > 3000) {
        outputDiv.innerHTML = `<div class="placeholder"><span>⚠️</span><p>Text too long. Maximum 3000 words. Current: ${wordCount} words.</p></div>`;
        return;
    }
    
    const intensity = intensitySlider.value / 100;
    const tone = currentTone;
    
    const progressInterval = showProgress();
    progressText.textContent = '🧠 Applying high perplexity transformations...';
    
    humanizeBtn.disabled = true;
    humanizeBtn.style.opacity = '0.6';
    
    const startTime = performance.now();
    
    try {
        const response = await fetch('/api/humanize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, tone, intensity })
        });
        
        const data = await response.json();
        
       if (data.success) {
    // Store the raw humanized text for copying
    const rawText = data.output;
    
    // Store raw text as data attribute for copy function
    outputDiv.setAttribute('data-raw-text', rawText);
    
    // Preserve paragraph structure for display
    let outputHtml = data.output;
    // Convert double newlines to paragraph tags
    outputHtml = outputHtml.split('\n\n').map(para => {
        if (para.trim()) {
            // Check if this line is a heading (starts with capital, no ending punctuation)
            const isHeading = para.trim().match(/^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/) && 
                             para.trim().length < 80 && 
                             !para.trim().endsWith('.') && 
                             !para.trim().endsWith('?');
            
            if (isHeading) {
                return `<h3 style="font-weight: bold; color: #1a1a2e; font-size: 22px; margin: 1rem 0 0.5rem 0;">${para.trim()}</h3>`;
            }
            return `<p>${para.trim()}</p>`;
        }
        return '';
    }).join('');
    
    outputDiv.innerHTML = outputHtml;
    updateStats(data.metrics);
    progressText.textContent = '✅ Complete! Text has been humanized with high perplexity.';
}else {
            throw new Error(data.error);
        }
        
    } catch (error) {
        console.error('Error:', error);
        outputDiv.innerHTML = `<div class="placeholder"><span>⚠️</span><p>Error: ${error.message}</p></div>`;
    } finally {
        clearInterval(progressInterval);
        setTimeout(() => {
            progressContainer.style.display = 'none';
            progressBar.style.width = '0%';
        }, 1000);
        humanizeBtn.disabled = false;
        humanizeBtn.style.opacity = '1';
    }
}

// Load example with paragraphs
function loadExample() {
    inputTextarea.value = `Artificial intelligence has revolutionized the way we create content in today's digital landscape. 

Furthermore, AI writing tools have become increasingly sophisticated and accessible to the general public. Consequently, many professionals and students are turning to AI for their content creation needs. 

Moreover, the quality of AI-generated text continues to improve with each new model release. Thus, it is becoming increasingly difficult to distinguish between human and AI writing. 

However, AI detectors like GPTZero and Turnitin have been developed specifically to identify machine-generated text. As a result, content creators need effective tools to humanize their AI output while preserving the original meaning and quality. 

This is where our high perplexity humanizer comes in. Using advanced algorithms including burstiness, sentence variation, and natural filler insertion, we can transform robotic AI text into something that reads like it was written by a real person.`;
    
    updateWordCount();
    outputDiv.innerHTML = '<div class="placeholder"><span>📋</span><p>Example loaded! Click "Humanize Now" to see the transformation.</p><small>Notice how paragraphs are preserved</small></div>';
}

// Clear fields
function clearFields() {
    inputTextarea.value = '';
    outputDiv.innerHTML = '<div class="placeholder"><span>✨</span><p>Your humanized text will appear here</p><small>Preserves paragraphs and formatting</small></div>';
    statsGrid.style.display = 'none';
    updateWordCount();
}

// ========== FIXED COPY BUTTON FUNCTION - Preserves headings in plain text ==========
function copyOutput() {
    console.log('Copy button clicked!');
    
    // Get all text from output div
    let outputText = '';
    
    // Check if there are paragraphs or divs in the output
    const contentElements = outputDiv.querySelectorAll('p, div');
    
    if (contentElements.length > 0 && !outputDiv.querySelector('.placeholder')) {
        // Extract text from all elements (this preserves heading text as plain text)
        contentElements.forEach(el => {
            let text = el.innerText || el.textContent;
            if (text && text.trim() !== '') {
                outputText += text + '\n\n';
            }
        });
        outputText = outputText.trim();
    } else {
        // Get direct text content
        outputText = outputDiv.innerText || outputDiv.textContent;
    }
    
    // Clean up any HTML entities or extra spaces
    outputText = outputText.replace(/&nbsp;/g, ' ')
                          .replace(/\n{3,}/g, '\n\n')
                          .trim();
    
    // Check if there's actual content (not placeholder)
    const isPlaceholder = outputText.includes('Your humanized text will appear here') || 
                          outputText.includes('Click "Humanize Now"') ||
                          outputText === '' ||
                          outputText === '✨';
    
    if (!outputText || isPlaceholder) {
        alert('Nothing to copy. Please humanize some text first.');
        return;
    }
    
    // Method 1: Modern Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(outputText).then(() => {
            showCopySuccess();
        }).catch(err => {
            console.error('Clipboard API failed:', err);
            fallbackCopyText(outputText);
        });
    } else {
        // Method 2: Fallback for older browsers
        fallbackCopyText(outputText);
    }
}

// Show success feedback on button
// Show success feedback on button
function showCopySuccess() {
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = '✅ Copied!';
    copyBtn.style.background = 'linear-gradient(135deg, #97069C, #FB006E)';
    copyBtn.style.color = 'white';
    copyBtn.style.border = 'none';
    
    setTimeout(() => {
        copyBtn.innerHTML = originalText;
        copyBtn.style.background = '';
        copyBtn.style.color = '';
        copyBtn.style.border = '';
    }, 2000);
}

// Fallback copy method using textarea
function fallbackCopyText(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showCopySuccess();
        } else {
            alert('Press Ctrl+C to copy the text.');
        }
    } catch (err) {
        console.error('Fallback copy failed:', err);
        alert('Please select and copy the text manually.');
    }
    
    document.body.removeChild(textarea);
}

// FAQ toggle - Fixed for inline onclick
function initFaq() {
    // No need for this since FAQ uses inline onclick
    console.log('FAQ initialized');
}

// ========== EVENT LISTENERS ==========
humanizeBtn.addEventListener('click', humanizeText);
clearBtn.addEventListener('click', clearFields);
if (exampleBtn) exampleBtn.addEventListener('click', loadExample);

// IMPORTANT: Properly attach copy button event
if (copyBtn) {
    // Remove any existing listeners by cloning and replacing
    const newCopyBtn = copyBtn.cloneNode(true);
    copyBtn.parentNode.replaceChild(newCopyBtn, copyBtn);
    
    // Add fresh event listener to the new button
    newCopyBtn.addEventListener('click', copyOutput);
    console.log('Copy button event listener attached successfully');
} else {
    console.error('Copy button not found!');
}

// Keyboard shortcut
inputTextarea.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        humanizeText();
    }
});

// Initialize
updateWordCount();
initFaq();