<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:xs="http://www.w3.org/2001/XMLSchema">

    <xsl:output method="xml" indent="yes"/>

    <xsl:template match="/report">
        <state-report>
            <xsl:for-each-group select="city" group-by="@state">
                <state-group name="{current-grouping-key()}">
                    <total-population>
                        <xsl:value-of select="sum(current-group()/xs:integer(@population))"/>
                    </total-population>
                    <xsl:for-each select="current-group()">
                        <city-item name="{@name}">
                            <xsl:value-of select="@population"/>
                        </city-item>
                    </xsl:for-each>
                </state-group>
            </xsl:for-each-group>
        </state-report>
    </xsl:template>

</xsl:stylesheet>