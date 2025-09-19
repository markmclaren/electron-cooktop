// XML Cooktop - Multi-Pane Interface Implementation

class XMLCooktop {
  constructor() {
    this.editors = {
      source: null,
      stylesheet: null,
      result: null,
    };
    this.currentPane = "source";
    this.templates = null;
    this.hasUnsavedChanges = false;
    this.currentFiles = {
      source: null,
      stylesheet: null,
    };

    this.init();
  }

  async init() {
  await this.initializeMonaco();
  this.setupEventListeners();
  await this.loadTemplates();
  this.setupMenuListeners();
  this.showWelcomeScreen();

  console.log("XML Cooktop initialized, showing welcome screen");
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
    // Create editors for each pane
    this.createEditor("source", "xml");
    this.createEditor("stylesheet", "xsl");
    this.createEditor("result", "xml");

    // Set default content
    this.setDefaultContent();

    // Switch to source pane initially
    this.switchPane("source");
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
      readOnly: paneId === "result",
    });

    // Set up change detection for editable editors
    if (paneId !== "result") {
      editor.onDidChangeModelContent(() => {
        this.hasUnsavedChanges = true;
        this.updateStatus(`Modified: ${paneId}`);
      });
    }

    // Set up cursor position tracking
    editor.onDidChangeCursorPosition((e) => {
      if (this.currentPane === paneId) {
        this.updateCursorPosition(e.position);
      }
    });

    this.editors[paneId] = editor;
  }

  setDefaultContent() {
    // Default XML content
    const defaultXml = `<?xml version="1.0" encoding="UTF-8"?>
<catalog>
    <book id="1">
        <title>XML Fundamentals</title>
        <author>John Doe</author>
        <price currency="USD">29.99</price>
        <category>Programming</category>
    </book>
    <book id="2">
        <title>XSLT Mastery</title>
        <author>Jane Smith</author>
        <price currency="USD">39.99</price>
        <category>Programming</category>
    </book>
    <book id="3">
        <title>Web Development</title>
        <author>Bob Wilson</author>
        <price currency="USD">34.99</price>
        <category>Web</category>
    </book>
</catalog>`;

    // Default XSLT content
    const defaultXsl = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:output method="html" indent="yes"/>
    
    <xsl:template match="/">
        <html>
            <head>
                <title>Book Catalog</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    table { border-collapse: collapse; width: 100%; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .price { text-align: right; }
                </style>
            </head>
            <body>
                <h1>Book Catalog</h1>
                <table>
                    <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Author</th>
                        <th>Price</th>
                        <th>Category</th>
                    </tr>
                    <xsl:for-each select="catalog/book">
                        <tr>
                            <td><xsl:value-of select="@id"/></td>
                            <td><xsl:value-of select="title"/></td>
                            <td><xsl:value-of select="author"/></td>
                            <td class="price">$<xsl:value-of select="price"/></td>
                            <td><xsl:value-of select="category"/></td>
                        </tr>
                    </xsl:for-each>
                </table>
                <p>Total books: <xsl:value-of select="count(catalog/book)"/></p>
            </body>
        </html>
    </xsl:template>
</xsl:stylesheet>`;

    this.editors.source.setValue(
      defaultXml.replace(/\n/g, "\n").replace(/\t/g, "\t")
    );
    this.editors.stylesheet.setValue(
      defaultXsl.replace(/\n/g, "\n").replace(/\t/g, "\t")
    );
  }

  setupEventListeners() {
    // Source XML copy button
    const copySourceBtn = document.getElementById("btn-copy-source");
    if (copySourceBtn) copySourceBtn.addEventListener("click", () => {
      const xmlText = this.editors.source.getValue();
      navigator.clipboard.writeText(xmlText);
      this.updateStatus("Source XML copied to clipboard");
    });

    // Stylesheet copy button
    const copyStylesheetBtn = document.getElementById("btn-copy-stylesheet");
    if (copyStylesheetBtn) copyStylesheetBtn.addEventListener("click", () => {
      const xslText = this.editors.stylesheet.getValue();
      navigator.clipboard.writeText(xslText);
      this.updateStatus("Stylesheet XSL copied to clipboard");
    });
    // Source XML clear button
    const clearSourceBtn = document.getElementById("btn-clear-source");
    if (clearSourceBtn) clearSourceBtn.addEventListener("click", () => {
      const currentValue = this.editors.source.getValue();
      if (currentValue.trim().length > 0) {
        if (confirm("Are you sure you want to clear the Source XML pane?")) {
          this.editors.source.setValue("");
          this.updateStatus("Source XML pane cleared");
        }
      } else {
        this.editors.source.setValue("");
        this.updateStatus("Source XML pane cleared");
      }
    });

    // Stylesheet clear button
    const clearStylesheetBtn = document.getElementById("btn-clear-stylesheet");
    if (clearStylesheetBtn) clearStylesheetBtn.addEventListener("click", () => {
      const currentValue = this.editors.stylesheet.getValue();
      if (currentValue.trim().length > 0) {
        if (confirm("Are you sure you want to clear the Stylesheet pane?")) {
          this.editors.stylesheet.setValue("");
          this.updateStatus("Stylesheet pane cleared");
        }
      } else {
        this.editors.stylesheet.setValue("");
        this.updateStatus("Stylesheet pane cleared");
      }
    });
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

    // Cooktop tabs
    document.querySelectorAll(".cooktop-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        const pane = tab.dataset.pane;
        this.switchPane(pane);
      });
    });

    // XPath console
    document.getElementById("btn-execute-xpath").addEventListener("click", () => this.executeXPath());
    document.getElementById("xpath-input").addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.executeXPath();
      }
    });
    document.getElementById("btn-clear-xpath").addEventListener("click", () => {
      document.getElementById("xpath-output").textContent = "";
    });

    // --- Pane-footer buttons wiring ---
    // Source XML pane-footer
    const srcOpenBtn = document.querySelector("#pane-source .pane-footer .btn-icon[title='Open XML file']");
    if (srcOpenBtn) srcOpenBtn.addEventListener("click", () => this.openFile());
    const srcSaveBtn = document.querySelector("#pane-source .pane-footer .btn-icon[title='Save XML']");
    if (srcSaveBtn) srcSaveBtn.addEventListener("click", () => this.saveFile());

    // XPath Console pane-footer
    const xpathClearBtn = document.querySelector("#pane-xpath .pane-footer .btn-icon[title='Clear console']");
    if (xpathClearBtn) xpathClearBtn.addEventListener("click", () => {
      document.getElementById("xpath-output").textContent = "";
    });

    // Stylesheet pane-footer
    const xslOpenBtn = document.querySelector("#pane-stylesheet .pane-footer .btn-icon[title='Open XSL file']");
    if (xslOpenBtn) xslOpenBtn.addEventListener("click", () => this.openFile());
    const xslSaveBtn = document.querySelector("#pane-stylesheet .pane-footer .btn-icon[title='Save XSL']");
    if (xslSaveBtn) xslSaveBtn.addEventListener("click", () => this.saveFile());

    // Result pane-footer
    const resultSaveBtn = document.querySelector("#pane-result .pane-footer .btn-icon[title='Save result']");
    if (resultSaveBtn) resultSaveBtn.addEventListener("click", () => this.runXSLTAndSave());
    const resultCopyBtn = document.querySelector("#pane-result .pane-footer .btn-icon[title='Copy result']");
    if (resultCopyBtn) resultCopyBtn.addEventListener("click", () => {
      const resultText = this.editors.result.getValue();
      navigator.clipboard.writeText(resultText);
      this.updateStatus("Result copied to clipboard");
    });

    // Result HTML pane-footer
    const htmlOpenBtn = document.querySelector("#pane-result-html .pane-footer .btn-icon[title='Open in browser']");
    if (htmlOpenBtn) htmlOpenBtn.addEventListener("click", () => {
      const htmlPreview = document.getElementById("html-preview");
      if (htmlPreview && htmlPreview.src) {
        window.open(htmlPreview.src, "_blank");
        this.updateStatus("HTML preview opened in browser");
      }
    });
    const htmlSaveBtn = document.querySelector("#pane-result-html .pane-footer .btn-icon[title='Save HTML']");
    if (htmlSaveBtn) htmlSaveBtn.addEventListener("click", () => this.runXSLTAndSave());

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

  async runXSLT() {
    try {
      const xmlContent = this.editors.source.getValue();
      const xslContent = this.editors.stylesheet.getValue();

      if (!xmlContent.trim()) {
        this.showError(
          "No XML Content",
          "Please enter XML content in the source pane."
        );
        return;
      }

      if (!xslContent.trim()) {
        this.showError(
          "No XSLT Content",
          "Please enter XSLT content in the stylesheet pane."
        );
        return;
      }

      this.updateStatus("Running XSLT transformation...");

      const result = await window.electronAPI.transformXSLT(
        xmlContent,
        xslContent
      );

      if (result.success) {
        // Update result pane
        this.editors.result.setValue(result.result);

        // Update HTML preview
        const htmlPreview = document.getElementById("html-preview");
        const blob = new Blob([result.result], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        htmlPreview.src = url;

        // Switch to result pane
        this.switchPane("result");

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

  async runXSLTAndSave() {
    await this.runXSLT();

    const result = this.editors.result.getValue();
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

    const xmlContent = this.editors.source.getValue();
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
      // ...existing code...
      // Restore read-only state for result pane
      if (this.currentPane === "result" && wasReadOnly) {
        currentEditor.updateOptions({ readOnly: true });
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
    this.editors.source.setValue(
      '<?xml version="1.0" encoding="UTF-8"?>\\n<root>\\n\\t\\n</root>'
    );
    this.editors.stylesheet.setValue(
      '<?xml version="1.0" encoding="UTF-8"?>\\n<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">\\n\\t<xsl:output method="xml" indent="yes"/>\\n\\t\\n\\t<xsl:template match="/">\\n\\t\\t\\n\\t</xsl:template>\\n\\t\\n</xsl:stylesheet>'
    );
    this.editors.source.setValue(
      '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n\t\n</root>'
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
    );
    this.editors.stylesheet.setValue(
      '<?xml version="1.0" encoding="UTF-8"?>\n<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">\n\t<xsl:output method="xml" indent="yes"/>\n\t\n\t<xsl:template match="/">\n\t\t\n\t</xsl:template>\n\t\n</xsl:stylesheet>'
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
    );
    this.currentFiles.source = null;
    this.currentFiles.stylesheet = null;
    this.hasUnsavedChanges = false;

    this.switchPane("source");
    this.updateStatus("New document created");
  }

  loadSampleData() {
    this.setDefaultContent();
    this.switchPane("source");
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
        const extension = file.name.split(".").pop().toLowerCase();

        if (extension === "xml") {
          this.editors.source.setValue(content);
          this.currentFiles.source = file.name;
          this.switchPane("source");
        } else if (extension === "xsl" || extension === "xslt") {
          this.editors.stylesheet.setValue(content);
          this.currentFiles.stylesheet = file.name;
          this.switchPane("stylesheet");
        }

        this.updateStatus(`Opened: ${file.name}`);
      }
    });
    input.click();
  }

  async saveFile() {
    const currentEditor = this.editors[this.currentPane];
    if (!currentEditor || this.currentPane === "result") {
      this.showError("Cannot Save", "Please select an editable pane to save.");
      return;
    }

    const content = currentEditor.getValue();
    const extension = this.currentPane === "source" ? ".xml" : ".xsl";
    const defaultName = `${this.currentPane}${extension}`;

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

  showError(title, message) {
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
