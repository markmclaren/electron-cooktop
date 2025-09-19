// XML Cooktop - Main Application Logic

class XMLCooktop {
    constructor() {
        this.editors = new Map(); // Map of file paths to Monaco editor instances
        this.activeEditor = null;
        this.activeFilePath = null;
        this.templates = null;
        this.unsavedChanges = new Set();
        
        this.init();
    }
    
    async init() {
        await this.initializeMonaco();
        this.setupEventListeners();
        await this.loadTemplates();
        this.setupMenuListeners();
        
        console.log('XML Cooktop initialized');
    }
    
    async initializeMonaco() {
        return new Promise((resolve) => {
            require.config({ 
                paths: { 
                    'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' 
                }
            });
            
            require(['vs/editor/editor.main'], () => {
                // Register XML language
                monaco.languages.register({ id: 'xml' });
                monaco.languages.register({ id: 'xsl' });
                
                // Set XML syntax highlighting
                monaco.languages.setMonarchTokensProvider('xml', {
                    tokenizer: {
                        root: [
                            [/<!--/, 'comment', '@comment'],
                            [/<\?.*\?>/, 'metatag'],
                            [/<\/?\w+/, 'tag', '@tag'],
                            [/[^<]+/, 'text']
                        ],
                        comment: [
                            [/-->/, 'comment', '@pop'],
                            [/./, 'comment']
                        ],
                        tag: [
                            [/\/?>/, 'tag', '@pop'],
                            [/\w+/, 'attribute.name'],
                            [/=/, 'delimiter'],
                            [/".*?"/, 'attribute.value'],
                            [/'.*?'/, 'attribute.value']
                        ]
                    }
                });
                
                // Set XSL syntax highlighting (extends XML)
                monaco.languages.setMonarchTokensProvider('xsl', {
                    tokenizer: {
                        root: [
                            [/<!--/, 'comment', '@comment'],
                            [/<\?.*\?>/, 'metatag'],
                            [/<\/?xsl:\w+/, 'keyword', '@tag'],
                            [/<\/?\w+/, 'tag', '@tag'],
                            [/[^<]+/, 'text']
                        ],
                        comment: [
                            [/-->/, 'comment', '@pop'],
                            [/./, 'comment']
                        ],
                        tag: [
                            [/\/?>/, { cases: { '@eos': { token: 'keyword', next: '@pop' }, '@default': { token: 'tag', next: '@pop' } } }],
                            [/\w+/, 'attribute.name'],
                            [/=/, 'delimiter'],
                            [/".*?"/, 'attribute.value'],
                            [/'.*?'/, 'attribute.value']
                        ]
                    }
                });
                
                // Define themes
                monaco.editor.defineTheme('cooktop-light', {
                    base: 'vs',
                    inherit: true,
                    rules: [
                        { token: 'comment', foreground: '008000' },
                        { token: 'keyword', foreground: '0000FF', fontStyle: 'bold' },
                        { token: 'tag', foreground: '800080' },
                        { token: 'attribute.name', foreground: 'FF0000' },
                        { token: 'attribute.value', foreground: '0000FF' },
                        { token: 'metatag', foreground: 'FF00FF' }
                    ],
                    colors: {
                        'editor.background': '#FFFFFF',
                        'editor.foreground': '#000000'
                    }
                });
                
                monaco.editor.setTheme('cooktop-light');
                resolve();
            });
        });
    }
    
    setupEventListeners() {
        // Toolbar buttons
        document.getElementById('btn-open').addEventListener('click', () => this.openFile());
        document.getElementById('btn-save').addEventListener('click', () => this.saveFile());
        document.getElementById('btn-save-as').addEventListener('click', () => this.saveFileAs());
        document.getElementById('btn-transform').addEventListener('click', () => this.transformXSLT());
        document.getElementById('btn-validate').addEventListener('click', () => this.validateXML());
        document.getElementById('btn-format').addEventListener('click', () => this.formatXML());
        
        // Welcome screen buttons
        document.getElementById('btn-welcome-new').addEventListener('click', () => this.newFile());
        document.getElementById('btn-welcome-open').addEventListener('click', () => this.openFile());
        
        // New file button
        document.getElementById('btn-new-file').addEventListener('click', () => this.newFile());
        
        // XPath console
        document.getElementById('btn-execute-xpath').addEventListener('click', () => this.executeXPath());
        document.getElementById('xpath-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.executeXPath();
            }
        });
        
        // Clear console
        document.getElementById('btn-clear-console').addEventListener('click', () => {
            document.getElementById('xpath-output').textContent = '';
        });
        
        // Modal close
        document.getElementById('modal-close').addEventListener('click', () => this.hideModal());
        document.getElementById('modal-cancel').addEventListener('click', () => this.hideModal());
        document.getElementById('modal-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.hideModal();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'n':
                        e.preventDefault();
                        this.newFile();
                        break;
                    case 'o':
                        e.preventDefault();
                        this.openFile();
                        break;
                    case 's':
                        e.preventDefault();
                        if (e.shiftKey) {
                            this.saveFileAs();
                        } else {
                            this.saveFile();
                        }
                        break;
                }
            } else if (e.key === 'F5') {
                e.preventDefault();
                this.transformXSLT();
            } else if (e.key === 'F7') {
                e.preventDefault();
                this.validateXML();
            }
        });
    }
    
    setupMenuListeners() {
        // Menu event listeners
        window.electronAPI.onMenuNewFile(() => this.newFile());
        window.electronAPI.onMenuOpenFile((event, filePath) => {
            if (filePath) {
                this.openFileByPath(filePath);
            } else {
                this.openFile();
            }
        });
        window.electronAPI.onMenuSaveFile(() => this.saveFile());
        window.electronAPI.onMenuTransformXSLT(() => this.transformXSLT());
        window.electronAPI.onMenuValidateXML(() => this.validateXML());
        window.electronAPI.onMenuFormatXML(() => this.formatXML());
    }
    
    async loadTemplates() {
        try {
            const result = await window.electronAPI.loadTemplates();
            if (result.success) {
                this.templates = result.templates;
                this.renderTemplateTree();
            } else {
                console.error('Failed to load templates:', result.error);
                // Create default templates structure
                this.templates = this.createDefaultTemplates();
                this.renderTemplateTree();
            }
        } catch (error) {
            console.error('Error loading templates:', error);
            this.templates = this.createDefaultTemplates();
            this.renderTemplateTree();
        }
    }
    
    createDefaultTemplates() {
        return {
            folders: [
                {
                    name: 'XML',
                    templates: [
                        { name: 'XML Document', content: '<?xml version="1.0" encoding="UTF-8"?>\\n<root>\\n\\t\\n</root>' },
                        { name: 'XML with DTD', content: '<?xml version="1.0" encoding="UTF-8"?>\\n<!DOCTYPE root SYSTEM "document.dtd">\\n<root>\\n\\t\\n</root>' }
                    ]
                },
                {
                    name: 'XSLT',
                    templates: [
                        { name: 'Basic XSLT', content: '<?xml version="1.0" encoding="UTF-8"?>\\n<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">\\n\\t<xsl:output method="xml" indent="yes"/>\\n\\t\\n\\t<xsl:template match="/">\\n\\t\\t\\n\\t</xsl:template>\\n\\t\\n</xsl:stylesheet>' },
                        { name: 'Identity Transform', content: '<?xml version="1.0" encoding="UTF-8"?>\\n<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">\\n\\t<xsl:output method="xml" indent="yes"/>\\n\\t\\n\\t<xsl:template match="@*|node()">\\n\\t\\t<xsl:copy>\\n\\t\\t\\t<xsl:apply-templates select="@*|node()"/>\\n\\t\\t</xsl:copy>\\n\\t</xsl:template>\\n\\t\\n</xsl:stylesheet>' }
                    ]
                }
            ]
        };
    }
    
    renderTemplateTree() {
        const container = document.getElementById('template-tree');
        container.innerHTML = '';

        if (!this.templates || !this.templates.folders) {
            container.innerHTML = '<div class="loading">No templates available</div>';
            return;
        }

        // Render folders as before
        this.templates.folders.forEach(folder => {
            const folderElement = document.createElement('div');
            folderElement.className = 'template-folder';

            const headerElement = document.createElement('div');
            headerElement.className = 'template-folder-header';
            headerElement.innerHTML = `
                <span class="template-folder-icon">▶</span>
                <span>${folder.name}</span>
            `;

            const itemsElement = document.createElement('div');
            itemsElement.className = 'template-items';

            if (folder.templates) {
                folder.templates.forEach(template => {
                    const itemElement = document.createElement('div');
                    itemElement.className = 'template-item';
                    itemElement.textContent = template.name;
                    itemElement.addEventListener('click', () => this.insertTemplate(template));
                    itemsElement.appendChild(itemElement);
                });
            }

            headerElement.addEventListener('click', () => {
                folderElement.classList.toggle('expanded');
            });

            folderElement.appendChild(headerElement);
            folderElement.appendChild(itemsElement);
            container.appendChild(folderElement);
        });

        // Render standalone templates at the bottom
        if (this.templates.standaloneTemplates && Array.isArray(this.templates.standaloneTemplates)) {
            const standaloneContainer = document.createElement('div');
            standaloneContainer.className = 'standalone-templates';

            this.templates.standaloneTemplates.forEach(template => {
                const itemElement = document.createElement('div');
                itemElement.className = 'template-item';
                itemElement.textContent = template.name;
                itemElement.addEventListener('click', () => this.insertTemplate(template));
                standaloneContainer.appendChild(itemElement);
            });

            container.appendChild(standaloneContainer);
        }
    }
    
    newFile() {
        const fileName = `Untitled-${Date.now()}.xml`;
        const content = '<?xml version="1.0" encoding="UTF-8"?>\\n<root>\\n\\t\\n</root>';
        
        this.createEditor(fileName, content, 'xml');
        this.hideWelcomeScreen();
        this.updateStatus(`New file: ${fileName}`);
    }
    
    async openFile() {
        // This will trigger the main process to show an open dialog
        // The result will come through the menu listener
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xml,.xsl,.xslt,.dtd';
        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                const content = await file.text();
                const language = this.getLanguageFromExtension(file.name);
                this.createEditor(file.name, content, language);
                this.hideWelcomeScreen();
                this.updateStatus(`Opened: ${file.name}`);
            }
        });
        input.click();
    }
    
    async openFileByPath(filePath) {
        try {
            const result = await window.electronAPI.readFile(filePath);
            if (result.success) {
                const fileName = filePath.split(/[\\/]/).pop();
                const language = this.getLanguageFromExtension(fileName);
                this.createEditor(fileName, result.content, language, filePath);
                this.hideWelcomeScreen();
                this.updateStatus(`Opened: ${fileName}`);
            } else {
                this.showError('Failed to open file', result.error);
            }
        } catch (error) {
            this.showError('Error opening file', error.message);
        }
    }
    
    async saveFile() {
        if (!this.activeEditor || !this.activeFilePath) {
            return this.saveFileAs();
        }
        
        try {
            const content = this.activeEditor.getValue();
            const result = await window.electronAPI.writeFile(this.activeFilePath, content);
            
            if (result.success) {
                this.unsavedChanges.delete(this.activeFilePath);
                this.updateTabTitle(this.activeFilePath);
                this.updateStatus(`Saved: ${this.activeFilePath.split(/[\\/]/).pop()}`);
            } else {
                this.showError('Failed to save file', result.error);
            }
        } catch (error) {
            this.showError('Error saving file', error.message);
        }
    }
    
    async saveFileAs() {
        if (!this.activeEditor) return;
        
        try {
            const fileName = this.activeFilePath ? this.activeFilePath.split(/[\\/]/).pop() : 'untitled.xml';
            const result = await window.electronAPI.saveFileDialog(fileName);
            
            if (!result.canceled) {
                const content = this.activeEditor.getValue();
                const writeResult = await window.electronAPI.writeFile(result.filePath, content);
                
                if (writeResult.success) {
                    // Update the editor's file path
                    const oldPath = this.activeFilePath;
                    this.activeFilePath = result.filePath;
                    
                    if (oldPath && this.editors.has(oldPath)) {
                        this.editors.set(result.filePath, this.editors.get(oldPath));
                        this.editors.delete(oldPath);
                    }
                    
                    this.unsavedChanges.delete(oldPath);
                    this.unsavedChanges.delete(result.filePath);
                    
                    this.updateTabTitle(result.filePath);
                    this.updateFileList();
                    this.updateStatus(`Saved as: ${result.filePath.split(/[\\/]/).pop()}`);
                } else {
                    this.showError('Failed to save file', writeResult.error);
                }
            }
        } catch (error) {
            this.showError('Error saving file', error.message);
        }
    }
    
    createEditor(fileName, content, language, filePath = null) {
        const editorContainer = document.getElementById('editor-container');
        
        // Create Monaco editor
        const editorElement = document.createElement('div');
        editorElement.className = 'monaco-editor-container';
        editorElement.style.display = 'none';
        editorContainer.appendChild(editorElement);
        
        const editor = monaco.editor.create(editorElement, {
            value: content,
            language: language,
            theme: 'cooktop-light',
            automaticLayout: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 13,
            lineNumbers: 'on',
            renderWhitespace: 'selection',
            wordWrap: 'on'
        });
        
        // Store editor reference
        const path = filePath || fileName;
        this.editors.set(path, {
            editor,
            element: editorElement,
            fileName,
            language,
            originalContent: content
        });
        
        // Set up change detection
        editor.onDidChangeModelContent(() => {
            this.unsavedChanges.add(path);
            this.updateTabTitle(path);
        });
        
        // Set up cursor position tracking
        editor.onDidChangeCursorPosition((e) => {
            this.updateCursorPosition(e.position);
        });
        
        // Switch to this editor
        this.switchToEditor(path);
        this.updateFileList();
        this.createTab(path, fileName);
    }
    
    switchToEditor(filePath) {
        // Hide current editor
        if (this.activeEditor) {
            const currentEditorData = this.editors.get(this.activeFilePath);
            if (currentEditorData) {
                currentEditorData.element.style.display = 'none';
            }
        }
        
        // Show new editor
        const editorData = this.editors.get(filePath);
        if (editorData) {
            editorData.element.style.display = 'block';
            this.activeEditor = editorData.editor;
            this.activeFilePath = filePath;
            
            // Focus the editor
            this.activeEditor.focus();
            
            // Update UI
            this.updateActiveTab(filePath);
            this.updateStatus(`Editing: ${editorData.fileName}`);
            this.updateLanguageStatus(editorData.language);
        }
    }
    
    createTab(filePath, fileName) {
        const tabBar = document.getElementById('tab-bar');
        
        // Remove placeholder if it exists
        const placeholder = tabBar.querySelector('.tab-placeholder');
        if (placeholder) {
            placeholder.remove();
        }
        
        // Create tab element
        const tab = document.createElement('div');
        tab.className = 'tab';
        tab.dataset.filePath = filePath;
        
        const tabName = document.createElement('span');
        tabName.className = 'tab-name';
        tabName.textContent = fileName;
        
        const tabClose = document.createElement('button');
        tabClose.className = 'tab-close';
        tabClose.innerHTML = '×';
        tabClose.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeTab(filePath);
        });
        
        tab.appendChild(tabName);
        tab.appendChild(tabClose);
        
        // Tab click handler
        tab.addEventListener('click', () => {
            this.switchToEditor(filePath);
        });
        
        tabBar.appendChild(tab);
        this.updateActiveTab(filePath);
    }
    
    updateActiveTab(filePath) {
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.filePath === filePath);
        });
    }
    
    updateTabTitle(filePath) {
        const tab = document.querySelector(`[data-file-path="${filePath}"]`);
        if (tab) {
            const tabName = tab.querySelector('.tab-name');
            const editorData = this.editors.get(filePath);
            const isModified = this.unsavedChanges.has(filePath);
            
            if (tabName && editorData) {
                tabName.textContent = editorData.fileName + (isModified ? ' •' : '');
            }
        }
    }
    
    closeTab(filePath) {
        const editorData = this.editors.get(filePath);
        if (!editorData) return;
        
        // Check for unsaved changes
        if (this.unsavedChanges.has(filePath)) {
            if (!confirm(`${editorData.fileName} has unsaved changes. Close anyway?`)) {
                return;
            }
        }
        
        // Remove tab
        const tab = document.querySelector(`[data-file-path="${filePath}"]`);
        if (tab) {
            tab.remove();
        }
        
        // Dispose editor
        editorData.editor.dispose();
        editorData.element.remove();
        
        // Remove from maps
        this.editors.delete(filePath);
        this.unsavedChanges.delete(filePath);
        
        // Switch to another editor or show welcome screen
        if (this.activeFilePath === filePath) {
            const remainingEditors = Array.from(this.editors.keys());
            if (remainingEditors.length > 0) {
                this.switchToEditor(remainingEditors[0]);
            } else {
                this.activeEditor = null;
                this.activeFilePath = null;
                this.showWelcomeScreen();
            }
        }
        
        this.updateFileList();
    }
    
    updateFileList() {
        const fileList = document.getElementById('file-list');
        fileList.innerHTML = '';
        
        if (this.editors.size === 0) {
            fileList.innerHTML = '<div class="empty-state">No files open</div>';
            return;
        }
        
        this.editors.forEach((editorData, filePath) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            if (filePath === this.activeFilePath) {
                fileItem.classList.add('active');
            }
            
            const isModified = this.unsavedChanges.has(filePath);
            
            fileItem.innerHTML = `
                <span class="file-icon">📄</span>
                <span class="file-name">${editorData.fileName}</span>
                ${isModified ? '<span class="file-modified">●</span>' : ''}
            `;
            
            fileItem.addEventListener('click', () => {
                this.switchToEditor(filePath);
            });
            
            fileList.appendChild(fileItem);
        });
    }
    
    insertTemplate(template) {
        if (!this.activeEditor) {
            this.newFile();
        }
        
        const position = this.activeEditor.getPosition();
        const content = template.content.replace(/\\\\n/g, '\\n').replace(/\\\\t/g, '\\t');
        
        this.activeEditor.executeEdits('insert-template', [{
            range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
            text: content
        }]);
        
        this.activeEditor.focus();
    }
    
    async transformXSLT() {
        if (!this.activeEditor) {
            this.showError('No file open', 'Please open an XML file first.');
            return;
        }
        
        // For now, we'll assume the current file is XML and ask for XSL file
        const xmlContent = this.activeEditor.getValue();
        
        // Simple file input for XSL file
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xsl,.xslt';
        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    const xslContent = await file.text();
                    const result = await window.electronAPI.transformXSLT(xmlContent, xslContent);
                    
                    if (result.success) {
                        // Create new editor with result
                        const resultFileName = `result-${Date.now()}.xml`;
                        this.createEditor(resultFileName, result.result, 'xml');
                        this.updateStatus('XSLT transformation completed');
                    } else {
                        this.showError('XSLT Transformation Failed', result.error);
                    }
                } catch (error) {
                    this.showError('Error reading XSL file', error.message);
                }
            }
        });
        input.click();
    }
    
    async validateXML() {
        if (!this.activeEditor) {
            this.showError('No file open', 'Please open an XML file first.');
            return;
        }
        
        try {
            const content = this.activeEditor.getValue();
            const result = await window.electronAPI.validateXML(content);
            
            if (result.success) {
                if (result.valid) {
                    this.updateStatus('XML is valid');
                    this.showInfo('Validation Result', 'The XML document is well-formed and valid.');
                } else {
                    this.showError('Validation Failed', result.error);
                }
            } else {
                this.showError('Validation Error', result.error);
            }
        } catch (error) {
            this.showError('Error validating XML', error.message);
        }
    }
    
    formatXML() {
        if (!this.activeEditor) return;
        
        // Use Monaco's built-in formatting
        this.activeEditor.getAction('editor.action.formatDocument').run();
        this.updateStatus('XML formatted');
    }
    
    executeXPath() {
        const xpathInput = document.getElementById('xpath-input');
        const xpathOutput = document.getElementById('xpath-output');
        const expression = xpathInput.value.trim();
        
        if (!expression) return;
        
        if (!this.activeEditor) {
            xpathOutput.textContent = 'Error: No XML document open';
            return;
        }
        
        try {
            // This is a simplified XPath implementation
            // In a real implementation, you'd use a proper XPath processor
            xpathOutput.textContent = `XPath: ${expression}\\nResult: [XPath evaluation would be implemented here]`;
        } catch (error) {
            xpathOutput.textContent = `Error: ${error.message}`;
        }
    }
    
    getLanguageFromExtension(fileName) {
        const ext = fileName.split('.').pop().toLowerCase();
        switch (ext) {
            case 'xsl':
            case 'xslt':
                return 'xsl';
            case 'dtd':
                return 'xml'; // Monaco doesn't have DTD, use XML
            default:
                return 'xml';
        }
    }
    
    hideWelcomeScreen() {
        document.getElementById('welcome-screen').style.display = 'none';
    }
    
    showWelcomeScreen() {
        document.getElementById('welcome-screen').style.display = 'flex';
        
        // Add placeholder back to tab bar if no tabs
        const tabBar = document.getElementById('tab-bar');
        if (tabBar.children.length === 0) {
            const placeholder = document.createElement('div');
            placeholder.className = 'tab-placeholder';
            placeholder.textContent = 'Open a file to start editing';
            tabBar.appendChild(placeholder);
        }
    }
    
    updateStatus(message) {
        document.getElementById('status-file').textContent = message;
    }
    
    updateCursorPosition(position) {
        document.getElementById('status-position').textContent = `Ln ${position.lineNumber}, Col ${position.column}`;
    }
    
    updateLanguageStatus(language) {
        document.getElementById('status-language').textContent = language.toUpperCase();
    }
    
    showModal(title, content) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-content').innerHTML = content;
        document.getElementById('modal-overlay').style.display = 'flex';
    }
    
    hideModal() {
        document.getElementById('modal-overlay').style.display = 'none';
    }
    
    showError(title, message) {
        this.showModal(title, `<p style="color: #dc2626;">${message}</p>`);
    }
    
    showInfo(title, message) {
        this.showModal(title, `<p>${message}</p>`);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new XMLCooktop();
});
