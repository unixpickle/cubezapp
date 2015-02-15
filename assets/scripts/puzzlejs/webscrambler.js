(function() {

  // Uncomment the following line and put in the webworker path if necessary.
  // var workerPath = 'puzzlejs/webscrambler_worker.js';
  
  var workerPath = null;

  var scrambleWorker = null;
  var callbacks = {};
  var ticketId = 0;

  if ('undefined' !== typeof window.Worker) {
    // We may need to find the worker's path manually.
    if (workerPath === null) {
      // Use the current script's "src" attribute to figure out where the
      // scripts are.
      var scripts = document.getElementsByTagName('script');
      if (scripts.length === 0) {
        throw new Error('unable to find worker path');
      }
      var scriptPath = scripts[scripts.length-1].src.split('?')[0];
      var slashIdx = scriptPath.lastIndexOf('/');
      if (slashIdx >= 0) {
        workerPath = scriptPath.slice(0, slashIdx) + '/webscrambler_worker.js';
      } else {
        workerPath = 'webscrambler_worker.js';
      }
    }
    
    // Setup the webworker to call our callbacks.
    scrambleWorker = new window.Worker(workerPath);
    scrambleWorker.onmessage = function(e) {
      var m = e.data;
      var cb = callbacks[m.id]
      delete callbacks[m.id];
      cb(m.scramble);
    }
  }

  function generateScramble(puzzle, scrambler, moves, cb) {
    // We may need to compute the scramble synchronously.
    if (scrambleWorker === null) {
      setTimeout(function() {
        var res = window.puzzlejs.scrambler.generateScramble(puzzle, scrambler,
          moves);
        cb(res);
      }, 10);
      return;
    }

    // Post the request and wait for the response asynchronously.
    var ticket = ticketId++;
    callbacks[ticket] = cb;
    scrambleWorker.postMessage({puzzle: puzzle, scrambler: scrambler,
      moves: moves, id: ticket});
  }

  if (!window.puzzlejs) {
    window.puzzlejs = {webscrambler: {}};
  } else if (!window.puzzlejs.webscrambler) {
    window.puzzlejs.webscrambler = {};
  }
  window.puzzlejs.webscrambler.generateScramble = generateScramble;

})();