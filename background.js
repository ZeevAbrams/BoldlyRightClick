// background.js
chrome.runtime.onInstalled.addListener(() => {
    // Create parent menu item
    chrome.contextMenus.create({
      id: "boldlyRightClick",
      title: "Boldly Right Click",
      contexts: ["selection"]
    });
  
    // Create submenu items
    chrome.contextMenus.create({
      id: "boldText",
      parentId: "boldlyRightClick",
      title: "Bold",
      contexts: ["selection"]
    });
  
    chrome.contextMenus.create({
      id: "italicText",
      parentId: "boldlyRightClick",
      title: "Italics",
      contexts: ["selection"]
    });
  
    chrome.contextMenus.create({
      id: "boldItalicText",
      parentId: "boldlyRightClick",
      title: "Bold+Italics",
      contexts: ["selection"]
    });
    
    // Add new option to convert back to plain text
    chrome.contextMenus.create({
      id: "plainText",
      parentId: "boldlyRightClick",
      title: "Convert to Plain Text",
      contexts: ["selection"]
    });
  });
  
  // Handle context menu clicks
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    // Process the text selection first to handle any spaces
    let selectedText = info.selectionText;
    let textToConvert = selectedText;
    let trailingSpaces = '';
    
    // Extract trailing spaces and store them
    while (textToConvert.endsWith(' ')) {
      trailingSpaces += ' ';
      textToConvert = textToConvert.slice(0, -1);
    }
    
    // Process the text without trailing spaces
    let formattedText = '';
    if (info.menuItemId === "boldText") {
      formattedText = convertToBold(textToConvert);
    } else if (info.menuItemId === "italicText") {
      formattedText = convertToItalic(textToConvert);
    } else if (info.menuItemId === "boldItalicText") {
      formattedText = convertToBoldItalic(textToConvert);
    } else if (info.menuItemId === "plainText") {
      formattedText = convertToPlainText(textToConvert);
    }
    
    // Add back the trailing spaces
    formattedText += trailingSpaces;
    
    // Execute script to replace the selected text
    if (formattedText) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: replaceSelectedText,
        args: [formattedText]
      });
    }
  });
  
  // Text conversion functions using Unicode mathematical alphanumeric symbols
  function convertToBold(text) {
    return text.split('').map(char => {
      if (/[a-z]/.test(char)) {
        return String.fromCodePoint(char.charCodeAt(0) - 97 + 0x1D41A);
      } else if (/[A-Z]/.test(char)) {
        return String.fromCodePoint(char.charCodeAt(0) - 65 + 0x1D400);
      } else if (/[0-9]/.test(char)) {
        return String.fromCodePoint(char.charCodeAt(0) - 48 + 0x1D7CE);
      }
      return char;
    }).join('');
  }
  
  function convertToItalic(text) {
    return text.split('').map(char => {
      // Special case for lowercase 'h' - use italic from different Unicode block
      if (char === 'h') {
        // Use Planck constant unicode character which looks like an italic h
        return 'ℎ'; // U+210E PLANCK CONSTANT
      } else if (/[a-z]/.test(char)) {
        return String.fromCodePoint(char.charCodeAt(0) - 97 + 0x1D44E);
      } else if (/[A-Z]/.test(char)) {
        return String.fromCodePoint(char.charCodeAt(0) - 65 + 0x1D434);
      }
      return char;
    }).join('');
  }
  
  function convertToBoldItalic(text) {
    return text.split('').map(char => {
      if (/[a-z]/.test(char)) {
        return String.fromCodePoint(char.charCodeAt(0) - 97 + 0x1D482);
      } else if (/[A-Z]/.test(char)) {
        return String.fromCodePoint(char.charCodeAt(0) - 65 + 0x1D468);
      }
      return char;
    }).join('');
  }
  
  // Function to convert formatted text back to plain text
  function convertToPlainText(text) {
    // Create a mapping of all special characters to their plain text equivalents
    const charMap = new Map();
    
    // Add bold lowercase mappings
    for (let i = 0; i < 26; i++) {
      const plain = String.fromCharCode(97 + i); // a-z
      const bold = String.fromCodePoint(0x1D41A + i); // 𝐚-𝐳
      charMap.set(bold, plain);
    }
    
    // Add bold uppercase mappings
    for (let i = 0; i < 26; i++) {
      const plain = String.fromCharCode(65 + i); // A-Z
      const bold = String.fromCodePoint(0x1D400 + i); // 𝐀-𝐙
      charMap.set(bold, plain);
    }
    
    // Add italic lowercase mappings
    for (let i = 0; i < 26; i++) {
      const plain = String.fromCharCode(97 + i); // a-z
      // Skip 'h' as we're using a special character for it
      if (plain !== 'h') {
        const italic = String.fromCodePoint(0x1D44E + i); // 𝑎-𝑧
        charMap.set(italic, plain);
      }
    }
    
    // Add special case for italic 'h' (Planck constant)
    charMap.set('ℎ', 'h');
    
    // Add italic uppercase mappings
    for (let i = 0; i < 26; i++) {
      const plain = String.fromCharCode(65 + i); // A-Z
      const italic = String.fromCodePoint(0x1D434 + i); // 𝐴-𝑍
      charMap.set(italic, plain);
    }
    
    // Add bold-italic lowercase mappings
    for (let i = 0; i < 26; i++) {
      const plain = String.fromCharCode(97 + i); // a-z
      const boldItalic = String.fromCodePoint(0x1D482 + i); // 𝒂-𝒛
      charMap.set(boldItalic, plain);
    }
    
    // Add bold-italic uppercase mappings
    for (let i = 0; i < 26; i++) {
      const plain = String.fromCharCode(65 + i); // A-Z
      const boldItalic = String.fromCodePoint(0x1D468 + i); // 𝑨-𝒁
      charMap.set(boldItalic, plain);
    }
    
    // Add bold number mappings
    for (let i = 0; i < 10; i++) {
      const plain = String.fromCharCode(48 + i); // 0-9
      const bold = String.fromCodePoint(0x1D7CE + i); // 𝟎-𝟗
      charMap.set(bold, plain);
    }
    
    // Convert the text character by character
    let result = '';
    for (const char of text) {
      // If the character is in our map, use the plain version, otherwise keep it as is
      result += charMap.has(char) ? charMap.get(char) : char;
    }
    
    return result;
  }
  
  // Function to be injected into the page to replace selected text
  function replaceSelectedText(newText) {
    const activeElement = document.activeElement;
    const selection = window.getSelection();
    
    if (activeElement && (activeElement.isContentEditable || 
        activeElement.tagName === 'TEXTAREA' || 
        activeElement.tagName === 'INPUT')) {
      
      // For input fields and textareas
      if (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT') {
        const start = activeElement.selectionStart;
        const end = activeElement.selectionEnd;
        const text = activeElement.value;
        
        activeElement.value = text.substring(0, start) + newText + text.substring(end);
        activeElement.selectionStart = start;
        activeElement.selectionEnd = start + newText.length;
        activeElement.focus();
      } 
      // For contentEditable elements
      else if (activeElement.isContentEditable) {
        document.execCommand('insertText', false, newText);
      }
    } 
    // For general webpage text
    else if (selection && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(newText));
    }
  }