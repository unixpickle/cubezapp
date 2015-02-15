// This is the compiled scrambler API.
(function() {

  var exports;
  if ('undefined' !== typeof window) {
    // Browser
    if (!window.puzzlejs) {
      window.puzzlejs = {scrambler: {}};
    } else if (!window.puzzlejs.scrambler) {
      window.puzzlejs.scrambler = {};
    }
    exports = window.puzzlejs.scrambler;
  } else if ('undefined' !== typeof self) {
    // WebWorker
    if (!self.puzzlejs) {
      self.puzzlejs = {scrambler: {}};
    } else if (!self.puzzlejs.scrambler) {
      self.puzzlejs.scrambler = {};
    }
    exports = self.puzzlejs.scrambler;
  } else if ('undefined' !== typeof module) {
    // Node.js
    if (!module.exports) {
      module.exports = {};
    }
    exports = module.exports;
  }
  
  
  var RubikAPI = null;
  var SkewbAPI = null;
  
  if ('undefined' !== typeof window) {
    RubikAPI = window.puzzlejs.rubik;
    SkewbAPI = window.puzzlejs.skewb;
  } else if ('undefined' !== typeof self) {
    RubikAPI = self.puzzlejs.rubik;
    SkewbAPI = self.puzzlejs.skewb;
  } else if ('function' === typeof require) {
    RubikAPI = require('./rubik.js');
    SkewbAPI = require('./skewb.js');
  }
  
  var scramblers;
  
  function allPuzzles() {
    var res = [];
    for (var i = 0, len = scramblers.length; i < len; ++i) {
      res[i] = scramblers[i].name;
    }
    return res;
  }
  
  function generateScramble(puzzle, scrambler, moves) {
    // Find the info for the scrambler.
    var info = null;
    for (var i = 0, len = scramblers.length; i < len; ++i) {
      if (scramblers[i].name === puzzle) {
        var subs = scramblers[i].scramblers;
        for (var j = 0, len = subs.length; j < len; ++j) {
          if (subs[j].name === scrambler) {
            info = subs[j];
            break;
          }
        }
      }
    }
    
    if (info === null) {
      throw new Error('unknown scrambler: ' + puzzle + '/' + scrambler);
    }
    if (info.moves) {
      return info.f(moves);
    } else {
      return info.f();
    }
  }
  
  function rubikMoves(count) {
    var moves = RubikAPI.scrambleMoves(count);
    return RubikAPI.movesToString(moves);
  }
  
  function scramblersForPuzzle(puzzle) {
    for (var i = 0, len = scramblers.length; i < len; ++i) {
      if (scramblers[i].name === puzzle) {
        var res = [];
        var subs = scramblers[i].scramblers;
        for (var j = 0, len = subs.length; j < len; ++j) {
          res[j] = {moves: subs[j].moves, name: subs[j].name};
        }
        return res;
      }
    }
    throw new Error('unknown puzzle: ' + puzzle);
  }
  
  function skewbState() {
    var state = SkewbAPI.randomState();
    var solution = SkewbAPI.solve(state);
    return SkewbAPI.movesToString(solution);
  }
  
  scramblers = [
    {
      name: "3x3x3",
      scramblers: [
        {
          f: rubikMoves,
          moves: true,
          name: "Moves"
        }
      ]
    },
    {
      name: "Skewb",
      scramblers: [
        {
          f: skewbState,
          moves: false,
          name: "State"
        }
      ]
    }
  ];
  
  exports.allPuzzles = allPuzzles;
  exports.generateScramble = generateScramble;
  exports.scramblersForPuzzle = scramblersForPuzzle;
  

})();
