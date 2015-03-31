(function() {
  
  // generateId generates a random 32-character hexadecimal string.
  function generateId() {
    // Use window.crypto.getRandomValues() if it is available.
    if ('crypto' in window && 'getRandomValues' in window.crypto) {
      var arr = new Uint8Array(16);
      window.crypto.getRandomValues(arr);
      var result = '';
      for (var i = 0; i < 16; ++i) {
        var s = arr[i].toString(16);
        if (s.length === 1) {
          result += '0';
        }
        result += s;
      }
      return result;
    }
    
    // We must fall back on the Math.random() function.
    var identifier = '';
    var time = (new Date()).getTime() % 0x100;
    for (var i = 0; i < 16; ++i) {
      var number = (Math.floor(Math.random()*0x100)^time) % 0x100;
      var numStr = number.toString(16);
      if (numStr.length === 1) {
        identifier += '0';
      }
      identifier += numStr;
    }
    return identifier;
  }
  
  window.app.generateId = generateId;
  
})();