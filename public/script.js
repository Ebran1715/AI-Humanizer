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
// Extract plain text with formatting (for plain text fallback)
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
                            (tagName === 'div' && el.style && el.style.fontWeight === '900');
            
            if (isHeading) {
                if (plainText && !plainText.endsWith('\n\n')) {
                    plainText += '\n\n';
                }
                plainText += text.toUpperCase() + '\n\n';
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
    
    // Remove trailing dot
    const lines = plainText.split('\n');
    if (lines.length > 0) {
        while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
            lines.pop();
        }
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
// ========== COPY BUTTON FUNCTION - PRESERVES EXACT FORMATTING ==========
function copyOutput() {
    console.log('Copy button clicked!');
    
    // Get the HTML content from output div
    const htmlContent = outputDiv.innerHTML;
    
    // Check if we have actual content (not placeholder)
    const isPlaceholder = htmlContent.includes('Your humanized text will appear here') || 
                          htmlContent.includes('Click "Humanize Now"') ||
                          htmlContent.length < 50 ||
                          htmlContent.includes('placeholder');
    
    if (!htmlContent || isPlaceholder) {
        alert('Nothing to copy. Please humanize some text first.');
        return;
    }
    
    console.log('Copying HTML content, length:', htmlContent.length);
    
    // Create a styled HTML document with preserved styles
    const styledHtml = generateStyledHtml(htmlContent);
    
    // Copy rich HTML to clipboard
    if (navigator.clipboard && window.isSecureContext && navigator.clipboard.write) {
        // Use modern Clipboard API with HTML support
        const blob = new Blob([styledHtml], { type: 'text/html' });
        const plainTextBlob = new Blob([extractPlainTextWithFormatting(htmlContent)], { type: 'text/plain' });
        
        const clipboardItem = new ClipboardItem({
            'text/html': blob,
            'text/plain': plainTextBlob
        });
        
        navigator.clipboard.write([clipboardItem]).then(() => {
            showCopySuccess();
        }).catch(err => {
            console.error('Rich copy failed:', err);
            fallbackRichCopy(htmlContent);
        });
    } else {
        fallbackRichCopy(htmlContent);
    }
}

// Generate styled HTML document with preserved heading styles
function generateStyledHtml(htmlContent) {
    // Extract and enhance heading styles
    let enhancedHtml = htmlContent;
    
    // Ensure all h2 tags have proper styles
    enhancedHtml = enhancedHtml.replace(/<h2\s*>/gi, '<h2 style="font-weight:900 !important; color:#111111 !important; font-size:26px !important; margin:1.8rem 0 0.8rem 0 !important; line-height:1.3 !important; padding-bottom:5px !important; border-bottom:2px solid #111111 !important;">');
    
    // Ensure all p tags have proper styles
    enhancedHtml = enhancedHtml.replace(/<p\s*>/gi, '<p style="margin-bottom:1.2rem !important; line-height:1.7 !important; color:#333333 !important;">');
    
    // Fix any existing style attributes
    enhancedHtml = enhancedHtml.replace(/style="([^"]*)"/gi, (match, styles) => {
        // Add !important to existing styles if needed
        let newStyles = styles;
        if (!styles.includes('font-weight:900') && !styles.includes('font-weight: 900')) {
            if (match.includes('h2')) {
                newStyles += '; font-weight:900 !important';
            }
        }
        if (!styles.includes('font-size:26px') && !styles.includes('font-size: 26px')) {
            if (match.includes('h2')) {
                newStyles += '; font-size:26px !important';
            }
        }
        return `style="${newStyles}"`;
    });
    
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="generator" content="Humanizer Tool">
    <title>Humanized Text</title>
    <style>
        /* Preserve all heading styles */
        h2, .heading, [style*="font-weight:900"] {
            font-weight: 900 !important;
            color: #111111 !important;
            font-size: 26px !important;
            margin: 1.8rem 0 1.5rem 0 !important;
            line-height: 1.3 !important;
            // padding-bottom: 5px !important;
            // border-bottom: 2px solid #111111 !important;
        }
        
        /* Style for smaller headings */
        h2:has(span[style*="font-size:22px"]), 
        [style*="font-size:22px"] {
            font-size: 22px !important;
        }
        
        h2:has(span[style*="font-size:20px"]),
        [style*="font-size:20px"] {
            font-size: 20px !important;
        }
        
        /* Paragraph styles */
        p {
            margin-bottom: 1.2rem !important;
            line-height: 1.7 !important;
            color: #333333 !important;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            background: white;
        }
        
        /* Preserve spacing */
        br {
            display: block;
            margin: 0.5rem 0;
            content: "";
        }
        
        /* Ensure borders and formatting are preserved */
        * {
            box-sizing: border-box;
        }
    </style>
</head>
<body>
    ${enhancedHtml}
</body>
</html>`;
}

// Fallback for browsers that don't support ClipboardItem
function fallbackRichCopy(htmlContent) {
    // Create a temporary container with the formatted content
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed';
    tempContainer.style.top = '-10000px';
    tempContainer.style.left = '-10000px';
    tempContainer.style.width = '1px';
    tempContainer.style.height = '1px';
    tempContainer.style.opacity = '0';
    tempContainer.style.pointerEvents = 'none';
    tempContainer.contentEditable = 'true';
    
    // Create a styled version for copying
    const styledCopy = document.createElement('div');
    styledCopy.innerHTML = htmlContent;
    
    // Apply explicit styles to all headings
    styledCopy.querySelectorAll('h2').forEach(heading => {
        const wordCount = heading.innerText.split(' ').length;
        const fontSize = wordCount <= 3 ? '26px' : wordCount <= 6 ? '22px' : '20px';
        heading.style.fontWeight = '900';
        heading.style.color = '#111111';
        heading.style.fontSize = fontSize;
        heading.style.margin = '1.8rem 0 1.5rem 0';
        heading.style.lineHeight = '1.3';
        heading.style.paddingBottom = '5px';
        // heading.style.borderBottom = '2px solid #111111';
    });
    
    // Apply styles to all paragraphs
    styledCopy.querySelectorAll('p').forEach(para => {
        para.style.marginBottom = '1.2rem';
        para.style.lineHeight = '1.7';
        para.style.color = '#333333';
    });
    
    tempContainer.appendChild(styledCopy);
    document.body.appendChild(tempContainer);
    
    // Select the content
    const range = document.createRange();
    range.selectNodeContents(tempContainer);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    
    // Execute copy command
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showCopySuccess();
        } else {
            alert('Unable to copy automatically. Please select the text and press Ctrl+C.');
        }
    } catch (err) {
        console.error('Fallback copy failed:', err);
        alert('Unable to copy. Please copy manually (Ctrl+C).');
    } finally {
        // Clean up
        selection.removeAllRanges();
        document.body.removeChild(tempContainer);
    }
}

// Show success message
function showCopySuccess() {
    const originalText = copyBtn.textContent;
    copyBtn.textContent = '✓ Copied!';
    copyBtn.style.background = 'linear-gradient(135deg, #97069C, #FB006E)';
    copyBtn.style.color = 'white';
    
    // Show tooltip
    const tooltip = document.createElement('div');
    tooltip.textContent = '✓ Headings and formatting preserved! Bold + larger font will appear in Word/Google Docs';
    tooltip.style.position = 'fixed';
    tooltip.style.bottom = '80px';
    tooltip.style.right = '20px';
    tooltip.style.backgroundColor = '#111111';
    tooltip.style.color = 'white';
    tooltip.style.padding = '10px 16px';
    tooltip.style.borderRadius = '8px';
    tooltip.style.fontSize = '12px';
    tooltip.style.zIndex = '9999';
    tooltip.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    tooltip.style.fontFamily = 'sans-serif';
    document.body.appendChild(tooltip);
    
    setTimeout(() => {
        copyBtn.textContent = originalText;
        copyBtn.style.background = '';
        copyBtn.style.color = '';
        tooltip.remove();
    }, 2500);
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