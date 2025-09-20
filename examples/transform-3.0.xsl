<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:map="http://www.w3.org/2005/xpath-functions/map">

    <xsl:output method="xml" indent="yes"/>

    <xsl:variable name="prices" as="map(xs:string, xs:decimal)" select="map {
        'A001' : 12.50,
        'B002' : 5.00,
        'C003' : 25.00
    }"/>

    <xsl:template match="invoice">
        <invoice-report>
            <xsl:variable name="invoice-items" as="element()*">
                <xsl:for-each select="item">
                    <xsl:variable name="itemId" select="@id" as="xs:string"/>
                    <xsl:variable name="quantity" select="xs:decimal(@quantity)" as="xs:decimal"/>
                    <xsl:variable name="unit-price" select="map:get($prices, $itemId)" as="xs:decimal"/>
                    <xsl:variable name="item-total" select="$quantity * $unit-price" as="xs:decimal"/>

                    <item-report id="{$itemId}">
                        <quantity>
                            <xsl:value-of select="$quantity"/>
                        </quantity>
                        <unit-price>
                            <xsl:value-of select="$unit-price"/>
                        </unit-price>
                        <total-item-price>
                            <xsl:value-of select="$item-total"/>
                        </total-item-price>
                    </item-report>
                </xsl:for-each>
            </xsl:variable>

            <xsl:variable name="total-invoice-price" select="sum($invoice-items/total-item-price)"/>

            <xsl:sequence select="$invoice-items"/>

            <total-invoice-price>
                <xsl:value-of select="$total-invoice-price"/>
            </total-invoice-price>
        </invoice-report>
    </xsl:template>

</xsl:stylesheet>