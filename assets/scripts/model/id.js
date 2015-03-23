(function() {
  
  // generateId generates a random 32-character hexadecimal string.
  function generateId() {
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