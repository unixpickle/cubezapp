(function() {
  
  function Session() {
    this.records = [];
  }
  
  Session.prototype.add = function(record) {
    this.records.push(record);
  };
  
  Session.prototype.average = function(count, start) {
    // With no arguments, this takes the average of every value.
    if ('undefined' === typeof count) {
      if (this.count() === 0) {
        return NaN;
      }
      var sum = 0;
      for (var i = 0, len = this.count(); i < len; ++i) {
        sum += this.records[i].virtualTime();
      }
      return sum / this.count();
    }
    
    // Validate the start argument.
    if ('undefined' === typeof start) {
      start = this.count() - count;
    }
    if (start < 0 || start+count > this.count()) {
      return NaN;
    }
    
    // Create a list of all the times.
    var list = [];
    for (var i = start; i < start+count; ++i) {
      list.push(this.records[i].virtualTime());
    }
    
    // Remove best and worst times if necessary.
    if (count === 5 || count === 12) {
      list.sort(function(a, b) {
        return a - b;
      });
      list.splice(0, 1);
      list.splice(list.length-1, 1);
    }
    
    // Calculate the average.
    var sum = 0;
    for (var i = 0, len = list.length; i < len; ++i) {
      sum += list[i];
    }
    return sum / list.length;
  };
  
  Session.prototype.averageTable = function() {
    var result = [];
    var sizes = [5, 12, 100];
    for (var i = 0, len = sizes.length; i < len; ++i) {
      var size = sizes[i];
      if (size > this.count()) {
        break;
      }
      var lastAverage = this.session.average(size);
      var bestAverage = lastAverage;
      for (var j = 0, len = this.count()-size; j < len; ++j) {
        var avg = this.session.average(size, j);
        bestAverage = Math.min(bestAverage, avg);
      }
      result.push([size, lastAverage, bestAverage]);
    }
    return result;
  };
  
  Session.prototype.best = function() {
    var best = NaN;
    for (var i = 0, len = this.count(); i < len; ++i) {
      var time = this.records[i].virtualTime();
      if (isNaN(best) || time < best) {
        best = time;
      }
    }
    return best;
  };
  
  Session.prototype.count = function() {
    return this.records.length;
  };
  
  Session.prototype.delete = function(idx) {
    this.records.splice(idx, 1);
  };
  
  Session.prototype.worst = function() {
    if (this.count() === 0) {
      return NaN;
    }
    var worst = -1;
    for (var i = 0, len = this.count(); i < len; ++i) {
      worst = Math.max(this.records[i].virtualTime(), worst);
    }
    return worst;
  };
  
  if (!window.app) {
    window.app = {};
  }
  
  window.app.Session = Session;
  
})();