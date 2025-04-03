// Popup script for Quick Research Assistant

document.addEventListener('DOMContentLoaded', function() {
  console.log("Popup loaded");
  const saveButton = document.getElementById('save-api-key');
  const apiKeyInput = document.getElementById('api-key');
  const saveStatus = document.getElementById('save-status');
  
  // Google Search API elements
  const saveGoogleButton = document.getElementById('save-google-keys');
  const googleSearchApiKeyInput = document.getElementById('google-search-api-key');
  const googleSearchEngineIdInput = document.getElementById('google-search-engine-id');
  const googleSaveStatus = document.getElementById('google-save-status');
  
  // Theme toggle
  const themeToggle = document.getElementById('theme-toggle');
  
  // Load saved API keys and theme preference
  chrome.storage.sync.get(['geminiApiKey', 'googleSearchApiKey', 'googleSearchEngineId', 'theme'], function(result) {
    console.log("Loading settings from storage");
    if (result.geminiApiKey) {
      apiKeyInput.value = result.geminiApiKey;
    }
    if (result.googleSearchApiKey) {
      googleSearchApiKeyInput.value = result.googleSearchApiKey;
    }
    if (result.googleSearchEngineId) {
      googleSearchEngineIdInput.value = result.googleSearchEngineId;
    }
    
    // Apply saved theme or default to dark
    if (result.theme === 'light') {
      document.body.classList.add('light-theme');
      themeToggle.checked = true;
    }
  });
  
  // Save Gemini API key when button is clicked
  saveButton.addEventListener('click', function() {
    console.log("Save Gemini button clicked");
    const apiKey = apiKeyInput.value.trim();
    
    if (apiKey) {
      console.log("Saving Gemini API key:", apiKey.substring(0, 3) + "...");
      chrome.storage.sync.set({geminiApiKey: apiKey}, function() {
        console.log("Gemini API key saved successfully");
        saveStatus.style.display = 'block';
        saveStatus.textContent = "API key saved!";
        saveStatus.style.color = "#8f8";
        
        setTimeout(function() {
          saveStatus.style.display = 'none';
        }, 2000);
      });
    } else {
      console.log("No Gemini API key entered");
      saveStatus.style.display = 'block';
      saveStatus.textContent = "Please enter an API key!";
      saveStatus.style.color = "#ff8f8f";
      
      setTimeout(function() {
        saveStatus.style.display = 'none';
      }, 2000);
    }
  });
  
  // Save Google Search API settings when button is clicked
  saveGoogleButton.addEventListener('click', function() {
    console.log("Save Google Search button clicked");
    const googleApiKey = googleSearchApiKeyInput.value.trim();
    const searchEngineId = googleSearchEngineIdInput.value.trim();
    
    if (googleApiKey && searchEngineId) {
      console.log("Saving Google Search API settings");
      chrome.storage.sync.set({
        googleSearchApiKey: googleApiKey,
        googleSearchEngineId: searchEngineId
      }, function() {
        console.log("Google Search API settings saved successfully");
        googleSaveStatus.style.display = 'block';
        googleSaveStatus.textContent = "Search API settings saved!";
        googleSaveStatus.style.color = "#8f8";
        
        setTimeout(function() {
          googleSaveStatus.style.display = 'none';
        }, 2000);
      });
    } else {
      console.log("Missing Google Search API settings");
      googleSaveStatus.style.display = 'block';
      googleSaveStatus.textContent = "Please enter both API key and Engine ID!";
      googleSaveStatus.style.color = "#ff8f8f";
      
      setTimeout(function() {
        googleSaveStatus.style.display = 'none';
      }, 2000);
    }
  });
  
  // Handle theme toggle
  themeToggle.addEventListener('change', function() {
    if (this.checked) {
      document.body.classList.add('light-theme');
      chrome.storage.sync.set({theme: 'light'});
    } else {
      document.body.classList.remove('light-theme');
      chrome.storage.sync.set({theme: 'dark'});
    }
  });
  
  // Also allow saving by pressing Enter in the input fields
  apiKeyInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
      saveButton.click();
    }
  });
  
  googleSearchApiKeyInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && googleSearchEngineIdInput.value.trim()) {
      saveGoogleButton.click();
    } else if (event.key === 'Enter') {
      googleSearchEngineIdInput.focus();
    }
  });
  
  googleSearchEngineIdInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
      saveGoogleButton.click();
    }
  });
}); 