// XSLT Transformer - Simplified Interface Implementation

class XSLTTransformer {
  constructor() {
    this.hasUnsavedChanges = false;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupTheme();
    this.loadSampleData(); // Load sample data on startup
    console.log("XSLT Transformer initialized");
  }

  setupEventListeners() {
    // Transform button
    const transformBtn = document.getElementById("btn-transform");
    if (transformBtn) {
      transformBtn.addEventListener("click", () => this.runXSLT());
    }

    // Theme toggle button
    const themeToggleBtn = document.getElementById("btn-theme-toggle");
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener("click", () => this.toggleTheme());
    }

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.key === "F5" || (e.ctrlKey && e.key === "Enter")) {
        e.preventDefault();
        this.runXSLT();
      }
    });

    // Track changes
    const xmlInput = document.getElementById("input-xml");
    const xsltInput = document.getElementById("input-xslt");
    
    if (xmlInput) {
      xmlInput.addEventListener("input", () => this.markUnsaved());
    }
    
    if (xsltInput) {
      xsltInput.addEventListener("input", () => this.markUnsaved());
    }
  }

  setupTheme() {
    // Check for saved theme preference or default to dark
    const savedTheme = localStorage.getItem("theme") || "dark";
    this.setTheme(savedTheme);
    this.updateThemeIcon(savedTheme);
  }

  setTheme(theme) {
    const html = document.documentElement;
    if (theme === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }

  toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.classList.contains("dark") ? "dark" : "light";
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    this.setTheme(newTheme);
    this.updateThemeIcon(newTheme);
  }

  updateThemeIcon(theme) {
    const sunIcon = document.querySelector(".sun-icon");
    const moonIcon = document.querySelector(".moon-icon");
    
    if (sunIcon && moonIcon) {
      if (theme === "dark") {
        sunIcon.classList.remove("hidden");
        moonIcon.classList.add("hidden");
      } else {
        sunIcon.classList.add("hidden");
        moonIcon.classList.remove("hidden");
      }
    }
  }

  markUnsaved() {
    this.hasUnsavedChanges = true;
    // Could add visual indicator here
  }

  async runXSLT() {
    try {
      const xmlContent = document.getElementById("input-xml").value;
      const xslContent = document.getElementById("input-xslt").value;
      const outputEl = document.getElementById("output-result");

      if (!xmlContent.trim()) {
        this.showError("Please enter XML content in the Input XML field.");
        return;
      }

      if (!xslContent.trim()) {
        this.showError("Please enter XSLT content in the XSLT Stylesheet field.");
        return;
      }

      // Update button state
      const transformBtn = document.getElementById("btn-transform");
      const originalText = transformBtn.textContent;
      transformBtn.textContent = "Transforming...";
      transformBtn.disabled = true;

      // Check if we're in Electron environment
      if (window.electronAPI && window.electronAPI.transformXSLT) {
        // Use Electron's XSLT processor
        const result = await window.electronAPI.transformXSLT(xmlContent, xslContent);
        
        if (result.success) {
          outputEl.value = result.result;
          this.showSuccess("XSLT transformation completed successfully!");
        } else {
          this.showError(`XSLT Transformation Failed: ${result.error}`);
        }
      } else {
        // Fallback for browser environment or if electronAPI is not available
        try {
          const result = this.transformXSLTClient(xmlContent, xslContent);
          outputEl.value = result;
          this.showSuccess("XSLT transformation completed successfully!");
        } catch (error) {
          this.showError(`XSLT Transformation Failed: ${error.message}`);
        }
      }

      // Restore button state
      transformBtn.textContent = originalText;
      transformBtn.disabled = false;

    } catch (error) {
      console.error("Error during XSLT transformation:", error);
      this.showError(`Unexpected error: ${error.message}`);
      
      // Restore button state
      const transformBtn = document.getElementById("btn-transform");
      transformBtn.textContent = "Transform";
      transformBtn.disabled = false;
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

  showError(message) {
    // Create a simple error notification
    this.showNotification(message, "error");
  }

  showSuccess(message) {
    // Create a simple success notification
    this.showNotification(message, "success");
  }

  showNotification(message, type = "info") {
    // Remove existing notifications
    const existing = document.querySelector(".notification");
    if (existing) {
      existing.remove();
    }

    // Create notification element
    const notification = document.createElement("div");
    notification.className = `notification fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-md ${
      type === "error" 
        ? "bg-red-500 text-white" 
        : type === "success" 
        ? "bg-green-500 text-white" 
        : "bg-blue-500 text-white"
    }`;
    
    notification.innerHTML = `
      <div class="flex items-center justify-between">
        <span>${message}</span>
        <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
          ✕
        </button>
      </div>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  // Utility functions for future features
  clearInputs() {
    document.getElementById("input-xml").value = "";
    document.getElementById("input-xslt").value = "";
    document.getElementById("output-result").value = "";
  }

  loadExample(xmlContent, xsltContent) {
    document.getElementById("input-xml").value = xmlContent || "";
    document.getElementById("input-xslt").value = xsltContent || "";
    document.getElementById("output-result").value = "";
  }

  loadSampleData() {
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

    this.loadExample(sampleXML, sampleXSLT);
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.xsltTransformer = new XSLTTransformer();
});

// Export for potential use in other scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = XSLTTransformer;
}