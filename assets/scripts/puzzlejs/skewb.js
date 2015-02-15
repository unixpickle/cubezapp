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
  
  // Generate this using encodeCenterCases(findCenterCases()).
  var allCenterCases = null;
  
  // Generate this using encodeCornerCases(findCornerCases()).
  var allCornerCases = null;
  
  function decodeCenters(str) {
    var res = [];
    for (var i = 0; i < 6; ++i) {
      res[i] = str.charCodeAt(i) - 0x30;
    }
    return res;
  }
  
  function decodeCorners(str) {
    var res = [];
    for (var i = 0; i < 8; ++i) {
      res[i] = new Corner(str.charCodeAt(i*2)-0x30, str.charCodeAt(i*2+1)-0x30);
    }
    return res;
  }
  
  function encodeCenterCases(cases) {
    var res = [];
    for (var i = 0, len = cases.length; i < len; ++i) {
      res[i] = encodeCenters(cases[i]);
    }
    return res;
  }
  
  function encodeCenters(centers) {
    var res = "";
    for (var i = 0; i < 6; ++i) {
      res += centers[i];
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
  
  function findCenterCases() {
    var found = {};
    var cases = [];
    var nodes = [new Skewb()];
    var moves = allMoves();
    while (nodes.length > 0) {
      // Get the next node.
      var node = nodes[0];
      nodes.splice(0, 1);
      
      // Mark it as visited or continue if it was already visited.
      var enc = encodeCenters(node.centers);
      if (found.hasOwnProperty(enc)) {
        continue;
      }
      found[enc] = 1;
      
      // Branch out.
      cases.push(node.centers);
      for (var i = 0, len = moves.length; i < len; ++i) {
        var newNode = node.copy();
        newNode.move(moves[i]);
        nodes.push(newNode);
      }
    }
    return cases;
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
    if (allCenterCases === null) {
      allCenterCases = encodeCenterCases(findCenterCases());
    }
    var idx = Math.floor(Math.random() * allCenterCases.length);
    return decodeCenters(allCenterCases[idx]);
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
