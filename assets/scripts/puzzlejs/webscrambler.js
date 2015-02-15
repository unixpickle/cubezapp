(function() {

  var scrambleWorker = null;
  var workerPath = 'scripts/puzzlejs/webscrambler_worker.js';
  var callbacks = {};
  var ticketId = 0;

  if ('undefined' !== typeof window.Worker) {
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