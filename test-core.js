// Test script for XML Cooktop core functionality
const { Xslt, XmlParser } = require('xslt-processor');
const xml2js = require('xml2js');
const fs = require('fs-extra');
const path = require('path');

console.log('Testing XML Cooktop Core Functionality...\n');

// Test 1: XSLT Processing
console.log('1. Testing XSLT Processing...');
try {
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<catalog>
    <book id="1">
        <title>XML Fundamentals</title>
        <author>John Doe</author>
        <price>29.99</price>
    </book>
    <book id="2">
        <title>XSLT Mastery</title>
        <author>Jane Smith</author>
        <price>39.99</price>
    </book>
</catalog>`;

    const xslContent = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:output method="html" indent="yes"/>
    
    <xsl:template match="/">
        <html>
            <head><title>Book Catalog</title></head>
            <body>
                <h1>Book Catalog</h1>
                <table border="1">
                    <tr><th>Title</th><th>Author</th><th>Price</th></tr>
                    <xsl:for-each select="catalog/book">
                        <tr>
                            <td><xsl:value-of select="title"/></td>
                            <td><xsl:value-of select="author"/></td>
                            <td>$<xsl:value-of select="price"/></td>
                        </tr>
                    </xsl:for-each>
                </table>
            </body>
        </html>
    </xsl:template>
</xsl:stylesheet>`;

    const xslt = new Xslt();
    const xmlParser = new XmlParser();
    
    xslt.xsltProcess(
        xmlParser.xmlParse(xmlContent),
        xmlParser.xmlParse(xslContent)
    ).then(result => {
        console.log('✓ XSLT transformation successful');
        console.log('Result preview:', result.substring(0, 100) + '...\n');
    }).catch(error => {
        console.log('✗ XSLT transformation failed:', error.message);
    });
    
} catch (error) {
    console.log('✗ XSLT test failed:', error.message);
}

// Test 2: XML Validation
console.log('2. Testing XML Validation...');
try {
    const validXml = '<?xml version="1.0"?><root><item>test</item></root>';
    const invalidXml = '<?xml version="1.0"?><root><item>test</root>'; // Missing closing tag
    
    const parser = new xml2js.Parser();
    
    // Test valid XML
    parser.parseString(validXml, (err, result) => {
        if (err) {
            console.log('✗ Valid XML test failed:', err.message);
        } else {
            console.log('✓ Valid XML parsed successfully');
        }
    });
    
    // Test invalid XML
    parser.parseString(invalidXml, (err, result) => {
        if (err) {
            console.log('✓ Invalid XML correctly rejected:', err.message.substring(0, 50) + '...');
        } else {
            console.log('✗ Invalid XML should have been rejected');
        }
    });
    
} catch (error) {
    console.log('✗ XML validation test failed:', error.message);
}

// Test 3: Template Loading
console.log('\n3. Testing Template Loading...');
try {
    const templatesPath = path.join(__dirname, 'assets', 'templates.json');
    if (fs.existsSync(templatesPath)) {
        const templates = fs.readJsonSync(templatesPath);
        console.log('✓ Templates loaded successfully');
        console.log(`Found ${templates.folders.length} template folders`);
        
        const totalTemplates = templates.folders.reduce((sum, folder) => sum + folder.templates.length, 0);
        console.log(`Total templates: ${totalTemplates}`);
        
        // Show first few templates
        if (templates.folders.length > 0 && templates.folders[0].templates.length > 0) {
            console.log('Sample template:', templates.folders[0].templates[0].name);
        }
    } else {
        console.log('✗ Templates file not found');
    }
} catch (error) {
    console.log('✗ Template loading failed:', error.message);
}

// Test 4: File Operations
console.log('\n4. Testing File Operations...');
try {
    const testFile = path.join(__dirname, 'test-temp.xml');
    const testContent = '<?xml version="1.0"?>\n<test>Hello World</test>';
    
    // Write test
    fs.writeFileSync(testFile, testContent);
    console.log('✓ File write successful');
    
    // Read test
    const readContent = fs.readFileSync(testFile, 'utf8');
    if (readContent === testContent) {
        console.log('✓ File read successful');
    } else {
        console.log('✗ File content mismatch');
    }
    
    // Cleanup
    fs.removeSync(testFile);
    console.log('✓ File cleanup successful');
    
} catch (error) {
    console.log('✗ File operations failed:', error.message);
}

console.log('\nCore functionality tests completed!');
console.log('\nTo run the full application:');
console.log('1. Install on a system with a display server');
console.log('2. Run: npm start');
console.log('3. Or build distributable: npm run build (requires electron-builder)');
