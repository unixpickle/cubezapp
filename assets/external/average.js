// average.js version 1.0.1
//
// Copyright (c) 2015, Alexander Nichol.
// All rights reserved.
// 
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
// 
// 1. Redistributions of source code must retain the above copyright notice,
//    this list of conditions and the following disclaimer. 
// 2. Redistributions in binary form must reproduce the above copyright notice,
//    this list of conditions and the following disclaimer in the documentation
//    and/or other materials provided with the distribution.
// 
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
// ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
// LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
// SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.
//
(function() {
  var exports;
  if ('undefined' !== typeof window) {
    // Browser
    if (!window.averagejs) {
      window.averagejs = {};
    }
    exports = window.averagejs;
  } else if ('undefined' !== typeof self) {
    // WebWorker
    if (!self.averagejs) {
      self.averagejs = {};
    }
    exports = self.averagejs;
  } else if ('undefined' !== typeof module) {
    // Node.js
    if (!module.exports) {
      module.exports = {};
    }
    exports = module.exports;
  }

  // A CenterAverage is a rolling average which removes a certain number of the
  // highest and lowest values and which always counts +Inf as a high value and
  // -Inf as a low value.
  //
  // If there are more than numRemove values of +Inf or -Inf, the average is NaN.
  function CenterAverage(size, numRemove) {
    if (numRemove*2 >= size) {
      throw new Error('numRemove is too large');
    }

    this._size = size;
    this._numRemove = numRemove;

    this._posInfCount = 0;
    this._negInfCount = 0;

    this._average = new MovingAverage(size - numRemove*2);
    this._chronologicalValues = new NumberStack(size);
    this._sortedValues = new SortedArray(size);
  }

  // average returns the current average or NaN if there were not enough actual
  // values.
  CenterAverage.prototype.average = function() {
    if (Math.max(this._posInfCount, this._negInfCount) > this._numRemove ||
        this._sortedValues.count() < this._size) {
      return NaN;
    } else {
      return this._average.average();
    }
  };

  // copy generates a copy of the CenterAverage in this current state.
  CenterAverage.prototype.copy = function() {
    var res = new CenterAverage(this._size, this._numRemove);
    res._posInfCount = this._posInfCount;
    res._negInfCount = this._negInfCount;
    res._average = this._average.copy();
    res._chronologicalValues = this._chronologicalValues.copy();
    res._sortedValues = this._sortedValues.copy();
    return res;
  };

  // pushValue adds the next value to the rolling average and removes the very
  // first value.
  CenterAverage.prototype.pushValue = function(value) {
    var wasFullBeforeAddition = (this._sortedValues.count() === this._size);
    if (wasFullBeforeAddition) {
      this._removeOldestValue();
    }

    this._chronologicalValues.push(value);
    if (value === Infinity) {
      ++this._posInfCount;
    } else if (value === -Infinity) {
      ++this._negInfCount;
    }
    var idx = this._sortedValues.add(value);

    if (this._sortedValues.count() < this._size) {
      return;
    } else if (!wasFullBeforeAddition) {
      this._computeFirstAverage();
      return;
    }

    if (idx >= this._numRemove && idx < this._size - this._numRemove) {
      // |LLL|MMMM|HH | -> |LLL|MMMM|MHH|.
      this._average.add(value);
    }
    if (idx < this._numRemove) {
      // |LLL|MMMM|HH | -> |LLL|LMMM|MHH|
      this._average.add(this._sortedValues.get(this._numRemove));
    }
    if (idx < this._size - this._numRemove && this._numRemove > 0) {
      // |LLL|MMMM|HH | -> either |LLL|LMMM|MHH| or |LLL|MMMM|MHH|
      this._average.remove(this._sortedValues.get(this._size - this._numRemove));
    }
  };

  // standardDeviation computes the standard deviation of the center values.
  CenterAverage.prototype.standardDeviation = function() {
    var average = this.average();
    if (isNaN(average)) {
      return NaN;
    }
    var squareDiffs = 0;
    var max = this._size - this._numRemove;
    for (var i = this._numRemove; i < max; ++i) {
      squareDiffs += Math.pow(average - this._sortedValues.get(i), 2);
    }
    var variance = squareDiffs / (this._size - this._numRemove*2);
    return Math.sqrt(variance);
  };

  // valueNeededForAverage computes a value which could be passed to pushValue()
  // in order to have a given average value. This returns NaN if such a number
  // does not exist.
  CenterAverage.prototype.valueNeededForAverage = function(requested) {
    if (this._sortedValues.count() < this._size-1) {
      return NaN;
    }

    // shiftedVersion will be missing exactly 1 value. Its state can be denoted as
    // [LLL...|MMMM...|HH... ] (note the missing H).
    var shiftedVersion = this;
    if (this._sortedValues.count() === this._size) {
      shiftedVersion = this.copy();
      shiftedVersion._removeOldestValue();
    }

    if (shiftedVersion._posInfCount > this._numRemove ||
        shiftedVersion._negInfCount > this._numRemove) {
      return NaN;
    }

    var average = shiftedVersion._average.average();
    var middleCount = this._size - this._numRemove*2;

    // If numRemove is 0, it is usually possible to get any value.
    if (this._numRemove === 0) {
      if (!isFinite(average)) {
        return NaN;
      }
      return (requested - average) * middleCount;
    }

    var highestMiddle = shiftedVersion._sortedValues.get(this._size -
      (this._numRemove + 1));
    if (isFinite(highestMiddle) && average === requested) {
      // [LLL|MMMX|HH ], (sum of M + X)/count = requested, so we just push X to
      // get [LLL|MMMX|XHH].
      return highestMiddle;
    } else {
      // [LLL|MMMX|HH ], L <= result < X
      var lowerBound = shiftedVersion._sortedValues.get(this._numRemove - 1);
      var mSum = average*middleCount;
      if (isFinite(highestMiddle)) {
        mSum -= highestMiddle;
      }
      var newValue = requested*middleCount - mSum;
      if (newValue < lowerBound || newValue > highestMiddle) {
        return NaN;
      } else {
        return newValue;
      }
    }
  };

  CenterAverage.prototype._computeFirstAverage = function() {
    for (var i = this._numRemove; i < this._size-this._numRemove; ++i) {
      this._average.add(this._sortedValues.get(i));
    }
  };

  CenterAverage.prototype._removeOldestValue = function() {
    var oldValue = this._chronologicalValues.shift();
    if (oldValue === Infinity) {
      --this._posInfCount;
    } else if (oldValue === -Infinity) {
      --this._negInfCount;
    }

    // this._average may have to be updated after removing the value, since
    // |LLL|MMMMMMMM|HHH| might have become |LLM|MMMMMMMH|HH | (deleted an L) or
    // |LLL|MMMMMMMH|HH | (deleted an M). If it became |LLL|MMMMMMMM|HH |
    // (deleted an H), nothing changed in the average.

    var removedIndex = this._sortedValues.remove(oldValue);
    if (removedIndex >= this._numRemove &&
        removedIndex < this._size - this._numRemove) {
      this._average.remove(oldValue);
    }
    if (removedIndex < this._numRemove) {
      var newLowIndex = this._numRemove - 1;
      if (this._sortedValues.count() > newLowIndex) {
        this._average.remove(this._sortedValues.get(newLowIndex));
      }
    }
    if (removedIndex < this._size - this._numRemove && this._numRemove > 0) {
      var newMiddleIndex = this._size - this._numRemove - 1;
      if (this._sortedValues.count() > newMiddleIndex) {
        this._average.add(this._sortedValues.get(newMiddleIndex));
      }
    }
  };

  exports.CenterAverage = CenterAverage;
  // A MovingAverage computes an average on the fly.
  function MovingAverage(count) {
    this._count = count;
    this._value = 0;
  }

  MovingAverage.prototype.add = function(val) {
    if (!isFinite(val) || isNaN(val)) {
      return;
    }
    this._value += val;
  };

  MovingAverage.prototype.average = function() {
    return this._value / this._count;
  };

  MovingAverage.prototype.copy = function() {
    var res = new MovingAverage(this._count);
    res._value = this._value;
    return res;
  };

  MovingAverage.prototype.remove = function(val) {
    if (!isFinite(val) || isNaN(val)) {
      return;
    }
    this._value -= val;
  };

  exports.MovingAverage = MovingAverage;
  // A NumberStack is a list of numbers with a constant size and O(1) push and
  // shift time.
  function NumberStack(capacity) {
    this._array = [];
    this._start = 0;
    this._end = 0;
    this._count = 0;
    for (var i = 0; i < capacity; ++i) {
      this._array[i] = 0;
    }
  }

  NumberStack.prototype.copy = function() {
    var res = new NumberStack(0);
    res._array = this._array.slice();
    res._start = this._start;
    res._end = this._end;
    res._count = this._count;
    return res;
  };

  NumberStack.prototype.count = function() {
    return this._count;
  };

  NumberStack.prototype.get = function(idx) {
    if (idx < 0 || idx >= this._count) {
      throw new Error('index out of bounds: ' + idx);
    }
    return this._array[(idx + this._start) % this._array.length];
  };

  NumberStack.prototype.push = function(number) {
    if (this._count === this._array.length) {
      throw new Error('overflow');
    }
    ++this._count;
    this._array[this._end++] = number;
    if (this._end === this._array.length) {
      this._end = 0;
    }
  };

  NumberStack.prototype.shift = function() {
    if (this._count === 0) {
      throw new Error('underflow');
    }
    --this._count;
    var res = this._array[this._start++];
    if (this._start === this._array.length) {
      this._start = 0;
    }
    return res;
  };

  exports.NumberStack = NumberStack;
  // A SortedArray keeps an array of integers sorted. This could be implemented
  // as a binary tree in the future, but for now it uses a simple JS array.
  function SortedArray(size) {
    this._list = new BisectedNumberList(size);
  }

  // add inserts a value and returns the index it was inserted into.
  SortedArray.prototype.add = function(value) {
    var idx = this._findIndex(value);
    this._list.insert(idx, value);
    return idx;
  };

  // copy duplicates the sorted array and returns the duplicate.
  SortedArray.prototype.copy = function() {
    var res = new SortedArray();
    res._list = this._list.copy();
    return res;
  };

  // count returns the number of items in the list.
  SortedArray.prototype.count = function() {
    return this._list.count();
  };

  // get returns the number at a given index.
  SortedArray.prototype.get = function(index) {
    return this._list.get(index);
  };

  // remove removes a value and returns the index where the value was. It returns
  // -1 if the value was not found.
  SortedArray.prototype.remove = function(value) {
    var idx = this._findIndex(value);
    if (idx === this._list.count() || this._list.get(idx) !== value) {
      return -1;
    } else {
      this._list.remove(idx);
      return idx;
    }
  };

  SortedArray.prototype._findIndex = function(value) {
    var begin = -1;
    var end = this._list.count();
    while (begin + 1 < end) {
      var idx = (begin + end) >> 1;
      var val = this._list.get(idx);
      if (val > value) {
        end = idx;
      } else if (val < value) {
        begin = idx;
      } else {
        return idx;
      }
    }
    return begin + 1;
  };

  function BisectedNumberList(size) {
    this._lower = [];
    this._upper = [];
    this._lowerSize = (size >>> 1);
    this._upperSize = size - this._lowerSize;
  }

  BisectedNumberList.prototype.copy = function() {
    var res = new BisectedNumberList(this._lowerSize + this._upperSize);
    res._lower = this._lower.slice();
    res._upper = this._upper.slice();
    return res;
  };

  BisectedNumberList.prototype.count = function() {
    return this._lower.length + this._upper.length;
  };

  BisectedNumberList.prototype.get = function(i) {
    if (i < 0) {
      throw new Error('out of bounds');
    }
    if (i < this._lowerSize) {
      if (i >= this._lower.length) {
        throw new Error('out of bounds');
      }
      return this._lower[i];
    } else {
      var idx = i - this._lowerSize;
      if (idx >= this._upper.length) {
        throw new Error('out of bounds');
      }
      return this._upper[this._upper.length - (idx + 1)];
    }
  };

  BisectedNumberList.prototype.insert = function(i, val) {
    if (i < 0) {
      throw new Error('out of bounds');
    }
    if (i < this._lowerSize) {
      if (this._lower.length === this._lowerSize) {
        this._upper.push(this._lower.pop());
      }
      this._lower.splice(i, 0, val);
    } else {
      var idx = this._upper.length - (i - this._lowerSize);
      this._upper.splice(idx, 0, val);
    }
    if (this._upper.length > this._upperSize) {
      throw new Error('overflow');
    }
  };

  BisectedNumberList.prototype.remove = function(i) {
    if (i < this._lowerSize) {
      this._lower.splice(i, 1);
      if (this._upper.length > 0) {
        this._lower.push(this._upper.pop());
      }
    } else {
      var idx = this._upper.length - (i - this._lowerSize) - 1;
      this._upper.splice(idx, 1);
    }
  };

  function NumberList(size) {
    this._array = [];
    this._size = size;
  }

  NumberList.prototype.copy = function() {
    var res = new NumberList(this._size);
    res._array = this._array.slice();
    return res;
  };

  NumberList.prototype.count = function() {
    return this._array.length;
  };

  NumberList.prototype.get = function(i) {
    if (i < 0 || i >= this._array.length) {
      throw new Error('out of bounds');
    }
    return this._array[i];
  };

  NumberList.prototype.insert = function(i, val) {
    this._array.splice(i, 0, val);
    if (this._array.length > this._size) {
      throw new Error('overflow ' + this._size);
    }
  };

  NumberList.prototype.remove = function(i) {
    this._array.splice(i, 1);
  };

  exports.SortedArray = SortedArray;

})();
