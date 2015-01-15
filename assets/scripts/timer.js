(function() {
  
  function Session() {
    this.times = [];
  }
  
  Session.prototype.add = function(time) {
    this.times.push(new TimeInfo(time));
  };
  
  Session.prototype.best = function() {
    if (this.times.length === 0) {
      return 'N/A';
    }
    var best = Math.pow(10, 10);
    for (var i = 0, len = this.times.length; i < len; ++i) {
      best = Math.min(this.times[i].millis, best);
    }
    return printableTime(best);
  };
  
  Session.prototype.average = function(start, count) {
    var list = [];
    for (var i = start; i < start+count; ++i) {
      list.push(this.times[i].millis);
    }
    
    if (count === 5 || count === 12) {
      // Remove best and worst times.
      list.sort(function(a, b) {
        return a - b;
      });
      list.splice(0, 1);
      list.splice(list.length-1, 1);
    }
    
    var average = 0;
    for (var i = 0, len = list.length; i < len; ++i) {
      average += list[i];
    }
    return printableTime(average / list.length);
  };
  
  Session.prototype.totalAverage = function() {
    if (this.times.length === 0) {
      return 'N/A';
    }
    var sum = 0;
    for (var i = 0, len = this.times.length; i < len; ++i) {
      sum += this.times[i].millis;
    }
    return printableTime(Math.round(sum / this.times.length));
  };
  
  Session.prototype.worst = function() {
    if (this.times.length === 0) {
      return 'N/A';
    }
    var worst = -1;
    for (var i = 0, len = this.times.length; i < len; ++i) {
      worst = Math.max(this.times[i].millis, worst);
    }
    return printableTime(worst);
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
    
    this.table.ondelete = function(idx) {
      this.session.times.splice(idx, 1);
      this.table.delete(idx);
      this.updateStats();
    }.bind(this);
    
    // Spacebar event for starting/stopping
    $(document).keypress(function(k) {
      // TODO: make sure no input is selected...
      var keyCode = k.charCode || k.keyCode;
      if (keyCode == 0x20) {
        k.preventDefault();
        this.toggleTimer();
      }
    }.bind(this));
    
    // Manual time editing.
    this.timerField.on('input', this.inputChanged.bind(this));
    this.timerField.keypress(function(e) {
      var keyCode = e.charCode || e.keyCode;
      if (keyCode == 13) {
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
    this.updateStats();
    this.table.selectRow(this.session.times.length - 1);
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
      if (this.table.selected < 0) {
        this.table.selectRow(this.session.times.length-1);
      }
      clearInterval(this.interval);
      this.interval = null;
      this.start = null;
      this.updateStats();
    }
  };
  
  Timer.prototype.updateStats = function() {
    var solveCount = this.session.times.length;
    var totalAverage = this.session.totalAverage();
    var best = this.session.best();
    var worst = this.session.worst();
    var contents = 'Solve count: ' + solveCount + '<br>' +
      'Total average: ' + totalAverage + '<br>' +
      'Best time: ' + best + '<br>' +
      'Worst time: ' + worst;
    var sizes = [5, 12, 100];
    for (var i = 0; i < sizes.length; ++i) {
      var size = sizes[i];
      if (size > this.session.times.length) {
        break;
      }
      var lastStart = this.session.times.length - size;
      var lastAverage = this.session.average(lastStart, size);
      var bestAverage = lastAverage;
      for (var j = 0; j < lastStart; ++j) {
        var avg = this.session.average(j, size);
        bestAverage = Math.min(bestAverage, avg);
      }
      contents += '<br>Best average of ' + size + ': ' + bestAverage;
      contents += '<br>Last average of ' + size + ': ' + lastAverage;
    }
    $('#session-stats').html(contents);
  };
  
  function TimesTable() {
    this.element = $('#times-list');
    this.rowDivs = [];
    this.onselect = null;
    this.ondelete = null;
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
    var deleteButton = document.createElement('button');
    deleteButton.className = 'delete';
    deleteButton.innerHTML = 'x';
    rowElement.appendChild(deleteButton);
    
    // Allow them to click on the row.
    $(rowElement).click(function(e) {
      e.stopPropagation();
      this._selectRow(this.rowDivs.indexOf(rowElement));
    }.bind(this));
    $(deleteButton).click(function(e) {
      e.stopPropagation();
      if (this.ondelete) {
        this.ondelete(this.rowDivs.indexOf(rowElement));
      }
    }.bind(this));
    
    this.rowDivs.push(rowElement);
    this.element.prepend($(rowElement));
  };
  
  TimesTable.prototype.delete = function(idx) {
    if (idx < 0 || idx >= this.rowDivs.length) {
      return;
    }
    $(this.rowDivs[idx]).remove();
    this.rowDivs.splice(idx, 1);
    if (idx == this.selected) {
      this._selectRow(-1);
    } else if (idx < this.selected) {
      --this.selected;
    }
  };
  
  TimesTable.prototype.selectRow = function(idx) {
    if (idx >= this.rowDivs.length) {
      this.selectRow(-1);
      return;
    }
    // Deselect the last row
    if (this.selected >= 0 && this.selected < this.rowDivs.length) {
      this.rowDivs[this.selected].className = 'time-row';
    }
    
    // Select the new row.
    this.selected = idx;
    if (idx >= 0) {
      this.rowDivs[idx].className = 'time-row time-row-selected';
      // TODO: scroll to this
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
    
  }
  
  $(function() {
    new Timer();
  });
  
})();