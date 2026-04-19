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
    console.log('Humanization complete:', metrics);
}

// Humanize text
async function humanizeTextHandler() {
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
    
    try {
        const response = await fetch('/api/humanize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, tone, intensity })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Get the humanized text (try both fields for compatibility)
            const humanizedHtml = data.humanized || data.output;
            
            if (!humanizedHtml || humanizedHtml === 'undefined') {
                throw new Error('Received empty response from server');
            }
            
            // Store the HTML for display
            outputDiv.innerHTML = humanizedHtml;
            
            // Also store plain text version with proper line breaks for copying
            const plainText = extractPlainTextWithFormatting(humanizedHtml);
            outputDiv.setAttribute('data-raw-text', plainText);
            
            progressText.textContent = 'Complete! Text has been humanized with high perplexity.';
            
            if (data.metrics) {
                updateStats(data.metrics);
            }
        } else {
            throw new Error(data.error || 'Humanization failed');
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

// Extract plain text while preserving heading and paragraph structure
// Extract plain text while preserving heading and paragraph structure
function extractPlainTextWithFormatting(html) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    let plainText = '';
    const elements = tempDiv.children;
    
    for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        const tagName = el.tagName.toLowerCase();
        let text = (el.innerText || el.textContent || '').trim();
        
        // Remove leading | characters
        text = text.replace(/^\|\s*/, '');
        
        // Skip empty elements or standalone dots
        if (!text || text === '.' || text === ' .') {
            continue;
        }
        
        if (text) {
            const isHeading = tagName === 'h2' || 
                            tagName === 'h3' || 
                            (tagName === 'div' && el.style.fontWeight === '900');
            
            if (isHeading) {
                if (plainText && !plainText.endsWith('\n\n')) {
                    plainText += '\n\n';
                }
                plainText += text + '\n\n';
            } else if (tagName === 'p') {
                plainText += text + '\n\n';
            } else {
                plainText += text;
            }
        }
    }
    
    if (!plainText) {
        plainText = tempDiv.innerText || tempDiv.textContent || '';
        plainText = plainText.replace(/^\|\s*/gm, '');
    }
    
    // Clean up
    plainText = plainText
        .replace(/&nbsp;/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]+/g, ' ')
        .trim();
    
    // Remove trailing dot if it's the only thing on the last line
    const lines = plainText.split('\n');
    if (lines.length > 0) {
        // Remove empty lines at the end
        while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
            lines.pop();
        }
        // Check if last line is just a dot
        if (lines.length > 0) {
            const lastLine = lines[lines.length - 1].trim();
            if (lastLine === '.' || lastLine === ' .') {
                lines.pop();
            }
        }
        plainText = lines.join('\n').trim();
    }
    
    return plainText;
}

// Load example with paragraphs
// Load example with paragraphs
function loadExample() {
    inputTextarea.value = `Friendship: A Precious Bond

What's a Friend?

A friend is someone who understands you, supports you, and stands by your side through both good times and difficult moments. Friends share laughter, create memories together, and provide comfort when life gets challenging.

Qualities of a Good Friend

A true friend is honest, caring, and trustworthy. They listen without judgment and encourage you to become the best version of yourself. Respect, loyalty, and kindness are essential traits that strengthen this special bond.

Importance of Friendship

Friendship brings joy and emotional support. It reduces stress, boosts confidence, and helps individuals feel less alone. Good friends motivate you to achieve your goals and provide a sense of belonging in an often chaotic world.

Conclusion

Friendship is one of life's greatest treasures. It is built on trust, understanding, and mutual respect, making life more meaningful and enjoyable.`;
    
    updateWordCount();
    outputDiv.innerHTML = '<div class="placeholder"><span>📋</span><p>Example loaded! Click "Humanize Now" to see the transformation.</p><small>Notice how headings and paragraphs are preserved</small></div>';
}

// Clear fields
function clearFields() {
    inputTextarea.value = '';
    outputDiv.innerHTML = '<div class="placeholder"><span>✨</span><p>Your humanized text will appear here</p><small>Preserves headings and paragraphs</small></div>';
    outputDiv.removeAttribute('data-raw-text');
    statsGrid.style.display = 'none';
    updateWordCount();
}

// ========== COPY BUTTON FUNCTION ==========
function copyOutput() {
    console.log('Copy button clicked!');
    
    // Get the stored plain text with formatting
    let outputText = outputDiv.getAttribute('data-raw-text');
    
    // If no stored text, extract from current HTML
    if (!outputText || outputText.trim() === '') {
        outputText = extractPlainTextWithFormatting(outputDiv.innerHTML);
    }
    
    // Clean up the text
    outputText = outputText
        .replace(/&nbsp;/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]+/g, ' ')
        .trim();
    
    // Check if we have actual content
    const isPlaceholder = outputText.includes('Your humanized text will appear here') || 
                          outputText.includes('Click "Humanize Now"') ||
                          outputText === '' ||
                          outputText === '✨' ||
                          outputText.length < 10;
    
    if (!outputText || isPlaceholder) {
        alert('Nothing to copy. Please humanize some text first.');
        return;
    }
    
    console.log('Copying text, length:', outputText.length);
    console.log('First 200 chars:', outputText.substring(0, 200));
    
    // Copy to clipboard
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(outputText).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '✓ Copied!';
            copyBtn.style.background = 'linear-gradient(135deg, #97069C, #FB006E)';
            copyBtn.style.color = 'white';
            
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.style.background = '';
                copyBtn.style.color = '';
            }, 2000);
        }).catch(err => {
            console.error('Clipboard API failed:', err);
            fallbackCopyText(outputText);
        });
    } else {
        fallbackCopyText(outputText);
    }
}

// Fallback copy method using textarea
function fallbackCopyText(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '0';
    textarea.style.width = '2em';
    textarea.style.height = '2em';
    textarea.style.padding = '0';
    textarea.style.border = 'none';
    textarea.style.outline = 'none';
    textarea.style.boxShadow = 'none';
    textarea.style.background = 'transparent';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, 999999);
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '✓ Copied!';
            copyBtn.style.background = 'linear-gradient(135deg, #97069C, #FB006E)';
            copyBtn.style.color = 'white';
            
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.style.background = '';
                copyBtn.style.color = '';
            }, 2000);
        } else {
            alert('Unable to copy automatically. Please copy manually.');
        }
    } catch (err) {
        console.error('Fallback copy failed:', err);
        alert('Unable to copy. Please copy manually.');
    } finally {
        document.body.removeChild(textarea);
    }
}

// FAQ toggle
function initFaq() {
    console.log('FAQ initialized');
}

// ========== EVENT LISTENERS ==========
humanizeBtn.addEventListener('click', humanizeTextHandler);
clearBtn.addEventListener('click', clearFields);
if (exampleBtn) exampleBtn.addEventListener('click', loadExample);

if (copyBtn) {
    copyBtn.addEventListener('click', copyOutput);
    console.log('Copy button event listener attached successfully');
} else {
    console.error('Copy button not found!');
}

// Keyboard shortcut
inputTextarea.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        humanizeTextHandler();
    }
});

// Initialize
updateWordCount();
initFaq();