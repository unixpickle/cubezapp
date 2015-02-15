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
   * Corners represent the corners of a cube.
   */
  function Corners() {
    this.corners = [];
    for (var i = 0; i < 8; ++i) {
      this.corners[i] = new Corner(i, 0);
    }
  }
  
  Corners.prototype.copy = function() {
    var newCorners = [];
    for (var i = 0; i < 8; ++i) {
      newCorners[i] = this.corners[i].copy();
    }
    return Object.create(Corners.prototype, {corners: newCorners});
  };
  
  Corners.prototype.halfTurn = function(face) {
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
  
  Corners.prototype.move = function(m) {
    if (m.turns === 2) {
      this.halfTurn(m.face);
    } else {
      this.quarterTurn(m.face, m.turns);
    }
  };
  
  Corners.prototype.quarterTurn = function(face, turns) {
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
  
  function Cube() {
    this.edges = new Edges();
    this.corners = new Corners();
  }
  
  Cube.prototype.copy = function() {
    var props = {edges: this.edges.copy(), corners: this.corners.copy()};
    return Object.create(Cube.prototype, props);
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
    return Object.create(Edges.prototype, {edges: newEdges});
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
  
  exports.CubieCorner = Corner;
  exports.CubieCorners = Corners;
  exports.CubieCube = Cube;
  exports.CubieEdge = Edge;
  exports.CubieEdges = Edges;
  
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
    // The moves are ordered in descending comfort.
    return _allMovesList.slice();
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
  
  // Generate a list of every move, ordered by comfort.
  _allMovesList = parseMoves("R R' L L' U U' D D' R2 L2 U2 D2 F2 B2 F " +
    "F' B B'");
  
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

self.onmessage = function(e) {
  var m = e.data;
  var puzzle = m.puzzle;
  var scrambler = m.scrambler;
  var moves = m.moves;
  var scramble = self.puzzlejs.scrambler.generateScramble(puzzle, scrambler,
    moves);
  self.postMessage({id: m.id, scramble: scramble});
};