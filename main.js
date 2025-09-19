const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const { Xslt, XmlParser } = require('xslt-processor');
const xml2js = require('xml2js');
const chokidar = require('chokidar');

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
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    show: false
  });

  // Load the app
  mainWindow.loadFile('renderer/index.html');

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-file');
          }
        },
        {
          label: 'Open',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile'],
              filters: [
                { name: 'XML Files', extensions: ['xml', 'xsl', 'xslt', 'dtd'] },
                { name: 'All Files', extensions: ['*'] }
              ]
            });
            
            if (!result.canceled) {
              mainWindow.webContents.send('menu-open-file', result.filePaths[0]);
            }
          }
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu-save-file');
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'XML',
      submenu: [
        {
          label: 'Transform with XSLT',
          accelerator: 'F5',
          click: () => {
            mainWindow.webContents.send('menu-transform-xslt');
          }
        },
        {
          label: 'Validate XML',
          accelerator: 'F7',
          click: () => {
            mainWindow.webContents.send('menu-validate-xml');
          }
        },
        {
          label: 'Format XML',
          accelerator: 'Ctrl+Shift+F',
          click: () => {
            mainWindow.webContents.send('menu-format-xml');
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createMenu();
});

// IPC handlers for file operations
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('write-file', async (event, filePath, content) => {
  try {
    await fs.writeFile(filePath, content, 'utf8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-file-dialog', async (event, defaultPath) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath,
    filters: [
      { name: 'XML Files', extensions: ['xml'] },
      { name: 'XSL Files', extensions: ['xsl', 'xslt'] },
      { name: 'DTD Files', extensions: ['dtd'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  return result;
});

// XSLT transformation handler
ipcMain.handle('transform-xslt', async (event, xmlContent, xslContent) => {
  try {
    const xslt = new Xslt();
    const xmlParser = new XmlParser();
    
    const xmlDoc = xmlParser.xmlParse(xmlContent);
    const xslDoc = xmlParser.xmlParse(xslContent);
    
    const result = await xslt.xsltProcess(xmlDoc, xslDoc);
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// XML validation handler
ipcMain.handle('validate-xml', async (event, xmlContent) => {
  try {
    const { XMLValidator } = require('fast-xml-parser');
    const result = XMLValidator.validate(xmlContent, { allowBooleanAttributes: true });
    if (result === true) {
      return { success: true, valid: true };
    } else {
      // result is an object with error details
      let line = 1, col = 1;
      if (result.err) {
        // console.log('fast-xml-parser error object:', result.err);
        if (typeof result.err.line === 'number' && typeof result.err.col === 'number') {
          line = result.err.line;
          col = result.err.col;
        } else if (result.err.linePos && typeof result.err.linePos.line === 'number') {
          line = result.err.linePos.line;
          col = result.err.linePos.col || 1;
        } else if (typeof result.err.col === 'number') {
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
        col
      };
    }
  } catch (error) {
    return { success: false, valid: false, error: error.message };
  }
});

// Load templates from converted JSON
ipcMain.handle('load-templates', async () => {
  try {
    const templatesPath = path.join(__dirname, 'assets', 'templates.json');
    const templates = await fs.readJson(templatesPath);
    return { success: true, templates };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
