// NOTE TO READER:
// According to the cubing community, the "average" and the "mean" are different
// things. The "mean" is the arithmetic mean, while the average removes the best
// and worst times before computing the mean.
(function() {

  // FILTER_DNF_CUTOFF is the minimum size of an average which should ignore
  // DNFs.
  var FILTER_DNF_CUTOFF = 50;

  // DNF_TIME is a constant used to represent DNFs as integers.
  var DNF_TIME = -1;

  // An UnfilteredAverage is a rolling average which removes a certain number of
  // best and worst times and which always counts DNFs as bad times.
  function UnfilteredAverage(size, numRemove) {
    this._size = size;
    this._numRemove = numRemove;

    this._dnfCount = 0;

    this._average = new MovingAverage(size - numRemove*2);
    this._times = new NumberStack(size);
    this._best = new SortedArray();
    this._middle = new SortedArray();
    this._worst = new SortedArray();
  }

  // average returns the current average or -1 if the average is a DNF.
  UnfilteredAverage.prototype.average = function() {
    if (this._dnfCount > this._numRemove) {
      return -1;
    }
    return this._average.average();
  };

  // pushTime adds the next time to the rolling average and removes the very
  // first time.
  UnfilteredAverage.prototype.pushTime = function(time) {
    this._shiftTime();
    this._times.push(time);
    if (time === DNF_TIME) {
      ++this._dnfCount;
    }

    this._worst.add(time);
    this._balanceData();
  };

  UnfilteredAverage.prototype._balanceData = function() {
    while (this._worst.count() > this._numRemove) {
      var time = this._worst.popBest();
      this._middle.add(time);
      this._average.add(time);
    }
    var middleCapacity = this._size - this._numRemove*2;
    while (this._middle.count() > middleCapacity) {
      var time = this._middle.popBest();
      this._average.remove(time);
      this._best.add(time);
    }
  };

  UnfilteredAverage.prototype._shiftTime = function() {
    if (this._times.count() < this._size) {
      return;
    }

    var time = this._times.shift();
    if (time === DNF_TIME) {
      --this._dnfCount;
    }

    if (!this._middle.remove(time)) {
      if (!this._worst.remove(time)) {
        if (!this._best.remove(time)) {
          throw new Error('time was not in any table');
        }
      }
    } else {
      this._average.remove(time);
    }
  };

  // A FilteredAverage is a rolling average which completely ignores DNFs.
  function FilteredAverage(size, numRemove) {
    UnfilteredAverage.call(this, size, numRemove);
  }

  FilteredAverage.prototype = Object.create(UnfilteredAverage.prototype);

  FilteredAverage.prototype.pushTime = function(time) {
    if (time !== DNF_TIME) {
      UnfilteredAverage.prototype.pushTime.call(this, time);
    }
  };

  // A SortedArray keeps an array of integers sorted. It treats DNF_TIME as
  // positive infinity. This could be implemented as a binary tree in the
  // future.
  function SortedArray() {
    this._list = [];
  }

  SortedArray.prototype.add = function(value) {
    var idx = this._findIndex(value);
    this._list.splice(idx, 0, value);
  };

  SortedArray.prototype.count = function() {
    return this._list.length;
  };

  SortedArray.prototype.popBest = function() {
    if (this._list.length === 0) {
      throw new Error('underflow');
    }
    var val = this._list[0];
    this._list.splice(0, 1);
    return val;
  };

  SortedArray.prototype.remove = function(value) {
    var idx = this._findValue(value);
    if (idx === this._list.length || this._list[idx] !== value) {
      return false;
    } else {
      this._list.splice(idx, 1);
      return true;
    }
  };

  SortedArray.prototype._endsWithDNF = function() {
    if (this._list.length > 0) {
      return this._list[this._list.length - 1] === DNF_TIME;
    } else {
      return false;
    }
  };

  SortedArray.prototype._findIndex = function(value) {
    if (value === DNF_TIME) {
      if (this._endsWithDNF()) {
        return this._list.length - 1;
      } else {
        return this._list.length;
      }
    }
    var begin = -1;
    var end = this._list.length;
    while (begin + 1 < end) {
      var idx = (begin + end) >> 1;
      var val = this._list[idx];
      if (val > value || val === DNF_TIME) {
        end = idx;
      } else if (val < value) {
        begin = idx;
      } else {
        return idx;
      }
    }
    return begin + 1;
  };

  // A MovingAverage computes the average of a moving window of values.
  function MovingAverage(count) {
    this._count = count;
    this._value = 0;
  }

  MovingAverage.prototype.add = function(val) {
    this._value += val;
  };

  MovingAverage.prototype.average = function() {
    return this._value / this._count;
  };

  MovingAverage.prototype.remove = function(val) {
    this._value -= val;
  };

  // A NumberStack is a list of numbers which O(1) push and shift time.
  function NumberStack(capacity) {
    this._array = [];
    this._capacity = capacity;
    this._start = 0;
    this._end = 0;
    this._count = 0;
  }

  NumberStack.prototype.count = function() {
    return this._count;
  };

  NumberStack.prototype.get = function(idx) {
    if (idx < 0 || idx >= this._count) {
      throw new Error('index out of bounds: ' + idx);
    }
    return this._array[(idx + this._start) % this._capacity];
  };

  NumberStack.prototype.push = function(number) {
    if (this._count === this._capacity) {
      throw new Error('overflow');
    }
    ++this._count;
    this._array[this._end++] = number;
    if (this._end === this._capacity) {
      this._end = 0;
    }
  };

  NumberStack.prototype.shift = function() {
    if (this._count === 0) {
      throw new Error('underflow');
    }
    --this._count;
    var res = this._array[this._start++];
    if (this._start === this._capacity) {
      this._start = 0;
    }
    return res;
  };

  function currentSolveArray() {
    // NOTE: this will only work offline with the LocalStore.
    return window.app.store.getActive().solves;
  }

  window.app.computeStatisticsForSolves = computeStatisticsForSolves;

})();
