console.log("Content script loaded");

// Global variables
let infoPanel, titleElement, contentElement, loadingElement, sourcesElement, ttsButton;
let isInitialized = false;
let isSpeaking = false;

// Initialize the panel (only once)
function initializePanel() {
  if (isInitialized) return;
  
  console.log("Initializing panel");
  
  // Ensure marked.js is loaded
  if (typeof marked === 'undefined') {
    console.log("Marked.js not detected, loading it now");
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('marked.js');
    script.onload = () => {
      console.log("Marked.js loaded successfully");
    };
    document.head.appendChild(script);
  }
  
  infoPanel = document.createElement('div');
  infoPanel.id = 'quick-research-panel';
  infoPanel.className = 'quick-research-panel';
  infoPanel.style.display = 'none';
  infoPanel.style.position = 'absolute';
  infoPanel.style.zIndex = 10000;
  infoPanel.style.backgroundColor = '#2d2d2d';
  infoPanel.style.border = '1px solid #444';
  infoPanel.style.padding = '15px';
  infoPanel.style.boxShadow = '0 2px 10px rgba(0,0,0,0.4)';
  infoPanel.style.maxHeight = '70vh';
  infoPanel.style.maxWidth = '700px';
  infoPanel.style.width = '700px';
  infoPanel.style.overflowY = 'auto';
  infoPanel.style.borderRadius = '8px';
  infoPanel.style.transition = 'background-color 0.3s, color 0.3s, border-color 0.3s';
  infoPanel.style.resize = 'both';  // Make panel resizable
  infoPanel.style.overflow = 'auto'; // Allow overflow when resizing

  const closeButton = document.createElement('div');
  closeButton.className = 'quick-research-close-btn';
  closeButton.textContent = '×';
  closeButton.style.cursor = 'pointer';
  closeButton.style.fontSize = '18px';
  closeButton.style.float = 'right';
  closeButton.style.color = '#aaa';
  closeButton.addEventListener('click', () => {
    infoPanel.style.display = 'none';
    stopSpeech(); // Stop any ongoing speech when closing panel
  });

  titleElement = document.createElement('h3');
  titleElement.className = 'quick-research-title';
  titleElement.style.color = '#fff';
  titleElement.style.transition = 'color 0.3s';

  // Text-to-Speech button
  ttsButton = document.createElement('button');
  ttsButton.textContent = 'Read Aloud';
  ttsButton.style.padding = '8px 14px';
  ttsButton.style.backgroundColor = '#4285f4';
  ttsButton.style.color = 'white';
  ttsButton.style.border = 'none';
  ttsButton.style.borderRadius = '5px';
  ttsButton.style.cursor = 'pointer';
  ttsButton.style.marginTop = '10px';
  ttsButton.style.marginBottom = '10px';
  ttsButton.style.fontFamily = "'Inter', sans-serif";
  ttsButton.style.fontSize = '14px';
  ttsButton.style.fontWeight = '500';
  ttsButton.style.transition = 'all 0.2s ease';
  ttsButton.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
  ttsButton.style.display = 'none'; // Hide initially until content is loaded
  ttsButton.addEventListener('click', toggleSpeech);
  ttsButton.addEventListener('mouseover', () => {
    ttsButton.style.backgroundColor = '#5294ff';
    ttsButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
  });
  ttsButton.addEventListener('mouseout', () => {
    ttsButton.style.backgroundColor = isSpeaking ? '#f44336' : '#4285f4';
    ttsButton.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
  });
  
  // Theme toggle button
  const themeButton = document.createElement('button');
  themeButton.id = 'quick-research-theme-btn';
  themeButton.textContent = 'Theme';
  themeButton.style.padding = '6px 10px';
  themeButton.style.backgroundColor = '#555';
  themeButton.style.color = 'white';
  themeButton.style.border = 'none';
  themeButton.style.borderRadius = '5px';
  themeButton.style.cursor = 'pointer';
  themeButton.style.marginLeft = '8px';
  themeButton.style.fontSize = '12px';
  themeButton.style.fontWeight = '500';
  themeButton.style.transition = 'all 0.2s ease';
  themeButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
  themeButton.addEventListener('click', toggleTheme);
  themeButton.addEventListener('mouseover', () => {
    themeButton.style.backgroundColor = '#666';
    themeButton.style.transform = 'translateY(-1px)';
    themeButton.style.boxShadow = '0 3px 5px rgba(0,0,0,0.15)';
  });
  themeButton.addEventListener('mouseout', () => {
    themeButton.style.backgroundColor = '#555';
    themeButton.style.transform = 'translateY(0)';
    themeButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
  });

  // Language selector
  const languageSelector = document.createElement('select');
  languageSelector.id = 'quick-research-language';
  languageSelector.style.padding = '6px 10px';
  languageSelector.style.backgroundColor = '#444';
  languageSelector.style.color = 'white';
  languageSelector.style.border = 'none';
  languageSelector.style.borderRadius = '5px';
  languageSelector.style.cursor = 'pointer';
  languageSelector.style.marginLeft = '8px';
  languageSelector.style.fontSize = '12px';
  languageSelector.style.fontWeight = '500';
  languageSelector.style.transition = 'all 0.2s ease';
  languageSelector.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
  
  // Add language options
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'no', name: 'Norwegian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' }
  ];
  
  languages.forEach(lang => {
    const option = document.createElement('option');
    option.value = lang.code;
    option.textContent = lang.name;
    languageSelector.appendChild(option);
  });
  
  // Save language selection when changed
  languageSelector.addEventListener('change', () => {
    chrome.storage.sync.set({selectedLanguage: languageSelector.value});
    console.log("Language changed to:", languageSelector.value);
  });
  
  // Load saved language preference
  chrome.storage.sync.get(['selectedLanguage'], (result) => {
    if (result.selectedLanguage) {
      languageSelector.value = result.selectedLanguage;
      console.log("Loaded saved language:", result.selectedLanguage);
    }
  });
  
  // Create dropdown for Download options
  const downloadDropdown = document.createElement('div');
  downloadDropdown.id = 'quick-research-download-dropdown';
  downloadDropdown.className = 'dropdown';
  downloadDropdown.style.position = 'relative';
  downloadDropdown.style.display = 'inline-block';
  downloadDropdown.style.marginLeft = '8px';
  
  // Download button (dropdown toggle)
  const downloadBtn = document.createElement('button');
  downloadBtn.id = 'quick-research-download-btn';
  downloadBtn.textContent = 'Download';
  downloadBtn.style.padding = '6px 10px';
  downloadBtn.style.backgroundColor = '#34A853';
  downloadBtn.style.color = 'white';
  downloadBtn.style.border = 'none';
  downloadBtn.style.borderRadius = '5px';
  downloadBtn.style.cursor = 'pointer';
  downloadBtn.style.fontSize = '12px';
  downloadBtn.style.fontWeight = '500';
  downloadBtn.style.transition = 'all 0.2s ease';
  downloadBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
  downloadBtn.addEventListener('mouseover', () => {
    downloadBtn.style.backgroundColor = '#40c463';
    downloadBtn.style.transform = 'translateY(-1px)';
    downloadBtn.style.boxShadow = '0 3px 5px rgba(0,0,0,0.15)';
  });
  downloadBtn.addEventListener('mouseout', () => {
    downloadBtn.style.backgroundColor = '#34A853';
    downloadBtn.style.transform = 'translateY(0)';
    downloadBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
  });
  
  // Dropdown content
  const dropdownContent = document.createElement('div');
  dropdownContent.className = 'dropdown-content';
  dropdownContent.style.display = 'none';
  dropdownContent.style.position = 'absolute';
  dropdownContent.style.backgroundColor = '#333';
  dropdownContent.style.minWidth = '120px';
  dropdownContent.style.boxShadow = '0px 8px 16px 0px rgba(0,0,0,0.2)';
  dropdownContent.style.zIndex = '10001';
  dropdownContent.style.borderRadius = '4px';
  dropdownContent.style.overflow = 'hidden';
  
  // Copy option
  const copyOption = document.createElement('a');
  copyOption.textContent = 'Copy to Clipboard';
  copyOption.style.color = 'white';
  copyOption.style.padding = '8px 12px';
  copyOption.style.textDecoration = 'none';
  copyOption.style.display = 'block';
  copyOption.style.fontSize = '12px';
  copyOption.style.cursor = 'pointer';
  copyOption.addEventListener('mouseover', () => {
    copyOption.style.backgroundColor = '#444';
  });
  copyOption.addEventListener('mouseout', () => {
    copyOption.style.backgroundColor = 'transparent';
  });
  copyOption.addEventListener('click', () => {
    copyResearchToClipboard();
    dropdownContent.style.display = 'none';
  });
  
  // PDF option
  const pdfOption = document.createElement('a');
  pdfOption.textContent = 'Save as PDF';
  pdfOption.style.color = 'white';
  pdfOption.style.padding = '8px 12px';
  pdfOption.style.textDecoration = 'none';
  pdfOption.style.display = 'block';
  pdfOption.style.fontSize = '12px';
  pdfOption.style.cursor = 'pointer';
  pdfOption.addEventListener('mouseover', () => {
    pdfOption.style.backgroundColor = '#444';
  });
  pdfOption.addEventListener('mouseout', () => {
    pdfOption.style.backgroundColor = 'transparent';
  });
  pdfOption.addEventListener('click', () => {
    saveResearchAsPdf();
    dropdownContent.style.display = 'none';
  });
  
  // Text option
  const textOption = document.createElement('a');
  textOption.textContent = 'Save as Text';
  textOption.style.color = 'white';
  textOption.style.padding = '8px 12px';
  textOption.style.textDecoration = 'none';
  textOption.style.display = 'block';
  textOption.style.fontSize = '12px';
  textOption.style.cursor = 'pointer';
  textOption.addEventListener('mouseover', () => {
    textOption.style.backgroundColor = '#444';
  });
  textOption.addEventListener('mouseout', () => {
    textOption.style.backgroundColor = 'transparent';
  });
  textOption.addEventListener('click', () => {
    saveResearchResults();
    dropdownContent.style.display = 'none';
  });
  
  // Add options to dropdown content
  dropdownContent.appendChild(copyOption);
  dropdownContent.appendChild(pdfOption);
  dropdownContent.appendChild(textOption);
  
  // Add dropdown content to dropdown container
  downloadDropdown.appendChild(downloadBtn);
  downloadDropdown.appendChild(dropdownContent);
  
  // Toggle dropdown when clicking the button
  downloadBtn.addEventListener('click', () => {
    const isVisible = dropdownContent.style.display === 'block';
    dropdownContent.style.display = isVisible ? 'none' : 'block';
  });
  
  // Close the dropdown if clicked outside
  document.addEventListener('click', (event) => {
    if (!downloadDropdown.contains(event.target)) {
      dropdownContent.style.display = 'none';
    }
  });

  contentElement = document.createElement('div');
  contentElement.className = 'quick-research-content';
  contentElement.style.color = '#e0e0e0';
  contentElement.style.maxHeight = '60vh';
  contentElement.style.overflowY = 'auto';
  contentElement.style.paddingRight = '5px';
  contentElement.style.transition = 'color 0.3s';

  loadingElement = document.createElement('div');
  loadingElement.className = 'quick-research-loading';
  loadingElement.textContent = 'Loading...';
  loadingElement.style.color = '#bbb';
  loadingElement.style.transition = 'color 0.3s';

  sourcesElement = document.createElement('div');
  sourcesElement.className = 'quick-research-sources';
  sourcesElement.innerHTML = '<p class="quick-research-sources-title">Sources:</p><ul class="quick-research-sources-list"></ul>';
  sourcesElement.style.borderTop = '1px solid #444';
  sourcesElement.style.color = '#bbb';
  sourcesElement.style.transition = 'color 0.3s, border-color 0.3s';
  
  // Buttons container
  const buttonsContainer = document.createElement('div');
  buttonsContainer.id = 'info-panel-buttons';
  buttonsContainer.style.display = 'flex';
  buttonsContainer.style.alignItems = 'center';
  buttonsContainer.style.flexWrap = 'wrap';
  buttonsContainer.style.margin = '10px 0';
  buttonsContainer.appendChild(ttsButton);
  buttonsContainer.appendChild(downloadDropdown);
  buttonsContainer.appendChild(themeButton);
  buttonsContainer.appendChild(languageSelector);
  
  // Assemble panel
  infoPanel.appendChild(closeButton);
  infoPanel.appendChild(titleElement);
  infoPanel.appendChild(buttonsContainer);
  infoPanel.appendChild(loadingElement);
  infoPanel.appendChild(contentElement);
  infoPanel.appendChild(sourcesElement);
  document.body.appendChild(infoPanel);
  
  // Apply theme based on stored preference
  applyThemePreference();
  
  isInitialized = true;
  console.log("Panel initialized");
}

// Toggle theme for the panel
function toggleTheme() {
  // Get current theme state from the panel
  const isLightTheme = infoPanel.classList.contains('light-theme');
  
  // Toggle theme
  if (isLightTheme) {
    infoPanel.classList.remove('light-theme');
    chrome.storage.sync.set({theme: 'dark'});
  } else {
    infoPanel.classList.add('light-theme');
    chrome.storage.sync.set({theme: 'light'});
  }
  
  // Apply theme styles
  applyThemeStyles(!isLightTheme);
}

// Apply theme preference from storage
function applyThemePreference() {
  chrome.storage.sync.get(['theme'], function(result) {
    const isLightTheme = result.theme === 'light';
    if (isLightTheme) {
      infoPanel.classList.add('light-theme');
    } else {
      infoPanel.classList.remove('light-theme');
    }
    
    // Apply appropriate styles based on theme
    applyThemeStyles(isLightTheme);
  });
}

// Apply theme styles to the panel
function applyThemeStyles(isLightTheme) {
  if (isLightTheme) {
    // Light theme
    infoPanel.style.backgroundColor = '#f5f5f5';
    infoPanel.style.border = '1px solid #ddd';
    infoPanel.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    
    titleElement.style.color = '#333';
    contentElement.style.color = '#333';
    loadingElement.style.color = '#777';
    sourcesElement.style.borderTop = '1px solid #ddd';
    sourcesElement.style.color = '#777';
    
    // Style any links and other elements in the content
    const links = contentElement.querySelectorAll('a');
    links.forEach(link => {
      link.style.color = '#1a73e8';
    });
    
    const codeElements = contentElement.querySelectorAll('code, pre');
    codeElements.forEach(el => {
      el.style.backgroundColor = '#eee';
      el.style.color = '#333';
    });
    
    const blockquotes = contentElement.querySelectorAll('blockquote');
    blockquotes.forEach(el => {
      el.style.borderLeft = '3px solid #1a73e8';
      el.style.color = '#555';
    });
  } else {
    // Dark theme (default)
    infoPanel.style.backgroundColor = '#2d2d2d';
    infoPanel.style.border = '1px solid #444';
    infoPanel.style.boxShadow = '0 2px 10px rgba(0,0,0,0.4)';
    
    titleElement.style.color = '#fff';
    contentElement.style.color = '#e0e0e0';
    loadingElement.style.color = '#bbb';
    sourcesElement.style.borderTop = '1px solid #444';
    sourcesElement.style.color = '#bbb';
    
    // Style any links and other elements in the content
    const links = contentElement.querySelectorAll('a');
    links.forEach(link => {
      link.style.color = '#4285f4';
    });
    
    const codeElements = contentElement.querySelectorAll('code, pre');
    codeElements.forEach(el => {
      el.style.backgroundColor = '#3d3d3d';
      el.style.color = '#e0e0e0';
    });
    
    const blockquotes = contentElement.querySelectorAll('blockquote');
    blockquotes.forEach(el => {
      el.style.borderLeft = '3px solid #4285f4';
      el.style.color = '#bbb';
    });
  }
}

// Toggle text-to-speech functionality
function toggleSpeech() {
  if (isSpeaking) {
    stopSpeech();
  } else {
    startSpeech();
  }
}

// Start text-to-speech
function startSpeech() {
  if (!contentElement) return;
  
  // Get the text content from the panel, removing HTML tags
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = contentElement.innerHTML;
  const textToRead = tempDiv.textContent || tempDiv.innerText || '';
  
  if (textToRead.trim() === '') return;
  
  // Cancel any ongoing speech synthesis
  window.speechSynthesis.cancel();
  
  // Create a new speech synthesis utterance
  const utterance = new SpeechSynthesisUtterance(textToRead);
  
  // Get available voices
  const voices = window.speechSynthesis.getVoices();
  
  // Try to find a high-quality English voice
  // Prioritize 'Google' voices if available as they tend to be better quality
  let selectedVoice = null;
  
  // Voice preferences in order: Google US English, Microsoft US English, any other US English, then fallback
  if (voices && voices.length) {
    // Look for Google US English voices
    selectedVoice = voices.find(voice => 
      voice.name.includes('Google') && voice.name.includes('US English') ||
      voice.name.includes('Google US English')
    );
    
    // If no Google voice, try Microsoft voices
    if (!selectedVoice) {
      selectedVoice = voices.find(voice => 
        voice.name.includes('Microsoft') && (voice.name.includes('US English') || voice.name.includes('Zira'))
      );
    }
    
    // Still no voice? Try any US English voice
    if (!selectedVoice) {
      selectedVoice = voices.find(voice => 
        voice.lang === 'en-US' || voice.lang.startsWith('en-')
      );
    }
    
    // If we found a suitable voice, use it
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log("Using voice:", selectedVoice.name);
    }
  }
  
  // Set language to English
  utterance.lang = 'en-US';
  
  // Improved speech parameters
  utterance.rate = 1.0;      // Speech rate (1.0 is normal)
  utterance.pitch = 1.0;     // Speech pitch (1.0 is normal)
  utterance.volume = 1.0;    // Speech volume (max)
  
  // Events to track speech status
  utterance.onstart = () => {
    isSpeaking = true;
    ttsButton.textContent = 'Stop Reading';
    ttsButton.style.backgroundColor = '#f44336';
  };
  
  utterance.onend = () => {
    isSpeaking = false;
    ttsButton.textContent = 'Read Aloud';
    ttsButton.style.backgroundColor = '#4285f4';
  };
  
  utterance.onerror = (event) => {
    console.error('Speech synthesis error:', event);
    isSpeaking = false;
    ttsButton.textContent = 'Read Aloud';
    ttsButton.style.backgroundColor = '#4285f4';
  };
  
  // Make sure voices are loaded (needed in some browsers)
  if (window.speechSynthesis.onvoiceschanged !== undefined && voices.length === 0) {
    window.speechSynthesis.onvoiceschanged = function() {
      const newVoices = window.speechSynthesis.getVoices();
      if (newVoices.length > 0) {
        const betterVoice = getBestVoice(newVoices);
        if (betterVoice) {
          utterance.voice = betterVoice;
        }
      }
      // Speak after voices are loaded
      window.speechSynthesis.speak(utterance);
    };
  } else {
    // Speak the text immediately if voices are already loaded
    window.speechSynthesis.speak(utterance);
  }
}

// Helper function to find the best voice
function getBestVoice(availableVoices) {
  if (!availableVoices || availableVoices.length === 0) return null;
  
  // Voice preferences in order
  const preferredVoices = [
    voice => voice.name.includes('Google') && voice.name.includes('US English'),
    voice => voice.name.includes('Microsoft') && voice.name.includes('US English'),
    voice => voice.name.includes('Microsoft') && voice.name.includes('Zira'),
    voice => voice.lang === 'en-US',
    voice => voice.lang.startsWith('en-')
  ];
  
  for (const preference of preferredVoices) {
    const voice = availableVoices.find(preference);
    if (voice) return voice;
  }
  
  // Default to first English voice, or first available voice
  return availableVoices.find(v => v.lang.startsWith('en-')) || availableVoices[0];
}

// Stop text-to-speech
function stopSpeech() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
    isSpeaking = false;
    if (ttsButton) {
      ttsButton.textContent = 'Read Aloud';
      ttsButton.style.backgroundColor = '#4285f4';
    }
  }
}

// Listen for messages from background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received in content script:", request);
  
  if (request.action === "showInfoPanel") {
    if (!isInitialized) initializePanel();
    showPanel(request.text);
    sendResponse({ status: "success", text: request.text });
    return true;
  }
});

// Show the main panel for detailed research
async function showPanel(text) {
  console.log("Showing panel for:", text);
  
  // Initialize panel if not already done
  if (!isInitialized) {
    initializePanel();
  }
  
  // Get shortened title if needed
  const processedTitle = await shortenTitle(text);
  
  // Reset the panel
  titleElement.textContent = processedTitle;
  loadingElement.style.display = 'block';
  contentElement.innerHTML = '';
  contentElement.style.display = 'none';
  ttsButton.style.display = 'none';
  clearSources();

  // Update context menu visibility
  chrome.runtime.sendMessage({
    action: "updateContextMenu",
    show: true
  });
  
  // Position the panel near the selection
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // Calculate position to avoid going off-screen
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const panelWidth = 700; // Max width of the panel from CSS
    
    let left = rect.left;
    // If it would go off the right edge, align to the right
    if (left + panelWidth > viewportWidth) {
      left = Math.max(0, viewportWidth - panelWidth - 20);
    }
    
    let top = rect.bottom + window.scrollY + 10;
    // If it would go off the bottom, place it above the selection
    if (top + 300 > window.scrollY + viewportHeight) {
      top = rect.top + window.scrollY - 320; // 300px approx panel height + 20px margin
    }
    if (top < 0) top = 10; // Ensure it's not above the top of the page
    
    infoPanel.style.top = `${top}px`;
    infoPanel.style.left = `${left}px`;
  }
  
  // Display the panel
  infoPanel.style.display = 'block';
  
  // Fetch and display the information
  await fetchInformation(text);
}

// Ensure marked.js is available
function ensureMarkedLoaded() {
  return new Promise((resolve) => {
    if (typeof marked !== 'undefined') {
      console.log("Marked.js already loaded");
      resolve(true);
      return;
    }
    
    console.log("Loading marked.js from extension");
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('marked.js');
    script.onload = () => {
      console.log("Marked.js loaded successfully from extension");
      resolve(true);
    };
    script.onerror = (error) => {
      console.error("Failed to load marked.js from extension:", error);
      
      // Try one more approach - inject the script directly
      console.log("Attempting direct script injection");
      chrome.runtime.sendMessage(
        { action: "injectMarkedJs" }, 
        (response) => {
          if (response && response.success) {
            console.log("Marked.js injected successfully via background script");
            resolve(typeof marked !== 'undefined');
          } else {
            console.error("Failed to inject marked.js:", response?.error || "Unknown error");
            resolve(false);
          }
        }
      );
    };
    document.head.appendChild(script);
  });
}

// Fetch information from Gemini API using async/await
async function fetchInformation(text) {
  console.log("Fetching information for:", text);
  
  // Ensure marked.js is loaded before proceeding
  const markedLoaded = await ensureMarkedLoaded();
  console.log("Marked.js loaded status:", markedLoaded);
  
  try {
    // Get the API key from storage
    const result = await new Promise((resolve) => {
      chrome.storage.sync.get(['geminiApiKey', 'selectedLanguage'], resolve);
    });
    
    const API_KEY = result.geminiApiKey;
    if (!API_KEY) {
      throw new Error('No API key found. Please set your Gemini API key in the extension popup.');
    }
    
    // Get the selected language from storage instead of DOM
    let selectedLanguage = 'en';
    if (result.selectedLanguage) {
      selectedLanguage = result.selectedLanguage;
    } else {
      // Fallback to DOM element if storage value is not available
      const languageSelector = document.getElementById('quick-research-language');
      if (languageSelector) {
        selectedLanguage = languageSelector.value;
      }
    }
    const selectedLanguageName = getLanguageName(selectedLanguage);
    
    console.log("Using language for request:", selectedLanguage, selectedLanguageName);
    
    // Use the gemini-2.0-flash model as originally specified
    const API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent";
    
    // Create the prompt text for debugging
    const promptText = `YOU MUST RESPOND ENTIRELY IN ${selectedLanguageName.toUpperCase()} LANGUAGE. DO NOT USE ANY OTHER LANGUAGE.
          
                Briefly explain the following: "${text}". 
                Include the most relevant and up-to-date information. 
                Format your response using markdown for better readability. 
                Use headers, lists, emphasis, and other markdown formatting as appropriate.
                
                When the topic could benefit from visual explanation, include image placeholders using the format {Image TOPIC},
                where TOPIC is a short, specific description of what the image should show.
                For example: {Image Solar System}, {Image Human Heart}, {Image Quantum Computing}.
                
                Include 1-3 image placeholders if relevant to the topic.
                Place each image placeholder on its own line.
                
                Make sure to use proper markdown syntax for the rest of your response.
                
                REMINDER: YOUR ENTIRE RESPONSE MUST BE IN ${selectedLanguageName.toUpperCase()} LANGUAGE ONLY.`;
    
    // Log the entire prompt for debugging
    console.log("Main research prompt:", promptText);
    console.log("Selected language:", selectedLanguageName);
    
    // Prepare prompt for Gemini with language instruction
    const requestData = {
      contents: [{
        parts: [{
          text: promptText
        }]
      }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 768
      }
    };
    
    console.log("Sending request to Gemini API");
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("API error response:", errorData);
      throw new Error(`API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    console.log("Received response from Gemini API");
    loadingElement.style.display = 'none';
    contentElement.style.display = 'block';
    ttsButton.style.display = 'block'; // Show TTS button once content is loaded
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      let content = data.candidates[0].content.parts[0].text;
      
      // Process image placeholders
      content = await processImagePlaceholders(content);
      
      // Render markdown content
      if (markedLoaded) {
        try {
          // Configure marked options
          if (typeof marked !== 'undefined') {
            console.log("Using marked.js to render content");
            marked.setOptions({
              breaks: true,         // Add line breaks
              headerIds: false,     // No header IDs
              mangle: false,        // Don't mangle links
              smartLists: true,     // Use smarter list behavior
              smartypants: true     // Use "smart" typographic punctuation
            });
            
            // Parse and render markdown
            const htmlContent = marked.parse(content);
            contentElement.innerHTML = htmlContent;
            
            // Make sure images are properly styled
            const images = contentElement.querySelectorAll('img');
            images.forEach(img => {
              img.style.maxWidth = '100%';
              img.style.height = 'auto';
              img.style.display = 'block';
              img.style.margin = '15px auto';
              img.style.borderRadius = '6px';
              img.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              
              // Add loading state
              img.style.opacity = '0.6';
              img.style.transition = 'opacity 0.3s ease';
              
              // Handle successful load
              img.onload = function() {
                this.style.opacity = '1';
              };
              
              // Handle errors more gracefully
              img.onerror = function() {
                console.error('Failed to load image:', this.src);
                // Instead of hiding completely, show an error indicator
                this.style.opacity = '0.3';
                this.style.border = '1px dashed #999';
                this.style.padding = '10px';
                this.style.backgroundColor = '#444';
                this.style.minHeight = '30px';
                
                // Add an error message overlay
                const errorMsg = document.createElement('div');
                errorMsg.textContent = 'Image failed to load';
                errorMsg.style.position = 'absolute';
                errorMsg.style.top = '50%';
                errorMsg.style.left = '50%';
                errorMsg.style.transform = 'translate(-50%, -50%)';
                errorMsg.style.color = '#aaa';
                errorMsg.style.fontSize = '12px';
                errorMsg.style.textAlign = 'center';
                
                const container = document.createElement('div');
                container.style.position = 'relative';
                container.style.display = 'inline-block';
                container.style.margin = '15px auto';
                container.style.width = '100%';
                
                // Replace the image with our container
                this.parentNode.insertBefore(container, this);
                container.appendChild(this);
                container.appendChild(errorMsg);
              };
            });
            
            console.log("Markdown rendered successfully with marked.js");
          } else {
            // Use a more direct method if marked is somehow not available
            console.log("Marked not defined, using direct rendering method");
            renderDirectMarkdown(content);
          }
        } catch (e) {
          console.error("Error parsing markdown:", e);
          renderPlainContent(content);
        }
      } else {
        console.error("Marked.js not available, falling back to plain text");
        renderPlainContent(content);
      }
      
      addSource('Google Gemini AI', 'https://ai.google.dev/');
    } else {
      contentElement.innerHTML = '<p>No detailed information found in the API response.</p>';
      console.error("Unexpected API response format:", data);
      ttsButton.style.display = 'none'; // Hide TTS button if no content
    }
  }
  catch (error) {
    console.error("Error fetching information:", error);
    loadingElement.style.display = 'none';
    contentElement.style.display = 'block';
    contentElement.innerHTML = `<p>Error: ${error.message}</p>`;
    ttsButton.style.display = 'none'; // Hide TTS button on error
  }
}

// Process image placeholders and replace with real images
async function processImagePlaceholders(content) {
  // Pattern to match {Image Topic} placeholders
  const placeholderPattern = /\{Image ([^}]+)\}/g;
  let match;
  let processedContent = content;
  let placeholderPromises = [];
  let replacements = [];

  // Find all placeholders
  while ((match = placeholderPattern.exec(content)) !== null) {
    const fullMatch = match[0];
    const searchTerm = match[1].trim();
    
    // Add to our list of promises and remember which placeholder each is for
    placeholderPromises.push(
      fetchImageFromGoogle(searchTerm)
        .then(imageUrl => {
          // Create safe alt text
          const safeAltText = searchTerm.replace(/"/g, '&quot;');
          
          replacements.push({
            placeholder: fullMatch,
            markdown: imageUrl ? `![${safeAltText}](${imageUrl})` : `[Image: ${safeAltText}]`
          });
        })
    );
  }

  // Wait for all image searches to complete
  if (placeholderPromises.length > 0) {
    await Promise.all(placeholderPromises);
    
    // Replace all placeholders with their image markdown
    replacements.forEach(replacement => {
      processedContent = processedContent.replace(
        replacement.placeholder, 
        replacement.markdown
      );
    });
  }
  
  // Also process any existing markdown image references to validate URLs
  processedContent = processedContent.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, url) => {
    // Check if URL is valid and complete
    if (!isValidImageUrl(url)) {
      console.log("Found invalid image URL:", url);
      // Create a fallback SVG with the image description
      const safeAltText = alt.replace(/"/g, '&quot;');
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="200" viewBox="0 0 600 200">
        <rect width="100%" height="100%" fill="#555"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="20" text-anchor="middle" fill="#fff">${safeAltText || 'Invalid Image URL'}</text>
      </svg>`;
      const base64Svg = btoa(unescape(encodeURIComponent(svgContent)));
      const fallbackUrl = `data:image/svg+xml;base64,${base64Svg}`;
      return `![${alt}](${fallbackUrl})`;
    }
    return match; // Keep original if URL seems valid
  });

  return processedContent;
}

// Helper function to validate image URLs
function isValidImageUrl(url) {
  // Check for incomplete URLs or obvious truncation
  if (!url || 
      url.endsWith('(') || 
      url.endsWith('/') || 
      url.includes('...)') ||
      !url.match(/^https?:\/\//)) {
    return false;
  }
  
  try {
    // Try to construct a URL object - will throw if seriously malformed
    new URL(url);
    return true;
  } catch (e) {
    console.error("Invalid URL detected:", url, e);
    return false;
  }
}

// Fetch image from Google using a search API
async function fetchImageFromGoogle(searchTerm) {
  console.log("Searching for image:", searchTerm);
  
  try {
    // First try using Google Custom Search API if we have keys set up
    const result = await new Promise((resolve) => {
      chrome.storage.sync.get(['googleSearchApiKey', 'googleSearchEngineId'], resolve);
    });
    
    const API_KEY = result.googleSearchApiKey;
    const SEARCH_ENGINE_ID = result.googleSearchEngineId;
    
    if (API_KEY && SEARCH_ENGINE_ID) {
      // Use Google Custom Search API to find images
      const response = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(searchTerm)}&searchType=image&num=1&safe=active`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          return data.items[0].link;
        }
      }
    }

    // Fallback to a more reliable placeholder service that doesn't encode text in URL
    // Using a base64 SVG instead of the placeholder.com service that was causing issues
    const encodedText = encodeURIComponent(searchTerm);
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="200" viewBox="0 0 600 200">
      <rect width="100%" height="100%" fill="#555"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="20" text-anchor="middle" fill="#fff">${encodedText}</text>
    </svg>`;
    const base64Svg = btoa(unescape(encodeURIComponent(svgContent)));
    return `data:image/svg+xml;base64,${base64Svg}`;
  } catch (error) {
    console.error("Error fetching image:", error);
    // Return a data URL for a simple SVG placeholder
    return `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="200" viewBox="0 0 600 200"><rect width="100%" height="100%" fill="#555"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="20" text-anchor="middle" fill="#fff">Image Placeholder</text></svg>')}`;
  }
}

// Render markdown directly without using marked library
function renderDirectMarkdown(content) {
  console.log("Using direct markdown rendering");
  
  // Create a temporary div to safely parse HTML
  const tempDiv = document.createElement('div');
  
  // Preprocess content to handle nested lists
  // We'll convert the markdown to handle nested lists first
  let processedContent = content;
  
  // Process lists with proper nesting based on indentation
  let listLines = [];
  let inList = false;
  let listHtml = '';
  let currentIndentLevel = 0;
  
  // Process code blocks first (```)
  let inCodeBlock = false;
  let codeBlockContent = '';
  let codeLanguage = '';
  let processedLines = [];
  
  const lines = processedContent.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Handle code blocks
    if (line.trim().startsWith('```')) {
      if (!inCodeBlock) {
        // Start of code block
        inCodeBlock = true;
        // Extract language if specified (e.g., ```javascript)
        codeLanguage = line.trim().substring(3).trim();
        continue;
      } else {
        // End of code block
        inCodeBlock = false;
        // Create code block element with syntax highlighting class if language specified
        const langClass = codeLanguage ? ` class="language-${codeLanguage}"` : '';
        processedLines.push(`<pre><code${langClass}>${escapeHtml(codeBlockContent)}</code></pre>`);
        codeBlockContent = '';
        codeLanguage = '';
        continue;
      }
    }
    
    if (inCodeBlock) {
      // Inside code block, collect content
      codeBlockContent += line + '\n';
      continue;
    }
    
    // Process normal lines (not in code blocks)
    processedLines.push(line);
  }
  
  // Reset processedContent
  processedContent = '';
  
  // Process lists and other elements
  for (let i = 0; i < processedLines.length; i++) {
    const line = processedLines[i];
    
    // Check if this line is a list item
    const listMatch = line.match(/^(\s*)([-*]) (.+)$/);
    
    if (listMatch) {
      // This is a list item
      const indentation = listMatch[1].length;
      const listMarker = listMatch[2];
      const content = listMatch[3];
      
      if (!inList) {
        // Start a new list
        inList = true;
        listHtml = '<ul>';
        currentIndentLevel = indentation;
      }
      
      // Determine the indentation level difference
      const indentDiff = indentation - currentIndentLevel;
      
      if (indentDiff > 0) {
        // This is a nested list item
        listHtml += '<ul><li>' + content;
      } else if (indentDiff < 0) {
        // Close nested lists based on indentation difference
        const closeTags = '</li></ul>'.repeat(Math.abs(indentDiff) / 2);
        listHtml += closeTags + '<li>' + content;
      } else {
        // Same level list item
        listHtml += '</li><li>' + content;
      }
      
      currentIndentLevel = indentation;
      
      // If next line is not a list item, close the list
      if (i === processedLines.length - 1 || !processedLines[i + 1].match(/^\s*[-*] /)) {
        // Close all open lists
        const depth = (indentation / 2) + 1;
        listHtml += '</li>' + '</ul>'.repeat(depth);
        processedContent += listHtml;
        inList = false;
      }
    } else {
      // Not a list item
      if (inList) {
        // Close the current list
        const depth = (currentIndentLevel / 2) + 1;
        listHtml += '</li>' + '</ul>'.repeat(depth);
        processedContent += listHtml;
        inList = false;
      }
      
      processedContent += line + '\n';
    }
  }
  
  // Simple markdown to HTML conversion for the rest of the elements
  let html = processedContent
    // Headers
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Strikethrough
    .replace(/~~(.*?)~~/g, '<del>$1</del>')
    // Blockquotes
    .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
    // Horizontal rules
    .replace(/^---+$/gm, '<hr>')
    .replace(/^\*\*\*+$/gm, '<hr>')
    .replace(/^___+$/gm, '<hr>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Images - Add support for markdown image syntax with error handling
    .replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, src) => {
      // Check if the image URL is a placeholder.com URL and convert it to our SVG placeholder
      if (src.includes('placeholder.com')) {
        // Extract the text from placeholder URL
        const textMatch = src.match(/text=([^&]+)/);
        const placeholderText = textMatch ? decodeURIComponent(textMatch[1]) : 'Image';
        
        // Generate SVG placeholder
        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="200" viewBox="0 0 600 200">
          <rect width="100%" height="100%" fill="#555"/>
          <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="20" text-anchor="middle" fill="#fff">${placeholderText}</text>
        </svg>`;
        const base64Svg = btoa(unescape(encodeURIComponent(svgContent)));
        const svgDataUrl = `data:image/svg+xml;base64,${base64Svg}`;
        
        return `<img src="${svgDataUrl}" alt="${alt}" style="max-width:100%; height:auto; margin:10px 0; display:block; border-radius:6px;">`;
      }
      
      // Check for invalid or truncated URLs
      if (!isValidImageUrl(src)) {
        // Generate SVG placeholder for invalid URL
        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="200" viewBox="0 0 600 200">
          <rect width="100%" height="100%" fill="#555"/>
          <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="20" text-anchor="middle" fill="#fff">${alt || 'Invalid Image URL'}</text>
        </svg>`;
        const base64Svg = btoa(unescape(encodeURIComponent(svgContent)));
        const svgDataUrl = `data:image/svg+xml;base64,${base64Svg}`;
        
        return `<img src="${svgDataUrl}" alt="${alt}" style="max-width:100%; height:auto; margin:10px 0; display:block; border-radius:6px;">`;
      }
      
      // Return normal image HTML for valid image URLs
      return `<img src="${src}" alt="${alt}" style="max-width:100%; height:auto; margin:10px 0; display:block; border-radius:6px;">`;
    })
    // Links
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
    // Paragraphs (except for lists, blockquotes, etc. which we already processed)
    .replace(/^(?!<(\/)?(?:h1|h2|h3|ul|ol|li|img|blockquote|hr|pre|code).*>)(.+)$/gm, '<p>$2</p>');
  
  // Process tables - handle after the above replacements so we don't corrupt the table structure
  html = processTableMarkdown(html);
  
  // Set the HTML content safely
  tempDiv.innerHTML = html;
  
  // Apply styling to blockquotes
  const blockquotes = tempDiv.querySelectorAll('blockquote');
  blockquotes.forEach(blockquote => {
    blockquote.style.borderLeft = '3px solid #aaa';
    blockquote.style.paddingLeft = '15px';
    blockquote.style.margin = '10px 0';
    blockquote.style.color = '#bbb';
    blockquote.style.fontStyle = 'italic';
  });
  
  // Style code elements
  const codeElements = tempDiv.querySelectorAll('code');
  codeElements.forEach(code => {
    code.style.backgroundColor = '#444';
    code.style.padding = '2px 5px';
    code.style.borderRadius = '3px';
    code.style.fontFamily = 'monospace';
    code.style.fontSize = '0.9em';
  });
  
  // Style pre (code blocks)
  const preElements = tempDiv.querySelectorAll('pre');
  preElements.forEach(pre => {
    pre.style.backgroundColor = '#333';
    pre.style.padding = '12px';
    pre.style.overflow = 'auto';
    pre.style.borderRadius = '5px';
    pre.style.marginBottom = '15px';
    pre.style.marginTop = '15px';
  });
  
  // Copy the processed HTML into the content element
  contentElement.innerHTML = '';
  while (tempDiv.firstChild) {
    contentElement.appendChild(tempDiv.firstChild);
  }
  
  // Make sure images are properly styled and have error handling
  const images = contentElement.querySelectorAll('img');
  images.forEach(img => {
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.display = 'block';
    img.style.margin = '15px auto';
    img.style.borderRadius = '6px';
    img.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    
    // Add loading state
    img.style.opacity = '0.6';
    img.style.transition = 'opacity 0.3s ease';
    
    // Handle successful load
    img.onload = function() {
      this.style.opacity = '1';
    };
    
    // Handle errors more gracefully
    img.onerror = function() {
      console.error('Failed to load image:', this.src);
      // Instead of hiding completely, show an error indicator
      this.style.opacity = '0.3';
      this.style.border = '1px dashed #999';
      this.style.padding = '10px';
      this.style.backgroundColor = '#444';
      this.style.minHeight = '30px';
      
      // Add an error message overlay
      const errorMsg = document.createElement('div');
      errorMsg.textContent = 'Image failed to load';
      errorMsg.style.position = 'absolute';
      errorMsg.style.top = '50%';
      errorMsg.style.left = '50%';
      errorMsg.style.transform = 'translate(-50%, -50%)';
      errorMsg.style.color = '#aaa';
      errorMsg.style.fontSize = '12px';
      errorMsg.style.textAlign = 'center';
      
      const container = document.createElement('div');
      container.style.position = 'relative';
      container.style.display = 'inline-block';
      container.style.margin = '15px auto';
      container.style.width = '100%';
      
      // Replace the image with our container
      this.parentNode.insertBefore(container, this);
      container.appendChild(this);
      container.appendChild(errorMsg);
    };
  });
  
  console.log("Direct markdown rendering complete");
}

// Helper function to process table markdown
function processTableMarkdown(html) {
  const lines = html.split('\n');
  let inTable = false;
  let tableHTML = '';
  let processedHTML = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check for table row (has |)
    if (line.includes('|')) {
      // Check if this is a header separator row (like |---|---|)
      const isSeparator = /^\|(\s*[-:]+\s*\|)+\s*[-:]+\s*\|$/.test(line);
      
      if (!inTable) {
        // Start a new table
        inTable = true;
        tableHTML = '<table style="width:100%; border-collapse:collapse; margin:15px 0;">';
        
        // Add header row
        if (!isSeparator) {
          tableHTML += '<thead><tr>';
          const cells = line.split('|').filter(cell => cell !== '');
          cells.forEach(cell => {
            tableHTML += `<th style="border:1px solid #555; padding:8px; text-align:left; background-color:#383838;">${cell.trim()}</th>`;
          });
          tableHTML += '</tr></thead><tbody>';
        }
      } else if (isSeparator) {
        // Skip the separator row, we already added the header
        continue;
      } else {
        // Add a regular table row
        tableHTML += '<tr>';
        const cells = line.split('|').filter(cell => cell !== '');
        cells.forEach(cell => {
          tableHTML += `<td style="border:1px solid #555; padding:8px;">${cell.trim()}</td>`;
        });
        tableHTML += '</tr>';
      }
      
      // Check if table ends (next line doesn't have |)
      if (i === lines.length - 1 || !lines[i + 1].includes('|')) {
        tableHTML += '</tbody></table>';
        processedHTML += tableHTML;
        inTable = false;
      }
    } else {
      // Not a table row
      if (inTable) {
        // Close the current table
        tableHTML += '</tbody></table>';
        processedHTML += tableHTML;
        inTable = false;
      }
      
      processedHTML += lines[i] + '\n';
    }
  }
  
  return processedHTML;
}

// Helper function to escape HTML in code blocks
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Helper function to render plain content without markdown
function renderPlainContent(content) {
  console.log("Rendering plain content as fallback");
  
  // Create a container
  contentElement.innerHTML = '';
  
  // Simple markdown-like formatting for headers
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    if (line === '') {
      continue; // Skip empty lines
    }
    
    // Handle headers (# Header)
    if (line.startsWith('# ')) {
      const header = document.createElement('h1');
      header.textContent = line.substring(2);
      contentElement.appendChild(header);
    } 
    else if (line.startsWith('## ')) {
      const header = document.createElement('h2');
      header.textContent = line.substring(3);
      contentElement.appendChild(header);
    }
    else if (line.startsWith('### ')) {
      const header = document.createElement('h3');
      header.textContent = line.substring(4);
      contentElement.appendChild(header);
    }
    // Handle bullet points
    else if (line.startsWith('* ') || line.startsWith('- ')) {
      const listItem = document.createElement('div');
      listItem.innerHTML = '• ' + line.substring(2);
      listItem.style.marginLeft = '20px';
      contentElement.appendChild(listItem);
    }
    // Handle images
    else if (line.match(/!\[(.*?)\]\((.*?)\)/)) {
      const match = line.match(/!\[(.*?)\]\((.*?)\)/);
      if (match && match.length >= 3) {
        const altText = match[1];
        let imageUrl = match[2];
        
        // Check if the image URL is a placeholder.com URL and convert it to our SVG placeholder
        if (imageUrl.includes('placeholder.com')) {
          // Extract the text from placeholder URL
          const textMatch = imageUrl.match(/text=([^&]+)/);
          const placeholderText = textMatch ? decodeURIComponent(textMatch[1]) : 'Image';
          
          // Generate SVG placeholder
          const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="200" viewBox="0 0 600 200">
            <rect width="100%" height="100%" fill="#555"/>
            <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="20" text-anchor="middle" fill="#fff">${placeholderText}</text>
          </svg>`;
          const base64Svg = btoa(unescape(encodeURIComponent(svgContent)));
          imageUrl = `data:image/svg+xml;base64,${base64Svg}`;
        }
        // Check for invalid or truncated URLs
        else if (!isValidImageUrl(imageUrl)) {
          // Generate SVG placeholder for invalid URL
          const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="200" viewBox="0 0 600 200">
            <rect width="100%" height="100%" fill="#555"/>
            <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="20" text-anchor="middle" fill="#fff">${altText || 'Invalid Image URL'}</text>
          </svg>`;
          const base64Svg = btoa(unescape(encodeURIComponent(svgContent)));
          imageUrl = `data:image/svg+xml;base64,${base64Svg}`;
        }
        
        const imgContainer = document.createElement('div');
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = altText;
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.display = 'block';
        img.style.margin = '15px auto';
        img.style.borderRadius = '6px';
        img.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        
        // Add loading state
        img.style.opacity = '0.6';
        img.style.transition = 'opacity 0.3s ease';
        
        // Handle successful load
        img.onload = function() {
          this.style.opacity = '1';
        };
        
        // Handle errors more gracefully
        img.onerror = function() {
          console.error('Failed to load image:', this.src);
          // Instead of hiding completely, show an error indicator
          this.style.opacity = '0.3';
          this.style.border = '1px dashed #999';
          this.style.padding = '10px';
          this.style.backgroundColor = '#444';
          this.style.minHeight = '30px';
          
          // Add an error message overlay
          const errorMsg = document.createElement('div');
          errorMsg.textContent = 'Image failed to load';
          errorMsg.style.position = 'absolute';
          errorMsg.style.top = '50%';
          errorMsg.style.left = '50%';
          errorMsg.style.transform = 'translate(-50%, -50%)';
          errorMsg.style.color = '#aaa';
          errorMsg.style.fontSize = '12px';
          errorMsg.style.textAlign = 'center';
          
          const container = document.createElement('div');
          container.style.position = 'relative';
          container.style.display = 'inline-block';
          container.style.margin = '15px auto';
          container.style.width = '100%';
          
          // Replace the image with our container
          this.parentNode.insertBefore(container, this);
          container.appendChild(this);
          container.appendChild(errorMsg);
        };
        
        imgContainer.appendChild(img);
        contentElement.appendChild(imgContainer);
      }
    }
    // Regular paragraph
    else {
      const paragraph = document.createElement('p');
      paragraph.textContent = line;
      contentElement.appendChild(paragraph);
    }
  }
}

// Add a source link
function addSource(name, url) {
  const sourcesList = document.querySelector('.quick-research-sources-list');
  if (!sourcesList) return;
  
  const sourceItem = document.createElement('li');
  const sourceLink = document.createElement('a');
  sourceLink.href = url;
  sourceLink.textContent = name;
  sourceLink.target = '_blank';
  sourceItem.appendChild(sourceLink);
  sourcesList.appendChild(sourceItem);
  
  sourcesElement.style.display = 'block';
}

// Clear any previously added sources
function clearSources() {
  const sourcesList = document.querySelector('.quick-research-sources-list');
  if (sourcesList) {
    sourcesList.innerHTML = '';
    sourcesElement.style.display = 'none';
  }
}

// Add this function to handle the Quick Research feature
async function fetchQuickInformation(text) {
  try {
    // Get the API key from storage - use the same geminiApiKey as the main research feature
    const result = await new Promise((resolve) => {
      chrome.storage.sync.get(['geminiApiKey', 'selectedLanguage'], resolve);
    });
    
    const API_KEY = result.geminiApiKey;
    
    if (!API_KEY) {
      throw new Error('No API key found. Please set your Gemini API key in the extension popup.');
    }
    
    // Get the selected language from storage instead of DOM
    let selectedLanguage = 'en';
    if (result.selectedLanguage) {
      selectedLanguage = result.selectedLanguage;
    } else {
      // Fallback to DOM element if storage value is not available
      const languageSelector = document.getElementById('quick-research-language');
      if (languageSelector) {
        selectedLanguage = languageSelector.value;
      }
    }
    const selectedLanguageName = getLanguageName(selectedLanguage);
    
    console.log("Quick research using language:", selectedLanguage, selectedLanguageName);
    
    // Use the gemini-2.0-flash model as in the main research function
    const API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent";
    
    // Create the prompt text for debugging
    const promptText = `YOU MUST RESPOND ENTIRELY IN ${selectedLanguageName.toUpperCase()} LANGUAGE. DO NOT USE ANY OTHER LANGUAGE.
          
                Provide a very concise summary (2-3 sentences) about "${text}". 
                Include only the most essential facts or explanation.
                If the topic is complex, focus on making it easily understandable.
                
                If the topic would significantly benefit from visual explanation, you can include an image placeholder using the format {Image TOPIC},
                where TOPIC is what the image should show. Only include an image if it's truly necessary for understanding this specific topic.
                
                REMINDER: YOUR ENTIRE RESPONSE MUST BE IN ${selectedLanguageName.toUpperCase()} LANGUAGE ONLY.`;
    
    // Log the entire prompt for debugging
    console.log("Quick research prompt:", promptText);
    console.log("Selected language:", selectedLanguageName);
    
    // Prepare prompt for Gemini - specifically for quick research with language instruction
    const requestData = {
      contents: [{
        parts: [{
          text: promptText
        }]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 300
      }
    };
    
    console.log("Sending quick research request to Gemini API");
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("API error response:", errorData);
      throw new Error(`API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    console.log("Received quick research response from Gemini API");
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      let content = data.candidates[0].content.parts[0].text;
      
      // Process the content for any image placeholders that might be returned
      content = await processImagePlaceholders(content);
      
      return {
        title: text,
        content: content
      };
    } else {
      return {
        title: text,
        content: "No information found for this topic."
      };
    }
  } catch (error) {
    console.error("Error fetching quick information:", error);
    return {
      title: "Error",
      content: `An error occurred: ${error.message}`
    };
  }
}

// Function to show the Quick Research panel
async function showQuickPanel(text) {
  // Initialize panel if not already done
  if (!isInitialized) {
    initializePanel();
  }
  
  // Get shortened title if needed
  const processedTitle = await shortenTitle(text);
  
  // Reset the panel
  titleElement.textContent = processedTitle;
  loadingElement.style.display = 'block';
  contentElement.innerHTML = '';
  contentElement.style.display = 'none';
  ttsButton.style.display = 'none';
  clearSources();
  
  // Position the panel near the selection
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // Calculate position to avoid going off-screen
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const panelWidth = 700; // Max width of the panel from CSS
    
    let left = rect.left;
    // If it would go off the right edge, align to the right
    if (left + panelWidth > viewportWidth) {
      left = Math.max(0, viewportWidth - panelWidth - 20);
    }
    
    let top = rect.bottom + window.scrollY + 10;
    // If it would go off the bottom, place it above the selection
    if (top + 300 > window.scrollY + viewportHeight) {
      top = rect.top + window.scrollY - 320; // 300px approx panel height + 20px margin
    }
    if (top < 0) top = 10; // Ensure it's not above the top of the page
    
    infoPanel.style.top = `${top}px`;
    infoPanel.style.left = `${left}px`;
  }
  
  // Display the panel
  infoPanel.style.display = 'block';
  
  // Fetch and display the information
  const result = await fetchQuickInformation(text);
  
  loadingElement.style.display = 'none';
  contentElement.style.display = 'block';
  titleElement.textContent = processedTitle;
  
  // Ensure marked.js is loaded before trying to render the content
  const markedLoaded = await ensureMarkedLoaded();
  
  // Display the content with appropriate formatting
  if (markedLoaded && typeof marked !== 'undefined') {
    try {
      // Configure marked options
      marked.setOptions({
        breaks: true,
        headerIds: false,
        mangle: false,
        smartLists: true,
        smartypants: true
      });
      
      // Parse and render markdown
      contentElement.innerHTML = marked.parse(result.content);
      
      // Make sure images are properly styled
      const images = contentElement.querySelectorAll('img');
      images.forEach(img => {
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.display = 'block';
        img.style.margin = '15px auto';
        img.style.borderRadius = '6px';
        img.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        
        // Add loading state
        img.style.opacity = '0.6';
        img.style.transition = 'opacity 0.3s ease';
        
        // Handle successful load
        img.onload = function() {
          this.style.opacity = '1';
        };
        
        // Handle errors more gracefully
        img.onerror = function() {
          console.error('Failed to load image:', this.src);
          // Instead of hiding completely, show an error indicator
          this.style.opacity = '0.3';
          this.style.border = '1px dashed #999';
          this.style.padding = '10px';
          this.style.backgroundColor = '#444';
          this.style.minHeight = '30px';
          
          // Add an error message overlay
          const errorMsg = document.createElement('div');
          errorMsg.textContent = 'Image failed to load';
          errorMsg.style.position = 'absolute';
          errorMsg.style.top = '50%';
          errorMsg.style.left = '50%';
          errorMsg.style.transform = 'translate(-50%, -50%)';
          errorMsg.style.color = '#aaa';
          errorMsg.style.fontSize = '12px';
          errorMsg.style.textAlign = 'center';
          
          const container = document.createElement('div');
          container.style.position = 'relative';
          container.style.display = 'inline-block';
          container.style.margin = '15px auto';
          container.style.width = '100%';
          
          // Replace the image with our container
          this.parentNode.insertBefore(container, this);
          container.appendChild(this);
          container.appendChild(errorMsg);
        };
      });
    } catch (e) {
      console.error("Error parsing markdown:", e);
      renderDirectMarkdown(result.content);
    }
  } else if (result.content.includes('\n') || result.content.includes('#') || result.content.includes('*')) {
    // If content appears to have markdown formatting but marked.js isn't available
    renderDirectMarkdown(result.content);
  } else {
    // Plain text fallback
    contentElement.innerHTML = `<p>${result.content}</p>`;
  }
  
  // Show the TTS button if there's content to read
  if (contentElement.innerText.trim() !== '') {
    ttsButton.style.display = 'inline-block';
  }
  
  // Add Gemini as a source
  addSource('Google Gemini AI', 'https://ai.google.dev/');
}

// Function to save research results as a text file
function saveResearchResults() {
  if (!contentElement || !titleElement) return;
  
  // Get the title and content
  const title = titleElement.textContent || 'Research';
  
  // Get the text content from the panel, removing HTML tags
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = contentElement.innerHTML;
  const textContent = tempDiv.textContent || tempDiv.innerText || '';
  
  if (textContent.trim() === '') {
    console.log("No content to save");
    return;
  }
  
  // Format the content nicely
  const dateTime = new Date().toLocaleString();
  const formattedContent = 
`# ${title}
Research conducted on ${dateTime}

${textContent}

---
Generated by Quick Research Assistant using Google Gemini AI`;
  
  // Create filename based on title (sanitized)
  const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const fileName = `research_${sanitizedTitle}_${Date.now()}.txt`;
  
  // Send to background script for downloading
  chrome.runtime.sendMessage({
    action: "downloadTextFile",
    content: formattedContent,
    fileName: fileName
  }, (response) => {
    if (response && response.success) {
      console.log("File download initiated successfully");
      
      // Show a brief confirmation message
      const saveConfirmation = document.createElement('div');
      saveConfirmation.textContent = 'Research saved!';
      saveConfirmation.style.position = 'absolute';
      saveConfirmation.style.bottom = '10px';
      saveConfirmation.style.right = '10px';
      saveConfirmation.style.backgroundColor = '#4CAF50';
      saveConfirmation.style.color = 'white';
      saveConfirmation.style.padding = '8px 12px';
      saveConfirmation.style.borderRadius = '4px';
      saveConfirmation.style.fontSize = '14px';
      saveConfirmation.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
      saveConfirmation.style.zIndex = 10001;
      saveConfirmation.style.animation = 'fade-in-out 2s forwards';
      
      // Add keyframes for animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes fade-in-out {
          0% { opacity: 0; transform: translateY(20px); }
          10% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }
      `;
      document.head.appendChild(style);
      
      document.body.appendChild(saveConfirmation);
      
      // Remove the confirmation message after animation
      setTimeout(() => {
        if (saveConfirmation.parentNode) {
          saveConfirmation.parentNode.removeChild(saveConfirmation);
        }
      }, 2000);
    } else {
      console.error("Error saving file");
    }
  });
}

// Function to copy research results to clipboard
function copyResearchToClipboard() {
  if (!contentElement || !titleElement) return;
  
  // Get the title and content
  const title = titleElement.textContent || 'Research';
  
  // Get the text content from the panel, removing HTML tags
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = contentElement.innerHTML;
  const textContent = tempDiv.textContent || tempDiv.innerText || '';
  
  if (textContent.trim() === '') {
    return;
  }
  
  // Format the content nicely
  const dateTime = new Date().toLocaleString();
  const formattedContent = 
`# ${title}
Research conducted on ${dateTime}

${textContent}

---
Generated by Quick Research Assistant using Google Gemini AI`;

  // Copy to clipboard
  navigator.clipboard.writeText(formattedContent).then(() => {
    // Show a brief confirmation message
    showConfirmationToast('Research copied to clipboard!');
  }).catch(err => {
    console.error('Error copying to clipboard:', err);
    showConfirmationToast('Failed to copy!', false);
  });
}

// Function to save research results as a PDF
function saveResearchAsPdf() {
  if (!contentElement || !titleElement) return;
  
  // Get the title and content
  const title = titleElement.textContent || 'Research';
  
  // Create a temporary hidden div to format our PDF content
  const pdfContainer = document.createElement('div');
  pdfContainer.style.position = 'absolute';
  pdfContainer.style.left = '-9999px';
  pdfContainer.style.top = '0';
  pdfContainer.style.width = '800px'; // Set width for better PDF formatting
  
  // Create styled content for PDF
  const dateTime = new Date().toLocaleString();
  
  // Style the PDF content
  pdfContainer.innerHTML = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px;">
      <h1 style="color: #4285f4; border-bottom: 1px solid #ddd; padding-bottom: 10px;">${title}</h1>
      <p style="color: #666; font-style: italic;">Research conducted on ${dateTime}</p>
      <div style="margin-top: 20px; line-height: 1.6;">
        ${contentElement.innerHTML}
      </div>
      <div style="margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px; color: #666; font-size: 12px;">
        Generated by Quick Research Assistant using Google Gemini AI
      </div>
    </div>
  `;
  
  document.body.appendChild(pdfContainer);
  
  // Create filename based on title (sanitized)
  const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const fileName = `research_${sanitizedTitle}_${Date.now()}.pdf`;
  
  // Use window.print() to trigger the browser's print dialog, with PDF options
  const printOptions = {
    printBackground: true,
    pageSize: 'A4',
    preferCSSPageSize: true
  };
  
  // Tell the background script we want to print (can't directly call window.print from a content script)
  chrome.runtime.sendMessage({
    action: "triggerPrintAsPdf",
    pdfTitle: title
  }, (response) => {
    if (response && response.success) {
      // The print dialog has been opened, remove the temporary container after a delay
      setTimeout(() => {
        pdfContainer.remove();
      }, 1000);
      
      showConfirmationToast('PDF save initiated');
    } else {
      pdfContainer.remove();
      console.error("Error triggering PDF print dialog");
    }
  });
}

// Function to show toast notification
function showConfirmationToast(message, success = true) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.position = 'absolute';
  toast.style.bottom = '10px';
  toast.style.right = '10px';
  toast.style.backgroundColor = success ? '#4CAF50' : '#F44336';
  toast.style.color = 'white';
  toast.style.padding = '8px 12px';
  toast.style.borderRadius = '4px';
  toast.style.fontSize = '14px';
  toast.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
  toast.style.zIndex = 10001;
  toast.style.animation = 'fade-in-out 2s forwards';
  
  // Add keyframes for animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fade-in-out {
      0% { opacity: 0; transform: translateY(20px); }
      10% { opacity: 1; transform: translateY(0); }
      80% { opacity: 1; }
      100% { opacity: 0; }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(toast);
  
  // Remove the confirmation message after animation
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 2000);
}

// Listen for messages from the background script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    console.log("Content script received message:", message);
    
    if (message.action === "showInfoPanel" && message.text) {
      showPanel(message.text);
      sendResponse({ status: "success" });
    }
    else if (message.action === "showQuickInfoPanel" && message.text) {
      showQuickPanel(message.text);
      sendResponse({ status: "success" });
    }
    else if (message.action === "saveResearchResults") {
      saveResearchResults();
      sendResponse({ status: "success" });
    }
    else if (message.action === "saveResearchAsPdf") {
      if (infoPanel && infoPanel.style.display !== 'none') {
        saveResearchAsPdf();
        sendResponse({ status: "success" });
      } else {
        sendResponse({ status: "error", message: "No active panel" });
      }
    }
    else if (message.action === "copyResearchToClipboard") {
      if (infoPanel && infoPanel.style.display !== 'none') {
        copyResearchToClipboard();
        sendResponse({ status: "success" });
      } else {
        sendResponse({ status: "error", message: "No active panel" });
      }
    }
  } catch (error) {
    console.error("Error processing message:", error);
    sendResponse({ status: "error", message: error.message });
  }
  
  // Return true to indicate we'll send a response asynchronously
  return true;
});

// Hide panel and update context menu when the page is unloaded
window.addEventListener('beforeunload', () => {
  if (infoPanel && infoPanel.style.display !== 'none') {
    // Update context menu visibility
    chrome.runtime.sendMessage({
      action: "updateContextMenu",
      show: false
    });
  }
});

console.log("Content script ready");

// Helper function to get language name from code
function getLanguageName(code) {
  const languages = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'no': 'Norwegian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'ko': 'Korean',
    'ar': 'Arabic',
    'hi': 'Hindi'
  };
  
  return languages[code] || 'English';
}

// Function to shorten title using AI
async function shortenTitle(title) {
  console.log("Shortening title:", title);
  
  // If title is short enough, don't process it
  if (title.length <= 60) {
    return title;
  }
  
  try {
    // Get the API key from storage
    const result = await new Promise((resolve) => {
      chrome.storage.sync.get(['geminiApiKey'], resolve);
    });
    
    const API_KEY = result.geminiApiKey;
    if (!API_KEY) {
      console.log("No API key available for title shortening");
      return title;
    }
    
    // Use Gemini API to create a shorter title
    const API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";
    
    const promptText = `Create a short, concise title (maximum 5-7 words) that captures the essence of this topic: "${title}". 
                Return ONLY the new title, with no additional text, quotes, or explanations.`;
    
    const requestData = {
      contents: [{
        parts: [{
          text: promptText
        }]
      }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 30
      }
    };
    
    console.log("Sending title shortening request to Gemini API");
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      console.error("Title shortening API error");
      return title; // Return original title on error
    }
    
    const data = await response.json();
    console.log("Received title shortening response");
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const shortTitle = data.candidates[0].content.parts[0].text.trim();
      
      // If we got a reasonable response, use it
      if (shortTitle && shortTitle.length > 0 && shortTitle.length < title.length) {
        console.log("Shortened title:", shortTitle);
        return shortTitle;
      }
    }
    
    // Fallback to original title
    return title;
    
  } catch (error) {
    console.error("Error shortening title:", error);
    return title; // Return original title on error
  }
}
