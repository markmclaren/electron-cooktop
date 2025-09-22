// XML Cooktop - Multi-Pane Interface Implementation

class XMLCooktop {
  constructor() {
    this.editors = {
      "xml-input": null,
      "xslt-input": null,
      "output": null,
    };
    this.currentPane = "xml-input";
    this.templates = null;
    this.hasUnsavedChanges = false;
    this.currentFiles = {
      "xml-input": null,
      "xslt-input": null,
    };

    this.init();
  }

  async init() {
  await this.initializeMonaco();
  this.initializeCooktop(); // Create editors first
  this.setupEventListeners();
  await this.loadTemplates();
  this.setupMenuListeners();
  this.setDefaultContent(); // Load sample data immediately
  this.hideWelcomeScreen(); // Hide welcome screen and show editor

  console.log("XML Cooktop initialized with sample data");
  }

  async initializeMonaco() {
    return new Promise((resolve) => {
      require.config({
        paths: {
          vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs",
        },
      });

      require(["vs/editor/editor.main"], () => {
        // Register languages
        monaco.languages.register({ id: "xml" });
        monaco.languages.register({ id: "xsl" });

        // Enhanced XML syntax highlighting
        monaco.languages.setMonarchTokensProvider("xml", {
          tokenizer: {
            root: [
              [/<!--/, "comment", "@comment"],
              [/<\?.*?\?>/, "metatag"],
              [/<!\[CDATA\[/, "cdata", "@cdata"],
              [/<\/?\w+/, "tag", "@tag"],
              [/&\w+;/, "entity"],
              [/[^<&]+/, "text"],
            ],
            comment: [
              [/-->/, "comment", "@pop"],
              [/./, "comment"],
            ],
            cdata: [
              [/\]\]>/, "cdata", "@pop"],
              [/./, "cdata"],
            ],
            tag: [
              [/\/?>/, "tag", "@pop"],
              [/\w+/, "attribute.name"],
              [/=/, "delimiter"],
              [/"([^"]*)"/, "attribute.value"],
              [/'([^']*)'/, "attribute.value"],
            ],
          },
        });

        // Enhanced XSL syntax highlighting
        monaco.languages.setMonarchTokensProvider("xsl", {
          tokenizer: {
            root: [
              [/<!--/, "comment", "@comment"],
              [/<\?.*?\?>/, "metatag"],
              [/<!\[CDATA\[/, "cdata", "@cdata"],
              [/<\/?xsl:\w+/, "keyword", "@xsltag"],
              [/<\/?\w+/, "tag", "@tag"],
              [/&\w+;/, "entity"],
              [/\{[^}]*\}/, "xpath"],
              [/[^<&{]+/, "text"],
            ],
            comment: [
              [/-->/, "comment", "@pop"],
              [/./, "comment"],
            ],
            cdata: [
              [/\]\]>/, "cdata", "@pop"],
              [/./, "cdata"],
            ],
            xsltag: [
              [/\/?>/, "keyword", "@pop"],
              [/\w+/, "attribute.name"],
              [/=/, "delimiter"],
              [/"([^"]*)"/, "attribute.value"],
              [/'([^']*)'/, "attribute.value"],
            ],
            tag: [
              [/\/?>/, "tag", "@pop"],
              [/\w+/, "attribute.name"],
              [/=/, "delimiter"],
              [/"([^"]*)"/, "attribute.value"],
              [/'([^']*)'/, "attribute.value"],
            ],
          },
        });

        // Define XML Cooktop theme
        monaco.editor.defineTheme("cooktop-theme", {
          base: "vs",
          inherit: true,
          rules: [
            { token: "comment", foreground: "008000", fontStyle: "italic" },
            { token: "keyword", foreground: "0000FF", fontStyle: "bold" },
            { token: "tag", foreground: "800080" },
            { token: "attribute.name", foreground: "FF0000" },
            { token: "attribute.value", foreground: "0000FF" },
            { token: "metatag", foreground: "FF00FF" },
            { token: "entity", foreground: "FF8000" },
            { token: "cdata", foreground: "808080" },
            { token: "xpath", foreground: "008080", fontStyle: "bold" },
          ],
          colors: {
            "editor.background": "#FFFFFF",
            "editor.foreground": "#000000",
            "editor.lineHighlightBackground": "#F0F8FF",
          },
        });

        monaco.editor.setTheme("cooktop-theme");
        resolve();
      });
    });
  }

  initializeCooktop() {
        // Create Monaco editors for 3-pane layout
        this.createEditor("xml-input", "xml");
        this.createEditor("xslt-input", "xsl");
        this.createEditor("output", "xml");
        
        // All editors are visible in 3-pane layout - no switching needed
  }

  // Generic async file loader
  async loadExampleFile(path) {
    try {
      const response = await fetch(path);
      if (!response.ok) throw new Error(`Failed to load ${path}`);
      return await response.text();
    } catch (err) {
      console.error(err);
      return '';
    }
  }

  createEditor(paneId, language) {
    const container = document.getElementById(`editor-${paneId}`);
    if (!container) return;

    const editor = monaco.editor.create(container, {
      value: "",
      language: language,
      theme: "cooktop-theme",
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 12,
      lineNumbers: "on",
      renderWhitespace: "selection",
      wordWrap: "on",
      readOnly: paneId === "output",
    });

    // Set up change detection for editable editors
    if (paneId !== "result") {
      editor.onDidChangeModelContent(() => {
        this.hasUnsavedChanges = true;
        this.updateStatus(`Modified: ${paneId}`);
      });
    }

    // Set up focus tracking to update current pane
    editor.onDidFocusEditorWidget(() => {
      this.currentPane = paneId;
      console.log(`Focus changed to pane: ${paneId}`);
      this.updateStatus(`Active pane: ${paneId}`);
      this.updateActivePaneVisual(paneId);
    });

    // Also track clicks on the editor container
    container.addEventListener('click', () => {
      this.currentPane = paneId;
      console.log(`Click focus changed to pane: ${paneId}`);
      editor.focus(); // Ensure Monaco editor gets focus too
    });

    // Set up cursor position tracking
    editor.onDidChangeCursorPosition((e) => {
      if (this.currentPane === paneId) {
        this.updateCursorPosition(e.position);
      }
    });

    this.editors[paneId] = editor;
  }

  setDefaultContent() {
    // Load sample XML and XSLT for immediate testing
    const sampleXML = `<?xml version="1.0" encoding="UTF-8"?>
<catalog>
  <cd>
    <title>Empire Burlesque</title>
    <artist>Bob Dylan</artist>
    <country>USA</country>
    <company>Columbia</company>
    <price>10.90</price>
    <year>1985</year>
  </cd>
  <cd>
    <title>Hide your heart</title>
    <artist>Bonnie Tyler</artist>
    <country>UK</country>
    <company>CBS Records</company>
    <price>9.90</price>
    <year>1988</year>
  </cd>
  <cd>
    <title>Greatest Hits</title>
    <artist>Dolly Parton</artist>
    <country>USA</country>
    <company>RCA</company>
    <price>9.90</price>
    <year>1982</year>
  </cd>
</catalog>`;

    const sampleXSLT = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="/">
    <html>
    <body>
      <h2>My CD Collection</h2>
      <table border="1">
        <tr bgcolor="#9acd32">
          <th>Title</th>
          <th>Artist</th>
          <th>Country</th>
          <th>Price</th>
        </tr>
        <xsl:for-each select="catalog/cd">
          <tr>
            <td><xsl:value-of select="title"/></td>
            <td><xsl:value-of select="artist"/></td>
            <td><xsl:value-of select="country"/></td>
            <td><xsl:value-of select="price"/></td>
          </tr>
        </xsl:for-each>
      </table>
    </body>
    </html>
  </xsl:template>
</xsl:stylesheet>`;

    if (this.editors["xml-input"]) {
      this.editors["xml-input"].setValue(sampleXML);
    }
    if (this.editors["xslt-input"]) {
      this.editors["xslt-input"].setValue(sampleXSLT);
    }
  }

  setupEventListeners() {
    // Dark mode toggle
    const darkToggleBtn = document.getElementById("btn-toggle-dark");
    if (darkToggleBtn) {
      darkToggleBtn.addEventListener("click", () => {
        document.body.classList.toggle("dark");
        const isDark = document.body.classList.contains("dark");
        
        // Update Monaco editor theme
        if (window.monaco) {
          if (isDark) {
            window.monaco.editor.setTheme("vs-dark");
          } else {
            window.monaco.editor.setTheme("cooktop-theme");
          }
        }
        
        // Update button icon and tooltip
        const icon = darkToggleBtn.querySelector('i');
        if (isDark) {
          // Switch to sun icon for dark mode (to indicate "switch to light")
          icon.className = 'bi bi-sun';
          darkToggleBtn.title = 'Switch to Light Mode';
        } else {
          // Switch to moon icon for light mode (to indicate "switch to dark")
          icon.className = 'bi bi-moon';
          darkToggleBtn.title = 'Switch to Dark Mode';
        }
      });
    }
    // Pane buttons functionality moved to generic handlers
    // TODO: Add event delegation for pane control buttons
  // Toolbar buttons (New, Open, Save, Save As removed)
    document.getElementById("btn-format").addEventListener("click", () => this.formatCurrentEditor());
    document.getElementById("btn-validate").addEventListener("click", () => this.validateXML());
    document.getElementById("btn-run-xslt").addEventListener("click", () => this.runXSLT());
    document.getElementById("btn-run-xslt-save").addEventListener("click", () => this.runXSLTAndSave());

    // Sidebar toggle (Code Bits button)
    document.getElementById("btn-toggle-sidebar").addEventListener("click", () => {
      const sidebar = document.getElementById("sidebar");
      const mainLayout = document.querySelector(".main-layout");
      const collapsed = sidebar.classList.toggle("collapsed");
      if (collapsed) {
        mainLayout.classList.add("sidebar-collapsed");
      } else {
        mainLayout.classList.remove("sidebar-collapsed");
      }
      this.updateStatus(collapsed ? "Code Bits sidebar hidden" : "Code Bits sidebar shown");
    });

    // Remove tab switching for 3-pane layout
    // Tabs are not needed in the simplified layout

    // XPath console not included in 3-pane layout
    // XPath functionality removed for simplified interface

    // Pane control buttons - using specific IDs like original implementation
    
    // Source XML copy button
    const copySourceBtn = document.getElementById("btn-copy-source");
    if (copySourceBtn) copySourceBtn.addEventListener("click", () => {
      const xmlText = this.editors['xml-input']?.getValue() || '';
      if (xmlText) {
        navigator.clipboard.writeText(xmlText).then(() => {
          console.log('Source XML copied to clipboard');
        });
      }
    });

    // Source XML clear button
    const clearSourceBtn = document.getElementById("btn-clear-source");
    if (clearSourceBtn) clearSourceBtn.addEventListener("click", () => {
      const currentValue = this.editors['xml-input']?.getValue() || '';
      if (currentValue.trim().length > 0) {
        if (confirm("Are you sure you want to clear the XML input?")) {
          this.editors['xml-input']?.setValue('');
        }
      }
    });

    // Stylesheet copy button
    const copyStylesheetBtn = document.getElementById("btn-copy-stylesheet");
    if (copyStylesheetBtn) copyStylesheetBtn.addEventListener("click", () => {
      const xslText = this.editors['xslt-input']?.getValue() || '';
      if (xslText) {
        navigator.clipboard.writeText(xslText).then(() => {
          console.log('Stylesheet XSL copied to clipboard');
        });
      }
    });

    // Stylesheet clear button
    const clearStylesheetBtn = document.getElementById("btn-clear-stylesheet");
    if (clearStylesheetBtn) clearStylesheetBtn.addEventListener("click", () => {
      const currentValue = this.editors['xslt-input']?.getValue() || '';
      if (currentValue.trim().length > 0) {
        if (confirm("Are you sure you want to clear the Stylesheet pane?")) {
          this.editors['xslt-input']?.setValue('');
        }
      }
    });

    // Output copy button
    const copyOutputBtn = document.getElementById("btn-copy-output");
    if (copyOutputBtn) copyOutputBtn.addEventListener("click", () => {
      const outputText = this.editors['output']?.getValue() || '';
      if (outputText) {
        navigator.clipboard.writeText(outputText).then(() => {
          console.log('Output copied to clipboard');
        });
      }
    });

    // Open and Save button event listeners
    
    // XML Open button
    const openXmlBtn = document.getElementById("btn-open-xml");
    if (openXmlBtn) openXmlBtn.addEventListener("click", () => {
      this.currentPane = 'xml-input';
      this.openFile();
    });

    // XML Save button
    const saveXmlBtn = document.getElementById("btn-save-xml");
    if (saveXmlBtn) saveXmlBtn.addEventListener("click", () => {
      this.currentPane = 'xml-input';
      this.saveFile();
    });

    // XSLT Open button
    const openXsltBtn = document.getElementById("btn-open-xslt");
    if (openXsltBtn) openXsltBtn.addEventListener("click", () => {
      this.currentPane = 'xslt-input';
      this.openFile();
    });

    // XSLT Save button
    const saveXsltBtn = document.getElementById("btn-save-xslt");
    if (saveXsltBtn) saveXsltBtn.addEventListener("click", () => {
      this.currentPane = 'xslt-input';
      this.saveFile();
    });

    // Output Save button
    const saveOutputBtn = document.getElementById("btn-save-output");
    if (saveOutputBtn) saveOutputBtn.addEventListener("click", () => {
      this.currentPane = 'output';
      this.saveOutput();
    });
    // Tab switching for output pane
    console.log("Setting up tab event listeners...");
    const tabElements = document.querySelectorAll('.pane-tabs .tab');
    console.log("Found tab elements:", tabElements.length);
    
    tabElements.forEach(tab => {
      // Remove any existing listeners to prevent duplicates
      tab.replaceWith(tab.cloneNode(true));
    });
    
    // Re-select after cloning and add fresh listeners
    const newTabElements = document.querySelectorAll('.pane-tabs .tab');
    console.log("Re-selected tab elements:", newTabElements.length);
    
    newTabElements.forEach((tab, index) => {
      console.log(`Adding click listener to tab ${index}:`, tab);
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const tabId = e.currentTarget.dataset.tab;
        console.log("Tab clicked:", tabId);
        this.switchOutputTab(tabId);
      });
    });

    // HTML Preview button
    const previewBtn = document.getElementById("btn-preview-html");
    if (previewBtn) {
      previewBtn.addEventListener("click", () => this.updateHTMLPreview());
    }

    // Welcome screen
    document.getElementById("btn-welcome-new").addEventListener("click", () => {
      this.hideWelcomeScreen();
      this.initializeCooktop();
      this.newDocument();
    });
    document.getElementById("btn-welcome-open").addEventListener("click", () => {
      this.hideWelcomeScreen();
      this.initializeCooktop();
      this.openFile();
    });
    document.getElementById("btn-welcome-sample").addEventListener("click", () => {
      this.hideWelcomeScreen();
      this.initializeCooktop();
      this.loadSampleData();
    });

    // Modal close
    document.getElementById("modal-close").addEventListener("click", () => this.hideModal());
    document.getElementById("modal-ok").addEventListener("click", () => this.hideModal());
    document.getElementById("modal-overlay").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) {
        this.hideModal();
      }
    });

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "n":
            e.preventDefault();
            this.newDocument();
            break;
          case "o":
            e.preventDefault();
            this.openFile();
            break;
          case "s":
            e.preventDefault();
            if (e.shiftKey) {
              this.saveFileAs();
            } else {
              this.saveFile();
            }
            break;
        }
      } else {
        switch (e.key) {
          case "F5":
            e.preventDefault();
            this.runXSLT();
            break;
          case "F7":
            e.preventDefault();
            this.validateXML();
            break;
          case "F8":
            e.preventDefault();
            this.formatCurrentEditor();
            break;
        }
      }
    });
  }

  setupMenuListeners() {
    // Menu event listeners
    window.electronAPI.onMenuNewFile(() => this.newDocument());
    window.electronAPI.onMenuOpenFile((event, filePath) => {
      if (filePath) {
        this.openFileByPath(filePath);
      } else {
        this.openFile();
      }
    });
    window.electronAPI.onMenuSaveFile(() => this.saveFile());
    window.electronAPI.onMenuTransformXSLT(() => this.runXSLT());
    window.electronAPI.onMenuValidateXML(() => this.validateXML());
    window.electronAPI.onMenuFormatXML(() => this.formatCurrentEditor());
    window.electronAPI.onMenuLoadSampleData(() => this.loadSampleData());
    // Listen for menu-load-example event from main process
    if (window.electronAPI && window.electronAPI.onMenuLoadExample) {
      console.log('[DEBUG] Setting up onMenuLoadExample listener');
      window.electronAPI.onMenuLoadExample(async (event, data) => {
        console.log('[DEBUG] menu-load-example event received:', data);
        try {
          // Use the XML and XSL content directly (already loaded by main process)
          const xmlContent = data.xml;
          const xslContent = data.xsl;
          // Set content in the appropriate panes (updated for 3-pane layout)
          this.editors["xml-input"].setValue(xmlContent);
          this.editors["xslt-input"].setValue(xslContent);
          // No pane switching needed in 3-pane layout - all panes are visible
          this.updateStatus(`Loaded example: ${data.name}`);
        } catch (err) {
          console.error('[DEBUG] Error loading example:', err);
          this.showError('Example Load Error', err.message || String(err));
        }
      });
    }
  }

  async loadTemplates() {
    try {
      const result = await window.electronAPI.loadTemplates();
      if (result.success) {
        this.templates = result.templates;
        this.renderTemplateTree();
      } else {
        console.error("Failed to load templates:", result.error);
        this.templates = this.createDefaultTemplates();
        this.renderTemplateTree();
      }
    } catch (error) {
      console.error("Error loading templates:", error);
      this.templates = this.createDefaultTemplates();
      this.renderTemplateTree();
    }
  }

  createDefaultTemplates() {
    return {
      folders: [
        {
          name: "XML",
          templates: [
            {
              name: "XML Document",
              content:
                '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n\t\n</root>',
            },
            {
              name: "XML with DTD",
              content:
                '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE root SYSTEM "document.dtd">\n<root>\n\t\n</root>',
            },
          ],
        },
        {
          name: "XSLT",
          templates: [
            {
              name: "Basic XSLT",
              content:
                '<?xml version="1.0" encoding="UTF-8"?>\\n<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">\\n\\t<xsl:output method="xml" indent="yes"/>\\n\\t\\n\\t<xsl:template match="/">\\n\\t\\t\\n\\t</xsl:template>\\n\\t\\n</xsl:stylesheet>',
            },
          ],
        },
      ],
    };
  }

  renderTemplateTree() {
    const container = document.getElementById("template-tree");
    container.innerHTML = "";

    if (!this.templates || !this.templates.folders) {
      container.innerHTML = '<div class="loading">No templates available</div>';
      return;
    }

    this.templates.folders.forEach((folder) => {
      const folderElement = document.createElement("div");
      folderElement.className = "template-folder"; // collapsed by default

      const headerElement = document.createElement("div");
      headerElement.className = "template-folder-header";
      headerElement.innerHTML = `
        <span class="template-folder-icon">▶</span>
        <span>${folder.name}</span>
      `;

      const itemsElement = document.createElement("div");
      itemsElement.className = "template-items";

      if (folder.templates) {
        folder.templates.forEach((template) => {
          const itemElement = document.createElement("div");
          itemElement.className = "template-item";
          itemElement.textContent = template.name;
          itemElement.addEventListener("click", () => {
            if (itemElement.disabled) return;
            itemElement.disabled = true;
            this.insertTemplate(template);
            setTimeout(() => {
              itemElement.disabled = false;
            }, 500);
          });
          itemsElement.appendChild(itemElement);
        });
      }

      headerElement.addEventListener("click", () => {
        // Toggle only this folder
        folderElement.classList.toggle("expanded");
      });

      folderElement.appendChild(headerElement);
      folderElement.appendChild(itemsElement);
      container.appendChild(folderElement);
    });

    // Render standalone templates at the bottom
    if (
      this.templates.standaloneTemplates &&
      Array.isArray(this.templates.standaloneTemplates)
    ) {
      const standaloneContainer = document.createElement("div");
      standaloneContainer.className = "standalone-templates";

      this.templates.standaloneTemplates.forEach((template) => {
        const itemElement = document.createElement("div");
        itemElement.className = "template-item";
        itemElement.textContent = template.name;
        itemElement.addEventListener("click", () => {
          if (itemElement.disabled) return;
          itemElement.disabled = true;
          this.insertTemplate(template);
          setTimeout(() => {
            itemElement.disabled = false;
          }, 500);
        });
        standaloneContainer.appendChild(itemElement);
      });

      container.appendChild(standaloneContainer);
    }
  }

  switchPane(paneId) {
    // Hide all panes
    document.querySelectorAll(".cooktop-pane").forEach((pane) => {
      pane.classList.remove("active");
    });

    // Remove active class from all tabs
    document.querySelectorAll(".cooktop-tab").forEach((tab) => {
      tab.classList.remove("active");
    });

    // Show selected pane
    const pane = document.getElementById(`pane-${paneId}`);
    const tab = document.querySelector(`[data-pane="${paneId}"]`);

    if (pane && tab) {
      pane.classList.add("active");
      tab.classList.add("active");
      this.currentPane = paneId;

      // Focus the editor if it exists
      if (this.editors[paneId]) {
        setTimeout(() => {
          this.editors[paneId].focus();
          this.updateCursorPosition(this.editors[paneId].getPosition());
        }, 100);
      }

      this.updateStatus(`Active pane: ${paneId}`);
    }
  }

  updateActivePaneVisual(activePaneId) {
    // Remove active class from all editor panes
    document.querySelectorAll('.editor-pane').forEach(pane => {
      pane.classList.remove('active');
    });

    // Add active class to the current pane
    const activePaneElement = document.querySelector(`#pane-${activePaneId}`) || 
                             document.querySelector(`[data-pane="${activePaneId}"]`)?.closest('.editor-pane') ||
                             document.querySelector(`#editor-${activePaneId}`)?.closest('.editor-pane');
    
    if (activePaneElement) {
      activePaneElement.classList.add('active');
      
      // Add a brief highlight effect to make the selection more noticeable
      const header = activePaneElement.querySelector('.pane-header');
      if (header) {
        header.style.transition = 'none';
        header.style.transform = 'scale(1.02)';
        setTimeout(() => {
          header.style.transition = 'transform 0.2s ease, background-color 0.3s ease, border-color 0.3s ease';
          header.style.transform = 'scale(1)';
        }, 100);
      }
    }
  }

  async runXSLT() {
    try {
      const xmlContent = this.editors["xml-input"].getValue();
      const xslContent = this.editors["xslt-input"].getValue();

      if (!xmlContent.trim()) {
        this.showError(
          "No XML Content",
          "Please enter XML content in the XML input pane."
        );
        return;
      }

      if (!xslContent.trim()) {
        this.showError(
          "No XSLT Content",
          "Please enter XSLT content in the XSLT input pane."
        );
        return;
      }

      this.updateStatus("Running XSLT transformation...");

      let result;
      // Check if we're in Electron environment
      if (window.electronAPI && window.electronAPI.transformXSLT) {
        // Use Electron's XSLT processor
        result = await window.electronAPI.transformXSLT(xmlContent, xslContent);
      } else {
        // Fallback for browser environment or if electronAPI is not available
        try {
          const transformedResult = this.transformXSLTClient(xmlContent, xslContent);
          result = { success: true, result: transformedResult };
        } catch (error) {
          result = { success: false, error: error.message };
        }
      }

      if (result.success) {
        // Update output pane
        this.editors["output"].setValue(result.result);

        this.updateStatus("XSLT transformation completed successfully");
      } else {
        this.showError("XSLT Transformation Failed", result.error);
        this.updateStatus("XSLT transformation failed");
      }
    } catch (error) {
      this.showError("Error during XSLT transformation", error.message);
      this.updateStatus("XSLT transformation error");
    }
  }

  transformXSLTClient(xmlString, xslString) {
    // Client-side XSLT transformation using browser APIs
    const parser = new DOMParser();
    const xsltProcessor = new XSLTProcessor();

    // Parse XML and XSL
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    const xslDoc = parser.parseFromString(xslString, "text/xml");

    // Check for parsing errors
    if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
      throw new Error("Invalid XML: " + xmlDoc.getElementsByTagName("parsererror")[0].textContent);
    }

    if (xslDoc.getElementsByTagName("parsererror").length > 0) {
      throw new Error("Invalid XSLT: " + xslDoc.getElementsByTagName("parsererror")[0].textContent);
    }

    // Import stylesheet and transform
    xsltProcessor.importStylesheet(xslDoc);
    const resultDoc = xsltProcessor.transformToDocument(xmlDoc);

    // Serialize result
    const serializer = new XMLSerializer();
    return serializer.serializeToString(resultDoc);
  }

  async runXSLTAndSave() {
    await this.runXSLT();

    const result = this.editors["output"].getValue();
    if (result.trim()) {
      try {
        const saveResult = await window.electronAPI.saveFileDialog(
          "result.html"
        );
        if (!saveResult.canceled) {
          const writeResult = await window.electronAPI.writeFile(
            saveResult.filePath,
            result
          );
          if (writeResult.success) {
            this.updateStatus(`Result saved to: ${saveResult.filePath}`);
          } else {
            this.showError("Save Failed", writeResult.error);
          }
        }
      } catch (error) {
        this.showError("Error saving result", error.message);
      }
    }
  }

  async validateXML() {
    const currentEditor = this.editors[this.currentPane];
    if (!currentEditor) {
      this.showError("No Editor", "No active editor to validate.");
      return;
    }

    try {
      const content = currentEditor.getValue();
      const result = await window.electronAPI.validateXML(content);

      // Remove previous error markers
      const model = currentEditor ? currentEditor.getModel() : null;
      if (model && window.monaco) {
        window.monaco.editor.setModelMarkers(model, 'xml', []);
      }
      if (result.success) {
        if (result.valid) {
          this.updateStatus("XML is valid and well-formed");
          this.showInfo(
            "Validation Result",
            "The XML document is well-formed and valid."
          );
        } else {
          let errorMsg = result.error;
          if (typeof result.line === 'number' && typeof result.col === 'number') {
            // errorMsg += `\n(Line ${result.line}, Column ${result.col})`;
            // Highlight error in editor
            const model = currentEditor.getModel();
            if (model && window.monaco) {
              window.monaco.editor.setModelMarkers(model, 'xml', [{
                startLineNumber: result.line,
                endLineNumber: result.line,
                startColumn: result.col,
                endColumn: result.col + 1,
                message: result.error,
                severity: window.monaco.MarkerSeverity.Error
              }]);
            }
          }
          this.showError("Validation Failed", errorMsg);
        }
      } else {
        let errorMsg = result.error;
        if (typeof result.line === 'number' && typeof result.col === 'number') {
          // errorMsg += `\n(Line ${result.line}, Column ${result.col})`;
          // Highlight error in editor
          const model = currentEditor.getModel();
          if (model && window.monaco) {
            window.monaco.editor.setModelMarkers(model, 'xml', [{
              startLineNumber: result.line,
              endLineNumber: result.line,
              startColumn: result.col,
              endColumn: result.col + 1,
              message: result.error,
              severity: window.monaco.MarkerSeverity.Error
            }]);
          }
        }
        this.showError("Validation Error", errorMsg);
      }
    } catch (error) {
      this.showError("Error validating XML", error.message);
    }
  }

  formatCurrentEditor() {
    const currentEditor = this.editors[this.currentPane];
    if (currentEditor) {
      // Temporarily make result pane editable for formatting
      const wasReadOnly = currentEditor.getRawOptions().readOnly;
      if (this.currentPane === "result" && wasReadOnly) {
        currentEditor.updateOptions({ readOnly: false });
      }
      // Use Prettier for XML and XSL formatting
      const content = currentEditor.getValue();
      let formatted = content;
      try {
        if (window.xmlFormatter) {
          console.log('xml-formatter is loaded, attempting to format...');
          const before = content;
          // Use xml-formatter for XML and XSL files
          const options = {
            indentation: '  ',
            collapseContent: true,
            lineSeparator: '\n',
            stripComments: false
          };
          let result;
          try {
            result = window.xmlFormatter(content, options);
          } catch (e) {
            console.error('xml-formatter error:', e);
            this.updateStatus(`${this.currentPane} formatting error: ${e.message}`);
            return;
          }
          console.log('xml-formatter output:', result);
          if (before === result) {
            this.updateStatus(`${this.currentPane} formatted (no changes by xml-formatter)`);
          } else {
            this.updateStatus(`${this.currentPane} formatted with xml-formatter`);
          }
          currentEditor.setValue(result);
        } else {
          this.updateStatus('xml-formatter not loaded');
          throw new Error("xml-formatter not loaded");
        }
      } catch (e) {
        console.error('xml-formatter formatting error:', e);
        currentEditor.getAction("editor.action.formatDocument").run();
        this.updateStatus(`${this.currentPane} formatted (fallback)`);
      }
  // Remove duplicate setValue; already set above after formatting
      // Restore read-only state for result pane
      if (this.currentPane === "result" && wasReadOnly) {
        currentEditor.updateOptions({ readOnly: true });
      }
    }
  }

  executeXPath() {
    const xpathInput = document.getElementById("xpath-input");
    const xpathOutput = document.getElementById("xpath-output");
    const expression = xpathInput.value.trim();

    if (!expression) return;

    const xmlContent = this.editors["xml-input"].getValue();
    if (!xmlContent.trim()) {
      xpathOutput.textContent = "Error: No XML document loaded in source pane";
      return;
    }

    try {
      // This is a simplified XPath implementation
      // In a real implementation, you'd use a proper XPath processor
      xpathOutput.textContent = `XPath Expression: ${expression}\\n\\nNote: Full XPath evaluation requires additional implementation.\\nThis is a placeholder for XPath functionality.\\n\\nXML Source Preview:\\n${xmlContent.substring(
        0,
        200
      )}...`;
    } catch (error) {
      xpathOutput.textContent = `Error: ${error.message}`;
    }
  }

  insertTemplate(template) {
    const currentEditor = this.editors[this.currentPane];
    if (currentEditor) {
      // Temporarily make result pane editable for formatting
      const wasReadOnly = currentEditor.getRawOptions().readOnly;
      if (this.currentPane === "result" && wasReadOnly) {
        currentEditor.updateOptions({ readOnly: false });
      }
      // Insert template content at current cursor position
      const templateContent = template.content || "";
      const selection = currentEditor.getSelection();
      const position = selection ? selection.getStartPosition() : currentEditor.getPosition();
      currentEditor.executeEdits("insert-template", [
        {
          range: new monaco.Range(
            position.lineNumber,
            position.column,
            position.lineNumber,
            position.column
          ),
          text: templateContent,
        },
      ]);
      currentEditor.focus();
      this.updateStatus(`Template "${template.name}" inserted`);
    }
  }

  newDocument() {
    this.editors["xml-input"].setValue(
      '<?xml version="1.0" encoding="UTF-8"?>\\n<root>\\n\\t\\n</root>'
    );
    this.editors["xslt-input"].setValue(
      '<?xml version="1.0" encoding="UTF-8"?>\\n<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">\\n\\t<xsl:output method="xml" indent="yes"/>\\n\\t\\n\\t<xsl:template match="/">\\n\\t\\t\\n\\t</xsl:template>\\n\\t\\n</xsl:stylesheet>'
    );
    this.editors["xml-input"].setValue(
      '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n\t\n</root>'
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
    );
    this.editors["xslt-input"].setValue(
      '<?xml version="1.0" encoding="UTF-8"?>\n<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">\n\t<xsl:output method="xml" indent="yes"/>\n\t\n\t<xsl:template match="/">\n\t\t\n\t</xsl:template>\n\t\n</xsl:stylesheet>'
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
    );
    this.currentFiles["xml-input"] = null;
    this.currentFiles["xslt-input"] = null;
    this.hasUnsavedChanges = false;

    this.switchPane("source");
    this.updateStatus("New document created");
  }

  loadSampleData() {
        // Load Book Catalog sample only when user requests
        this.loadExampleFile('../examples/book-catalog.xml').then(xml => {
            this.editors["xml-input"].setValue(xml);
        });
        this.loadExampleFile('../examples/book-catalog.xsl').then(xsl => {
            this.editors["xslt-input"].setValue(xsl);
        });
        // No pane switching needed in 3-pane layout
        this.updateStatus("Sample data loaded");
    }

  async openFile() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xml,.xsl,.xslt";
    input.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (file) {
        const content = await file.text();
        
        // Load into the current pane
        if (this.currentPane && this.editors[this.currentPane]) {
          this.editors[this.currentPane].setValue(content);
          this.currentFiles[this.currentPane] = file.name;
          this.updateStatus(`Opened: ${file.name}`);
        } else {
          // Fallback to extension-based loading if no current pane
          const extension = file.name.split(".").pop().toLowerCase();
          if (extension === "xml") {
            this.editors["xml-input"].setValue(content);
            this.currentFiles["xml-input"] = file.name;
          } else if (extension === "xsl" || extension === "xslt") {
            this.editors["xslt-input"].setValue(content);
            this.currentFiles["xslt-input"] = file.name;
          }
          this.updateStatus(`Opened: ${file.name}`);
        }
      }
    });
    input.click();
  }

  async openFileByPath(filePath) {
    try {
      // Use the Electron API to read the file
      const result = await window.electronAPI.readFile(filePath);
      if (result.success) {
        const fileName = filePath.split("/").pop() || filePath.split("\\").pop();

        // Load into the current pane
        if (this.currentPane && this.editors[this.currentPane]) {
          this.editors[this.currentPane].setValue(result.content);
          this.currentFiles[this.currentPane] = fileName;
          this.updateStatus(`Opened: ${fileName}`);
        } else {
          // Fallback to extension-based loading if no current pane
          const extension = filePath.split(".").pop().toLowerCase();
          if (extension === "xml") {
            this.editors["xml-input"].setValue(result.content);
            this.currentFiles["xml-input"] = fileName;
          } else if (extension === "xsl" || extension === "xslt") {
            this.editors["xslt-input"].setValue(result.content);
            this.currentFiles["xslt-input"] = fileName;
          }
          this.updateStatus(`Opened: ${fileName}`);
        }
      } else {
        this.showError("File Open Error", result.error);
      }
    } catch (error) {
      this.showError("Error opening file", error.message);
    }
  }

  async saveFile() {
    const currentEditor = this.editors[this.currentPane];
    if (!currentEditor) {
      this.showError("Cannot Save", "Please select an editable pane to save.");
      return;
    }

    // Don't allow saving the output pane
    if (this.currentPane === "output") {
      this.showError("Cannot Save", "Cannot save the output pane. Use the Save Output button instead.");
      return;
    }

    const content = currentEditor.getValue();
    let extension = ".txt";
    let defaultName = "untitled.txt";

    // Determine file extension and default name based on current pane
    if (this.currentPane === "xml-input") {
      extension = ".xml";
      defaultName = "document.xml";
    } else if (this.currentPane === "xslt-input") {
      extension = ".xsl";
      defaultName = "transform.xsl";
    }

    try {
      const result = await window.electronAPI.saveFileDialog(defaultName);
      if (!result.canceled) {
        const writeResult = await window.electronAPI.writeFile(
          result.filePath,
          content
        );
        if (writeResult.success) {
          this.currentFiles[this.currentPane] = result.filePath;
          this.hasUnsavedChanges = false;
          this.updateStatus(`Saved: ${result.filePath}`);
        } else {
          this.showError("Save Failed", writeResult.error);
        }
      }
    } catch (error) {
      this.showError("Error saving file", error.message);
    }
  }

  async saveFileAs() {
    await this.saveFile();
  }

  async saveOutput() {
    const content = this.outputContent || '';
    
    if (!content.trim()) {
      this.showError("Cannot Save", "No output to save. Please transform first.");
      return;
    }

    // Determine output format and default filename
    const isHTML = this.activeTab === 'preview';
    const extension = isHTML ? '.html' : '.xml';
    const defaultName = isHTML ? 'output.html' : 'output.xml';

    try {
      const result = await window.electronAPI.saveFileDialog(defaultName);
      if (!result.canceled) {
        const writeResult = await window.electronAPI.writeFile(
          result.filePath,
          content
        );
        if (writeResult.success) {
          this.updateStatus(`Saved output: ${result.filePath}`);
        } else {
          this.showError("Save Failed", writeResult.error);
        }
      }
    } catch (error) {
      this.showError("Error saving output", error.message);
    }
  }

  toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const mainLayout = document.querySelector(".main-layout");
    const collapsed = sidebar.classList.toggle("collapsed");
    if (collapsed) {
      mainLayout.classList.add("sidebar-collapsed");
    } else {
      mainLayout.classList.remove("sidebar-collapsed");
    }
  }

  showWelcomeScreen() {
    document.getElementById("welcome-overlay").style.display = "flex";
  }

  hideWelcomeScreen() {
    document.getElementById("welcome-overlay").style.display = "none";
  }

  updateStatus(message) {
    document.getElementById("status-file").textContent = message;
  }

  updateCursorPosition(position) {
    document.getElementById(
      "status-position"
    ).textContent = `Ln ${position.lineNumber}, Col ${position.column}`;
  }

  showModal(title, content) {
    document.getElementById("modal-title").textContent = title;
    document.getElementById("modal-content").innerHTML = content;
    document.getElementById("modal-overlay").style.display = "flex";
  }

  hideModal() {
    document.getElementById("modal-overlay").style.display = "none";
  }

  // Tab switching for output pane
  switchOutputTab(tabName) {
    console.log("Switching to tab:", tabName);
    
    // Prevent recursive calls
    if (this._switchingTab) {
      console.log("Already switching tabs, ignoring");
      return;
    }
    this._switchingTab = true;
    
    // Update tab elements - use more specific selector
    document.querySelectorAll('.pane-tabs .tab').forEach(tab => {
      tab.classList.remove('active');
    });
    
    const targetTab = document.querySelector(`.pane-tabs .tab[data-tab="${tabName}"]`);
    if (targetTab) {
      targetTab.classList.add('active');
    }

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    
    const targetContent = document.querySelector(`.tab-content[data-tab="${tabName}"]`);
    if (targetContent) {
      targetContent.classList.add('active');
    }

    // If switching to preview tab, refresh the preview content (only once)
    if (tabName === 'preview' && !this._isRefreshingPreview) {
      setTimeout(() => {
        this.refreshPreviewContent();
      }, 10);
    }
    
    // Reset flag after operation
    setTimeout(() => {
      this._switchingTab = false;
    }, 50);
  }

  // Refresh preview content without switching tabs
  refreshPreviewContent() {
    if (this._isRefreshingPreview) {
      console.log("Already refreshing preview, skipping");
      return;
    }
    
    this._isRefreshingPreview = true;
    
    const outputEditor = this.editors["output"];
    if (!outputEditor) {
      console.log("No output editor found");
      this._isRefreshingPreview = false;
      return;
    }

    const outputContent = outputEditor.getValue();
    const previewContainer = document.getElementById("html-preview");
    
    console.log("Refreshing preview content, length:", outputContent.length);
    console.log("Content preview:", outputContent.substring(0, 200) + "...");
    
    if (!outputContent.trim()) {
      previewContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">No output to preview. Run XSLT transformation first.</div>';
      this._isRefreshingPreview = false;
      return;
    }

    // Create a proper HTML preview container
    const previewDiv = document.createElement('div');
    previewDiv.style.width = '100%';
    previewDiv.style.height = '100%';
    previewDiv.style.overflow = 'auto';
    previewDiv.style.background = '#ffffff';
    previewDiv.style.padding = '0';

    try {
      // Check if it's HTML content
      const trimmedContent = outputContent.trim();
      const isHTML = trimmedContent.toLowerCase().includes('<html') || 
                     trimmedContent.toLowerCase().includes('<table') ||
                     trimmedContent.toLowerCase().includes('<div') ||
                     trimmedContent.toLowerCase().includes('<h1') ||
                     trimmedContent.toLowerCase().includes('<h2') ||
                     trimmedContent.toLowerCase().includes('<body');
      
      console.log("Is HTML content?", isHTML);
      console.log("Content starts with:", trimmedContent.substring(0, 100));
      
      if (isHTML) {
        console.log("Detected HTML content, rendering as HTML");
        
        // Create an iframe for better HTML rendering isolation
        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.style.background = '#ffffff';
        
        previewContainer.innerHTML = '';
        previewContainer.appendChild(iframe);
        
        // Write content to iframe document
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        iframeDoc.open();
        
        if (trimmedContent.toLowerCase().includes('<html')) {
          // Complete HTML document
          iframeDoc.write(outputContent);
        } else {
          // HTML fragment - wrap in a basic document
          iframeDoc.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: Arial, sans-serif; margin: 10px; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
              </style>
            </head>
            <body>
              ${outputContent}
            </body>
            </html>
          `);
        }
        
        iframeDoc.close();
        console.log("HTML rendered in iframe");
      } else {
        console.log("Not HTML content, showing as formatted text");
        // For non-HTML content, show as formatted text
        previewDiv.innerHTML = `<pre style="margin: 10px; font-family: monospace; white-space: pre-wrap; font-size: 12px;">${outputContent}</pre>`;
        previewContainer.innerHTML = '';
        previewContainer.appendChild(previewDiv);
      }
      console.log("Preview content refreshed successfully");
    } catch (error) {
      console.error("Error refreshing preview:", error);
      previewContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Error displaying preview</div>';
    }
    
    // Reset flag after a short delay to prevent rapid re-entry
    setTimeout(() => {
      this._isRefreshingPreview = false;
    }, 100);
  }

  // Update HTML preview with current output and switch to preview tab
  updateHTMLPreview() {
    console.log("updateHTMLPreview called");
    if (!this._switchingTab && !this._isRefreshingPreview) {
      this.refreshPreviewContent();
      this.switchOutputTab('preview');
    }
  }  showError(title, message) {
    this.showModal(title, `<p style="color: #dc2626;">${message}</p>`);
  }

  showInfo(title, message) {
    this.showModal(title, `<p>${message}</p>`);
  }
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new XMLCooktop();
});
