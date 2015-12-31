<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

  <xsl:template match="/">
    <html>
    <body>
      <div style="white-space: pre-wrap; word-wrap: break-word">
        <xsl:apply-templates select="notebook" />
      </div>
    </body>
    </html>
  </xsl:template>
  
  <xsl:template match="notebook">
    <ul>
      <xsl:apply-templates select="entry" />
    </ul>
  </xsl:template>

  <xsl:template match="entry">
    <li>
      <xsl:apply-templates select="title" /><br/>
      <xsl:apply-templates select="content" />      
    </li>
    <ul>
      <xsl:apply-templates select="entry" />
    </ul>
  </xsl:template>

  <xsl:template match="title">
    <b><xsl:value-of select="."/></b>
  </xsl:template>

  <xsl:template match="content">
    <xsl:value-of select="."/>   
  </xsl:template>

</xsl:stylesheet> 
