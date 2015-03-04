// NOTE TO READER:
// According to the blessed qqTimer, the "average" and the "mean" are different
// things. The "mean" is the arithmetic mean, while the average removes the best
// and worst times before computing the mean. I know this is wrong, but I am a
// simple minion who has no free will nor wishes to have it.
(function() {
  
  function bestAverage(times, count) {
    var best = -1;
    for (var i = 0, len = times.length-count; i <= len; ++i) {
      var subList = times.slice(i, i+count);
      removeBestWorst(subList);
      var average = mean(subList);
      if (average < best || best === -1) {
        best = average;
      }
    }
    return best;
  }
  
  function bestMean(times, count) {
    var best = -1;
    for (var i = 0, len = times.length-(count-1); i < len; ++i) {
      var subList = times.slice(i, i+count);
      var average = mean(subList);
      if (average < best || best === -1) {
        best = average;
      }
    }
    return best;
  }
  
  function bestTime(times) {
    var best = -1;
    for (var i = 0, len = times.length; i < len; ++i) {
      if (i === 0 || times[i] < best) {
        best = times[i];
      }
    }
    return best;
  }
  
  function computeStatistics(times) {
    // Compute the general statistics.
    var average = NaN;
    var best = NaN;
    var count = times.length;
    var worst = NaN;
    if (times.length > 0) {
      best = bestTime(times);
      worst = worstTime(times);
    }
    if (times.length > 2) {
      var t = times.slice();
      removeBestWorst(t);
      average = mean(t);
    }
    var res = {average: average, best: best, count: count, worst: worst,
      averages: []};
    
    // Compute the averages table
    if (times.length > 2) {
      res.averages.push(["mo3", lastMean(times, 3), bestMean(times, 3)]);
    }
    var averages = [5, 12, 50, 100, 1000];
    for (var i = 0, len = averages.length; i < len; ++i) {
      var avg = averages[i];
      if (avg > times.length) {
        break;
      }
      res.averages.push(['' + avg, lastAverage(times, avg),
        bestAverage(times, avg)]);
    }
    return res;
  }
  
  function lastAverage(times, count) {
    if (times.length < count) {
      return NaN;
    }
    var subList = times.slice(0, count);
    removeBestWorst(subList);
    return mean(subList);
  }
  
  function lastMean(times, count) {
    if (times.length < count) {
      return NaN;
    }
    var subList = times.slice(0, count);
    return mean(subList);
  }
  
  function mean(times) {
    var sum = 0;
    for (var i = 0, len = times.length; i < len; ++i) {
      sum += times[i];
    }
    return sum / times.length;
  }
  
  function removeBestWorst(times) {
    if (times.length === 0) {
      return;
    }
    
    // In O(n), find the max and min values.
    var max = 0;
    var maxIdx = -1;
    var min = 0;
    var minIdx = -1;
    for (var i = 0, len = times.length; i < len; ++i) {
      var time = times[i];
      if (time > max || maxIdx === -1) {
        max = time;
        maxIdx = i;
      }
      if (time < min || minIdx === -1) {
        min = time;
        minIdx = i;
      }
    }
    
    // Remove the max and min values.
    times.splice(maxIdx, 1);
    if (minIdx < maxIdx) {
      times.splice(minIdx, 1);
    } else if (minIdx > maxIdx) {
      times.splice(minIdx-1, 1);
    }
  }
  
  function statsForSolves(solves) {
    var times = [];
    for (var i = 0, len = solves.length; i < len; ++i) {
      times[i] = window.app.solveTime(solves[i]);
    }
    return computeStatistics(times);
  }
  
  function worstTime(times) {
    var worst = -1;
    for (var i = 0, len = times.length; i < len; ++i) {
      if (i === 0 || times[i] > worst) {
        worst = times[i];
      }
    }
    return worst;
  }
  
  window.app.computeStatistics = computeStatistics;
  window.app.statsForSolves = statsForSolves;
  
})();
