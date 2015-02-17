// This is the compiled perms API.
(function() {

  var exports;
  if ('undefined' !== typeof window) {
    // Browser
    if (!window.puzzlejs) {
      window.puzzlejs = {perms: {}};
    } else if (!window.puzzlejs.perms) {
      window.puzzlejs.perms = {};
    }
    exports = window.puzzlejs.perms;
  } else if ('undefined' !== typeof self) {
    // WebWorker
    if (!self.puzzlejs) {
      self.puzzlejs = {perms: {}};
    } else if (!self.puzzlejs.perms) {
      self.puzzlejs.perms = {};
    }
    exports = self.puzzlejs.perms;
  } else if ('undefined' !== typeof module) {
    // Node.js
    if (!module.exports) {
      module.exports = {};
    }
    exports = module.exports;
  }
  
  function includeAPI(name) {
    if ('undefined' !== typeof window) {
      return window.puzzlejs[name];
    } else if ('undefined' !== typeof self) {
      return self.puzzlejs[name];
    } else if ('function' === typeof require) {
      return require('./' + name + '.js');
    } else {
      throw new Error('Unable to include: ' + name);
    }
  }

  var pascalsTriangle = [
    [1],
    [1, 1],
    [1, 2, 1],
    [1, 3, 3, 1],
    [1, 4, 6, 4, 1],
    [1, 5, 10, 10, 5, 1],
    [1, 6, 15, 20, 15, 6, 1],
    [1, 7, 21, 35, 35, 21, 7, 1],
    [1, 8, 28, 56, 70, 56, 28, 8, 1],
    [1, 9, 36, 84, 126, 126, 84, 36, 9, 1],
    [1, 10, 45, 120, 210, 252, 210, 120, 45, 10, 1],
    [1, 11, 55, 165, 330, 462, 462, 330, 165, 55, 11, 1],
    [1, 12, 66, 220, 495, 792, 924, 792, 495, 220, 66, 12, 1]
  ];
  
  /**
   * Supply two numbers, a and b, to get (a choose b)
   */
  function choose(a, b) {
    if (a < 13) {
      return pascalsTriangle[a][b];
    }
    
    var res = 1;
    for (var i = 0; i < b; ++i) {
      res *= a;
      a -= 1;
    }
    return res/factorial(b);
  }
  
  /**
   * This takes an array of booleans and returns how many are true.
   */
  function countTrue(list) {
    var res = 0;
    for (var i = 0, len = list.length; i < len; ++i) {
      if (list[i] === true) {
        ++res;
      }
    }
    return res;
  }
  
  /**
   * The [choice] array stores a set of true and false boolean values. It
   * represents the "choice" to be encoded.
   */
  function encodeChoose(choice) {
    return encodeExplicitChoose(0, choice, countTrue(choice));
  }
  
  /**
   * This serves as a perfect-mapping hash function for an unordered choose
   * operation.
   *
   * The [start] argument specifies the index in the [choice] array to start at.
   * Usually, this should be 0.
   *
   * The [choice] array stores a set of true and false boolean values. It
   * represents the "choice" to be encoded.
   *
   * The [numTrue] argument specifies how many true values are in [choose]. You
   * can compute this using the [countTrue] function.
   */
  function encodeExplicitChoose(start, choice, numTrue) {
    if (choice.length-start <= 1 || numTrue === 0) {
      return 0;
    } else if (numTrue === 1) {
      for (var i = start, len = choice.length; i < len; ++i) {
        if (choice[i] === true) {
          return i-start;
        }
      }
    }
    
    var numMissed = 0;
    for (var i = start, len = choice.length; i < len; ++i) {
      if (choice[i] === true) {
        var subChoose = encodeExplicitChoose(i+1, choice, numTrue-1);
        return subChoose + numMissed;
      } else {
        numMissed += choose(choice.length-(i+1), numTrue-1);
      }
    }
    return -1;
  }
  
  exports.choose = choose;
  exports.encodeChoose = encodeChoose;
  var factorials = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800,
    39916800, 479001600, 6227020800];
  
  /**
   * This generates all the permutations of a given length [size].
   */
  function allPerms(size) {
    if (size === 0) {
      return [[]];
    } else if (size === 1) {
      return [[0]];
    }
    
    // Recursively generate permutations
    var result = [];
    var subPermutations = allPerms(size-1);
    for (var start = 0; start < size; ++start) {
      for (var i = 0, len = subPermutations.length; i < len; ++i) {
        var aPerm = [start].concat(subPermutations[i]);
        // Increment values which are >= start in the sub-permutation.
        for (var j = 1, l = aPerm.length; j < l; ++j) {
          if (aPerm[j] >= start) {
            ++aPerm[j];
          }
        }
        result.push(aPerm);
      }
    }
    return result;
  }
  
  /**
   * Encode a permutation with a perfect-mapping hash function, destroying the
   * permutation array in the process.
   */
  function encodeDestructablePerm(permutation) {
    if (permutation.length <= 1) {
      return 0;
    }
    
    var result = 0;
    for (var i = 0, len = permutation.length-1; i < len; ++i) {
      var current = permutation[i];
      
      // If the first item of the sub-permutation does not belong at the
      // beginning, we need to offset our result.
      if (current !== 0) {
        var tailCount = factorial(len-i);
        result += tailCount*current;
      }
      
      // Get rid of any trace of "current" from the sub-permutation .
      for (var j = i+1; j < len; ++j) {
        if (permutation[j] > current) {
          --permutation[j];
        }
      }
    }
    
    return result;
  }
  
  /**
   * Encode a permutation with a perfect-mapping hash function.
   */
  function encodePerm(permutation) {
    return encodeDestructablePerm(permutation.slice());
  }
  
  /**
   * Compute the factorial of [n].
   */
  function factorial(n) {
    if (n >= factorials.length) {
      return n * factorial(n-1);
    }
    return factorials[n];
  }
  
  /**
   * Compute the parity of a permutation on the list [0, 1, 2, 3, ...]
   *
   * This returns true for even parity and false for add parity.
   */
  function parity(permutation) {
    return paritySort(permutation.slice());
  }
  
  /**
   * Compute the parity of a permutation on the list [0, 1, 2, 3, ...].
   *
   * The [list] will be sorted while this function executes.
   *
   * This returns true for even parity and false for add parity.
   */
  function paritySort(list) {
    var parity = true;
    for (var i = 0, len = list.length-1; i < len; ++i) {
      // If the element is where it belongs, continue.
      if (list[i] === i) {
        continue;
      }
      
      parity = !parity;
      
      // Find the other value (which we know is after i)
      for (var j = i+1; j < len+1; ++j) {
        if (list[j] === i) {
          list[j] = list[i];
          list[i] = i;
        }
      }
    }
    return parity;
  }
  
  /**
   * Generates a random permutation of length [len].
   */
  function randomPerm(len) {
    // Generate a list of symbols.
    var symbols = [];
    for (var i = 0; i < len; ++i) {
      symbols[i] = i;
    }
    
    // Picking random symbols from the list and add them to the result.
    var result = [];
    while (symbols.length > 0) {
      var idx = Math.floor(Math.random() * symbols.length);
      var value = symbols[idx];
      symbols.splice(idx, 1);
      result.push(value);
    }
    
    return result;
  }
  
  /**
   * Generates a random permutation of length [len] with parity [p].
   */
  function randomPermParity(len, p) {
    if (len <= 1 && p === false) {
      throw new Error('cannot generate odd permutation on ' + len + ' symbols');
    }
    
    var res = randomPerm(len);
    
    // Do a swap if the parity is wrong.
    if (parity(res) !== p) {
      var first = res[0];
      res[0] = res[1];
      res[1] = first;
    }
    
    return res;
  }
  
  exports.allPerms = allPerms;
  exports.encodeDestructablePerm = encodeDestructablePerm;
  exports.encodePerm = encodePerm;
  exports.factorial = factorial;
  exports.parity = parity;
  exports.paritySort = paritySort;
  exports.randomPerm = randomPerm;
  exports.randomPermParity = randomPermParity;

})();
// This is the compiled pocketcube API.
(function() {

  var exports;
  if ('undefined' !== typeof window) {
    // Browser
    if (!window.puzzlejs) {
      window.puzzlejs = {pocketcube: {}};
    } else if (!window.puzzlejs.pocketcube) {
      window.puzzlejs.pocketcube = {};
    }
    exports = window.puzzlejs.pocketcube;
  } else if ('undefined' !== typeof self) {
    // WebWorker
    if (!self.puzzlejs) {
      self.puzzlejs = {pocketcube: {}};
    } else if (!self.puzzlejs.pocketcube) {
      self.puzzlejs.pocketcube = {};
    }
    exports = self.puzzlejs.pocketcube;
  } else if ('undefined' !== typeof module) {
    // Node.js
    if (!module.exports) {
      module.exports = {};
    }
    exports = module.exports;
  }
  
  function includeAPI(name) {
    if ('undefined' !== typeof window) {
      return window.puzzlejs[name];
    } else if ('undefined' !== typeof self) {
      return self.puzzlejs[name];
    } else if ('function' === typeof require) {
      return require('./' + name + '.js');
    } else {
      throw new Error('Unable to include: ' + name);
    }
  }

  /**
   * A Corner stores the piece index and orientation of a corner.
   *
   * To understand the meaning of a Corner's fields, you must first
   * understand the coordinate system. There are there axes, x, y, and z.
   * The x axis is 0 at the L face and 1 at the R face.
   * The y axis is 0 at the D face and 1 at the U face.
   * The z axis is 0 at the B face and 1 at the F face.
   *
   * A corner piece's index is determined by it's original position on the
   * cube. The index is a binary number of the form ZYX, where Z is the most
   * significant digit. Thus, the BLD corner is 0, the BRU corner is 3, the
   * FRU corner is 7, etc.
   *
   * The orientation of a corner tells how it is twisted. It is an axis number
   * 0, 1, or 2 for x, y, or z respectively. It indicates the direction normal
   * to the red or orange sticker (i.e. the sticker that is usually normal to
   * the x axis).
   */
  function Corner(piece, orientation) {
    this.piece = piece;
    this.orientation = orientation;
  }
  
  Corner.prototype.copy = function() {
    return new Corner(this.piece, this.orientation);
  };
  
  /**
   * Cube represent the corners of a cube.
   */
  function Cube() {
    this.corners = [];
    for (var i = 0; i < 8; ++i) {
      this.corners[i] = new Corner(i, 0);
    }
  }
  
  Cube.prototype.copy = function() {
    var newCube = [];
    for (var i = 0; i < 8; ++i) {
      newCube[i] = this.corners[i].copy();
    }
    var res = Object.create(Cube.prototype);
    res.corners = newCube;
    return res;
  };
  
  Cube.prototype.halfTurn = function(face) {
    switch (face) {
    case 1:
      var ref = this.corners[2];
      this.corners[2] = this.corners[7];
      this.corners[7] = ref;
      ref = this.corners[3];
      this.corners[3] = this.corners[6];
      this.corners[6] = ref;
      break;
    case 2:
      var ref = this.corners[0];
      this.corners[0] = this.corners[5];
      this.corners[5] = ref;
      ref = this.corners[1];
      this.corners[1] = this.corners[4];
      this.corners[4] = ref;
      break;
    case 3:
      var ref = this.corners[5];
      this.corners[5] = this.corners[6];
      this.corners[6] = ref;
      ref = this.corners[4];
      this.corners[4] = this.corners[7];
      this.corners[7] = ref;
      break;
    case 4:
      var ref = this.corners[0];
      this.corners[0] = this.corners[3];
      this.corners[3] = ref;
      ref = this.corners[1];
      this.corners[1] = this.corners[2];
      this.corners[2] = ref;
      break;
    case 5:
      var ref = this.corners[1];
      this.corners[1] = this.corners[7];
      this.corners[7] = ref;
      ref = this.corners[3];
      this.corners[3] = this.corners[5];
      this.corners[5] = ref;
      break;
    case 6:
      var ref = this.corners[0];
      this.corners[0] = this.corners[6];
      this.corners[6] = ref;
      ref = this.corners[2];
      this.corners[2] = this.corners[4];
      this.corners[4] = ref;
      break;
    default:
      break;
    }
  };
  
  Cube.prototype.move = function(m) {
    if (m.turns === 2) {
      this.halfTurn(m.face);
    } else {
      this.quarterTurn(m.face, m.turns);
    }
  };
  
  Cube.prototype.quarterTurn = function(face, turns) {
    switch (face) {
    case 1:
      if (turns === 1) {
        var ref = this.corners[6];
        this.corners[6] = this.corners[7];
        this.corners[7] = this.corners[3];
        this.corners[3] = this.corners[2];
        this.corners[2] = ref;
      } else {
        var ref = this.corners[6];
        this.corners[6] = this.corners[2];
        this.corners[2] = this.corners[3];
        this.corners[3] = this.corners[7];
        this.corners[7] = ref;
      }
      var indices = [2, 3, 6, 7];
      for (var i = 0; i < 4; ++i) {
        var idx = indices[i];
        this.corners[idx].orientation = 2 - this.corners[idx].orientation;
      }
      break;
    case 2:
      if (turns === 1) {
        var ref = this.corners[4];
        this.corners[4] = this.corners[0];
        this.corners[0] = this.corners[1];
        this.corners[1] = this.corners[5];
        this.corners[5] = ref;
      } else {
        var ref = this.corners[4];
        this.corners[4] = this.corners[5];
        this.corners[5] = this.corners[1];
        this.corners[1] = this.corners[0];
        this.corners[0] = ref;
      }
      var indices = [0, 1, 4, 5];
      for (var i = 0; i < 4; ++i) {
        var idx = indices[i];
        this.corners[idx].orientation = 2 - this.corners[idx].orientation;
      }
      break;
    case 3:
      if (turns === 1) {
        var ref = this.corners[4];
        this.corners[4] = this.corners[5];
        this.corners[5] = this.corners[7];
        this.corners[7] = this.corners[6];
        this.corners[6] = ref;
      } else {
        var ref = this.corners[6];
        this.corners[6] = this.corners[7];
        this.corners[7] = this.corners[5];
        this.corners[5] = this.corners[4];
        this.corners[4] = ref;
      }
      var indices = [4, 5, 6, 7];
      for (var i = 0; i < 4; ++i) {
        var p = this.corners[indices[i]];
        var o = p.orientation;
        if (o === 0) {
          p.orientation = 1;
        } else if (o === 1) {
          p.orientation = 0;
        }
      }
      break;
    case 4:
      if (turns === 1) {
        var ref = this.corners[0];
        this.corners[0] = this.corners[2];
        this.corners[2] = this.corners[3];
        this.corners[3] = this.corners[1];
        this.corners[1] = ref;
      } else {
        var ref = this.corners[1];
        this.corners[1] = this.corners[3];
        this.corners[3] = this.corners[2];
        this.corners[2] = this.corners[0];
        this.corners[0] = ref;
      }
      for (var i = 0; i < 4; ++i) {
        var p = this.corners[i];
        var o = p.orientation;
        if (o === 0) {
          p.orientation = 1;
        } else if (o === 1) {
          p.orientation = 0;
        }
      }
      break;
    case 5:
      if (turns === 1) {
        var ref = this.corners[5];
        this.corners[5] = this.corners[1];
        this.corners[1] = this.corners[3];
        this.corners[3] = this.corners[7];
        this.corners[7] = ref;
      } else {
        var ref = this.corners[7];
        this.corners[7] = this.corners[3];
        this.corners[3] = this.corners[1];
        this.corners[1] = this.corners[5];
        this.corners[5] = ref;
      }
      var indices = [1, 3, 5, 7];
      for (var i = 0; i < 4; ++i) {
        var p = this.corners[indices[i]];
        var o = p.orientation;
        if (o === 1) {
          p.orientation = 2;
        } else if (o === 2) {
          p.orientation = 1;
        }
      }
      break;
    case 6:
      if (turns === 1) {
        var ref = this.corners[4];
        this.corners[4] = this.corners[6];
        this.corners[6] = this.corners[2];
        this.corners[2] = this.corners[0];
        this.corners[0] = ref;
      } else {
        var ref = this.corners[0];
        this.corners[0] = this.corners[2];
        this.corners[2] = this.corners[6];
        this.corners[6] = this.corners[4];
        this.corners[4] = ref;
      }
      for (var i = 0; i < 4; ++i) {
        var p = this.corners[i * 2];
        var o = p.orientation;
        if (o === 1) {
          p.orientation = 2;
        } else if (o === 2) {
          p.orientation = 1;
        }
      }
      break;
    default:
      break;
    }
  };
  
  Cube.prototype.solved = function() {
    for (var i = 0; i < 7; ++i) {
      var corner = this.corners[i];
      if (corner.piece !== i || corner.orientation !== 0) {
        return false;
      }
    }
    return true;
  };
  
  exports.Corner = Corner;
  exports.Cube = Cube;
  var PermsAPI = includeAPI('perms');
  
  function FullHeuristic(depth) {
    this.depth = depth;
    this.table = {};
  }
  
  FullHeuristic.prototype.generate = function(moves) {
    var queue = [{depth: 0, cube: new Cube()}];
    while (queue.length > 0) {
      node = queue[0];
      queue.splice(0, 1);
      
      var key = '' + encodeCube(node.cube);
      if (this.table.hasOwnProperty(key)) {
        continue;
      }
      this.table[key] = node.depth;
      
      if (node.depth === this.depth) {
        continue;
      }
      for (var i = 0, len = moves.length; i < len; ++i) {
        var newCube = node.cube.copy();
        newCube.move(moves[i]);
        queue.push({depth: node.depth+1, cube: newCube});
      }
    }
  };
  
  FullHeuristic.prototype.lookup = function(cube) {
    var result = this.table[encodeCube(cube)];
    if ('undefined' === typeof result) {
      return this.depth + 1;
    }
    return result;
  };
  
  function encodeCO(cube) {
    var res = 0;
    var mul = 1;
    for (var i = 0; i < 7; ++i) {
      res += mul * cube.corners[i].orientation;
      mul *= 3;
    }
    return res;
  }
  
  function encodeCP(cube) {
    var permutation = [];
    for (var i = 0; i < 8; ++i) {
      permutation[i] = cube.corners[i].piece;
    }
    return PermsAPI.encodeDestructablePerm(permutation);
  }
  
  function encodeCube(cube) {
    return encodeCP(cube)*2187 + encodeCO(cube);
  }
  
  exports.FullHeuristic = FullHeuristic;
  var _allMovesList;
  
  function Move(face, turns) {
    this.face = face;
    this.turns = turns;
  }
  
  Move.prototype.axis = function() {
    return [-1, 1, 1, 2, 2, 0, 0][this.face];
  };
  
  Move.prototype.inverse = function() {
    if (this.turns === 2) {
      return this;
    } else {
      return new Move(this.face, -this.turns);
    }
  };
  
  Move.prototype.toString = function() {
    var faces = 'UDFBRL';
    var face = faces[this.face - 1];
    if (this.turns === 1) {
      return face;
    } else if (this.turns === 2) {
      return face + '2';
    } else {
      return face + "'";
    }
  };
  
  function allMoves() {
    return _allMovesList.slice();
  }
  
  function basisMoves() {
    return _basisMovesList.slice();
  }
  
  function movesToString(moves) {
    return moves.join(' ');
  }
  
  function parseMove(s) {
    if (s.length === 1) {
      var faces = ['U', 'D', 'F', 'B', 'R', 'L'];
      var face = faces.indexOf(s);
      if (face < 0) {
        throw new Error('Invalid move: ' + s);
      }
      return new Move(face+1, 1);
    } else if (s.length === 2) {
      var res = parseMove(s[0]);
      if (s[1] === '2') {
        res.turns = 2;
      } else if (s[1] === "'") {
        res.turns = -1;
      } else {
        throw new Error('Invalid move: ' + s);
      }
      return res;
    } else {
      throw new Error('Invalid move: ' + s);
    }
  }
  
  function parseMoves(s) {
    var parts = s.split(' ');
    var res = [];
    for (var i = 0, len = parts.length; i < len; ++i) {
      res[i] = parseMove(parts[i]);
    }
    return res;
  }
  
  // Generate a list of every move, ordered by comfort.
  _allMovesList = parseMoves("R R' L L' U U' D D' R2 L2 U2 D2 F2 B2 F " +
    "F' B B'");
  
  // Generate a list of the standard basis moves.
  _basisMovesList = parseMoves("R R' R2 U U' U2 F F' F2");
  
  exports.Move = Move;
  exports.allMoves = allMoves;
  exports.basisMoves = basisMoves;
  exports.movesToString = movesToString;
  exports.parseMove = parseMove;
  exports.parseMoves = parseMoves;
  var randomPerm = includeAPI('perms').randomPerm;
  
  function randomState() {
    var result = new Cube();
    
    // Generate a random permutation and random twists.
    // Corner 0 needs to stay solved so that no B, L, or D moves are needed.
    var pieces = randomPerm(7);
    for (var i = 0; i < 7; ++i) {
      result.corners[i + 1].piece = pieces[i] + 1;
    }
    for (var i = 1; i < 7; ++i) {
      result.corners[i].orientation = Math.floor(Math.random() * 3);
    }
    
    // Compute the last corner's orientation.
    // The way this works is based on the fact that a sune combo which twists two
    // adjacent corners is all that is necessary to generate any corner
    // orientation case.
    var ordering = [0, 1, 5, 4, 6, 2, 3, 7];
    var orientations = [];
    for (var i = 0; i < 8; ++i) {
      orientations[i] = result.corners[ordering[i]].orientation;
    }
    for (var i = 0; i < 7; ++i) {
      var thisOrientation = orientations[i];
      var nextOrientation = orientations[i + 1];
      // Twist thisOrientation to be solved, affecting the next corner in the
      // sequence.
      if (thisOrientation === 1) {
        // y -> x, x -> z, z -> y
        orientations[i + 1] = (nextOrientation+2) % 3;
      } else if (thisOrientation === 2) {
        // z -> x, x -> y, y -> z
        orientations[i + 1] = (nextOrientation+1) % 3;
      }
    }
    // The twist of the last corner is the inverse of what it should be in the
    // scramble.
    if (orientations[7] === 1) {
      result.corners[7].orientation = 2;
    } else if (orientations[7] === 2) {
      result.corners[7].orientation = 1;
    }
    
    return result;
  }
  
  exports.randomState = randomState;
  function depthFirst(cube, heuristic, moves, depth) {
    if (depth === 0) {
      if (cube.solved()) {
        return [];
      } else {
        return null;
      }
    } else if (heuristic.lookup(cube) > depth) {
      return null;
    }
    
    // Apply all the moves.
    for (var i = 0, len = moves.length; i < len; ++i) {
      var newState = cube.copy();
      newState.move(moves[i]);
      var result = depthFirst(newState, heuristic, moves, depth-1);
      if (result !== null) {
        return [moves[i]].concat(result);
      }
    }
    
    return null;
  }
  
  function solve(cube, heuristic, moves, maxDepth) {
    if ('undefined' === typeof maxDepth) {
      maxDepth = 11;
    }
    for (var depth = 0; depth <= maxDepth; ++depth) {
      var solution = depthFirst(cube, heuristic, moves, depth);
      if (solution !== null) {
        return solution;
      }
    }
    return null;
  }
  
  exports.solve = solve;

})();
// This is the compiled rubik API.
(function() {

  var exports;
  if ('undefined' !== typeof window) {
    // Browser
    if (!window.puzzlejs) {
      window.puzzlejs = {rubik: {}};
    } else if (!window.puzzlejs.rubik) {
      window.puzzlejs.rubik = {};
    }
    exports = window.puzzlejs.rubik;
  } else if ('undefined' !== typeof self) {
    // WebWorker
    if (!self.puzzlejs) {
      self.puzzlejs = {rubik: {}};
    } else if (!self.puzzlejs.rubik) {
      self.puzzlejs.rubik = {};
    }
    exports = self.puzzlejs.rubik;
  } else if ('undefined' !== typeof module) {
    // Node.js
    if (!module.exports) {
      module.exports = {};
    }
    exports = module.exports;
  }
  
  function includeAPI(name) {
    if ('undefined' !== typeof window) {
      return window.puzzlejs[name];
    } else if ('undefined' !== typeof self) {
      return self.puzzlejs[name];
    } else if ('function' === typeof require) {
      return require('./' + name + '.js');
    } else {
      throw new Error('Unable to include: ' + name);
    }
  }

  var PocketCube = includeAPI('pocketcube');
  var Corner = PocketCube.Corner;
  var Corners = PocketCube.Cube;
  
  function Cube() {
    this.edges = new Edges();
    this.corners = new Corners();
  }
  
  Cube.prototype.copy = function() {
    var res = Object.create(Cube.prototype);
    res.edges = this.edges.copy();
    res.corners = this.corners.copy();
    return res;
  };
  
  Cube.prototype.halfTurn = function(face) {
    this.corners.halfTurn(face);
    this.edges.halfTurn(face);
  };
  
  Cube.prototype.move = function(m) {
    this.corners.move(m);
    this.edges.move(m);
  };
  
  Cube.prototype.quarterTurn = function(face, turns) {
    this.corners.quarterTurn(face, turns);
    this.edges.quarterTurn(face, turns);
  };
  
  Cube.prototype.solved = function() {
    return this.corners.solved() && this.edges.solved();
  };
  
  /**
   * An Edge represents a physical edge of a cube.
   *
   * Edges are indexed from 0 through 11 in the following order:
   * UF, RF, DF, LF, UL, UR, BU, BR, BD, BL, DL, DR.
   *
   * The flip field is true if the edge is "bad" in the ZZ color scheme (i.e.
   * if it requires an F or B move to fix).
   */
  function Edge(piece, flip) {
    this.piece = piece;
    this.flip = flip;
  }
  
  Edge.prototype.copy = function() {
    return new Edge(this.piece, this.flip);
  };
  
  function Edges() {
    this.edges = [];
    for (var i = 0; i < 12; ++i) {
      this.edges[i] = new Edge(i, false);
    }
  }
  
  Edges.prototype.copy = function() {
    var newEdges = [];
    for (var i = 0; i < 12; ++i) {
      newEdges[i] = this.edges[i].copy();
    }
    var res = Object.create(Edges.prototype);
    res.edges = newEdges;
    return res;
  };
  
  Edges.prototype.halfTurn = function(face) {
    switch (face) {
    case 1:
      var ref = this.edges[0];
      this.edges[0] = this.edges[6];
      this.edges[6] = ref;
      ref = this.edges[4];
      this.edges[4] = this.edges[5];
      this.edges[5] = ref;
      break;
    case 2:
      var ref = this.edges[2];
      this.edges[2] = this.edges[8];
      this.edges[8] = ref;
      ref = this.edges[10];
      this.edges[10] = this.edges[11];
      this.edges[11] = ref;
      break;
    case 3:
      var ref = this.edges[0];
      this.edges[0] = this.edges[2];
      this.edges[2] = ref;
      ref = this.edges[1];
      this.edges[1] = this.edges[3];
      this.edges[3] = ref;
      break;
    case 4:
      var ref = this.edges[6];
      this.edges[6] = this.edges[8];
      this.edges[8] = ref;
      ref = this.edges[7];
      this.edges[7] = this.edges[9];
      this.edges[9] = ref;
      break;
    case 5:
      var ref = this.edges[1];
      this.edges[1] = this.edges[7];
      this.edges[7] = ref;
      ref = this.edges[5];
      this.edges[5] = this.edges[11];
      this.edges[11] = ref;
      break;
    case 6:
      var ref = this.edges[3];
      this.edges[3] = this.edges[9];
      this.edges[9] = ref;
      ref = this.edges[4];
      this.edges[4] = this.edges[10];
      this.edges[10] = ref;
      break;
    default:
      break;
    }
  };
  
  Edges.prototype.move = function(m) {
    if (m.turns === 2) {
      this.halfTurn(m.face);
    } else {
      this.quarterTurn(m.face, m.turns);
    }
  };
  
  Edges.prototype.quarterTurn = function(face, turns) {
    switch (face) {
    case 1:
      if (turns === 1) {
        var ref = this.edges[5];
        this.edges[5] = this.edges[6];
        this.edges[6] = this.edges[4];
        this.edges[4] = this.edges[0];
        this.edges[0] = ref;
      } else {
        var ref = this.edges[0];
        this.edges[0] = this.edges[4];
        this.edges[4] = this.edges[6];
        this.edges[6] = this.edges[5];
        this.edges[5] = ref;
      }
      break;
    case 2:
      if (turns === 1) {
        var ref = this.edges[10];
        this.edges[10] = this.edges[8];
        this.edges[8] = this.edges[11];
        this.edges[11] = this.edges[2];
        this.edges[2] = ref;
      } else {
        var ref = this.edges[2];
        this.edges[2] = this.edges[11];
        this.edges[11] = this.edges[8];
        this.edges[8] = this.edges[10];
        this.edges[10] = ref;
      }
      break;
    case 3:
      if (turns === 1) {
        var ref = this.edges[3];
        this.edges[3] = this.edges[2];
        this.edges[2] = this.edges[1];
        this.edges[1] = this.edges[0];
        this.edges[0] = ref;
      } else {
        var ref = this.edges[0];
        this.edges[0] = this.edges[1];
        this.edges[1] = this.edges[2];
        this.edges[2] = this.edges[3];
        this.edges[3] = ref;
      }
      for (var i = 0; i < 4; ++i) {
        this.edges[i].flip = !this.edges[i].flip;
      }
      break;
    case 4:
      if (turns === 1) {
        var ref = this.edges[7];
        this.edges[7] = this.edges[8];
        this.edges[8] = this.edges[9];
        this.edges[9] = this.edges[6];
        this.edges[6] = ref;
      } else {
        var ref = this.edges[6];
        this.edges[6] = this.edges[9];
        this.edges[9] = this.edges[8];
        this.edges[8] = this.edges[7];
        this.edges[7] = ref;
      }
      for (var i = 6; i < 10; ++i) {
        this.edges[i].flip = !this.edges[i].flip;
      }
      break;
    case 5:
      if (turns === 1) {
        var ref = this.edges[11];
        this.edges[11] = this.edges[7];
        this.edges[7] = this.edges[5];
        this.edges[5] = this.edges[1];
        this.edges[1] = ref;
      } else {
        var ref = this.edges[1];
        this.edges[1] = this.edges[5];
        this.edges[5] = this.edges[7];
        this.edges[7] = this.edges[11];
        this.edges[11] = ref;
      }
      break;
    case 6:
      if (turns === 1) {
        var ref = this.edges[4];
        this.edges[4] = this.edges[9];
        this.edges[9] = this.edges[10];
        this.edges[10] = this.edges[3];
        this.edges[3] = ref;
      } else {
        var ref = this.edges[3];
        this.edges[3] = this.edges[10];
        this.edges[10] = this.edges[9];
        this.edges[9] = this.edges[4];
        this.edges[4] = ref;
      }
      break;
    default:
      break;
    }
  };
  
  Edges.prototype.solved = function() {
    for (var i = 0; i < 11; ++i) {
      var edge = this.edges[i];
      if (edge.piece !== i || edge.flip) {
        return false;
      }
    }
    return true;
  };
  
  exports.CubieCorner = Corner;
  exports.CubieCorners = Corners;
  exports.CubieCube = Cube;
  exports.CubieEdge = Edge;
  exports.CubieEdges = Edges;
  var MoveSource = includeAPI('pocketcube');
  var Move = MoveSource.Move;
  var allMoves = MoveSource.allMoves;
  var movesToString = MoveSource.movesToString;
  var parseMove = MoveSource.parseMove;
  var parseMoves = MoveSource.parseMoves;
  
  function scrambleMoves(len) {
    var axis = -1;
    var moves = allMoves();
    var result = [];
    
    for (var i = 0; i < len; ++i) {
      // Pick a random move
      var moveIdx = Math.floor(Math.random() * moves.length);
      var move = moves[moveIdx];
      
      // Reset the moves and the axis if necessary.
      if (move.axis() !== axis) {
        axis = move.axis();
        moves = allMoves();
      }
      
      // Remove all moves which affect this face
      for (var j = 0; j < moves.length; ++j) {
        if (moves[j].face === move.face) {
          moves.splice(j, 1);
          --j;
        }
      }
      
      result[i] = move;
    }
    
    return result;
  }
  
  exports.Move = Move;
  exports.allMoves = allMoves;
  exports.movesToString = movesToString;
  exports.parseMove = parseMove;
  exports.parseMoves = parseMoves;
  exports.scrambleMoves = scrambleMoves;

})();
// This is the compiled skewb API.
(function() {

  var exports;
  if ('undefined' !== typeof window) {
    // Browser
    if (!window.puzzlejs) {
      window.puzzlejs = {skewb: {}};
    } else if (!window.puzzlejs.skewb) {
      window.puzzlejs.skewb = {};
    }
    exports = window.puzzlejs.skewb;
  } else if ('undefined' !== typeof self) {
    // WebWorker
    if (!self.puzzlejs) {
      self.puzzlejs = {skewb: {}};
    } else if (!self.puzzlejs.skewb) {
      self.puzzlejs.skewb = {};
    }
    exports = self.puzzlejs.skewb;
  } else if ('undefined' !== typeof module) {
    // Node.js
    if (!module.exports) {
      module.exports = {};
    }
    exports = module.exports;
  }
  
  function includeAPI(name) {
    if ('undefined' !== typeof window) {
      return window.puzzlejs[name];
    } else if ('undefined' !== typeof self) {
      return self.puzzlejs[name];
    } else if ('function' === typeof require) {
      return require('./' + name + '.js');
    } else {
      throw new Error('Unable to include: ' + name);
    }
  }

  function Move(face, clock) {
    this.face = face;
    this.clock = clock;
  }
  
  Move.prototype.toString = function() {
    var faceName = "BLRU"[this.face];
    if (this.clock) {
      return faceName;
    } else {
      return faceName + "'";
    }
  };
  
  function allMoves() {
    var res = [];
    for (var i = 0; i < 4; ++i) {
      res[i*2] = new Move(i, false);
      res[i*2 + 1] = new Move(i, true);
    }
    return res;
  }
  
  function movesToString(moves) {
    return moves.join(' ');
  }
  
  function parseMove(str) {
    if (str.length === 2) {
      if (str[1] !== "'") {
        throw new Error("Invalid move: " + str);
      }
      var move = parseMove(str[0]);
      move.clock = false;
      return move;
    } else if (str.length === 1) {
      var face = "BLRU".indexOf(str);
      if (face < 0) {
        throw new Error('Invalid move: ' + str);
      }
      return new Move(face, true);
    } else {
      throw new Error('Invalid move: ' + str);
    }
  }
  
  function parseMoves(str) {
    var moves = [];
    var tokens = str.split(' ');
    for (var i = 0, len = tokens.length; i < len; ++i) {
      moves[i] = parseMove(tokens[i]);
    }
    return moves;
  }
  
  exports.Move = Move;
  exports.allMoves = allMoves;
  exports.movesToString = movesToString;
  exports.parseMove = parseMove;
  exports.parseMoves = parseMoves;
  var randomPermParity = includeAPI('perms').randomPermParity;
  
  // Generate this using encodeCornerCases(findCornerCases()).
  var allCornerCases = null;
  
  function decodeCorners(str) {
    var res = [];
    for (var i = 0; i < 8; ++i) {
      res[i] = new Corner(str.charCodeAt(i*2)-0x30, str.charCodeAt(i*2+1)-0x30);
    }
    return res;
  }
  
  function encodeCornerCases(cases) {
    var res = [];
    for (var i = 0, len = cases.length; i < len; ++i) {
      res[i] = encodeCorners(cases[i]);
    }
    return res;
  }
  
  function encodeCorners(corners) {
    var res = "";
    for (var i = 0; i < 8; i++) {
      res += corners[i].piece + '' + corners[i].orientation;
    }
    return res;
  }
  
  function findCornerCases() {
    var found = {};
    var cases = [];
    var nodes = [new Skewb()];
    var moves = allMoves();
    while (nodes.length > 0) {
      // Get the next node.
      var node = nodes[0];
      nodes.splice(0, 1);
      
      // Mark it as visited or continue if it was already visited.
      var enc = encodeCorners(node.corners);
      if (found.hasOwnProperty(enc)) {
        continue;
      }
      found[enc] = 1;
      
      // Branch out.
      cases.push(node.corners);
      for (var i = 0, len = moves.length; i < len; ++i) {
        var newNode = node.copy();
        newNode.move(moves[i]);
        nodes.push(newNode);
      }
    }
    return cases;
  }
  
  function randomCenters() {
    return randomPermParity(6, true);
  }
  
  function randomCorners() {
    if (allCornerCases === null) {
      allCornerCases = encodeCornerCases(findCornerCases());
    }
    var cornerIdx = Math.floor(Math.random() * allCornerCases.length);
    return decodeCorners(allCornerCases[cornerIdx]);
  }
  
  function randomState() {
    var res = new Skewb();
    res.centers = randomCenters();
    res.corners = randomCorners();
    return res;
  }
  
  exports.randomCenters = randomCenters;
  exports.randomCorners = randomCorners;
  exports.randomState = randomState;
  function Corner(piece, orientation) {
    this.piece = piece;
    this.orientation = orientation;
  }
  
  Corner.prototype.copy = function() {
    return new Corner(this.piece, this.orientation);
  };
  
  function Skewb() {
    this.centers = [0, 1, 2, 3, 4, 5];
    this.corners = [];
    for (var i = 0; i < 8; ++i) {
      this.corners.push(new Corner(i, 0));
    }
  }
  
  Skewb.prototype.copy = function() {
    var res = Object.create(Skewb.prototype);
    res.centers = this.centers.slice();
    res.corners = [];
    for (var i = 0; i < 8; ++i) {
      res.corners[i] = this.corners[i].copy();
    }
    return res;
  };
  
  Skewb.prototype.move = function(move) {
    switch (move.face) {
    case 0:
      this.turnB(move.clock);
      break;
    case 1:
      this.turnL(move.clock);
      break;
    case 2:
      this.turnR(move.clock);
      break;
    case 3:
      this.turnU(move.clock);
      break;
    }
  };
  
  Skewb.prototype.rotateX = function() {
    // Permute the centers.
    var ref = this.centers[2];
    this.centers[2] = this.centers[1];
    this.centers[1] = this.centers[3];
    this.centers[3] = this.centers[0];
    this.centers[0] = ref;
    
    // Permute the corners.
    var ref1 = this.corners[6];
    this.corners[6] = this.corners[4];
    this.corners[4] = this.corners[0];
    this.corners[0] = this.corners[2];
    this.corners[2] = ref1;
    ref1 = this.corners[7];
    this.corners[7] = this.corners[5];
    this.corners[5] = this.corners[1];
    this.corners[1] = this.corners[3];
    this.corners[3] = ref1;
    
    // Swap the y and z orientations.
    for (var i = 0; i < 8; ++i) {
      if (this.corners[i].orientation === 1) {
        this.corners[i].orientation = 2;
      } else if (this.corners[i].orientation === 2) {
        this.corners[i].orientation = 1;
      }
    }
  };
  
  Skewb.prototype.rotateY = function() {
    // Permute the centers.
    var ref = this.centers[4];
    this.centers[4] = this.centers[3];
    this.centers[3] = this.centers[5];
    this.centers[5] = this.centers[2];
    this.centers[2] = ref;
    
    // Permute the corners.
    ref1 = this.corners[6];
    this.corners[6] = this.corners[7];
    this.corners[7] = this.corners[3];
    this.corners[3] = this.corners[2];
    this.corners[2] = ref1;
    ref1 = this.corners[4];
    this.corners[4] = this.corners[5];
    this.corners[5] = this.corners[1];
    this.corners[1] = this.corners[0];
    this.corners[0] = ref1;
    
    // Swap the x and z orientations.
    for (var i = 0; i < 8; ++i) {
      if (this.corners[i].orientation === 0) {
        this.corners[i].orientation = 2;
      } else if (this.corners[i].orientation === 2) {
        this.corners[i].orientation = 0;
      }
    }
  };
  
  Skewb.prototype.rotateZ = function() {
    // Permute the centers.
    var ref = this.centers[5];
    this.centers[5] = this.centers[1];
    this.centers[1] = this.centers[4];
    this.centers[4] = this.centers[0];
    this.centers[0] = ref;
    
    // Permute the corners.
    var ref1 = this.corners[0];
    this.corners[0] = this.corners[1];
    this.corners[1] = this.corners[3];
    this.corners[3] = this.corners[2];
    this.corners[2] = ref1;
    ref1 = this.corners[4];
    this.corners[4] = this.corners[5];
    this.corners[5] = this.corners[7];
    this.corners[7] = this.corners[6];
    this.corners[6] = ref1;
    
    // Swap the x and y orientations.
    for (var i = 0; i < 8; ++i) {
      if (this.corners[i].orientation === 0) {
        this.corners[i].orientation = 1;
      } else if (this.corners[i].orientation === 1) {
        this.corners[i].orientation = 0;
      }
    }
  };
  
  Skewb.prototype.solved = function() {
    for (var i = 0; i < 6; ++i) {
      if (this.centers[i] !== i) {
        return false;
      }
    }
    for (var i = 0; i < 8; ++i) {
      if (this.corners[i].piece !== i || this.corners[i].orientation !== 0) {
        return false;
      }
    }
    return true;
  };
  
  Skewb.prototype.turnB = function(clock) {
    // Permute corners.
    if (clock) {
      var ref = this.corners[1];
      this.corners[1] = this.corners[4];
      this.corners[4] = this.corners[2];
      this.corners[2] = ref;
    } else {
      var ref = this.corners[2]
      this.corners[2] = this.corners[4];
      this.corners[4] = this.corners[1];
      this.corners[1] = ref;
    }
    
    // Permute centers.
    if (clock) {
      var ref = this.centers[3];
      this.centers[3] = this.centers[1];
      this.centers[1] = this.centers[5];
      this.centers[5] = ref;
    } else {
      var ref = this.centers[5]
      this.centers[5] = this.centers[1];
      this.centers[1] = this.centers[3];
      this.centers[3] = ref;
    }
    
    // Orient corners.
    var corners = [0, 1, 2, 4];
    for (var idx = 0; idx < 4; ++idx) {
      var i = corners[idx];
      if (clock) {
        this.corners[i].orientation = (this.corners[i].orientation + 1) % 3;
      } else {
        this.corners[i].orientation = (this.corners[i].orientation + 2) % 3;
      }
    }
  };
  
  Skewb.prototype.turnL = function(clock) {
    // Permute corners.
    if (clock) {
      var ref = this.corners[0];
      this.corners[0] = this.corners[5];
      this.corners[5] = this.corners[6];
      this.corners[6] = ref;
    } else {
      var ref = this.corners[6]
      this.corners[6] = this.corners[5];
      this.corners[5] = this.corners[0];
      this.corners[0] = ref;
    }
    
    // Permute centers.
    if (clock) {
      var ref = this.centers[5];
      this.centers[5] = this.centers[1];
      this.centers[1] = this.centers[2];
      this.centers[2] = ref;
    } else {
      var ref = this.centers[2]
      this.centers[2] = this.centers[1];
      this.centers[1] = this.centers[5];
      this.centers[5] = ref;
    }
    
    // Orient corners.
    var corners = [0, 4, 6, 5];
    for (var idx = 0; idx < 4; ++idx) {
      var i = corners[idx];
      if (clock) {
        this.corners[i].orientation = (this.corners[i].orientation + 2) % 3;
      } else {
        this.corners[i].orientation = (this.corners[i].orientation + 1) % 3;
      }
    }
  };
  
  Skewb.prototype.turnR = function(clock) {
    // Permute corners.
    if (clock) {
      var ref = this.corners[5];
      this.corners[5] = this.corners[0];
      this.corners[0] = this.corners[3];
      this.corners[3] = ref;
    } else {
      var ref = this.corners[3]
      this.corners[3] = this.corners[0];
      this.corners[0] = this.corners[5];
      this.corners[5] = ref;
    }
    
    // Permute centers.
    if (clock) {
      var ref = this.centers[1];
      this.centers[1] = this.centers[3];
      this.centers[3] = this.centers[4];
      this.centers[4] = ref;
    } else {
      var ref = this.centers[4]
      this.centers[4] = this.centers[3];
      this.centers[3] = this.centers[1];
      this.centers[1] = ref;
    }
    
    // Orient corners.
    var corners = [0, 1, 3, 5];
    for (var idx = 0; idx < 4; ++idx) {
      var i = corners[idx];
      if (clock) {
        this.corners[i].orientation = (this.corners[i].orientation + 2) % 3;
      } else {
        this.corners[i].orientation = (this.corners[i].orientation + 1) % 3;
      }
    }
  };
  
  Skewb.prototype.turnU = function(clock) {
    // Permute corners.
    if (clock) {
      var ref = this.corners[3];
      this.corners[3] = this.corners[0];
      this.corners[0] = this.corners[6];
      this.corners[6] = ref;
    } else {
      var ref = this.corners[6]
      this.corners[6] = this.corners[0];
      this.corners[0] = this.corners[3];
      this.corners[3] = ref;
    }
    
    // Permute centers.
    if (clock) {
      var ref = this.centers[3];
      this.centers[3] = this.centers[5];
      this.centers[5] = this.centers[0];
      this.centers[0] = ref;
    } else {
      var ref = this.centers[0]
      this.centers[0] = this.centers[5];
      this.centers[5] = this.centers[3];
      this.centers[3] = ref;
    }
    
    // Orient corners.
    var corners = [0, 2, 3, 6];
    for (var idx = 0; idx < 4; ++idx) {
      var i = corners[idx];
      if (clock) {
        this.corners[i].orientation = (this.corners[i].orientation + 2) % 3;
      } else {
        this.corners[i].orientation = (this.corners[i].orientation + 1) % 3;
      }
    }
  };
  
  exports.Corner = Corner;
  exports.Skewb = Skewb;
  // Generate this using makeCenterHeuristic().
  var centerHeuristicData = null;
  
  // Generate this using makeCOHeuristic().
  var coHeuristicData = null;
  
  function centerHeuristic(state) {
    if (centerHeuristicData === null) {
      centerHeuristicData = makeCenterHeuristic();
    }
    return centerHeuristicData[encodeCenters(state)];
  }
  
  function coHeuristic(state) {
    if (coHeuristicData === null) {
      coHeuristicData = makeCOHeuristic();
    }
    return coHeuristicData[encodeCO(state)];
  }
  
  function depthFirst(start, remaining, lastFace) {
    if (remaining === 0) {
      if (!start.solved()) {
        return null;
      } else {
        return [];
      }
    } else if (coHeuristic(start.corners) > remaining ||
        centerHeuristic(start.centers) > remaining) {
      return null;
    }
    
    for (var i = 0; i < 4; ++i) {
      if (i === lastFace) {
        continue;
      }
      for (var j = 0; j < 2; ++j) {
        var move = {face: i, clock: j===0};
        var state = start.copy();
        state.move(move);
        var solution = depthFirst(state, remaining-1, i);
        if (solution !== null) {
          return [move].concat(solution);
        }
      }
    }
    return null;
  }
  
  function encodeCO(corners) {
    var res = '';
    for (var i = 0; i < 8; ++i) {
      res += corners[i].orientation;
    }
    return res;
  }
  
  function encodeCenters(centers) {
    var res = '';
    for (var i = 0; i < 6; ++i) {
      res += centers[i];
    }
    return res;
  }
  
  function makeCOHeuristic() {
    var res = {};
    var nodes = [{state: new Skewb(), depth: 0}];
    var moves = allMoves();
    while (nodes.length > 0) {
      var node = nodes[0];
      nodes.splice(0, 1);
      
      // Check if the state has been visited before.
      var idx = encodeCO(node.state.corners);
      if (res.hasOwnProperty(idx)) {
        continue;
      }
      res[idx] = node.depth;
      
      // Branch out.
      for (var i = 0, len = moves.length; i < len; ++i) {
        var newNode = node.state.copy();
        newNode.move(moves[i]);
        nodes.push({state: newNode, depth: node.depth+1});
      }
    }
    return res;
  }
  
  function makeCenterHeuristic() {
    var res = {};
    var nodes = [{state: new Skewb(), depth: 0}];
    var moves = allMoves();
    while (nodes.length > 0) {
      var node = nodes[0];
      nodes.splice(0, 1);
      
      // Check if the state has been visited before.
      var idx = encodeCenters(node.state.centers);
      if (res.hasOwnProperty(idx)) {
        continue;
      }
      res[idx] = node.depth;
      
      // Branch out.
      for (var i = 0, len = moves.length; i < len; ++i) {
        var newNode = node.state.copy();
        newNode.move(moves[i]);
        nodes.push({state: newNode, depth: node.depth+1});
      }
    }
    return res;
  }
  
  function solve(state) {
    for (var i = 0; i < 11; ++i) {
      var solution = depthFirst(state, i, -1);
      if (solution !== null) {
        for (var i = 0, len = solution.length; i < len; ++i) {
          solution[i] = new Move(solution[i].face, solution[i].clock);
        }
        return solution;
      }
    }
    return null;
  }
  
  exports.solve = solve;

})();
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
  
  function includeAPI(name) {
    if ('undefined' !== typeof window) {
      return window.puzzlejs[name];
    } else if ('undefined' !== typeof self) {
      return self.puzzlejs[name];
    } else if ('function' === typeof require) {
      return require('./' + name + '.js');
    } else {
      throw new Error('Unable to include: ' + name);
    }
  }

  var RubikAPI = includeAPI('rubik');
  var SkewbAPI = includeAPI('skewb');
  var PocketAPI = includeAPI('pocketcube');
  var scramblers;
  
  var pocketHeuristic = null;
  
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
  
  function pocketState() {
    var basis = PocketAPI.basisMoves();
    if (pocketHeuristic === null) {
      pocketHeuristic = new PocketAPI.FullHeuristic(5);
      pocketHeuristic.generate(basis);
    }
    var state = PocketAPI.randomState();
    var solution = PocketAPI.solve(state, pocketHeuristic, basis);
    return PocketAPI.movesToString(solution);
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
      name: "2x2x2",
      scramblers: [
        {
          f: pocketState,
          moves: false,
          name: "State"
        }
      ]
    },
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
(function() {

  // Uncomment the following line and put in the webworker path if necessary.
  // var workerPath = 'puzzlejs/webscrambler_worker.js';
  
  var workerPath = null;

  var scrambleWorker = null;
  var workerUnavailable = false;
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
  }

  function generateScramble(puzzle, scrambler, moves, cb) {
    if (scrambleWorker === null) {
      if ('undefined' === typeof window.Worker || workerUnavailable) {
        // No WebWorker support; generate scramble on main thread.
        setTimeout(function() {
          var genScram = window.puzzlejs.scrambler.generateScramble;
          var res = genScram(puzzle, scrambler, moves);
          cb(res);
        }, 10);
        return;
      }
      
      // Create the WebWorker.
      try {
        setupWorker();
      } catch (e) {
        workerUnavailable = true;
        generateScramble(puzzle, scrambler, moves, cb);
        return;
      }
    }

    // Send a request to the WebWorker.
    var ticket = ticketId++;
    callbacks[ticket] = cb;
    scrambleWorker.postMessage({puzzle: puzzle, scrambler: scrambler,
      moves: moves, id: ticket});
  }
  
  function setupWorker() {
    // Setup the webworker to call our callbacks.
    scrambleWorker = new window.Worker(workerPath);
    scrambleWorker.onmessage = function(e) {
      var m = e.data;
      var cb = callbacks[m.id]
      delete callbacks[m.id];
      cb(m.scramble);
    }
  }

  if (!window.puzzlejs) {
    window.puzzlejs = {webscrambler: {}};
  } else if (!window.puzzlejs.webscrambler) {
    window.puzzlejs.webscrambler = {};
  }
  window.puzzlejs.webscrambler.generateScramble = generateScramble;

})();
