const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
  saveFileDialog: (defaultPath) => ipcRenderer.invoke('save-file-dialog', defaultPath),
  
  // XML operations
  transformXSLT: (xmlContent, xslContent) => ipcRenderer.invoke('transform-xslt', xmlContent, xslContent),
  validateXML: (xmlContent) => ipcRenderer.invoke('validate-xml', xmlContent),
  
  // Template operations
  loadTemplates: () => ipcRenderer.invoke('load-templates'),
  
  // Menu event listeners
  onMenuNewFile: (callback) => ipcRenderer.on('menu-new-file', callback),
  onMenuOpenFile: (callback) => ipcRenderer.on('menu-open-file', callback),
  onMenuSaveFile: (callback) => ipcRenderer.on('menu-save-file', callback),
  onMenuTransformXSLT: (callback) => ipcRenderer.on('menu-transform-xslt', callback),
  onMenuValidateXML: (callback) => ipcRenderer.on('menu-validate-xml', callback),
  onMenuFormatXML: (callback) => ipcRenderer.on('menu-format-xml', callback),
  onMenuLoadSampleData: (callback) => ipcRenderer.on('menu-load-sample-data', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});
