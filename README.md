
# XML Cooktop - Electron Edition

**Experimental Project Disclaimer**

This project is an experiment and is provided strictly as-is for personal, educational, or research use. It is not suitable for commercial use without purchasing the appropriate licenses from Saxonica for SaxonJS and xslt3. See the Saxonica licensing terms for details: https://www.saxonica.com/license/index.xml


## Technology Overview & Mechanisms

### Formatting
XML and XSLT documents are formatted using the `xml-formatter` library, which is bundled for browser use via webpack. This ensures fast, client-side formatting with proper indentation and line breaks.

### Validation
XML validation is performed using `fast-xml-parser`, providing real-time error detection and line/column reporting. Validation errors are highlighted in the Monaco Editor for immediate feedback.

### Transformation
XSLT 3.0 transformations are handled by SaxonJS (`saxon-js` npm package) and the `xslt3` CLI/compiler. At runtime, XSLT stylesheets are compiled to SEF (Stylesheet Export File) using xslt3, and then executed in-process with SaxonJS. This enables robust, standards-compliant XSLT 3.0 support without requiring Java.

#### Mechanism Summary
- **Formatting:** `xml-formatter` (bundled via webpack)
- **Validation:** `fast-xml-parser` (real-time, with Monaco highlighting)
- **Transformation:** `saxon-js` + `xslt3` (XSLT 3.0, SEF compilation at runtime)

## Saxonica & SaxonJS Licensing

This application uses SaxonJS and xslt3 from Saxonica Limited for XSLT 3.0 transformation. SaxonJS is free for non-commercial use, but commercial use may require a license. Please review the [Saxonica licensing terms](https://www.saxonica.com/license/index.xml) and [SaxonJS documentation](https://www.saxonica.com/saxon-js/documentation/index.html) before distributing or using this application commercially.

**Full credit to Saxonica Limited for SaxonJS and xslt3.**

# XML Cooktop - Electron Edition

A faithful recreation of the original XML Cooktop application by Victor Pavlov, built with modern web technologies for cross-platform compatibility. This Electron-based version preserves the iconic multi-pane "cooktop" interface that made the original application so powerful for XML and XSLT development.

## The "Cooktop" Interface

The heart of XML Cooktop is its unique multi-pane interface, which provides dedicated spaces for different aspects of XML/XSLT development:

- **Source (XML)**: Edit your XML documents with syntax highlighting
- **XPath Console**: Test and debug XPath expressions interactively  
- **Stylesheet (XSL)**: Create and edit XSLT transformations
- **Result**: View the XML output of XSLT transformations
- **Result (HTML)**: Preview HTML output in a live browser view

This layout allows you to work with XML, XSLT, and see results simultaneously - the essence of what made XML Cooktop a beloved tool for XML developers.

## Features

### Multi-Pane Cooktop Interface
- **Tabbed Pane System**: Switch between source XML, XPath console, XSLT stylesheet, result, and HTML preview
- **Live XSLT Processing**: Transform XML with XSLT and see results immediately
- **Integrated XPath Testing**: Evaluate XPath expressions against your XML documents
- **HTML Preview**: See HTML output rendered in real-time

### Professional XML Editing
- **Monaco Editor**: The same editor that powers VS Code, with XML/XSLT syntax highlighting
- **Code Completion**: IntelliSense support for XML and XSLT elements
- **Error Detection**: Real-time validation and error highlighting
- **Auto-formatting**: Format XML and XSLT documents with proper indentation

### Template System ("Code Bits")
- **126 Built-in Templates**: Converted from the original XML Cooktop template library
- **25 Template Categories**: DTD, XSLT Elements, XSLT Functions, XPath, XML, HTML, CSS, and more
- **Quick Insertion**: Click to insert templates at cursor position
- **Hierarchical Organization**: Templates organized in expandable folders


### XSLT Processing Engine
- **SaxonJS XSLT 3.0 Processor**: Modern, standards-compliant XSLT engine (see above)
- **Multiple Output Options**: 
  - View results in the result pane
  - Preview HTML in integrated browser
  - Save results to file
  - Open results in default browser
- **Error Reporting**: Detailed error messages for XSLT transformation issues


## Installation

### Prerequisites
- Node.js 16 or higher
- npm or yarn package manager

### Quick Start
```bash
# Clone or extract the project
cd electron-cooktop

# Install dependencies
npm install

# Run in development mode
npm start
```

### Building for Distribution
```bash
# Install electron-builder globally (optional)
npm install -g electron-builder

# Build for current platform
npm run build

# The built application will be in the dist/ folder
```

## Usage

### Getting Started
1. **Launch the Application**: Run `npm start` or launch the built executable
2. **Load Sample Data**: Click "Load Sample Data" to see the cooktop in action
3. **Explore the Panes**: Use the tabs at the bottom to switch between different views
4. **Run XSLT**: Click "Run XSLT" to transform the XML with the stylesheet

### The Cooktop Workflow
1. **Edit XML**: Start in the "source (xml)" pane to create or edit your XML document
2. **Create XSLT**: Switch to "stylesheet(xsl)" to write your transformation
3. **Test XPath**: Use the "xpath console" to test expressions against your XML
4. **Transform**: Click "Run XSLT" to see the transformation results
5. **Preview**: Check the "result(html)" pane to see HTML output rendered

### Keyboard Shortcuts
- `Ctrl+N` (Cmd+N): New document
- `Ctrl+O` (Cmd+O): Open file
- `Ctrl+S` (Cmd+S): Save current pane
- `F5`: Run XSLT transformation
- `F7`: Validate XML in current pane
- `F8`: Format XML/XSLT in current pane

### Template Usage
1. **Browse Templates**: Expand folders in the "Code Bits" sidebar
2. **Insert Template**: Click on any template to insert it at the cursor position
3. **Categories Available**: DTD, XSLT Elements, XSLT Functions, XPath, XML, HTML, CSS, and more

## Original XML Cooktop Compatibility

This Electron version faithfully recreates the core functionality of the original XML Cooktop:

### ✅ Preserved Features
- Multi-pane "cooktop" interface with tabbed navigation
- Complete template library (126 templates in 25 categories)
- XSLT transformation engine
- XPath expression testing
- XML validation and well-formedness checking
- Syntax highlighting for XML, XSLT, DTD
- Auto-formatting capabilities
- Multiple XSLT output options

### 🔄 Modernized Components
- **Editor**: Upgraded from Scintilla to Monaco Editor (VS Code's editor)
- **XSLT Engine**: JavaScript-based processor instead of MSXML
- **UI Framework**: Modern web technologies instead of Windows Forms
- **Cross-Platform**: Runs on Windows, macOS, and Linux

### 📁 Reused Assets
- **Templates.xml**: All 126 templates converted to JSON format
- **Syntax.xml**: Color schemes adapted for Monaco Editor
- **XSL Utilities**: Transformation stylesheets preserved
- **Interface Design**: Layout and workflow patterns maintained

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Application Framework | Electron | Cross-platform desktop application |
| Code Editor | Monaco Editor | Professional XML/XSLT editing |
| XSLT Processor | SaxonJS + xslt3 | XSLT 3.0 transformation (SEF, Saxonica) |
| XML Validator | fast-xml-parser | XML validation and error reporting |
| Formatter | xml-formatter | XML/XSLT formatting (bundled via webpack) |
| UI Styling | CSS3 | Modern interface design |
| File Operations | Node.js fs-extra | Enhanced file system operations |

## Project Structure

```
electron-cooktop/
├── main.js                 # Electron main process
├── preload.js             # Secure IPC bridge
├── renderer/              # Frontend application
│   ├── index.html         # Multi-pane cooktop interface
│   ├── css/styles.css     # Cooktop-inspired styling
│   └── js/cooktop.js      # Multi-pane application logic
├── assets/                # Application resources
│   ├── templates.json     # Converted template library
│   └── icon.svg          # Application icon
└── test-core.js          # Core functionality tests
```

## Development

### Core Classes
- **XMLCooktop**: Main application controller managing the multi-pane interface
- **Editor Management**: Monaco editor integration for each pane
- **Template System**: Dynamic loading and insertion of code templates
- **XSLT Engine**: JavaScript-based transformation processing

### Testing
```bash
# Run core functionality tests
node test-core.js

# Tests verify:
# - XSLT transformation engine
# - XML validation
# - Template loading system
# - File operations
```

### Adding Templates
Templates are stored in `assets/templates.json`. To add new templates:

1. Edit the JSON file following the existing structure
2. Restart the application to load new templates
3. Templates support `\\n` for newlines and `\\t` for tabs

## Comparison with Original

| Feature | Original XML Cooktop | Electron Edition |
|---------|---------------------|------------------|
| Platform | Windows only | Windows, macOS, Linux |
| Editor | Scintilla | Monaco Editor (VS Code) |
| XSLT Engine | MSXML | JavaScript (xslt-processor) |
| Templates | 126 templates | Same 126 templates (converted) |
| Interface | Multi-pane cooktop | Faithful recreation |
| File Support | XML, XSL, DTD, HTML | Same formats |
| XPath Console | Built-in | Built-in (enhanced) |


## Known Limitations

- **XSLT Version**: Now supports XSLT 3.0 via SaxonJS and xslt3 (see above)
- **XPath Features**: Some advanced XPath 3.0 features may have limitations (see SaxonJS docs)
- **External Tools**: Tool integration requires platform-specific configuration
- **Performance**: Large documents may be slower than native implementations

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- **Victor Pavlov**: Creator of the original XML Cooktop application
- **Original XML Cooktop Community**: For years of feedback and feature requests
- **Monaco Editor Team**: For the excellent code editor component
- **Saxonica Limited**: For SaxonJS and xslt3 (XSLT 3.0 transformation)
- **Electron Team**: For making cross-platform desktop apps accessible

## Support

For issues, feature requests, or questions:

1. Check existing issues on GitHub
2. Create a new issue with:
   - System information (OS, Node.js version)
   - Steps to reproduce the problem
   - Expected vs actual behavior
   - Screenshots if applicable

---

**XML Cooktop Electron Edition** - The classic XML development environment, reimagined for the modern, cross-platform world while preserving the powerful multi-pane workflow that made the original indispensable.
