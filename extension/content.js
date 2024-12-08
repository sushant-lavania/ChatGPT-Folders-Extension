/**
 * @fileoverview Adds "My Folders" and "bookmark chats" functionality with data persistence to the ChatGPT interface.
 * Supports both light and dark modes.
 * Pinned items appear at top, earliest pinned at top among pinned.
 * Folders appear before bookmark chats.
 * Folder expansion/collapse is maintained on actions.
 * @version 2.4.0
 */
(() => {
    'use strict';

    const LOCAL_STORAGE_KEY = 'myFoldersAndBookmarksData_v2';
    // Track folder expansion states: { [folderName]: boolean }
    const folderExpansionState = {};

    function saveData(data) {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save data:', error);
        }
    }

    function loadData() {
        try {
            const data = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (data) {
                return JSON.parse(data);
            } else {
                return { foldersData: [], bookmarkChats: [] };
            }
        } catch (error) {
            console.error('Failed to load data:', error);
            return { foldersData: [], bookmarkChats: [] };
        }
    }

    function sanitizeString(str) {
        const tempDiv = document.createElement('div');
        tempDiv.textContent = str;
        return tempDiv.innerHTML;
    }

    function createElement(tag, options = {}) {
        const element = document.createElement(tag);

        if (options.attributes) {
            for (const [key, value] of Object.entries(options.attributes)) {
                element.setAttribute(key, value);
            }
        }

        if (options.styles) {
            Object.assign(element.style, options.styles);
        }

        if (options.properties) {
            for (const [key, value] of Object.entries(options.properties)) {
                element[key] = value;
            }
        }

        if (options.events) {
            for (const [eventType, listener] of Object.entries(options.events)) {
                element.addEventListener(eventType, listener);
            }
        }

        return element;
    }

    function getTheme() {
        const bodyStyles = getComputedStyle(document.body);
        const backgroundColor = bodyStyles.backgroundColor;

        if (backgroundColor) {
            const rgb = backgroundColor.match(/\d+/g);
            if (rgb && rgb.length >= 3) {
                const [r, g, b] = rgb.map(Number);
                const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
                return luminance < 128 ? 'dark' : 'light';
            }
        }
        return 'light';
    }

    function initMyFolders() {
        if (document.getElementById('my-folders-header')) {
            console.log('"My Folders" already added.');
            return;
        }

        const exploreGPTs = Array.from(document.querySelectorAll('button')).find(
            (button) => button.textContent.trim() === 'Explore GPTs'
        );

        if (!exploreGPTs) {
            console.error('"Explore GPTs" button not found.');
            return;
        }

        const theme = getTheme();

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

        let data = loadData();
        let { foldersData, bookmarkChats } = data;

        const now = () => Date.now();
        function ensureProperties() {
            foldersData.forEach((folder) => {
                if (typeof folder.pinned === 'undefined') folder.pinned = false;
                if (typeof folder.pinnedAt === 'undefined') folder.pinnedAt = null;
                if (typeof folder.creationIndex === 'undefined') folder.creationIndex = now();
                folder.chats.forEach((chat) => {
                    if (typeof chat.pinned === 'undefined') chat.pinned = false;
                    if (typeof chat.pinnedAt === 'undefined') chat.pinnedAt = null;
                    if (typeof chat.creationIndex === 'undefined') chat.creationIndex = now();
                });
            });
            bookmarkChats.forEach((chat) => {
                if (typeof chat.pinned === 'undefined') chat.pinned = false;
                if (typeof chat.pinnedAt === 'undefined') chat.pinnedAt = null;
                if (typeof chat.creationIndex === 'undefined') chat.creationIndex = now();
            });
        }
        ensureProperties();

        const mainHeader = createElement('button', {
            attributes: { id: 'my-folders-header', title: 'My Folder' },
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
                borderRadius: '7px',
            },
        });

        const folderIconContainer = createElement('div', {
            styles: {
                display: 'flex',
                alignItems: 'center',
                borderRadius: '7px',
            },
        });

        const folderIcon = createElement('span', {
            properties: { textContent: '📁' },
            styles: { marginRight: '15px', borderRadius: '7px' },
        });

        const folderText = createElement('span', {
            properties: { textContent: 'My Folders' },
            styles: {
                fontWeight: 'normal',
                fontFamily: getComputedStyle(exploreGPTs).fontFamily,
                fontSize: getComputedStyle(exploreGPTs).fontSize,
                borderRadius: '7px',
            },
        });

        folderIconContainer.appendChild(folderIcon);
        folderIconContainer.appendChild(folderText);

        const createFolderButton = createElement('button', {
            properties: { textContent: '#' },
            attributes: { title: 'create folders' },
            styles: {
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                borderRadius: '7px',
                opacity: '0',
                transition: 'opacity 0.2s, color 0.2s, font-size 0.2s',
                marginLeft: '10px',
                display: 'flex',
                alignItems: 'center',
            },
            events: {
                mouseover: () => {
                    createFolderButton.style.color = '#00aaff';
                    createFolderButton.style.fontSize = '20px';
                },
                mouseout: () => {
                    createFolderButton.style.color = 'inherit';
                    createFolderButton.style.fontSize = '16px';
                },
                click: (event) => {
                    event.stopPropagation();
                    const folderName = prompt('Enter folder name:');
                    if (folderName) {
                        const sanitizedFolderName = sanitizeString(folderName.trim());
                        if (sanitizedFolderName) {
                            if (foldersData.some((folder) => folder.name === sanitizedFolderName)) {
                                alert(`A folder named "${sanitizedFolderName}" already exists.`);
                                return;
                            }
                            foldersData.push({
                                name: sanitizedFolderName,
                                chats: [],
                                pinned: false,
                                pinnedAt: null,
                                creationIndex: now(),
                            });
                            saveData({ foldersData, bookmarkChats });
                            itemsContainer.style.display = 'block';
                            folderIcon.textContent = '📂';
                            folderExpansionState[sanitizedFolderName] = true;
                            renderItems();
                        } else {
                            alert('Invalid folder name.');
                        }
                    }
                },
            },
        });

        const addBookmarkChatButton = createElement('button', {
            properties: { textContent: '+' },
            attributes: { title: 'add curr chat as bookmark' },
            styles: {
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                fontSize: '20px',
                fontWeight: 'bold',
                borderRadius: '7px',
                opacity: '0',
                transition: 'opacity 0.2s, color 0.2s, font-size 0.2s',
                marginLeft: '10px',
                display: 'flex',
                alignItems: 'center',
            },
            events: {
                mouseover: () => {
                    addBookmarkChatButton.style.color = '#00aaff';
                    addBookmarkChatButton.style.fontSize = '22px';
                },
                mouseout: () => {
                    addBookmarkChatButton.style.color = 'inherit';
                    addBookmarkChatButton.style.fontSize = '20px';
                },
                click: (event) => {
                    event.stopPropagation();
                    const chatName = document.title || 'Unnamed Chat';
                    const chatHref = window.location.href;
                    const sanitizedChatName = sanitizeString(chatName.trim());
                    if (bookmarkChats.some((c) => c.name === sanitizedChatName && c.href === chatHref)) {
                        alert(`Chat "${sanitizedChatName}" already bookmarked.`);
                        return;
                    }

                    bookmarkChats.push({
                        name: sanitizedChatName,
                        href: chatHref,
                        pinned: false,
                        pinnedAt: null,
                        creationIndex: now(),
                    });
                    saveData({ foldersData, bookmarkChats });
                    itemsContainer.style.display = 'block';
                    folderIcon.textContent = '📂';
                    renderItems();
                },
            },
        });

        const optionsButton = createElement('button', {
            properties: { textContent: '…' },
            attributes: { title: 'options' },
            styles: {
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                fontSize: '20px',
                fontWeight: 'bold',
                borderRadius: '7px',
                opacity: '0',
                transition: 'opacity 0.2s, color 0.2s, font-size 0.2s',
                marginLeft: '10px',
                marginTop: '2px',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
            },
            events: {
                mouseover: () => {
                    optionsButton.style.color = '#00aaff';
                    optionsButton.style.fontSize = '20px';
                },
                mouseout: () => {
                    optionsButton.style.color = 'inherit';
                    optionsButton.style.fontSize = '20px';
                },
                click: (event) => {
                    event.stopPropagation();
                    if (optionsMenu.style.display === 'block') {
                        optionsMenu.style.display = 'none';
                    } else {
                        optionsMenu.style.display = 'block';
                        const rect = optionsButton.getBoundingClientRect();
                        optionsMenu.style.top = `${rect.bottom + window.scrollY}px`;
                        optionsMenu.style.left = `${rect.left + window.scrollX - optionsMenu.offsetWidth + optionsButton.offsetWidth}px`;
                    }
                },
            },
        });

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

        function createMenuItem(text, onClick) {
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
        }

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
                        if (
                            importedData &&
                            Array.isArray(importedData.foldersData) &&
                            Array.isArray(importedData.bookmarkChats)
                        ) {
                            data = importedData;
                            foldersData = data.foldersData;
                            bookmarkChats = data.bookmarkChats;
                            ensureProperties();
                            saveData(data);
                            renderItems();
                            alert('Data imported successfully!');
                        } else {
                            alert('Invalid data format.');
                        }
                    } catch (error) {
                        alert('Failed to import data.');
                        console.error('Import error:', error);
                    }
                };
                document.body.appendChild(fileInput);
                fileInput.click();
                document.body.removeChild(fileInput);
            });
            document.body.appendChild(fileInput);
            fileInput.click();
            document.body.removeChild(fileInput);
        });

        const exportItem = createMenuItem('📤 Export User Data', () => {
            const dataStr = JSON.stringify({ foldersData, bookmarkChats }, null, 2);
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

        const linkedInItem = createMenuItem('👤 LinkedIn', () => {
            window.open('https://www.linkedin.com/in/sushant-lavania-47288322a/', '_blank');
        });

        const githubItem = createMenuItem('🛠️ GitHub Repo', () => {
            window.open('https://github.com/sushant-lavania/ChatGPT-Folders-Extension', '_blank');
        });

        optionsMenu.appendChild(importItem);
        optionsMenu.appendChild(exportItem);
        optionsMenu.appendChild(linkedInItem);
        optionsMenu.appendChild(githubItem);
        document.body.appendChild(optionsMenu);

        document.addEventListener('click', (event) => {
            if (
                event.target !== optionsMenu &&
                event.target !== optionsButton &&
                !optionsMenu.contains(event.target)
            ) {
                optionsMenu.style.display = 'none';
            }
        });

        const buttonsContainer = createElement('div', {
            styles: {
                display: 'flex',
                alignItems: 'center',
            },
        });

        buttonsContainer.appendChild(createFolderButton);
        buttonsContainer.appendChild(addBookmarkChatButton);
        buttonsContainer.appendChild(optionsButton);

        mainHeader.appendChild(folderIconContainer);
        mainHeader.appendChild(buttonsContainer);

        const itemsContainer = createElement('div', {
            styles: { display: 'none', borderRadius: '7px' },
        });

        mainHeader.addEventListener('click', (event) => {
            if (event.target !== createFolderButton && event.target !== addBookmarkChatButton && event.target !== optionsButton) {
                itemsContainer.style.display =
                    itemsContainer.style.display === 'none' ? 'block' : 'none';
                folderIcon.textContent =
                    itemsContainer.style.display === 'none' ? '📁' : '📂';
            }
        });

        mainHeader.addEventListener('mouseover', () => {
            createFolderButton.style.opacity = '1';
            addBookmarkChatButton.style.opacity = '1';
            optionsButton.style.opacity = '1';
            mainHeader.style.background = themeColors.hoverBackgroundColor;
            mainHeader.style.color = themeColors.hoverTextColor;
        });

        mainHeader.addEventListener('mouseout', () => {
            createFolderButton.style.opacity = '0';
            addBookmarkChatButton.style.opacity = '0';
            optionsButton.style.opacity = '0';
            mainHeader.style.background = 'transparent';
            mainHeader.style.color = 'inherit';
        });

        function togglePin(item) {
            if (!item.pinned) {
                item.pinned = true;
                item.pinnedAt = Date.now();
            } else {
                item.pinned = false;
                item.pinnedAt = null;
            }
        }

        function sortItems(a, b) {
            // pinned first
            if (a.pinned !== b.pinned) {
                return a.pinned ? -1 : 1; // pinned at top
            }
            // both pinned => by pinnedAt ascending
            if (a.pinned && b.pinned) {
                return (a.pinnedAt || 0) - (b.pinnedAt || 0);
            }
            // both unpinned => by creationIndex ascending
            return (a.creationIndex || 0) - (b.creationIndex || 0);
        }

        function renderChatsInFolder(folderContent, folderChats, currentFolderName) {
            folderContent.innerHTML = '';
            const sortedChats = folderChats.slice().sort(sortItems);

            if (sortedChats.length === 0) {
                // show (empty) if no chats
                const emptyMsg = document.createElement('div');
                emptyMsg.textContent = '(empty)';
                emptyMsg.style.fontStyle = 'italic';
                emptyMsg.style.opacity = '0.7';
                folderContent.appendChild(emptyMsg);
            } else {
                sortedChats.forEach((chat) => {
                    const chatItem = createChatItem(chat, currentFolderName, false);
                    folderContent.appendChild(chatItem);
                });
            }
        }

        function createChatItem(chat, currentFolderName, isBookmarkChat = false) {
            const chatName = chat.name;
            const chatHref = chat.href;

            const chatItem = createElement('div', {
                styles: {
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '5px',
                    padding: '10px',
                    border: `1px solid ${themeColors.folderItemBorderColor}`,
                    borderRadius: '7px',
                    background: themeColors.folderItemBackground,
                    color: themeColors.textColor,
                },
            });

            const chatLink = createElement('a', {
                properties: {
                    href: chatHref,
                    textContent: chatName,
                },
                styles: {
                    color: 'inherit',
                    textDecoration: 'none',
                    flexGrow: '1',
                    borderRadius: '7px',
                },
            });

            const renameButton = createElement('button', {
                properties: { textContent: '🖋' },
                attributes: { title: 'rename chat' },
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
                        renameButton.style.color = '#00aaff';
                        renameButton.style.fontSize = '17px';
                    },
                    mouseout: () => {
                        renameButton.style.color = themeColors.textColor;
                        renameButton.style.fontSize = '16px';
                    },
                    click: (event) => {
                        event.stopPropagation();
                        const newName = prompt('Enter new chat name:', chatName);
                        if (newName) {
                            const sanitizedNewName = sanitizeString(newName.trim());
                            if (sanitizedNewName) {
                                if (isBookmarkChat) {
                                    const chatIndex = bookmarkChats.findIndex(
                                        (c) => c.name === chatName && c.href === chatHref
                                    );
                                    if (chatIndex !== -1) {
                                        bookmarkChats[chatIndex].name = sanitizedNewName;
                                        saveData({ foldersData, bookmarkChats });
                                        renderItems();
                                    }
                                } else {
                                    const folderIndex = foldersData.findIndex(
                                        (folder) => folder.name === currentFolderName
                                    );
                                    if (folderIndex !== -1) {
                                        const chatIndex = foldersData[folderIndex].chats.findIndex(
                                            (c) => c.name === chatName && c.href === chatHref
                                        );
                                        if (chatIndex !== -1) {
                                            foldersData[folderIndex].chats[chatIndex].name = sanitizedNewName;
                                            saveData({ foldersData, bookmarkChats });
                                            // Keep folder expanded
                                            folderExpansionState[currentFolderName] = true;
                                            renderItems();
                                        }
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
                attributes: { title: chat.pinned ? 'Pinned' : 'UnPinned Chat' },
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
                        pinChatButton.style.fontSize = '17px';
                        pinChatButton.style.color = '#00aaff';
                    },
                    mouseout: () => {
                        pinChatButton.style.fontSize = '16px';
                        pinChatButton.style.color = themeColors.textColor;
                    },
                    click: (event) => {
                        event.stopPropagation();
                        if (isBookmarkChat) {
                            const chatIndex = bookmarkChats.findIndex(
                                (c) => c.name === chatName && c.href === chatHref
                            );
                            if (chatIndex !== -1) {
                                togglePin(bookmarkChats[chatIndex]);
                                saveData({ foldersData, bookmarkChats });
                                renderItems();
                            }
                        } else {
                            const folderIndex = foldersData.findIndex(
                                (folder) => folder.name === currentFolderName
                            );
                            if (folderIndex !== -1) {
                                const chatIndex = foldersData[folderIndex].chats.findIndex(
                                    (c) => c.name === chatName && c.href === chatHref
                                );
                                if (chatIndex !== -1) {
                                    togglePin(foldersData[folderIndex].chats[chatIndex]);
                                    saveData({ foldersData, bookmarkChats });
                                    // Keep folder expanded
                                    folderExpansionState[currentFolderName] = true;
                                    renderItems();
                                }
                            }
                        }
                    },
                },
            });

            const deleteChatButton = createElement('button', {
                properties: { textContent: '×' },
                attributes: { title: 'delete chat' },
                styles: {
                    marginLeft: '10px',
                    background: 'none',
                    border: 'none',
                    color: themeColors.textColor,
                    fontSize: '16px',
                    cursor: 'pointer',
                    transition: 'color 0.2s, font-size 0.2s',
                    borderRadius: '7px',
                },
                events: {
                    mouseover: () => {
                        deleteChatButton.style.color = themeColors.deleteButtonHoverColor;
                        deleteChatButton.style.fontSize = '17px';
                    },
                    mouseout: () => {
                        deleteChatButton.style.color = themeColors.textColor;
                        deleteChatButton.style.fontSize = '16px';
                    },
                    click: (event) => {
                        event.stopPropagation();
                        if (isBookmarkChat) {
                            bookmarkChats = bookmarkChats.filter(
                                (c) => c.name !== chatName || c.href !== chatHref
                            );
                            saveData({ foldersData, bookmarkChats });
                            renderItems();
                        } else {
                            const folderIndex = foldersData.findIndex(
                                (folder) => folder.name === currentFolderName
                            );
                            if (folderIndex !== -1) {
                                foldersData[folderIndex].chats = foldersData[folderIndex].chats.filter(
                                    (c) => c.name !== chatName || c.href !== chatHref
                                );
                                saveData({ foldersData, bookmarkChats });
                                // Keep folder expanded
                                folderExpansionState[currentFolderName] = true;
                                renderItems();
                            }
                        }
                    },
                },
            });

            chatItem.appendChild(chatLink);
            chatItem.appendChild(renameButton);
            chatItem.appendChild(pinChatButton);
            chatItem.appendChild(deleteChatButton);

            return chatItem;
        }

        function createFolder(folderName, folderChats = [], pinned = false) {
            let currentFolderName = folderName;

            const folderContainer = createElement('div', {
                styles: { marginBottom: '5px', borderRadius: '7px' },
            });

            const headerContainer = createElement('div', {
                styles: {
                    display: 'flex',
                    alignItems: 'center',
                    border: `1px solid ${themeColors.borderColor}`,
                    borderRadius: '7px',
                },
            });

            const folderIconSpan = createElement('span', {
                properties: { textContent: '📁' },
                styles: {
                    marginRight: '10px',
                    fontSize: '16px',
                },
            });

            const folderNameSpan = createElement('span', {
                properties: { textContent: folderName },
                attributes: { title: 'click twice to rename' },
                styles: {
                    flexGrow: '1',
                },
            });

            const folderButton = createElement('button', {
                attributes: { title: 'My Folder' },
                styles: {
                    display: 'flex',
                    alignItems: 'center',
                    flexGrow: '1',
                    padding: '10px',
                    background: themeColors.backgroundColor,
                    color: themeColors.textColor,
                    border: 'none',
                    borderRadius: '7px 0 0 7px',
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
                    click: (event) => {
                        // toggle folder expansion
                        event.stopPropagation();
                        folderExpansionState[currentFolderName] = !folderExpansionState[currentFolderName];
                        renderItems();
                    },
                    dblclick: (event) => {
                        event.stopPropagation();
                        const newName = prompt('Enter new folder name:', currentFolderName);
                        if (newName) {
                            const sanitizedNewName = sanitizeString(newName.trim());
                            if (sanitizedNewName) {
                                if (foldersData.some((folder) => folder.name === sanitizedNewName)) {
                                    alert(`A folder named "${sanitizedNewName}" already exists.`);
                                    return;
                                }

                                const folderIndex = foldersData.findIndex(
                                    (folder) => folder.name === currentFolderName
                                );
                                if (folderIndex !== -1) {
                                    foldersData[folderIndex].name = sanitizedNewName;
                                    saveData({ foldersData, bookmarkChats });

                                    const wasExpanded = folderExpansionState[currentFolderName] || false;
                                    delete folderExpansionState[currentFolderName];
                                    currentFolderName = sanitizedNewName;
                                    folderExpansionState[currentFolderName] = wasExpanded;
                                    renderItems();
                                }
                            } else {
                                alert('Invalid folder name.');
                            }
                        }
                    },
                },
            });

            folderButton.appendChild(folderIconSpan);
            folderButton.appendChild(folderNameSpan);

            const addChatButton = createElement('button', {
                properties: { textContent: '+' },
                attributes: { title: 'add curr chat' },
                styles: {
                    padding: '10px',
                    background: themeColors.backgroundColor,
                    color: themeColors.textColor,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    transition: 'color 0.2s, font-size 0.2s',
                },
                events: {
                    mouseover: () => {
                        addChatButton.style.color = '#00aaff';
                        addChatButton.style.fontSize = '17px';
                    },
                    mouseout: () => {
                        addChatButton.style.color = themeColors.textColor;
                        addChatButton.style.fontSize = '16px';
                    },
                    click: (event) => {
                        event.stopPropagation();
                        const chatName = document.title || 'Unnamed Chat';
                        const chatHref = window.location.href;
                        const sanitizedChatName = sanitizeString(chatName.trim());

                        const folderIndex = foldersData.findIndex(
                            (folder) => folder.name === currentFolderName
                        );
                        if (folderIndex !== -1) {
                            const folder = foldersData[folderIndex];
                            if (folder.chats.some((c) => c.name === sanitizedChatName && c.href === chatHref)) {
                                alert(`Chat "${sanitizedChatName}" is already in the folder.`);
                                return;
                            }

                            folder.chats.push({
                                name: sanitizedChatName,
                                href: chatHref,
                                pinned: false,
                                pinnedAt: null,
                                creationIndex: Date.now(),
                            });
                            saveData({ foldersData, bookmarkChats });
                            // Keep folder expanded
                            folderExpansionState[currentFolderName] = true;
                            renderItems();
                        }
                    },
                },
            });

            const pinFolderButton = createElement('button', {
                properties: { textContent: pinned ? '◉' : '◎' },
                attributes: { title: pinned ? 'Pinned' : 'UnPinned Folder' },
                styles: {
                    padding: '10px',
                    background: themeColors.backgroundColor,
                    color: themeColors.textColor,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    transition: 'color 0.2s, font-size 0.2s',
                },
                events: {
                    mouseover: () => {
                        pinFolderButton.style.fontSize = '17px';
                        pinFolderButton.style.color = '#00aaff';
                    },
                    mouseout: () => {
                        pinFolderButton.style.fontSize = '16px';
                        pinFolderButton.style.color = themeColors.textColor;
                    },
                    click: (event) => {
                        event.stopPropagation();
                        const folderIndex = foldersData.findIndex(
                            (f) => f.name === currentFolderName
                        );
                        if (folderIndex !== -1) {
                            const folder = foldersData[folderIndex];
                            // NOTE: Folder should NOT expand on pin toggle:
                            // we do NOT set folderExpansionState here.
                            if (!folder.pinned) {
                                folder.pinned = true;
                                folder.pinnedAt = Date.now();
                            } else {
                                folder.pinned = false;
                                folder.pinnedAt = null;
                            }
                            saveData({ foldersData, bookmarkChats });
                            // Re-render without forcing expansion
                            renderItems();
                        }
                    },
                },
            });

            const deleteButton = createElement('button', {
                properties: { textContent: '×' },
                attributes: { title: 'delete folder' },
                styles: {
                    padding: '10px',
                    background: themeColors.backgroundColor,
                    color: themeColors.textColor,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    transition: 'color 0.2s, font-size 0.2s',
                    borderRadius: '0 7px 7px 0',
                },
                events: {
                    mouseover: () => {
                        deleteButton.style.color = themeColors.deleteButtonHoverColor;
                        deleteButton.style.fontSize = '17px';
                    },
                    mouseout: () => {
                        deleteButton.style.color = themeColors.textColor;
                        deleteButton.style.fontSize = '16px';
                    },
                    click: (event) => {
                        event.stopPropagation();
                        if (
                            confirm(`Are you sure you want to delete the folder "${currentFolderName}"?`)
                        ) {
                            const folderIndex = foldersData.findIndex(
                                (folder) => folder.name === currentFolderName
                            );
                            if (folderIndex !== -1) {
                                delete folderExpansionState[currentFolderName];
                                foldersData.splice(folderIndex, 1);
                                saveData({ foldersData, bookmarkChats });
                                renderItems();
                            }
                        }
                    },
                },
            });

            const folderContent = createElement('div', {
                styles: {
                    padding: '10px',
                    background: themeColors.folderContentBackground,
                    border: `1px solid ${themeColors.borderColor}`,
                    borderRadius: '7px',
                },
            });

            renderChatsInFolder(folderContent, folderChats, currentFolderName);

            const isExpanded = folderExpansionState[currentFolderName] || false;
            folderContent.style.display = isExpanded ? 'block' : 'none';
            folderIconSpan.textContent = isExpanded ? '📂' : '📁';

            const buttonContainer = createElement('div', {
                styles: { display: 'flex', borderRadius: '7px' },
            });

            buttonContainer.appendChild(addChatButton);
            buttonContainer.appendChild(pinFolderButton);
            buttonContainer.appendChild(deleteButton);

            headerContainer.appendChild(folderButton);
            headerContainer.appendChild(buttonContainer);

            folderContainer.appendChild(headerContainer);
            folderContainer.appendChild(folderContent);

            itemsContainer.appendChild(folderContainer);
        }

        function renderItems() {
            itemsContainer.innerHTML = '';

            // folders first
            const sortedFolders = foldersData.slice().sort(sortItems);
            sortedFolders.forEach((folder) => {
                createFolder(folder.name, folder.chats, folder.pinned);
            });

            const sortedBookmarkChats = bookmarkChats.slice().sort(sortItems);

            if (sortedBookmarkChats.length > 0) {
                // Add a "Bookmarks 📎" section before showing chats
                const bookmarkHeader = document.createElement('div');
                bookmarkHeader.textContent = "\u00A0\u00A0📎\u00A0\u00A0Bookmarks";
                // bookmarkHeader.style.fontWeight = 'bold';
                bookmarkHeader.style.marginTop = '10px';
                bookmarkHeader.style.marginBottom = '5px';
                itemsContainer.appendChild(bookmarkHeader);
            }

            // then bookmarkChats
            sortedBookmarkChats.forEach((chat) => {
                const chatItem = createChatItem(chat, null, true);
                itemsContainer.appendChild(chatItem);
            });
        }

        renderItems();

        exploreGPTs.parentElement.insertAdjacentElement('afterend', mainHeader);
        mainHeader.insertAdjacentElement('afterend', itemsContainer);

        const titleElement = document.querySelector('title');
        const titleObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                const newTitle = mutation.target.textContent;
                updateChatNameIfExists(window.location.href, newTitle);
            });
        });
        titleObserver.observe(titleElement, { childList: true });

        function updateChatNameIfExists(href, newName) {
            let updated = false;
            bookmarkChats.forEach((chat) => {
                if (chat.href === href && chat.name !== newName) {
                    chat.name = newName;
                    updated = true;
                }
            });

            foldersData.forEach((folder) => {
                const chatIndex = folder.chats.findIndex((c) => c.href === href);
                if (chatIndex !== -1) {
                    if (folder.chats[chatIndex].name !== newName) {
                        folder.chats[chatIndex].name = newName;
                        updated = true;
                    }
                }
            });

            if (updated) {
                saveData({ foldersData, bookmarkChats });
                renderItems();
            }
        }
    }

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
