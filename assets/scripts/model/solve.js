(function() {
  
  function Solve(time) {
    this.dnf = false;
    this.inspection = 0;
    this.memo = -1;
    this.notes = '';
    this.plus2 = false;
    this.scramble = '';
    this.time = time;
  }
  
  Solve.parse = function(timeStr) {
    return new Solve(parseTime(timeStr));
  };
  
  Solve.unpack = function(jsonObject) {
    var res = Object.create(Solve.prototype);
    for (var key in jsonObject) {
      if (!jsonObject.hasOwnProperty(key)) {
        continue;
      }
      res[key] = jsonObject[key];
    }
    return res;
  };
  
  Solve.prototype.toHTML = function() {
    if (this.plus2) {
      return this.toString() + '+';
    } else {
      return '<s>' + this.toString() + '</s>';
    }
    return this.toString();
  };
  
  Solve.prototype.toString = function() {
    var millis = this.time;
    
    // This is the definition of ugly code.
    var centiseconds = '' + (Math.floor(millis/10)%100);
    var seconds = '' + (Math.floor(millis/1000)%60);
    var minutes = '' + (Math.floor(millis/60000)%60);
    var hours = '' + (Math.floor(millis/3600000)%60);
    if (centiseconds.length < 2) {
      centiseconds = '0' + centiseconds;
    }
    if (minutes === '0' && hours === '0') {
      return seconds + '.' + centiseconds;
    } else if (hours === '0') {
      seconds = padZero(seconds);
      return minutes + ':' + seconds + '.' + centiseconds;
    } else {
      seconds = padZero(seconds);
      minutes = padZero(minutes);
      return hours + ':' + minutes + ':' + seconds + '.' + centiseconds;
    }
  };
  
  Solve.prototype.virtualTime = function() {
    if (this.plus2) {
      return this.time + 2;
    }
    return this.time;
  };
  
  function filterDigits(value) {
    // Remove all non-digit characters. I bet there's a fancier JS way to do
    // this.
    rawChars = '';
    for (var i = 0; i < value.length; ++i) {
      var code = value.charCodeAt(i);
      if (code == 0x30 && rawChars.length == 0) {
        continue;
      }
      if (code < 0x30 || code > 0x39) {
        continue;
      }
      rawChars += code - 0x30;
    }
    if (rawChars.length > 7) {
      return rawChars.substring(0, 7);
    }
    return rawChars;
  }
  
  function padZero(s) {
    if (s.length < 2) {
      return '0' + s;
    }
    return s;
  }
  
  function parseTime(timeStr) {
    // It works. Don't judge.
    var digits = filterDigits(timeStr);
    var multipliers = [10, 100, 1000, 10000, 60000, 600000, 6*600000, 6*6000000,
      6*6*600000];
    var number = 0;
    for (var i = 0; i < digits.length; i++) {
      var mult = multipliers[digits.length - i - 1];
      var digit = digits.charCodeAt(i) - 0x30;
      number += digit * mult;
    }
    return number;
  }
  
  if (!window.app) {
    window.app = {};
  }
  window.app.Solve = Solve;
  
})();