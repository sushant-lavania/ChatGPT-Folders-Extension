/**
 * @fileoverview Adds "My Folders" functionality with data persistence to the ChatGPT interface.
 * Supports both light and dark modes.
 * @version 1.9.0
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
  
      // "+" button to create folders (initially hidden)
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
          opacity: '0', // Ensure the button is initially hidden
          transition: 'opacity 0.2s, color 0.2s, font-size 0.2s',
          marginLeft: '10px', // Added space between buttons
          display: 'flex',
          alignItems: 'center',
        },
        events: {
          mouseover: () => {
            createFolderButton.style.color = '#00aaff'; // Blue color
            createFolderButton.style.fontSize = '21px'; // Slightly increase size on hover
          },
          mouseout: () => {
            createFolderButton.style.color = 'inherit';
            createFolderButton.style.fontSize = '20px'; // Reset size
          },
          click: (event) => {
            event.stopPropagation();
            const folderName = prompt('Enter folder name:');
            if (folderName) {
              const sanitizedFolderName = sanitizeString(folderName.trim());
              if (sanitizedFolderName) {
                // Check for duplicate folder name
                if (foldersData.some((folder) => folder.name === sanitizedFolderName)) {
                  alert(`A folder named "${sanitizedFolderName}" already exists.`);
                  return;
                }
  
                foldersData.push({ name: sanitizedFolderName, chats: [], pinned: false });
                saveFoldersData(foldersData);
                foldersContainer.style.display = 'block';
                // Update folder icon to expanded
                folderIcon.textContent = '📂';
                // Re-render folders
                renderFolders();
              } else {
                alert('Invalid folder name.');
              }
            }
          },
        },
      });
  
      // Options button (ellipsis), initially hidden
      const optionsButton = createElement('button', {
        properties: { textContent: '…' },
        styles: {
          background: 'transparent',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          fontSize: '20px',
          fontWeight: 'bold',
          borderRadius: '7px',
          opacity: '0', // Ensure the button is initially hidden
          transition: 'opacity 0.2s, color 0.2s, font-size 0.2s',
          marginLeft: '10px', // Added space between buttons
          marginTop: '2px', // Adjusted to align with "+"
          display: 'flex',
          alignItems: 'center',
        },
        events: {
          mouseover: () => {
            optionsButton.style.color = '#00aaff'; // Blue color
            optionsButton.style.fontSize = '21px'; // Slightly increase size on hover
          },
          mouseout: () => {
            optionsButton.style.color = 'inherit';
            optionsButton.style.fontSize = '20px'; // Reset size
          },
          click: (event) => {
            event.stopPropagation();
            // Toggle options menu
            if (optionsMenu.style.display === 'block') {
              optionsMenu.style.display = 'none';
            } else {
              optionsMenu.style.display = 'block';
              // Position optionsMenu relative to optionsButton
              const rect = optionsButton.getBoundingClientRect();
              optionsMenu.style.top = `${rect.bottom + window.scrollY}px`;
              optionsMenu.style.left = `${rect.left + window.scrollX - optionsMenu.offsetWidth + optionsButton.offsetWidth}px`;
            }
          },
        },
      });
  
      // Options menu
      const optionsMenu = createElement('div', {
        styles: {
          display: 'none',
          position: 'absolute',
          background: themeColors.backgroundColor,
          color: themeColors.textColor,
          border: `1px solid ${themeColors.borderColor}`,
          borderRadius: '5px',
          padding: '5px',
          zIndex: 1000,
        },
      });
  
      // Helper function to create menu items
      const createMenuItem = (text, onClick) => {
        const item = createElement('div', {
          properties: { textContent: text },
          styles: {
            padding: '5px 10px',
            cursor: 'pointer',
          },
          events: {
            click: (event) => {
              event.stopPropagation();
              onClick();
              optionsMenu.style.display = 'none';
            },
            mouseover: () => {
              item.style.background = themeColors.hoverBackgroundColor;
              item.style.color = themeColors.hoverTextColor;
            },
            mouseout: () => {
              item.style.background = themeColors.backgroundColor;
              item.style.color = themeColors.textColor;
            },
          },
        });
        return item;
      };
  
      // Import user data
      const importItem = createMenuItem('📥 Import User Data', () => {
        const fileInput = createElement('input', {
          attributes: { type: 'file', accept: '.json' },
          styles: { display: 'none' },
        });
        fileInput.addEventListener('change', () => {
          const file = fileInput.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const importedData = JSON.parse(e.target.result);
              if (Array.isArray(importedData)) {
                foldersData = importedData;
                saveFoldersData(foldersData);
                renderFolders();
                alert('Data imported successfully!');
              } else {
                alert('Invalid data format.');
              }
            } catch (error) {
              alert('Failed to import data.');
              console.error('Import error:', error);
            }
          };
          reader.readAsText(file);
        });
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
      });
  
      // Export user data
      const exportItem = createMenuItem('📤 Export User Data', () => {
        const dataStr = JSON.stringify(foldersData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = createElement('a', {
          attributes: { href: url, download: 'my_folders_data.json' },
        });
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });
  
      // LinkedIn link (placeholder)
      const linkedInItem = createMenuItem('👤 LinkedIn', () => {
        window.open('https://www.linkedin.com/in/your-profile', '_blank');
      });
  
      // GitHub Repo link (placeholder)
      const githubItem = createMenuItem('🛠️ GitHub Repo', () => {
        window.open('https://github.com/your-repo', '_blank');
      });
  
      optionsMenu.appendChild(importItem);
      optionsMenu.appendChild(exportItem);
      optionsMenu.appendChild(linkedInItem);
      optionsMenu.appendChild(githubItem);
  
      // Append optionsMenu to body
      document.body.appendChild(optionsMenu);
  
      // Close optionsMenu when clicking outside
      document.addEventListener('click', (event) => {
        if (
          event.target !== optionsMenu &&
          event.target !== optionsButton &&
          !optionsMenu.contains(event.target)
        ) {
          optionsMenu.style.display = 'none';
        }
      });
  
      // Buttons container
      const buttonsContainer = createElement('div', {
        styles: {
          display: 'flex',
          alignItems: 'center',
        },
      });
  
      buttonsContainer.appendChild(createFolderButton);
      buttonsContainer.appendChild(optionsButton);
  
      myFoldersHeader.appendChild(folderIconContainer);
      myFoldersHeader.appendChild(buttonsContainer);
  
      // Container for folders
      const foldersContainer = createElement('div', {
        styles: { display: 'none', borderRadius: '7px' }, // Added to create rounded corners
      });
  
      // Toggle foldersContainer visibility when header is clicked
      myFoldersHeader.addEventListener('click', (event) => {
        if (event.target !== createFolderButton && event.target !== optionsButton) {
          foldersContainer.style.display =
            foldersContainer.style.display === 'none' ? 'block' : 'none';
          // Update folder icon based on foldersContainer display
          folderIcon.textContent =
            foldersContainer.style.display === 'none' ? '📁' : '📂';
        }
      });
  
      // Hover effect for the entire "My Folders" header
      myFoldersHeader.addEventListener('mouseover', () => {
        // Show the "+" and "…" buttons
        createFolderButton.style.opacity = '1';
        optionsButton.style.opacity = '1';
        // Apply hover effect to the entire header
        myFoldersHeader.style.background = themeColors.hoverBackgroundColor;
        myFoldersHeader.style.color = themeColors.hoverTextColor;
      });
  
      myFoldersHeader.addEventListener('mouseout', () => {
        // Hide the "+" and "…" buttons
        createFolderButton.style.opacity = '0';
        optionsButton.style.opacity = '0';
        // Remove hover effect from the header
        myFoldersHeader.style.background = 'transparent';
        myFoldersHeader.style.color = 'inherit';
      });
  
      // Load folders from localStorage
      let foldersData = loadFoldersData();
  
      // Ensure all folders and chats have 'pinned' property
      foldersData.forEach((folder) => {
        if (typeof folder.pinned === 'undefined') {
          folder.pinned = false;
        }
        folder.chats.forEach((chat) => {
          if (typeof chat.pinned === 'undefined') {
            chat.pinned = false;
          }
        });
      });
  
      /**
       * Render all folders.
       */
      const renderFolders = () => {
        // Clear existing folders
        foldersContainer.innerHTML = '';
  
        // Sort folders: pinned folders first
        const sortedFolders = foldersData.slice().sort((a, b) => {
          if (a.pinned === b.pinned) {
            return 0;
          } else if (a.pinned) {
            return -1;
          } else {
            return 1;
          }
        });
  
        // Render each folder
        sortedFolders.forEach((folder) => {
          createFolder(folder.name, folder.chats, folder.pinned);
        });
      };
  
      /**
       * Render the chats in a folder.
       * @param {HTMLElement} folderContent - The folder content container.
       * @param {Array} folderChats - The array of chats in the folder.
       * @param {string} currentFolderName - The name of the current folder.
       */
      const renderChatsInFolder = (folderContent, folderChats, currentFolderName) => {
        // Clear existing content
        folderContent.innerHTML = '';
  
        // Sort chats: pinned chats first
        const sortedChats = folderChats.slice().sort((a, b) => {
          if (a.pinned === b.pinned) {
            return 0;
          } else if (a.pinned) {
            return -1;
          } else {
            return 1;
          }
        });
  
        // Render each chat
        sortedChats.forEach((chat) => {
          const chatItem = createChatItem(chat, currentFolderName);
          folderContent.appendChild(chatItem);
        });
      };
  
      /**
       * Create a chat item element.
       * @param {Object} chat - The chat object.
       * @param {string} currentFolderName - The name of the current folder.
       * @returns {HTMLElement} The chat item element.
       */
      const createChatItem = (chat, currentFolderName) => {
        const chatName = chat.name;
        const chatHref = chat.href;
  
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
            // Open in current tab
          },
          styles: {
            color: 'inherit',
            textDecoration: 'none',
            flexGrow: '1',
            borderRadius: '7px', // Added to create rounded corners
          },
        });
  
        const renameButton = createElement('button', {
          properties: { textContent: '🖋' },
          styles: {
            marginLeft: '10px',
            background: 'none',
            border: 'none',
            color: themeColors.textColor,
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'color 0.2s, font-size 0.2s',
          },
          events: {
            mouseover: () => {
              renameButton.style.fontSize = '17px'; // Slightly increase size on hover
            },
            mouseout: () => {
              renameButton.style.fontSize = '16px'; // Reset size
            },
            click: () => {
              const newName = prompt('Enter new chat name:', chatName);
              if (newName) {
                const sanitizedNewName = sanitizeString(newName.trim());
                if (sanitizedNewName) {
                  const folderIndex = foldersData.findIndex(
                    (folder) => folder.name === currentFolderName
                  );
                  if (folderIndex !== -1) {
                    const chatIndex = foldersData[folderIndex].chats.findIndex(
                      (c) => c.name === chatName && c.href === chatHref
                    );
                    if (chatIndex !== -1) {
                      foldersData[folderIndex].chats[chatIndex].name = sanitizedNewName;
                      saveFoldersData(foldersData);
                      // Re-render the chats
                      renderChatsInFolder(
                        chatItem.parentElement,
                        foldersData[folderIndex].chats,
                        currentFolderName
                      );
                    }
                  }
                } else {
                  alert('Invalid chat name.');
                }
              }
            },
          },
        });
  
        const pinChatButton = createElement('button', {
          properties: { textContent: chat.pinned ? '◉' : '◎' },
          styles: {
            marginLeft: '10px',
            background: 'none',
            border: 'none',
            color: themeColors.textColor,
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'color 0.2s, font-size 0.2s',
          },
          events: {
            mouseover: () => {
              pinChatButton.style.fontSize = '17px'; // Slightly increase size on hover
            },
            mouseout: () => {
              pinChatButton.style.fontSize = '16px'; // Reset size
            },
            click: () => {
              const folderIndex = foldersData.findIndex(
                (folder) => folder.name === currentFolderName
              );
              if (folderIndex !== -1) {
                const chatIndex = foldersData[folderIndex].chats.findIndex(
                  (c) => c.name === chatName && c.href === chatHref
                );
                if (chatIndex !== -1) {
                  const isPinned = foldersData[folderIndex].chats[chatIndex].pinned;
                  foldersData[folderIndex].chats[chatIndex].pinned = !isPinned;
                  saveFoldersData(foldersData);
                  // Re-render the chats
                  renderChatsInFolder(
                    chatItem.parentElement,
                    foldersData[folderIndex].chats,
                    currentFolderName
                  );
                }
              }
            },
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
            transition: 'color 0.2s, font-size 0.2s',
            borderRadius: '7px', // Added to create rounded corners
          },
          events: {
            mouseover: () => {
              deleteChatButton.style.color = themeColors.deleteButtonHoverColor;
              deleteChatButton.style.fontSize = '17px'; // Slightly increase size on hover
            },
            mouseout: () => {
              deleteChatButton.style.color = themeColors.textColor;
              deleteChatButton.style.fontSize = '16px'; // Reset size
            },
            click: () => {
              const folderIndex = foldersData.findIndex(
                (folder) => folder.name === currentFolderName
              );
              if (folderIndex !== -1) {
                foldersData[folderIndex].chats = foldersData[folderIndex].chats.filter(
                  (c) => c.name !== chatName || c.href !== chatHref
                );
                saveFoldersData(foldersData);
                // Re-render the chats
                renderChatsInFolder(
                  chatItem.parentElement,
                  foldersData[folderIndex].chats,
                  currentFolderName
                );
              }
            },
          },
        });
  
        // Append elements in the order: chatLink, renameButton, pinChatButton, deleteChatButton
        chatItem.appendChild(chatLink);
        chatItem.appendChild(renameButton);
        chatItem.appendChild(pinChatButton);
        chatItem.appendChild(deleteChatButton);
  
        return chatItem;
      };
  
      /**
       * Create a new folder element.
       * @param {string} folderName - The name of the folder.
       * @param {Array} folderChats - The list of chats in the folder.
       * @param {boolean} pinned - Whether the folder is pinned.
       */
      const createFolder = (folderName, folderChats = [], pinned = false) => {
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
                  if (foldersData.some((folder) => folder.name === sanitizedNewName)) {
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
            borderRadius: '0',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'color 0.2s, font-size 0.2s',
          },
          events: {
            mouseover: () => {
              addChatButton.style.color = '#00aaff'; // Blue color
              addChatButton.style.fontSize = '17px'; // Slightly increase size on hover
            },
            mouseout: () => {
              addChatButton.style.color = themeColors.textColor;
              addChatButton.style.fontSize = '16px'; // Reset size
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
              folderChats.push({
                name: sanitizedChatName,
                href: sanitizedChatHref,
                pinned: false, // Default to not pinned
              });
  
              // Update foldersData
              const folderIndex = foldersData.findIndex(
                (folder) => folder.name === currentFolderName
              );
              if (folderIndex !== -1) {
                foldersData[folderIndex].chats = folderChats;
                saveFoldersData(foldersData);
              } else {
                foldersData.push({
                  name: currentFolderName,
                  chats: folderChats,
                  pinned: false,
                });
                saveFoldersData(foldersData);
              }
  
              // Show folder content
              folderContent.style.display = 'block';
  
              // Update folder icon to expanded
              folderIconSpan.textContent = '📂';
  
              // Re-render the chats
              renderChatsInFolder(folderContent, folderChats, currentFolderName);
            },
          },
        });
  
        // Pin folder button
        const pinFolderButton = createElement('button', {
          properties: { textContent: pinned ? '◉' : '◎' },
          styles: {
            padding: '10px',
            background: themeColors.backgroundColor,
            color: themeColors.textColor,
            border: 'none',
            borderLeft: `1px solid ${themeColors.borderColor}`,
            borderRadius: '0',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'color 0.2s, font-size 0.2s',
          },
          events: {
            mouseover: () => {
              pinFolderButton.style.fontSize = '17px'; // Slightly increase size on hover
            },
            mouseout: () => {
              pinFolderButton.style.fontSize = '16px'; // Reset size
            },
            click: () => {
              const folderIndex = foldersData.findIndex(
                (f) => f.name === currentFolderName
              );
              if (folderIndex !== -1) {
                const isPinned = foldersData[folderIndex].pinned;
                foldersData[folderIndex].pinned = !isPinned;
                saveFoldersData(foldersData);
                // Re-render folders
                renderFolders();
              }
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
            transition: 'color 0.2s, font-size 0.2s',
          },
          events: {
            mouseover: () => {
              deleteButton.style.color = themeColors.deleteButtonHoverColor;
              deleteButton.style.fontSize = '17px'; // Slightly increase size on hover
            },
            mouseout: () => {
              deleteButton.style.color = themeColors.textColor;
              deleteButton.style.fontSize = '16px'; // Reset size
            },
            click: () => {
              if (
                confirm(`Are you sure you want to delete the folder "${currentFolderName}"?`)
              ) {
                const folderIndex = foldersData.findIndex(
                  (folder) => folder.name === currentFolderName
                );
                if (folderIndex !== -1) {
                  foldersData.splice(folderIndex, 1);
                  saveFoldersData(foldersData);
                  // Re-render folders
                  renderFolders();
                }
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
        renderChatsInFolder(folderContent, folderChats, currentFolderName);
  
        // Set initial folder icon based on content display
        folderIconSpan.textContent =
          folderContent.style.display === 'none' ? '📁' : '📂';
  
        // Assemble folder header
        const buttonContainer = createElement('div', {
          styles: { display: 'flex', borderRadius: '7px' }, // Added to create rounded corners
        });
  
        buttonContainer.appendChild(addChatButton);
        buttonContainer.appendChild(pinFolderButton);
        buttonContainer.appendChild(deleteButton);
  
        headerContainer.appendChild(folderButton);
        headerContainer.appendChild(buttonContainer);
  
        // Assemble folder
        folderContainer.appendChild(headerContainer);
        folderContainer.appendChild(folderContent);
  
        // Add folder to container
        foldersContainer.appendChild(folderContainer);
      };
  
      // Initial render of folders
      renderFolders();
  
      // Insert "My Folders" into the DOM
      exploreGPTs.parentElement.insertAdjacentElement('afterend', myFoldersHeader);
      myFoldersHeader.insertAdjacentElement('afterend', foldersContainer);
  
      // Observe changes to document.title to auto-update chat names
      const titleElement = document.querySelector('title');
      const titleObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          const newTitle = mutation.target.textContent;
          // Update chat name if it exists in folders
          updateChatNameIfExists(window.location.href, newTitle);
        });
      });
      titleObserver.observe(titleElement, { childList: true });
  
      /**
       * Update chat name in foldersData if it exists.
       * @param {string} href - The chat URL.
       * @param {string} newName - The new chat name.
       */
      const updateChatNameIfExists = (href, newName) => {
        let updated = false;
        foldersData.forEach((folder) => {
          const chatIndex = folder.chats.findIndex((chat) => chat.href === href);
          if (chatIndex !== -1) {
            if (folder.chats[chatIndex].name !== newName) {
              folder.chats[chatIndex].name = newName;
              updated = true;
            }
          }
        });
        if (updated) {
          saveFoldersData(foldersData);
          renderFolders();
        }
      };
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
  