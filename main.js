const { app, BrowserWindow, Menu, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs-extra");
const chokidar = require("chokidar");

// IPC handler to load example files
ipcMain.handle("load-example-file", async (event, filePath) => {
  try {
    const absPath = path.isAbsolute(filePath)
      ? filePath
      : path.join(__dirname, filePath);
    console.log("[DEBUG] load-example-file absPath:", absPath);
    const exists = fs.existsSync(absPath);
    console.log("[DEBUG] File exists:", exists);
    if (!exists) {
      return { success: false, error: "File does not exist: " + absPath };
    }
    const content = await fs.readFile(absPath, "utf8");
    return { success: true, content };
  } catch (err) {
    console.error("[DEBUG] Error in load-example-file:", err);
    return { success: false, error: err.message };
  }
});

// Keep a global reference of the window object
let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, "preload.js"),
    },
    icon: path.join(__dirname, "assets/icon.png"),
    show: false,
  });

  // Load the app
  mainWindow.loadFile("renderer/index.html");

  // Show window when ready to prevent visual flash
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    createMenu(); // Move menu creation here so mainWindow is ready
  });

  // Open DevTools in development
  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Create application menu
function createMenu() {
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "New",
          accelerator: "CmdOrCtrl+N",
          click: () => {
            mainWindow.webContents.send("menu-new-file");
          },
        },
        {
          label: "Open",
          accelerator: "CmdOrCtrl+O",
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ["openFile"],
              filters: [
                {
                  name: "XML Files",
                  extensions: ["xml", "xsl", "xslt", "dtd"],
                },
                { name: "All Files", extensions: ["*"] },
              ],
            });

            if (!result.canceled) {
              mainWindow.webContents.send(
                "menu-open-file",
                result.filePaths[0]
              );
            }
          },
        },
        {
          label: "Save",
          accelerator: "CmdOrCtrl+S",
          click: () => {
            mainWindow.webContents.send("menu-save-file");
          },
        },
        { type: "separator" },
        {
          label: "Exit",
          accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
      ],
    },
    {
      label: "XML",
      submenu: [
        {
          label: "Transform with XSLT",
          accelerator: "F5",
          click: () => {
            mainWindow.webContents.send("menu-transform-xslt");
          },
        },
        {
          label: "Validate XML",
          accelerator: "F7",
          click: () => {
            mainWindow.webContents.send("menu-validate-xml");
          },
        },
        {
          label: "Format XML",
          accelerator: "Ctrl+Shift+F",
          click: () => {
            mainWindow.webContents.send("menu-format-xml");
          },
        },
      ],
    },
    {
      label: "Examples",
      submenu: (function () {
        let examples = [];
        try {
          const examplesPath = path.join(__dirname, "assets/examples.json");
          examples = fs.readJsonSync(examplesPath);
        } catch (err) {
          console.error("Failed to load examples.json:", err);
        }
        // Build menu items for each example
        const items = examples.map((ex, idx) => ({
          label: ex.name,
          click: async () => {
            try {
              const xmlPath = path.join(__dirname, ex.xml);
              const xslPath = path.join(__dirname, ex.xsl);

              const xmlContent = await fs.readFile(xmlPath, "utf8");
              const xslContent = await fs.readFile(xslPath, "utf8");

              mainWindow.webContents.send("menu-load-example", {
                xml: xmlContent,
                xsl: xslContent,
                name: ex.name,
              });
            } catch (error) {
              console.error("Error loading example files:", error);
              dialog.showErrorBox(
                "Error",
                "Could not load the example files. Please check the console for more details."
              );
            }
          },
        }));
        // Optionally add a separator and fallback item
        if (items.length === 0) {
          items.push({ label: "No examples found", enabled: false });
        }
        return items;
      })(),
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC handlers for file operations
ipcMain.handle("read-file", async (event, filePath) => {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("write-file", async (event, filePath, content) => {
  try {
    await fs.writeFile(filePath, content, "utf8");
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("save-file-dialog", async (event, defaultPath) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath,
    filters: [
      { name: "XML Files", extensions: ["xml"] },
      { name: "XSL Files", extensions: ["xsl", "xslt"] },
      { name: "DTD Files", extensions: ["dtd"] },
      { name: "All Files", extensions: ["*"] },
    ],
  });

  return result;
});

// XSLT transformation handler
ipcMain.handle("transform-xslt", async (event, xmlContent, xslContent) => {
  try {
    const SaxonJS = require("saxon-js");
    const { execSync } = require("child_process");
    const fs = require("fs-extra");
    const tmp = require("os").tmpdir();
    const path = require("path");

    // Write XSLT to temp file
    const xslPath = path.join(tmp, `temp-xslt-${Date.now()}.xsl`);
    fs.writeFileSync(xslPath, xslContent, "utf8");
    // Write dummy XML to temp file
    const dummyXmlPath = path.join(tmp, `temp-dummy-${Date.now()}.xml`);
    fs.writeFileSync(dummyXmlPath, "<root/>", "utf8");
    // Compile XSLT to SEF using xslt3 CLI, supplying dummy XML
    const sefPath = path.join(tmp, `temp-sef-${Date.now()}.json`);
    execSync(`npx xslt3 -xsl:${xslPath} -s:${dummyXmlPath} -export:${sefPath}`);
    const sef = JSON.parse(fs.readFileSync(sefPath, "utf8"));

    // Transform XML using SaxonJS
    const result = await SaxonJS.transform(
      {
        stylesheetInternal: sef,
        sourceText: xmlContent,
        destination: "serialized",
      },
      "async"
    );
    // Clean up temp files
    fs.unlinkSync(xslPath);
    fs.unlinkSync(sefPath);
    fs.unlinkSync(dummyXmlPath);
    return { success: true, result: result.principalResult };
  } catch (error) {
    console.error("XSLT transformation error:", error);
    return {
      success: false,
      error:
        error && error.stack
          ? error.stack
          : error && error.message
          ? error.message
          : String(error),
    };
  }
});

// XML validation handler
ipcMain.handle("validate-xml", async (event, xmlContent) => {
  try {
    const { XMLValidator } = require("fast-xml-parser");
    const result = XMLValidator.validate(xmlContent, {
      allowBooleanAttributes: true,
    });
    if (result === true) {
      return { success: true, valid: true };
    } else {
      // result is an object with error details
      let line = 1,
        col = 1;
      if (result.err) {
        // console.log('fast-xml-parser error object:', result.err);
        if (
          typeof result.err.line === "number" &&
          typeof result.err.col === "number"
        ) {
          line = result.err.line;
          col = result.err.col;
        } else if (
          result.err.linePos &&
          typeof result.err.linePos.line === "number"
        ) {
          line = result.err.linePos.line;
          col = result.err.linePos.col || 1;
        } else if (typeof result.err.col === "number") {
          // Map error position to line number
          const uptoError = xmlContent.slice(0, result.err.col);
          line = uptoError.split(/\r?\n/).length;
          col = result.err.col;
        }
      }
      return {
        success: false,
        valid: false,
        error: result.err.msg + ` (line ${line}, col ${col})`,
        line,
        col,
      };
    }
  } catch (error) {
    return { success: false, valid: false, error: error.message };
  }
});

// Load templates from converted JSON
ipcMain.handle("load-templates", async () => {
  try {
    const templatesPath = path.join(__dirname, "assets", "templates.json");
    const templates = await fs.readJson(templatesPath);
    return { success: true, templates };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
