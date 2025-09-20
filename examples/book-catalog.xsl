<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:output method="html" indent="yes"/>
    
    <xsl:template match="/">
        <html>
            <head>
                <title>Book Catalog</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; background-color: #f9f9f9;}
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
</xsl:stylesheet>
