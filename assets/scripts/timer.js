(function() {
  
  function Session() {
    this.times = [];
  }
  
  Session.prototype.add = function(time) {
    this.times.push(new TimeInfo(time));
  };
  
  Session.prototype.totalAverage = function() {
    if (this.times.length === 0) {
      return 0;
    }
    var sum = 0;
    for (var i = 0, len = this.times.length; i < len; ++i) {
      sum += this.times[i].millis;
    }
    return printableTime(Math.round(sum / this.times.length));
  };
  
  function TimeInfo(millis) {
    this.millis = millis;
    this.dnf = false;
    this.plus2 = false;
  }
  
  function Timer() {
    this.session = new Session();
    this.table = new TimesTable();
    this.timerField = $('#timer');
    this.start = null;
    this.interval = null;
    
    this.table.onselect = function() {
      if (this.start !== null) {
        this.toggleTimer();
      }
      if (this.table.selected < 0) {
        this.timerField.prop('disabled', false);
        this.showTime(0);
        return;
      }
      this.timerField.prop('disabled', true);
      var time = this.session.times[this.table.selected];
      this.showTime(time.millis);
    }.bind(this);
    
    // Spacebar event for starting/stopping
    $(document).keypress(function(k) {
      // TODO: make sure no input is selected...
      if (k.keyCode == 0x20) {
        this.toggleTimer();
      }
    }.bind(this));
    
    // Manual time editing.
    this.timerField.on('input', this.inputChanged.bind(this));
    this.timerField.keypress(function(e) {
      if (e.keyCode == 13) {
        this.inputSubmit();
      }
    }.bind(this));
    
    this.updateStats();
  }
  
  Timer.prototype.inputChanged = function() {
    // Compute the new time
    var digits = filterDigits(this.timerField.val());
    var newTimeString = '';
    if (digits.length > 6) {
      newTimeString = digits.substring(0, digits.length-6) + ':' +
        digits.substring(digits.length-6, digits.length-4) + ':' +
        digits.substring(digits.length-4, digits.length-2) + '.' +
        digits.substring(digits.length-2);
    } else if (digits.length > 4) {
      newTimeString = digits.substring(0, digits.length-4) + ':' +
        digits.substring(digits.length-4, digits.length-2) + '.' +
        digits.substring(digits.length-2);
    } else if (digits.length >= 3) {
      newTimeString = digits.substring(0, digits.length - 2) + '.' +
        digits.substring(digits.length-2);
    } else if (digits.length == 2) {
      newTimeString = '0.' + digits;
    } else if (digits.length == 1) {
      newTimeString = '0.0' + digits;
    } else {
      newTimeString = '0.00';
    }
    this.timerField.val(newTimeString);
  };
  
  Timer.prototype.inputSubmit = function() {
    var delay = parseTime(this.timerField.val());
    this.session.add(delay);
    this.table.add(delay);
    this.showTime(0);
    this.updateStats();
  };
  
  Timer.prototype.showTime = function(time) {
    this.timerField.val(printableTime(time));
  };
  
  Timer.prototype.toggleTimer = function() {
    if (this.start === null) {
      this.table.selectRow(-1);
      this.timerField.prop('disabled', true);
      this.start = new Date();
      this.interval = setInterval(function() {
        var delay = (new Date()).getTime() - this.start.getTime();
        this.showTime(delay);
      }.bind(this), 33);
    } else {
      this.timerField.prop('disabled', false);
      var delay = (new Date()).getTime() - this.start.getTime();
      this.session.add(delay);
      this.table.add(delay);
      this.showTime(delay);
      clearInterval(this.interval);
      this.interval = null;
      this.start = null;
      this.updateStats();
    }
  };
  
  Timer.prototype.updateStats = function() {
    var solveCount = this.session.times.length;
    var totalAverage = this.session.totalAverage();
    $('#session-stats').html('Solve count: ' + solveCount + '<br>' +
      'Total average: ' + totalAverage);
  };
  
  function TimesTable() {
    this.element = $('#times-list');
    this.rowDivs = [];
    this.onselect = null;
    this.selected = -1;
    this.element.click(function() {
      this._selectRow(-1);
    }.bind(this));
  }
  
  TimesTable.prototype.add = function(time) {
    var rowElement = document.createElement('div');
    rowElement.className = 'time-row';
    var solveTime = document.createElement('label');
    solveTime.className = 'time';
    solveTime.innerHTML = printableTime(time);
    rowElement.appendChild(solveTime);
    
    // Allow them to click on the row.
    var index = this.rowDivs.length;
    $(rowElement).click(function(e) {
      e.stopPropagation();
      this._selectRow(index);
    }.bind(this));
    
    this.rowDivs.push(rowElement);
    this.element.append($(rowElement));
  };
  
  TimesTable.prototype.selectRow = function(idx) {
    if (idx >= this.rowDivs.length) {
      this.selectRow(-1);
      return;
    }
    // Deselect the last row
    if (this.selected >= 0) {
      this.rowDivs[this.selected].className = 'time-row';
    }
    
    // Select the new row.
    this.selected = idx;
    if (idx >= 0) {
      this.rowDivs[idx].className = 'time-row time-row-selected';
    }
  };
  
  TimesTable.prototype._selectRow = function(idx) {
    var cur = this.selected;
    this.selectRow(idx);
    if (this.onselect && cur != this.selected) {
      this.onselect(this.selected);
    }
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
  
  function parseTime(time) {
    // It works. Don't judge.
    var digits = filterDigits(time);
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
  
  function printableTime(millis) {
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
      if (seconds.length < 2) {
        seconds += '0';
      }
      return minutes + ':' + seconds + '.' + centiseconds;
    } else {
      if (seconds.length < 2) {
        seconds += '0';
      }
      if (minutes.length < 2) {
        minutes += '0';
      }
      return hours + ':' + minutes + ':' + seconds + '.' + centiseconds;
    }
  }
  
  $(function() {
    new Timer();
  });
  
})();