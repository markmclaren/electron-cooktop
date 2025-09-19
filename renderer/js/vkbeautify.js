// vkBeautify - XML pretty printer (minified for brevity)
// Source: https://github.com/vkiryukhin/vkBeautify
(function (window) {
  function vkbeautify() {
    this.xml = function (text, indent) {
      indent = indent || "  ";
      var reg = /(>)(<)(\/*)/g;
      text = text.replace(reg, "$1\r\n$2$3");
      var pad = 0;
      var formatted = "";
      text.split(/\r?\n/).forEach(function (node) {
        var indentLevel = 0;
        if (node.match(/.+<\/\w[^>]*>$/)) indentLevel = 0;
        else if (node.match(/^<\/\w/))
          if (pad != 0) pad -= 1;
          else if (node.match(/^<\w[^>]*[^\/]>.*$/)) indentLevel = 1;
          else indentLevel = 0;
        var padding = "";
        for (var i = 0; i < pad; i++) padding += indent;
        formatted += padding + node + "\r\n";
        pad += indentLevel;
      });
      return formatted.trim();
    };
  }
  window.vkbeautify = new vkbeautify();
})(window);
