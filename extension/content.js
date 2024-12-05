/**
 * @fileoverview Adds "My Folders" functionality with data persistence to the ChatGPT interface.
 * Supports both light and dark modes.
 * @version 1.4.0
 */
(() => {
    'use strict';
  
    // Constants
    const LOCAL_STORAGE_KEY = 'myFoldersData';
  
    // Utility Functions
  
    /**
     * Save folders data to localStorage.
     * @param {Array} data - The folders data to save.
     */
    const saveFoldersData = (data) => {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      } catch (error) {
        console.error('Failed to save folders data:', error);
      }
    };
  
    /**
     * Load folders data from localStorage.
     * @returns {Array} The loaded folders data.
     */
    const loadFoldersData = () => {
      try {
        const data = localStorage.getItem(LOCAL_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
      } catch (error) {
        console.error('Failed to load folders data:', error);
        return [];
      }
    };
  
    /**
     * Sanitize a string to prevent XSS attacks.
     * @param {string} str - The string to sanitize.
     * @returns {string} The sanitized string.
     */
    const sanitizeString = (str) => {
      const tempDiv = document.createElement('div');
      tempDiv.textContent = str;
      return tempDiv.innerHTML;
    };
  
    /**
     * Create an element with optional attributes and event listeners.
     * @param {string} tag - The tag name of the element.
     * @param {Object} [options] - The options for the element.
     * @returns {HTMLElement} The created element.
     */
    const createElement = (tag, options = {}) => {
      const element = document.createElement(tag);
  
      // Set attributes
      if (options.attributes) {
        for (const [key, value] of Object.entries(options.attributes)) {
          element.setAttribute(key, value);
        }
      }
  
      // Set styles
      if (options.styles) {
        Object.assign(element.style, options.styles);
      }
  
      // Set properties
      if (options.properties) {
        for (const [key, value] of Object.entries(options.properties)) {
          element[key] = value;
        }
      }
  
      // Add event listeners
      if (options.events) {
        for (const [eventType, listener] of Object.entries(options.events)) {
          element.addEventListener(eventType, listener);
        }
      }
  
      return element;
    };
  
    /**
     * Get the current theme ('light' or 'dark').
     * @returns {string} The current theme.
     */
    const getTheme = () => {
      const bodyStyles = getComputedStyle(document.body);
      const backgroundColor = bodyStyles.backgroundColor;
  
      if (backgroundColor) {
        const rgb = backgroundColor.match(/\d+/g);
        if (rgb && rgb.length >= 3) {
          const [r, g, b] = rgb.map(Number);
          // Calculate luminance
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
          return luminance < 128 ? 'dark' : 'light';
        }
      }
      return 'light'; // default to light
    };
  
    /**
     * Initialize the "My Folders" functionality.
     */
    const initMyFolders = () => {
      // Check if "My Folders" header already exists
      if (document.getElementById('my-folders-header')) {
        console.log('"My Folders" already added.');
        return;
      }
  
      // Find the "Explore GPTs" button
      const exploreGPTs = Array.from(document.querySelectorAll('button')).find(
        (button) => button.textContent.trim() === 'Explore GPTs'
      );
  
      if (!exploreGPTs) {
        console.error('"Explore GPTs" button not found.');
        return;
      }
  
      // Determine the current theme
      const theme = getTheme();
  
      // Set colors based on theme
      const colors = {
        dark: {
          backgroundColor: '#000',
          textColor: '#fff',
          borderColor: '#444',
          hoverBackgroundColor: '#333',
          hoverTextColor: '#f5f5f5',
          folderContentBackground: '#000',
          folderItemBackground: '#222',
          folderItemBorderColor: '#333',
          deleteButtonHoverColor: 'red',
        },
        light: {
          backgroundColor: '#fff',
          textColor: '#000',
          borderColor: '#ccc',
          hoverBackgroundColor: '#eaeaea',
          hoverTextColor: '#333',
          folderContentBackground: '#fff',
          folderItemBackground: '#f5f5f5',
          folderItemBorderColor: '#ddd',
          deleteButtonHoverColor: 'red',
        },
      };
  
      const themeColors = colors[theme];
  
    // Create the "My Folders" header
    const myFoldersHeader = createElement('button', {
        attributes: { id: 'my-folders-header' },
        styles: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '10px',
        background: 'transparent',
        border: 'none',
        color: 'inherit',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'normal',
        fontFamily: getComputedStyle(exploreGPTs).fontFamily,
        transition: 'background 0.2s, color 0.2s',
        borderRadius: '7px', // Added to create rounded corners
        },
    });
  
      // Folder icon and text container
      const folderIconContainer = createElement('div', {
        styles: {
          display: 'flex',
          alignItems: 'center',
          borderRadius: '7px', // Added to create rounded corners
        },
      });
  
      // Folder icon
      const folderIcon = createElement('span', {
        properties: { textContent: '📁' },
        styles: { marginRight: '15px', borderRadius: '7px' }, // Added to create rounded corners
      });
  
      // "My Folders" text
      const folderText = createElement('span', {
        properties: { textContent: 'My Folders' },
        styles: {
          fontWeight: 'normal',
          fontFamily: getComputedStyle(exploreGPTs).fontFamily,
          fontSize: getComputedStyle(exploreGPTs).fontSize,
          borderRadius: '7px', // Added to create rounded corners
        },
      });
  
      folderIconContainer.appendChild(folderIcon);
      folderIconContainer.appendChild(folderText);
  
      // "+" button to create folders
      const createFolderButton = createElement('button', {
        properties: { textContent: '+' },
        styles: {
          background: 'transparent',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          fontSize: '20px',
          fontWeight: 'bold',
          borderRadius: '7px', // Added to create rounded corners
          transition: 'opacity 0.2s, color 0.2s',
        },
        events: {
          mouseover: () => {
            createFolderButton.style.color = '#00aaff'; // Blue color
          },
          mouseout: () => {
            createFolderButton.style.color = 'inherit';
          },
          click: (event) => {
            event.stopPropagation();
            const folderName = prompt('Enter folder name:');
            if (folderName) {
              const sanitizedFolderName = sanitizeString(folderName.trim());
              if (sanitizedFolderName) {
                // Check for duplicate folder name
                if (foldersData.some(folder => folder.name === sanitizedFolderName)) {
                  alert(`A folder named "${sanitizedFolderName}" already exists.`);
                  return;
                }
  
                createFolder(sanitizedFolderName);
                foldersData.push({ name: sanitizedFolderName, chats: [] });
                saveFoldersData(foldersData);
                foldersContainer.style.display = 'block';
                // Update folder icon to expanded
                folderIcon.textContent = '📂';
              } else {
                alert('Invalid folder name.');
              }
            }
          },
        },
      });
  
      myFoldersHeader.appendChild(folderIconContainer);
      myFoldersHeader.appendChild(createFolderButton);
  
      // Container for folders
      const foldersContainer = createElement('div', {
        styles: { display: 'none', borderRadius: '7px' }, // Added to create rounded corners
      });
  
      // Toggle foldersContainer visibility when header is clicked
      myFoldersHeader.addEventListener('click', (event) => {
        if (event.target !== createFolderButton) {
          foldersContainer.style.display =
            foldersContainer.style.display === 'none' ? 'block' : 'none';
          // Update folder icon based on foldersContainer display
          folderIcon.textContent =
            foldersContainer.style.display === 'none' ? '📁' : '📂';
        }
      });
  
      // Hover effect for the entire "My Folders" header
      myFoldersHeader.addEventListener('mouseover', () => {
        // Show the "+" button
        createFolderButton.style.opacity = '1';
        // Apply hover effect to the entire header
        myFoldersHeader.style.background = themeColors.hoverBackgroundColor;
        myFoldersHeader.style.color = themeColors.hoverTextColor;
      });
  
      myFoldersHeader.addEventListener('mouseout', () => {
        // Hide the "+" button
        createFolderButton.style.opacity = '0';
        // Remove hover effect from the header
        myFoldersHeader.style.background = 'transparent';
        myFoldersHeader.style.color = 'inherit';
      });
  
      // Load folders from localStorage
      let foldersData = loadFoldersData();
  
      /**
       * Create a new folder element.
       * @param {string} folderName - The name of the folder.
       * @param {Array} folderChats - The list of chats in the folder.
       */
      const createFolder = (folderName, folderChats = []) => {
        let currentFolderName = folderName;
  
        // Create the folder container
        const folderContainer = createElement('div', {
          styles: { marginBottom: '5px', borderRadius: '7px' }, // Added to create rounded corners
        });
  
        // Create header container
        const headerContainer = createElement('div', {
          styles: {
            display: 'flex',
            alignItems: 'center',
            border: `1px solid ${themeColors.borderColor}`,
            borderRadius: '7px', // Added to create rounded corners
          },
        });
  
        // Folder icon (changing icon for expanded/contracted)
        const folderIconSpan = createElement('span', {
          properties: { textContent: '📁' }, // Default to contracted folder icon
          styles: {
            marginRight: '10px',
            fontSize: '16px',
          },
        });
  
        // Folder name text
        const folderNameSpan = createElement('span', {
          properties: { textContent: currentFolderName },
          styles: {
            flexGrow: '1',
          },
        });
  
        // Folder button (container for icon and name)
        const folderButton = createElement('button', {
          styles: {
            display: 'flex',
            alignItems: 'center',
            flexGrow: '1',
            padding: '10px',
            background: themeColors.backgroundColor,
            color: themeColors.textColor,
            border: 'none',
            borderRadius: '7px 0 0 7px', // Added to create rounded corners
            cursor: 'pointer',
            textAlign: 'left',
            fontWeight: 'bold',
            fontSize: '14px',
            transition: 'background 0.2s, color 0.2s',
          },
          events: {
            mouseover: () => {
              folderButton.style.background = themeColors.hoverBackgroundColor;
              folderButton.style.color = themeColors.hoverTextColor;
            },
            mouseout: () => {
              folderButton.style.background = themeColors.backgroundColor;
              folderButton.style.color = themeColors.textColor;
            },
            click: () => {
              folderContent.style.display =
                folderContent.style.display === 'none' ? 'block' : 'none';
              // Update folder icon based on folderContent display
              folderIconSpan.textContent =
                folderContent.style.display === 'none' ? '📁' : '📂';
            },
            dblclick: (event) => {
              event.stopPropagation();
              const newName = prompt('Enter new folder name:', currentFolderName);
              if (newName) {
                const sanitizedNewName = sanitizeString(newName.trim());
                if (sanitizedNewName) {
                  // Check for duplicate folder name
                  if (foldersData.some(folder => folder.name === sanitizedNewName)) {
                    alert(`A folder named "${sanitizedNewName}" already exists.`);
                    return;
                  }
  
                  folderNameSpan.textContent = sanitizedNewName;
                  const folderIndex = foldersData.findIndex(
                    (folder) => folder.name === currentFolderName
                  );
                  if (folderIndex !== -1) {
                    foldersData[folderIndex].name = sanitizedNewName;
                    saveFoldersData(foldersData);
                  }
                  currentFolderName = sanitizedNewName;
                } else {
                  alert('Invalid folder name.');
                }
              }
            },
          },
        });
  
        // Append icon and name to folderButton
        folderButton.appendChild(folderIconSpan);
        folderButton.appendChild(folderNameSpan);
  
        // "+" button to add chats
        const addChatButton = createElement('button', {
          properties: { textContent: '+' },
          styles: {
            padding: '10px',
            background: themeColors.backgroundColor,
            color: themeColors.textColor,
            border: 'none',
            borderLeft: `1px solid ${themeColors.borderColor}`,
            borderRadius: '0 7px 7px 0', // Added to create rounded corners
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'color 0.2s',
          },
          events: {
            mouseover: () => {
              addChatButton.style.color = '#00aaff'; // Blue color
            },
            mouseout: () => {
              addChatButton.style.color = themeColors.textColor;
            },
            click: () => {
              const chatName = document.title || 'Unnamed Chat';
              const chatHref = window.location.href;
  
              // Sanitize chat name
              const sanitizedChatName = sanitizeString(chatName.trim());
              const sanitizedChatHref = chatHref;
  
              // Check for duplicates
              if (
                folderChats.some(
                  (chat) =>
                    chat.name === sanitizedChatName && chat.href === sanitizedChatHref
                )
              ) {
                alert(`Chat "${sanitizedChatName}" is already in the folder.`);
                return;
              }
  
              // Add chat to folder
              addChatToFolder(
                sanitizedChatName,
                sanitizedChatHref,
                folderContent,
                folderChats,
                currentFolderName
              );
  
              // Update foldersData
              const folderIndex = foldersData.findIndex(
                (folder) => folder.name === currentFolderName
              );
              if (folderIndex !== -1) {
                foldersData[folderIndex].chats.push({
                  name: sanitizedChatName,
                  href: sanitizedChatHref,
                });
                saveFoldersData(foldersData);
              } else {
                foldersData.push({
                  name: currentFolderName,
                  chats: [{ name: sanitizedChatName, href: sanitizedChatHref }],
                });
                saveFoldersData(foldersData);
              }
  
              // Show folder content (your change from 'none' to 'block')
              folderContent.style.display = 'block';
  
              // Update folder icon to expanded
              folderIconSpan.textContent = '📂';
            },
          },
        });
  
        // Delete folder button
        const deleteButton = createElement('button', {
          properties: { textContent: '×' },
          styles: {
            padding: '10px',
            background: themeColors.backgroundColor,
            color: themeColors.textColor,
            border: 'none',
            borderLeft: `1px solid ${themeColors.borderColor}`,
            borderRadius: '0 7px 7px 0', // Added to create rounded corners
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'color 0.2s',
          },
          events: {
            mouseover: () => {
              deleteButton.style.color = themeColors.deleteButtonHoverColor;
            },
            mouseout: () => {
              deleteButton.style.color = themeColors.textColor;
            },
            click: () => {
              if (
                confirm(`Are you sure you want to delete the folder "${currentFolderName}"?`)
              ) {
                foldersContainer.removeChild(folderContainer);
                foldersData = foldersData.filter(
                  (folder) => folder.name !== currentFolderName
                );
                saveFoldersData(foldersData);
              }
            },
          },
        });
  
        // Folder content container
        const folderContent = createElement('div', {
          styles: {
            display: 'none',
            padding: '10px',
            background: themeColors.folderContentBackground,
            border: `1px solid ${themeColors.borderColor}`,
            borderRadius: '7px', // Added to create rounded corners
          },
        });
  
        // Load existing chats
        folderChats.forEach((chat) => {
          addChatToFolder(
            chat.name,
            chat.href,
            folderContent,
            folderChats,
            currentFolderName
          );
        });
  
        // Set initial folder icon based on content display
        folderIconSpan.textContent =
          folderContent.style.display === 'none' ? '📁' : '📂';
  
        // Assemble folder header
        const buttonContainer = createElement('div', {
          styles: { display: 'flex', borderRadius: '7px' }, // Added to create rounded corners
        });
  
        buttonContainer.appendChild(addChatButton);
        buttonContainer.appendChild(deleteButton);
  
        headerContainer.appendChild(folderButton);
        headerContainer.appendChild(buttonContainer);
  
        // Assemble folder
        folderContainer.appendChild(headerContainer);
        folderContainer.appendChild(folderContent);
  
        // Add folder to container
        foldersContainer.appendChild(folderContainer);
      };
  
      /**
       * Add a chat to a folder.
       * @param {string} chatName - The name of the chat.
       * @param {string} chatHref - The URL of the chat.
       * @param {HTMLElement} folderContent - The folder content container.
       * @param {Array} folderChats - The array of chats in the folder.
       * @param {string} currentFolderName - The name of the current folder.
       */
      const addChatToFolder = (
        chatName,
        chatHref,
        folderContent,
        folderChats,
        currentFolderName
      ) => {
        const chatItem = createElement('div', {
          styles: {
            display: 'flex',
            alignItems: 'center',
            marginBottom: '5px',
            padding: '10px',
            border: `1px solid ${themeColors.folderItemBorderColor}`,
            borderRadius: '7px', // Added to create rounded corners
            background: themeColors.folderItemBackground,
            color: themeColors.textColor,
          },
        });
  
        const chatLink = createElement('a', {
          properties: {
            href: chatHref,
            textContent: chatName,
            target: '_blank',
            rel: 'noopener noreferrer',
          },
          styles: {
            color: 'inherit',
            textDecoration: 'none',
            flexGrow: '1',
            borderRadius: '7px', // Added to create rounded corners
          },
        });
  
        const deleteChatButton = createElement('button', {
          properties: { textContent: '×' },
          styles: {
            marginLeft: '10px',
            background: 'none',
            border: 'none',
            color: themeColors.textColor,
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'color 0.2s',
            borderRadius: '7px', // Added to create rounded corners
          },
          events: {
            mouseover: () => {
              deleteChatButton.style.color = themeColors.deleteButtonHoverColor;
            },
            mouseout: () => {
              deleteChatButton.style.color = themeColors.textColor;
            },
            click: () => {
              folderContent.removeChild(chatItem);
              const folderIndex = foldersData.findIndex(
                (folder) => folder.name === currentFolderName
              );
              if (folderIndex !== -1) {
                foldersData[folderIndex].chats = foldersData[folderIndex].chats.filter(
                  (chat) => chat.name !== chatName
                );
                saveFoldersData(foldersData);
              }
            },
          },
        });
  
        chatItem.appendChild(chatLink);
        chatItem.appendChild(deleteChatButton);
        folderContent.appendChild(chatItem);
  
        folderChats.push({ name: chatName, href: chatHref });
      };
  
      // Load existing folders
      foldersData.forEach((folder) => {
        createFolder(folder.name, folder.chats);
      });
  
      // Insert "My Folders" into the DOM
      exploreGPTs.parentElement.insertAdjacentElement('afterend', myFoldersHeader);
      myFoldersHeader.insertAdjacentElement('afterend', foldersContainer);
    };
  
    // Observe the DOM for changes to ensure the "Explore GPTs" button is loaded
    const observer = new MutationObserver((mutationsList, observer) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
          const exploreGPTs = Array.from(document.querySelectorAll('button')).find(
            (button) => button.textContent.trim() === 'Explore GPTs'
          );
          if (exploreGPTs) {
            initMyFolders();
            observer.disconnect();
            break;
          }
        }
      }
    });
  
    observer.observe(document.body, { childList: true, subtree: true });
  })();