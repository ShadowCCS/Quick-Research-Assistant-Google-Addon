# Quick Research Assistant

A powerful Chrome extension that provides AI-powered information about any highlighted text without leaving your page.

## Features

- Research any text on any webpage with a simple right-click or keyboard shortcut
- AI-powered responses powered by Google's Gemini AI
- Optional image search integration
- Text-to-speech functionality
- Save research as PDF or copy to clipboard
- Dark and light theme options
- Multiple language support

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top-right corner)
4. Click "Load unpacked" and select the folder containing the extension files
5. The Quick Research Assistant extension should now appear in your extensions list

## API Setup Requirements

This extension requires API keys to function properly:

### Google Gemini API (Required)

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click on "Get API key" or "Create API key"
4. Copy your API key
5. Open the extension's popup by clicking on its icon in the Chrome toolbar
6. Paste your API key in the "Enter your Gemini API key" field and click "Save API Key"

### Google Custom Search API (Optional, for image results)

#### Step 1: Get a Google Custom Search API Key

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Navigate to "APIs & Services" > "Library"
4. Search for "Custom Search API" and enable it
5. Go to "APIs & Services" > "Credentials"
6. Click "Create credentials" > "API key"
7. Copy your API key
8. Open the extension's popup and paste it in the "Google Custom Search API Key" field

#### Step 2: Create a Custom Search Engine ID

1. Visit [Google Programmable Search Engine](https://programmablesearchengine.google.com/create/new)
2. Enter a name for your search engine
3. Under "What to search", select "Search the entire web"
4. Click "Create"
5. On the next page, click "Control Panel" for your new search engine
6. Find your Search Engine ID (it will look like "123456789:abcdefghijk")
7. Copy this ID
8. Open the extension's popup and paste it in the "Custom Search Engine ID" field and click "Save Search Keys"

## Usage

1. Highlight any text on a webpage
2. Right-click and select "Research: [text]" from the context menu
3. View the information in the popup panel

### Keyboard Shortcuts

- `Alt+Shift+R` (Windows/Linux) or `Option+Shift+R` (Mac): Research selected text
- `Alt+Shift+Q` (Windows/Linux) or `Option+Shift+Q` (Mac): Quick research selected text
- `Alt+Shift+S` (Windows/Linux) or `Option+Shift+S` (Mac): Save current research

## Additional Features

- **Theme Toggle**: Switch between dark and light themes
- **Text-to-Speech**: Listen to research results being read aloud
- **Multiple Languages**: Change the language of research results
- **Download Options**: Save research as PDF or copy to clipboard

## Privacy

Your API keys are stored locally in your browser's storage and are only used to make API calls to the respective services. This extension does not collect or share your personal data.

## Development

This extension is built using vanilla JavaScript, HTML, and CSS. It uses:

- Google's Gemini AI API for generating research content
- Google Custom Search API for image results (optional)
- Chrome Extension APIs for browser integration
- Marked.js for rendering Markdown content

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Version

Current version: 1.2 
