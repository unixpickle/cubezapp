// NOTE TO READER:
// According to the cubing community, the "average" and the "mean" are different
// things. The "mean" is the arithmetic mean, while the average removes the best
// and worst times before computing the mean.
(function() {

  // FILTER_DNF_CUTOFF is the first average size for which DNFs should be
  // completely ignored.
  var FILTER_DNF_CUTOFF = 50;

  var NUM_REMOVE = [0, 1, 1, 3, 5, 50];
  var SIZES = [3, 5, 12, 50, 100, 1000];

  function AverageComputer(size, numRemove, filter) {
    this._size = size;
    this._numRemove = numRemove;
    this._filter = filter;
    this._center = new window.averagejs.CenterAverage(size, numRemove);
    this._solves = new LinkedList();
  }

  AverageComputer.prototype.average = function() {
    return this._center.average();
  };

  AverageComputer.prototype.pushSolve = function(solve) {
    if (this._filter && solve.dnf) {
      return;
    }
    var time = solve.dnf ? Infinity : window.app.solveTime(solve);
    this._center.pushValue(time);
    this._solves.push(solve);
    this._solves.shift();
  };

  AverageComputer.prototype.standardDeviation = function() {
    return this._center.standardDeviation();
  };

  AverageComputer.prototype.timeToBeat = function() {
    var beat = this.average() - 1;
    var time = this._center.valueNeededForAverage(beat);
    if (isNaN(time) || time < 0) {
      return NaN;
    } else {
      return Math.floor(time);
    }
  };

  function LinkedList() {
    this._count = 0;
    this._first = null;
    this._last = null;
  }

  LinkedList.prototype.count = function() {
    return this._count;
  };

  LinkedList.prototype.push = function(x) {
    var node = {object: x, next: null, last: this._last};
    if (this._last === null) {
      this._first = node;
      this._last = node;
    } else {
      this._last.next = node;
      this._last = node;
    }
  };

  LinkedList.prototype.shift = function() {
    if (this._last === null) {
      return null;
    }
    var res = this._last.object;
    this._last = this._last.last;
    if (this._last === null) {
      this._first = null;
    } else {
      this._last.next = null;
    }
    return res;
  };

})();
