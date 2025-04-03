chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "researchHighlightedText",
    title: "Research: %s",
    contexts: ["selection"]
  });
  
  // Add the new Quick Research option
  chrome.contextMenus.create({
    id: "quickResearchHighlightedText",
    title: "Quick Research: %s",
    contexts: ["selection"]
  });

  // Add Save Research option
  chrome.contextMenus.create({
    id: "saveResearchResults",
    title: "Save Research as Text",
    contexts: ["all"],
    documentUrlPatterns: ["chrome-extension://*/*"],
    visible: false
  });
  
  console.log("Context menus created");
  
  // Show a notification about setting up the API key
  chrome.tabs.create({
    url: "popup.html"
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "researchHighlightedText" && tab && tab.id) {
    console.log("Context menu clicked with text:", info.selectionText);
    
    // Inject the content script if not already present
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    }).then(() => {
      // Small delay to ensure the script is loaded before messaging
      setTimeout(() => {
        chrome.tabs.sendMessage(tab.id, {
          action: "showInfoPanel",
          text: info.selectionText
        }).catch(error => {
          console.error("Error sending message:", error);
        });
      }, 100);
    }).catch(error => {
      console.error("Error injecting content script:", error);
    });
  }
  else if (info.menuItemId === "quickResearchHighlightedText" && tab && tab.id) {
    console.log("Quick Research context menu clicked with text:", info.selectionText);
    
    // Inject the content script if not already present
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    }).then(() => {
      // Small delay to ensure the script is loaded before messaging
      setTimeout(() => {
        chrome.tabs.sendMessage(tab.id, {
          action: "showQuickInfoPanel",
          text: info.selectionText
        }).catch(error => {
          console.error("Error sending message:", error);
        });
      }, 100);
    }).catch(error => {
      console.error("Error injecting content script:", error);
    });
  }
  else if (info.menuItemId === "saveResearchResults" && tab && tab.id) {
    console.log("Save Research Results clicked");
    chrome.tabs.sendMessage(tab.id, {
      action: "saveResearchResults"
    }).catch(error => {
      console.error("Error sending message:", error);
    });
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "injectMarkedJs" && sender.tab) {
    console.log("Received request to inject marked.js into tab:", sender.tab.id);
    
    // Inject marked.js directly
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      files: ['marked.js']
    }).then(() => {
      console.log("Successfully injected marked.js");
      sendResponse({ success: true });
    }).catch(error => {
      console.error("Error injecting marked.js:", error);
      sendResponse({ success: false, error: error.message });
    });
    
    // Return true to indicate we will send a response asynchronously
    return true;
  }
  else if (request.action === "updateContextMenu" && request.show) {
    // Show or hide the save menu based on the panel visibility
    chrome.contextMenus.update("saveResearchResults", {
      visible: request.show
    });
  }
  else if (request.action === "downloadTextFile" && request.content && request.fileName) {
    // Create a downloadable text file
    console.log("Creating downloadable file:", request.fileName);
    
    // Convert to Blob and create URL
    const blob = new Blob([request.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Create and click a temporary download link
    chrome.downloads.download({
      url: url,
      filename: request.fileName,
      saveAs: true
    });
    
    sendResponse({ success: true });
  }
  else if (request.action === "triggerPrintAsPdf") {
    // Handle PDF printing request from content script
    console.log("Triggering PDF print for:", request.pdfTitle);
    
    // Get the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (!tabs || tabs.length === 0) {
        sendResponse({ success: false, error: "No active tab found" });
        return;
      }
      
      try {
        // Execute script to trigger print dialog with PDF settings
        await chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: () => {
            // Configure print settings for PDF
            const printSettings = {
              printBackground: true,
              preferCSSPageSize: true
            };
            
            // Open print dialog with focus on Save as PDF
            window.print();
          }
        });
        
        sendResponse({ success: true });
      } catch (error) {
        console.error("Error triggering print dialog:", error);
        sendResponse({ success: false, error: error.message });
      }
    });
    
    // Return true to indicate we'll send a response asynchronously
    return true;
  }
});

// Listen for keyboard commands
chrome.commands.onCommand.addListener(async (command) => {
  console.log(`Command received: ${command}`);
  
  try {
    // Get the active tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs || tabs.length === 0) {
      console.error("No active tab found");
      return;
    }
    
    const activeTab = tabs[0];
    
    if (command === "research-selection" || command === "quick-research-selection") {
      // Get selected text
      const result = await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: () => window.getSelection().toString()
      });
      
      // Check if we got a valid selection
      const selectedText = result[0]?.result;
      if (!selectedText || selectedText.trim() === '') {
        console.log("No text selected");
        
        // Show a notification explaining that text needs to be selected
        chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          func: () => {
            // Create and show notification
            const notification = document.createElement('div');
            notification.textContent = 'Please select text first to use Research Assistant';
            notification.style.position = 'fixed';
            notification.style.top = '10px';
            notification.style.left = '50%';
            notification.style.transform = 'translateX(-50%)';
            notification.style.padding = '10px 15px';
            notification.style.backgroundColor = '#333';
            notification.style.color = 'white';
            notification.style.borderRadius = '4px';
            notification.style.zIndex = '999999';
            notification.style.fontSize = '14px';
            notification.style.fontFamily = 'Arial, sans-serif';
            notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
            document.body.appendChild(notification);
            
            // Remove after 3 seconds
            setTimeout(() => {
              if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
              }
            }, 3000);
          }
        });
        return;
      }
      
      console.log(`Selected text: ${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}`);
      
      // Inject the content script if not already present
      await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        files: ['content.js']
      });
      
      // Small delay to ensure the script is loaded before messaging
      setTimeout(() => {
        chrome.tabs.sendMessage(activeTab.id, {
          action: command === "research-selection" ? "showInfoPanel" : "showQuickInfoPanel",
          text: selectedText
        }).catch(error => {
          console.error("Error sending message:", error);
        });
      }, 100);
    }
    else if (command === "save-research") {
      // Send message to save current research
      chrome.tabs.sendMessage(activeTab.id, {
        action: "saveResearchResults"
      }).catch(error => {
        console.error("Error sending save message:", error);
      });
    }
  } catch (error) {
    console.error("Error handling command:", error);
  }
});
