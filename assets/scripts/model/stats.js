// NOTE TO READER:
// According to the blessed qqTimer, the "average" and the "mean" are different
// things. The "mean" is the arithmetic mean, while the average removes the best
// and worst times before computing the mean. I know this is wrong, but I am a
// simple minion who has no free will nor wishes to have it.
(function() {

  // Averages of 50 or more will pretend DNF solves aren't there.
  var FILTER_DNF_CUTOFF = 50;

  function bestAverage(times, count) {
    // NOTE: this can be optimized if it needs to be.
    var best = -1;
    var bestIdx = -1;
    for (var i = 0, len = times.length-count; i <= len; ++i) {
      var subList;
      if (count >= FILTER_DNF_CUTOFF) {
        subList = filterDNFs(times, i, count);
        if (subList === null) {
          break;
        }
      } else {
        subList = times.slice(i, i+count);
        if (dnfCount(subList) > 1) {
          continue;
        }
      }
      removeBestWorst(subList);
      var average = mean(subList);
      if (average < best || best === -1) {
        best = average;
        bestIdx = i;
      }
    }
    return {best: best, index: bestIdx};
  }

  function bestMeanOf3(times) {
    var best = -1;
    var bestIdx = -1;
    for (var i = 0, len = times.length-3; i <= len; ++i) {
      var subList = times.slice(i, i+3);
      if (dnfCount(subList) > 0) {
        continue;
      }
      var average = mean(subList);
      if (average < best || best === -1) {
        best = average;
      }
    }
    return {best: best, index: bestIdx};
  }

  function bestTime(times) {
    var best = -1;
    for (var i = 0, len = times.length; i < len; ++i) {
      var time = times[i];
      if (time >= 0) {
        if (i === 0 || time < best) {
          best = time;
        }
      }
    }
    return best;
  }

  function computeStatisticsForSolves(solves) {
    var times = timesForSolves(solves);
    // TODO: the rest of the stuff here.
  }

  function dnfCount(times) {
    var count = 0;
    for (var i = 0, len = times.length; i < len; ++i) {
      if (times[i] < 0) {
        ++count;
      }
    }
    return count;
  }

  function filterDNFs(times, start, count) {
    var res = [];
    for (var i = start, l = times.length; i < l && res.length < count; ++i) {
      var time = times[i];
      if (time >= 0) {
        res.push(time);
      }
    }
    if (res.length < count) {
      return null;
    } else {
      return res;
    }
  }

  function globalMean(times) {
    var sum = 0;
    var count = 0;
    for (var i = 0, len = times.length; i < len; ++i) {
      var time = times[i];
      if (time >= 0) {
        ++count;
        sum += time;
      }
    }
    return sum / count;
  }

  function lastAverage(times, count) {
    if (times.length < count) {
      return -1;
    }
    var subList;
    if (count >= FILTER_DNF_CUTOFF) {
      subList = [];
      for (var i = times.length-1; i >= 0 && subList.length < count; --i) {
        var time = times[i];
        if (time >= 0) {
          subList.push(time);
        }
      }
      if (subList.length < count) {
        return -1;
      }
    } else {
      subList = times.slice(times.length-count, times.length);
      if (dnfCount(subList) > 1) {
        return -1;
      }
    }
    removeBestWorst(subList);
    return mean(subList);
  }

  function lastMeanOf3(times) {
    if (times.length < 3) {
      return -1;
    }
    var subList = times.slice(times.length-3, times.length);
    if (dnfCount(subList) > 0) {
      return -1;
    }
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

    var worst = 0;
    var worstIdx = -1;
    var best = 0;
    var bestIdx = -1;
    for (var i = 0, len = times.length; i < len; ++i) {
      var time = times[i];
      if (time < 0) {
        worst = -1;
        worstIdx = i;
      } else {
        var worstIsDNF = (worst === -1);
        if (!maxIsDNF && (time > worst || worstIdx === -1)) {
          worst = time;
          worstIdx = i;
        }
        if (time < best || bestIdx === -1) {
          best = time;
          bestIdx = i;
        }
      }
    }

    times.splice(worstIdx, 1);
    if (bestIdx < worstIdx) {
      times.splice(bestIdx, 1);
    } else if (bestIdx > worstIdx) {
      times.splice(bestIdx-1, 1);
    }
  }

  function timesForSolves(solves) {
    var times = [];
    for (var i = 0, len = solves.length; i < len; ++i) {
      var solve = solves[i];
      if (solve.dnf) {
        times.push(-1);
      } else {
        times.push(window.app.solveTime(solve));
      }
    }
  }

  window.app.computeStatisticsForSolves = computeStatisticsForSolves;

})();
