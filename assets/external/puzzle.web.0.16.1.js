// puzzlejs.perms version 0.16.1
//
// Copyright (c) 2015, Alex Nichol.
// All rights reserved.
// 
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
// 
// 1. Redistributions of source code must retain the above copyright notice, this
//    list of conditions and the following disclaimer. 
// 2. Redistributions in binary form must reproduce the above copyright notice,
//    this list of conditions and the following disclaimer in the documentation
//    and/or other materials provided with the distribution.
// 
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
// ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
// WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
// ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
// (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
// LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
// ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
// SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
(function() {

  var exports;
  if ('undefined' !== typeof self) {
    if (!self.puzzlejs) {
      self.puzzlejs = {};
    }
    if (!self.puzzlejs.perms) {
      self.puzzlejs.perms = {};
    }
    exports = self.puzzlejs.perms;
  } else if ('undefined' !== typeof window) {
    if (!window.puzzlejs) {
      window.puzzlejs = {};
    }
    if (!window.puzzlejs.perms) {
      window.puzzlejs.perms = {};
    }
    exports = window.puzzlejs.perms;
  } else if ('undefined' !== typeof module) {
    exports = module.exports;
  }

  function includeAPI(name) {
    if ('undefined' !== typeof self) {
      return self.puzzlejs[name];
    } else if ('undefined' !== typeof window) {
      return window.puzzlejs[name];
    } else if ('function' === typeof require) {
      return require('./' + name + '.js');
    }
    throw new Error('cannot include packages');
  }

  var factorials = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800,
    39916800, 479001600, 6227020800];
  var applyPermCache = [];

  // allPerms generates all the permutations of a given length.
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

  // applyPerm applies a permutation to an array. The first argument is the array,
  // the second is the permutation. The result is stored in the first argument.
  function applyPerm(arr, perm) {
    if (arr.length !== perm.length) {
      throw new Error('incorrect permutation length');
    }
    var len = arr.length;
    for (var i = 0; i < len; ++i) {
      applyPermCache[i] = arr[perm[i]];
    }
    for (var i = 0; i < len; ++i) {
      arr[i] = applyPermCache[i];
    }
  }

  // comparePerms "compares" the permutations a and b and returns -1 if a<b, 1 if
  // a>b, or 0 if a=b. This is like comparing encodePerm(a) with encodePerm(b).
  function comparePerms(a, b) {
    if (a.length !== b.length) {
      throw new Error('permutations must be the same length');
    }
    for (var i = 0, len = a.length; i < len; ++i) {
      if (a[i] > b[i]) {
        return 1;
      } else if (a[i] < b[i]) {
        return -1;
      }
    }
    return 0;
  }

  // decodePerm generates a permutation array from a permutation's perfect hash.
  function decodePerm(hash, size) {
    var permutation = [];

    // Pre-allocate the array (i.e. avoid using a sparse array)
    for (var i = 0; i < size; ++i) {
      permutation[i] = 0;
    }

    // Read the "digits" of the permutation.
    for (var i = 0, len = size-1; i < len; ++i) {
      var coefficient = factorial(len - i);
      var digit = Math.floor(hash / coefficient);
      permutation[i] = digit;
      hash -= digit * coefficient;
    }

    // Convert the digits into a real permutation.
    for (var i = size-2; i >= 0; --i) {
      var theDigit = permutation[i];
      for (var j = i+1; j < size; ++j) {
        if (permutation[j] >= theDigit) {
          ++permutation[j];
        }
      }
    }

    return permutation;
  }

  // encodeDestructablePerm optimally encodes an array of permuted integers. In
  // the process, it modifies the array. This avoids an extra memory allocation
  // which encodePerm() cannot avoid at the expense of the original array.
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
        result += factorial(len-i)*current;
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

  // encodePerm encodes a permutation optimally without modifying it.
  function encodePerm(permutation) {
    return encodeDestructablePerm(permutation.slice());
  }

  // encodeDestructablePermIgnoringParity optimally encodes an array of permuted integers, ignoring
  // the last two elements. In the process, it modifies the array. This avoids an extra memory
  // allocation which encodePermIgnoringParity() cannot avoid at the expense of the original array.
  function encodeDestructablePermIgnoringParity(permutation) {
    if (permutation.length <= 2) {
      return 0;
    }

    var result = 0;
    for (var i = 0, len = permutation.length-1; i < len-1; ++i) {
      var current = permutation[i];

      // If the first item of the sub-permutation does not belong at the
      // beginning, we need to offset our result.
      if (current !== 0) {
        result += factorial(len-i)*current;
      }

      // Get rid of any trace of "current" from the sub-permutation .
      for (var j = i+1; j < len; ++j) {
        if (permutation[j] > current) {
          --permutation[j];
        }
      }
    }

    return result / 2;
  }

  // encodePermIgnoringParity encodes a permutation optimally without modifying it, ignoring the
  // parity of the permutation.
  function encodePermIgnoringParity(permutation) {
    return encodeDestructablePermIgnoringParity(permutation.slice());
  }

  // factorial returns the product of the numbers up to and including n. For
  // instance, factorial(4) is 4*3*2*1. A special case is that factorial(0) = 1.
  function factorial(n) {
    if (n >= factorials.length) {
      return n * factorial(n-1);
    }
    return factorials[n];
  }

  // parity computes the parity of a permutation. This returns true for even
  // parity and false for odd parity.
  function parity(permutation) {
    return paritySort(permutation.slice());
  }

  // paritySort computes the parity of a permutation, sorting the given
  // permutation in the process. Therefore, this can avoid an extra allocation
  // which the parity() routine cannot.
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

  // randomPerm generates a random permutation of a given length.
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

  // randomPermParity generates a random permutation of a given length.
  // The second argument specifies the parity of the permutation. If it is false,
  // the permutation will have odd parity.
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
  exports.applyPerm = applyPerm;
  exports.comparePerms = comparePerms;
  exports.decodePerm = decodePerm;
  exports.encodeDestructablePerm = encodeDestructablePerm;
  exports.encodePerm = encodePerm;
  exports.encodeDestructablePermIgnoringParity = encodeDestructablePermIgnoringParity;
  exports.encodePermIgnoringParity = encodePermIgnoringParity;
  exports.factorial = factorial;
  exports.parity = parity;
  exports.paritySort = paritySort;
  exports.randomPerm = randomPerm;
  exports.randomPermParity = randomPermParity;


  // pascalsTriangle stores pre-computed values of the choose operator. This makes
  // choose() a lot faster.
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

  // choose takes two numbers, a and b, and returns (a choose b).
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

  // countTrue takes an array and returns the number of elements which are true.
  function countTrue(list) {
    var res = 0;
    for (var i = 0, len = list.length; i < len; ++i) {
      if (list[i] === true) {
        ++res;
      }
    }
    return res;
  }

  // encodeChoose encodes an array which represents a given "choice"--that is, an
  // array of boolean values. This acts as a perfect-mapping hash function for
  // the unordered choose operation.
  function encodeChoose(choice) {
    return encodeExplicitChoose(0, choice, countTrue(choice));
  }

  // encodeExplicitChoose implements the backbone of encodeChoose().
  // The start argument specifies the index in the [choice] array to start at.
  // The choice array stores a set of true and false boolean values.
  // The numTrue argument specifies how many true values are in [choose]. You
  // can compute this using the countTrue() routine.
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



})();
// puzzlejs.symmetry version 0.16.1
//
// Copyright (c) 2015, Alex Nichol.
// All rights reserved.
// 
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
// 
// 1. Redistributions of source code must retain the above copyright notice, this
//    list of conditions and the following disclaimer. 
// 2. Redistributions in binary form must reproduce the above copyright notice,
//    this list of conditions and the following disclaimer in the documentation
//    and/or other materials provided with the distribution.
// 
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
// ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
// WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
// ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
// (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
// LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
// ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
// SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
(function() {

  var exports;
  if ('undefined' !== typeof self) {
    if (!self.puzzlejs) {
      self.puzzlejs = {};
    }
    if (!self.puzzlejs.symmetry) {
      self.puzzlejs.symmetry = {};
    }
    exports = self.puzzlejs.symmetry;
  } else if ('undefined' !== typeof window) {
    if (!window.puzzlejs) {
      window.puzzlejs = {};
    }
    if (!window.puzzlejs.symmetry) {
      window.puzzlejs.symmetry = {};
    }
    exports = window.puzzlejs.symmetry;
  } else if ('undefined' !== typeof module) {
    exports = module.exports;
  }

  function includeAPI(name) {
    if ('undefined' !== typeof self) {
      return self.puzzlejs[name];
    } else if ('undefined' !== typeof window) {
      return window.puzzlejs[name];
    } else if ('function' === typeof require) {
      return require('./' + name + '.js');
    }
    throw new Error('cannot include packages');
  }

  // There are 16 symmetries of the cube which preserve the UD axis. These
  // symmetries can be generated by performing cube rotations around the y axis,
  // flips across the LR axis, and flips across the UD axis. The LR flip could be
  // substituted for an FB flip; I chose LR arbitrarily.
  //
  // Since there are 16 symmetries, I represent symmetries as 4 bit numbers. The
  // lower 2 bits store the number of y rotations. The third bit is set for an LR
  // flip, and the fourth bit for a UD flip. If there is a y rotation, an LR flip,
  // and a UD flip, the y rotation is performed first, the LR flip second, and the
  // UD flip third. So, symmetry 15 represents UDflip*LRflip*y'. It can also be
  // noted that the UD flip commutes with the LR flip and the y rotation.

  // udSymmetryProducts[a*16 + b] gives the symmetry a*b.
  var udSymmetryProducts = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    1, 2, 3, 0, 7, 4, 5, 6, 9, 10, 11, 8, 15, 12, 13, 14,
    2, 3, 0, 1, 6, 7, 4, 5, 10, 11, 8, 9, 14, 15, 12, 13,
    3, 0, 1, 2, 5, 6, 7, 4, 11, 8, 9, 10, 13, 14, 15, 12,
    4, 5, 6, 7, 0, 1, 2, 3, 12, 13, 14, 15, 8, 9, 10, 11,
    5, 6, 7, 4, 3, 0, 1, 2, 13, 14, 15, 12, 11, 8, 9, 10,
    6, 7, 4, 5, 2, 3, 0, 1, 14, 15, 12, 13, 10, 11, 8, 9,
    7, 4, 5, 6, 1, 2, 3, 0, 15, 12, 13, 14, 9, 10, 11, 8,
    8, 9, 10, 11, 12, 13, 14, 15, 0, 1, 2, 3, 4, 5, 6, 7,
    9, 10, 11, 8, 15, 12, 13, 14, 1, 2, 3, 0, 7, 4, 5, 6,
    10, 11, 8, 9, 14, 15, 12, 13, 2, 3, 0, 1, 6, 7, 4, 5,
    11, 8, 9, 10, 13, 14, 15, 12, 3, 0, 1, 2, 5, 6, 7, 4,
    12, 13, 14, 15, 8, 9, 10, 11, 4, 5, 6, 7, 0, 1, 2, 3,
    13, 14, 15, 12, 11, 8, 9, 10, 5, 6, 7, 4, 3, 0, 1, 2,
    14, 15, 12, 13, 10, 11, 8, 9, 6, 7, 4, 5, 2, 3, 0, 1,
    15, 12, 13, 14, 9, 10, 11, 8, 7, 4, 5, 6, 1, 2, 3, 0
  ];

  // udSymmetryInverses[s] gives s'.
  var udSymmetryInverses = [0, 3, 2, 1, 4, 5, 6, 7, 8, 11, 10, 9, 12, 13, 14, 15];

  // udSymmetryInverse returns the inverse of a UD symmetry.
  function udSymmetryInverse(sym) {
    return udSymmetryInverses[sym];
  }

  // udSymmetryLRFlip returns true if the symmetry includes an LR reflection.
  function udSymmetryLRFlip(sym) {
    return (sym & 4) !== 0;
  }

  // udSymmetryProduct returns the product of two symmetries, s1*s2.
  function udSymmetryProduct(s1, s2) {
    return udSymmetryProducts[(s1 << 4) | s2];
  }

  // udSymmetryUDFlip returns true if the symmetry includes a UD reflection.
  function udSymmetryUDFlip(sym) {
    return (sym & 8) !== 0;
  }

  // udSymmetryY returns the number of y rotations performed by the symmetry.
  function udSymmetryY(sym) {
    return sym & 3;
  }

  exports.udSymmetryInverse = udSymmetryInverse;
  exports.udSymmetryLRFlip = udSymmetryLRFlip;
  exports.udSymmetryProduct = udSymmetryProduct;
  exports.udSymmetryUDFlip = udSymmetryUDFlip;
  exports.udSymmetryY = udSymmetryY;



})();
// puzzlejs.pocketcube version 0.16.1
//
// Copyright (c) 2015, Alex Nichol.
// All rights reserved.
// 
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
// 
// 1. Redistributions of source code must retain the above copyright notice, this
//    list of conditions and the following disclaimer. 
// 2. Redistributions in binary form must reproduce the above copyright notice,
//    this list of conditions and the following disclaimer in the documentation
//    and/or other materials provided with the distribution.
// 
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
// ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
// WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
// ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
// (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
// LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
// ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
// SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
(function() {

  var exports;
  if ('undefined' !== typeof self) {
    if (!self.puzzlejs) {
      self.puzzlejs = {};
    }
    if (!self.puzzlejs.pocketcube) {
      self.puzzlejs.pocketcube = {};
    }
    exports = self.puzzlejs.pocketcube;
  } else if ('undefined' !== typeof window) {
    if (!window.puzzlejs) {
      window.puzzlejs = {};
    }
    if (!window.puzzlejs.pocketcube) {
      window.puzzlejs.pocketcube = {};
    }
    exports = window.puzzlejs.pocketcube;
  } else if ('undefined' !== typeof module) {
    exports = module.exports;
  }

  function includeAPI(name) {
    if ('undefined' !== typeof self) {
      return self.puzzlejs[name];
    } else if ('undefined' !== typeof window) {
      return window.puzzlejs[name];
    } else if ('function' === typeof require) {
      return require('./' + name + '.js');
    }
    throw new Error('cannot include packages');
  }

  function depthFirst(cube, heuristic, moves, depth, lastFace, lastLastFace) {
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
      var move = moves[i];
      var face = move.face();

      // Prevent redundant moves.
      if (face === lastFace) {
        continue;
      } else if (face === lastLastFace) {
        // If lastFace was on the same axis as lastLastFace, this move is
        // redundant.
        if (Math.ceil(lastFace/2) === Math.ceil(lastLastFace/2)) {
          continue;
        }
      }

      // Generate the new state.
      var newState = cube.copy();
      newState.move(move);

      var result = depthFirst(newState, heuristic, moves, depth-1, face,
        lastFace);
      if (result !== null) {
        return [move].concat(result);
      }
    }

    return null;
  }

  function solve(cube, heuristic, minDepth) {
    for (var depth = minDepth || 0; depth <= 11; ++depth) {
      var solution = depthFirst(cube, heuristic, basisMoves(), depth, 0, 0);
      if (solution !== null) {
        return solution;
      }
    }
    return null;
  }

  exports.solve = solve;


  var randomPerm = includeAPI('perms').randomPerm;

  function randomLastLayer() {
    // Three random orientations and a solved corner.
    var orientations = [];
    for (var i = 0; i < 3; ++i) {
      orientations[i] = Math.floor(Math.random() * 3);
    }
    orientations[3] = 1;

    // Find the orientation of the last corner.
    var o = orientations.slice();
    for (var i = 0; i < 4; ++i) {
      var thisOrientation = o[i];
      var nextOrientation = o[i+1];
      if (thisOrientation === 2) {
        o[i+1] = (nextOrientation + 2) % 3;
      } else if (thisOrientation === 0) {
        o[i+1] = (nextOrientation + 1) % 3;
      }
    }
    if (o[3] === 0) {
      orientations[3] = 2;
    } else if (o[3] === 2) {
      orientations[3] = 0;
    }

    var cube = new Cube();
    var perm = randomPerm(4);
    var pieces = [2, 3, 7, 6];
    for (var i = 0; i < 4; ++i) {
      cube.corners[pieces[i]].piece = pieces[perm[i]];
      cube.corners[pieces[i]].orientation = orientations[i];
    }

    return cube;
  }

  function randomState() {
    var result = new Cube();

    // Corner 0 needs to stay solved so that no B, L, or D moves are needed.
    var pieces = randomPerm(7);
    for (var i = 0; i < 7; ++i) {
      result.corners[i + 1].piece = pieces[i] + 1;
    }
    for (var i = 1; i < 7; ++i) {
      result.corners[i].orientation = Math.floor(Math.random() * 3);
    }
    result.fixLastCorner();

    return result;
  }

  exports.randomLastLayer = randomLastLayer;
  exports.randomState = randomState;


  var _basisMovesList;

  // A Move represents a WCA move on the pocketcube. 
  // A move can occur on the faces U, D, F, B, R, and L. These are the first 6
  // values of the Move type. The next 6 values are U', D', F', B', R', L'. The
  // final six values are U2, D2, F2, B2, R2, L2. Thus, there are a total of 18
  // possible moves in the range [0, 18).
  function Move(number) {
    this.number = number;
  }

  // axis returns the number 0, 1, or 2 corresponding to the face. The 0 axis
  // corresponds to L and R. The 1 axis corresponds to U and D. The 2 axis
  // corresponds to F and B.
  Move.prototype.axis = function() {
    return [-1, 1, 1, 2, 2, 0, 0][this.face()];
  };

  // face returns the face of the move, which will be in the range [1, 6]
  // corresponding to U, D, F, B, R, and L respectively.
  Move.prototype.face = function() {
    return (this.number % 6) + 1;
  };

  // inverse returns the inverse of the move.
  Move.prototype.inverse = function() {
    if (this.number < 6) {
      return new Move(this.number + 6);
    } else if (this.number < 12) {
      return new Move(this.number - 6);
    } else {
      return this;
    }
  };

  // toString generates a WCA move from this move.
  Move.prototype.toString = function() {
    var faces = 'UDFBRL';
    var face = faces[this.face() - 1];
    if (this.turns() === 1) {
      return face;
    } else if (this.turns() === 2) {
      return face + '2';
    } else {
      return face + "'";
    }
  };

  // turns returns the number of turns represented by the move. This may be 1, -1,
  // or 2.
  Move.prototype.turns = function() {
    if (this.number < 6) {
      return 1;
    } else if (this.number < 12) {
      return -1;
    } else {
      return 2;
    }
  };

  // allMoves returns all the moves, sequentially.
  function allMoves() {
    var res = [];
    for (var i = 0; i < 18; ++i) {
      res[i] = new Move(i);
    }
    return res;
  }

  // basisMoves returns the moves which are necessary to generate every unrotated
  // state on the cube.
  function basisMoves() {
    return _basisMovesList.slice();
  }

  // movesToString generates a WCA string from an array of moves.
  function movesToString(moves) {
    return moves.join(' ');
  }

  // parseMove parses a move from a WCA string.
  function parseMove(s) {
    if (s.length === 1) {
      var faces = ['U', 'D', 'F', 'B', 'R', 'L'];
      var face = faces.indexOf(s);
      if (face < 0) {
        throw new Error('Invalid move: ' + s);
      }
      return new Move(face);
    } else if (s.length === 2) {
      var res = parseMove(s[0]);
      if (s[1] === '2') {
        return new Move(res.number + 12);
      } else if (s[1] === "'") {
        return new Move(res.number + 6);
      } else {
        throw new Error('Invalid move: ' + s);
      }
    } else {
      throw new Error('Invalid move: ' + s);
    }
  }

  // parseMoves parses a space-separated list of WCA moves.
  function parseMoves(s) {
    var parts = s.split(' ');
    var res = [];
    for (var i = 0, len = parts.length; i < len; ++i) {
      res[i] = parseMove(parts[i]);
    }
    return res;
  }

  // scrambleMoves generates a random list of basis moves.
  function scrambleMoves(count) {
    // Faces 1, 3, and 5 are U, F, and R respectively.
    var moves = [];
    var lastFace = 0;
    for (var i = 0; i < count; ++i) {
      var faces = [0, 2, 4];
      if (i > 0) {
        faces.splice(faces.indexOf(lastFace), 1);
      }
      var face = faces[Math.floor(Math.random() * faces.length)];
      var turns = Math.floor(Math.random()*3) * 6;
      moves.push(new Move(turns + face));
      lastFace = face;
    }
    return moves;
  }

  // Generate a list of the standard basis moves.
  _basisMovesList = parseMoves("R R' R2 U U' U2 F F' F2");

  exports.Move = Move;
  exports.allMoves = allMoves;
  exports.basisMoves = basisMoves;
  exports.movesToString = movesToString;
  exports.parseMove = parseMove;
  exports.parseMoves = parseMoves;
  exports.scrambleMoves = scrambleMoves;


  var PermsAPI = includeAPI('perms');

  // A FullHeuristic keeps track of the number of moves needed to solve a given
  // state of the Pocket Cube. It only tracks states up to a certain depth, since
  // there are too many states to index and store in memory at once.
  function FullHeuristic(depth) {
    this.depth = depth;
    this.table = {};

    // Do a breadth-first search to generate the heuristic table.
    var moves = basisMoves();
    var queue = [{depth: 0, cube: new Cube(), hash: '' + encodeCube(new Cube())}];
    var visited = {};
    while (queue.length > 0) {
      node = queue[0];
      queue.splice(0, 1);

      if (this.table.hasOwnProperty(node.hash)) {
        continue;
      }
      this.table[node.hash] = node.depth;

      if (node.depth === this.depth) {
        continue;
      }

      // Branch off.
      for (var i = 0, len = moves.length; i < len; ++i) {
        var newCube = node.cube.copy();
        newCube.move(moves[i]);
        var newHash = '' + encodeCube(newCube);
        if (!visited[newHash]) {
          queue.push({depth: node.depth+1, cube: newCube, hash: newHash});
          visited[newHash] = true;
        }
      }
    }
  }

  // lookup returns the lower bound for the number of moves to solve a given cube.
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


  // A Corner stores the piece index and orientation of a corner.
  //
  // To understand the meaning of a Corner's fields, you must first
  // understand the coordinate system. There are there axes, x, y, and z.
  // The x axis is 0 at the L face and 1 at the R face.
  // The y axis is 0 at the D face and 1 at the U face.
  // The z axis is 0 at the B face and 1 at the F face.
  //
  // A corner piece's index is determined by it's original position on the
  // cube. The index is a binary number of the form ZYX, where Z is the most
  // significant digit. Thus, the BLD corner is 0, the BRU corner is 3, the
  // FRU corner is 7, etc.
  //
  // The orientation of a corner tells how it is twisted. It is an axis number
  // 0, 1, or 2 for x, y, or z respectively. It indicates the direction normal
  // to the white or yellow sticker (i.e. the sticker that is usually normal to
  // the y axis). Oriented corners have an orientation of 1.
  function Corner(piece, orientation) {
    this.piece = piece;
    this.orientation = orientation;
  }

  // copy returns a copy of this corner.
  Corner.prototype.copy = function() {
    return new Corner(this.piece, this.orientation);
  };

  // A Cube represent the corners of a cube.
  // This constructor returns a solved Cube.
  function Cube() {
    this.corners = [];
    for (var i = 0; i < 8; ++i) {
      this.corners[i] = new Corner(i, 1);
    }
  }

  // copy returns a deep copy of the Cube.
  Cube.prototype.copy = function() {
    var newCube = [];
    for (var i = 0; i < 8; ++i) {
      newCube[i] = this.corners[i].copy();
    }
    var res = Object.create(Cube.prototype);
    res.corners = newCube;
    return res;
  };

  // fixLastCorner makes sure the corner orientation case is valid by twisting
  // corner 7.
  Cube.prototype.fixLastCorner = function() {
    // Compute the last corner's orientation. This uses the sune combo (which
    // twists two adjacent corners) to "solve" every corner except the last one.
    // The twist of the last corner (which started out solved) tells us which
    // orientation it should have had.

    // All corners in this ordering are adjacent, allowing the sune combo to work.
    var ordering = [0, 1, 5, 4, 6, 2, 3, 7];
    var orientations = [];
    for (var i = 0; i < 8; ++i) {
      orientations[i] = this.corners[ordering[i]].orientation;
    }
    for (var i = 0; i < 7; ++i) {
      var thisOrientation = orientations[i];
      var nextOrientation = orientations[i+1];
      // Twist thisOrientation to be solved, affecting the next corner in the
      // sequence.
      if (thisOrientation === 2) {
        // y -> x, x -> z, z -> y
        orientations[i+1] = (nextOrientation + 2) % 3;
      } else if (thisOrientation === 0) {
        // z -> x, x -> y, y -> z
        orientations[i+1] = (nextOrientation + 1) % 3;
      }
    }

    // The twist of the last corner is the inverse of what it should be in the
    // scramble.
    if (orientations[7] === 0) {
      this.corners[7].orientation = 2;
    } else if (orientations[7] === 2) {
      this.corners[7].orientation = 0;
    }
  };

  // halfTurn applies a half turn on a given face.
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

  // move applies a move to a Cube.
  Cube.prototype.move = function(m) {
    if (m.turns() === 2) {
      this.halfTurn(m.face());
    } else {
      this.quarterTurn(m.face(), m.turns());
    }
  };

  // quarterTurn applies a quarter turn to a Cube.
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

  // solved returns true if the first 7 corners are solved. The eighth corner must
  // be solved if the first 7 are.
  Cube.prototype.solved = function() {
    for (var i = 0; i < 7; ++i) {
      var corner = this.corners[i];
      if (corner.piece !== i || corner.orientation !== 1) {
        return false;
      }
    }
    return true;
  };

  exports.Corner = Corner;
  exports.Cube = Cube;



})();
// puzzlejs.rubik version 0.16.1
//
// Copyright (c) 2015, Alex Nichol.
// All rights reserved.
// 
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
// 
// 1. Redistributions of source code must retain the above copyright notice, this
//    list of conditions and the following disclaimer. 
// 2. Redistributions in binary form must reproduce the above copyright notice,
//    this list of conditions and the following disclaimer in the documentation
//    and/or other materials provided with the distribution.
// 
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
// ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
// WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
// ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
// (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
// LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
// ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
// SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
(function() {

  var exports;
  if ('undefined' !== typeof self) {
    if (!self.puzzlejs) {
      self.puzzlejs = {};
    }
    if (!self.puzzlejs.rubik) {
      self.puzzlejs.rubik = {};
    }
    exports = self.puzzlejs.rubik;
  } else if ('undefined' !== typeof window) {
    if (!window.puzzlejs) {
      window.puzzlejs = {};
    }
    if (!window.puzzlejs.rubik) {
      window.puzzlejs.rubik = {};
    }
    exports = window.puzzlejs.rubik;
  } else if ('undefined' !== typeof module) {
    exports = module.exports;
  }

  function includeAPI(name) {
    if ('undefined' !== typeof self) {
      return self.puzzlejs[name];
    } else if ('undefined' !== typeof window) {
      return window.puzzlejs[name];
    } else if ('function' === typeof require) {
      return require('./' + name + '.js');
    }
    throw new Error('cannot include packages');
  }

  // SHORT_LENGTH is a "good" length for a solution. A solution of SHORT_LENGTH
  // should be relatively easy to find and also relatively quick to apply to a
  // cube.
  var SHORT_LENGTH = 21;

  // SolveTables hold the move and heuristic tables for both phases of the solver.
  // The default SolveTables should be acceptable for most uses.
  function SolveTables(p1Moves, p1Heuristic, p2Coords, p2Heuristic) {
    this.p1Moves = p1Moves || new Phase1Moves();
    this.p1Heuristic = p1Heuristic || new Phase1Heuristic(this.p1Moves);
    this.p2Coords = p2Coords || new Phase2Coords();
    this.p2Heuristic = p2Heuristic || new Phase2Heuristic(this.p2Coords);
  }

  // SolveTimeouts contain basic information about how much time to spend on
  // various types of solutions.
  // The default SolveTimeouts will be acceptable for most purposes.
  function SolveTimeouts(shortTimeout, longTimeout) {
    // shortTimeout may be falsy (i.e. 0) but still be valid, so we can't simply
    // do shortTimeout || 500.
    if ('undefined' === typeof shortTimeout) {
      shortTimeout = 500;
    }
    this.shortTimeout = shortTimeout;
    this.longTimeout = longTimeout || 10000;
  }

  // solveCube synchronously finds a solution to a cube given SolveTables and
  // SolveTimeouts.
  function solveCube(cube, tables, timeouts) {
    if ('undefined' === typeof tables) {
      tables = new SolveTables();
    }
    if ('undefined' === typeof timeouts) {
      timeouts = new SolveTimeouts();
    }

    // Attempt to find a short solution.
    if (timeouts.shortTimeout > 0) {
      var s = solveLen(cube, tables, SHORT_LENGTH, timeouts.shortTimeout);
      if (s !== null) {
        return s;
      }
    }

    // Look for longer solutions.
    return solveLen(cube, tables, 30, timeouts.longTimeout);
  }

  function solveLen(cube, tables, maxLen, timeout) {
    var deadline = new Date().getTime() + timeout;
    var p1Cube = new Phase1Cube(cube);
    var result = null;
    solvePhase1(p1Cube, tables.p1Heuristic, tables.p1Moves, function(moves, c) {
      // Go through each axis and see if it's solved on that axis.
      var solved = c.solved();
      for (var axis = 0; axis < 3; ++axis) {
        if (!solved[axis]) {
          continue;
        }
        // Go back to the original CubieCube and apply the solution for phase-1.
        var newCube = cube.copy();
        for (var i = 0; i < moves.length; ++i) {
          newCube.move(moves[i]);
        }
        var p2Cube = convertCubieToPhase2(newCube, axis, tables.p2Coords);
        var p2Timeout = deadline - new Date().getTime();
        // Run the search
        var solution = solvePhase2(p2Cube, maxLen-moves.length,
          tables.p2Heuristic, tables.p2Coords, p2Timeout);
        if (solution !== null) {
          result = moves;
          for (var i = 0; i < solution.length; ++i) {
            result.push(p2MoveMove(solution[i], axis));
          }
          result = cancelMoves(result);
          return false;
        }
        return true;
      }
    }, timeout);
    return result;
  }

  exports.SolveTables = SolveTables;
  exports.SolveTimeouts = SolveTimeouts;
  exports.solveCube = solveCube;


  function randomCorners() {
    var result = new Cube();

    var pieces = perms.randomPermParity(8, true);
    for (var i = 0; i < 8; ++i) {
      result.corners.corners[i].piece = pieces[i];
    }

    for (var i = 0; i < 7; ++i) {
      result.corners.corners[i].orientation = Math.floor(Math.random() * 3);
    }
    result.corners.fixLastCorner();

    return result;
  }

  function randomEdges() {
    var result = new Cube();

    var pieces = perms.randomPermParity(12, true);
    for (var i = 0; i < 12; ++i) {
      result.edges.edges[i].piece = pieces[i];
    }

    var flipLast = false;
    for (var i = 0; i < 11; ++i) {
      var flag = Math.random() >= 0.5;
      result.edges.edges[i].flip = flag;
      if (flag) {
        flipLast = !flipLast;
      }
    }
    result.edges.edges[11].flip = flipLast;

    return result;
  }

  function randomLastLayer() {
    var result = randomZBLL();

    // Generate the edge orientations.
    var topEdges = [0, 4, 5, 6];
    var lastFlip = false;
    for (var i = 0; i < 3; ++i) {
      var flip = Math.random() >= 0.5;
      if (flip) {
        lastFlip = !lastFlip;
        result.edges.edges[topEdges[i]].flip = true;
      }
    }
    result.edges.edges[topEdges[3]].flip = lastFlip;

    return result;
  }

  function randomState() {
    var result = new Cube();

    // NOTE: we do not use pocketcube.randomState() because that state will always
    // leave the BDL corner solved. For 3x3 we don't want this restriction.

    // Generate a random permutation.
    var pieces = perms.randomPerm(8);
    for (var i = 0; i < 8; ++i) {
      result.corners.corners[i].piece = pieces[i];
    }

    // Generate random orientations.
    for (var i = 0; i < 7; ++i) {
      result.corners.corners[i].orientation = Math.floor(Math.random() * 3);
    }
    result.corners.fixLastCorner();

    // Generate a random edge permutation.
    var cornerParity = perms.parity(pieces);
    var edgePerm = perms.randomPermParity(12, cornerParity);
    for (var i = 0; i < 12; ++i) {
      result.edges.edges[i].piece = edgePerm[i];
    }

    // Generate random EO.
    var parity = false;
    for (var i = 0; i < 11; ++i) {
      var flag = Math.random() >= 0.5;
      result.edges.edges[i].flip = flag;
      if (flag) {
        parity = !parity;
      }
    }
    result.edges.edges[11].flip = parity;

    return result;
  }

  function randomZBLL() {
    var result = new Cube();
    result.corners = pocketcube.randomLastLayer();

    var cornerPerm = [];
    for (var i = 0; i < 8; ++i) {
      cornerPerm[i] = result.corners.corners[i].piece;
    }
    var cornerParity = perms.parity(cornerPerm);

    var edgePerm = perms.randomPermParity(4, cornerParity);
    var topEdges = [0, 4, 5, 6];
    for (var i = 0; i < 4; ++i) {
      result.edges.edges[topEdges[i]].piece = topEdges[edgePerm[i]];
    }

    return result;
  }

  exports.randomCorners = randomCorners;
  exports.randomEdges = randomEdges;
  exports.randomLastLayer = randomLastLayer;
  exports.randomState = randomState;
  exports.randomZBLL = randomZBLL;


  // moveSymInvConjugates[m][s] gives s*m*s'.
  var moveSymInvConjugates = [
    [0, 3, 1, 2, 0, 2, 1, 3, 0, 3, 1, 2, 0, 2, 1, 3],
    [1, 2, 0, 3, 1, 3, 0, 2, 1, 2, 0, 3, 1, 3, 0, 2],
    [2, 0, 3, 1, 3, 0, 2, 1, 2, 0, 3, 1, 3, 0, 2, 1],
    [3, 1, 2, 0, 2, 1, 3, 0, 3, 1, 2, 0, 2, 1, 3, 0],
    [4, 4, 4, 4, 5, 5, 5, 5, 8, 8, 8, 8, 7, 7, 7, 7],
    [5, 5, 5, 5, 4, 4, 4, 4, 7, 7, 7, 7, 8, 8, 8, 8],
    [6, 6, 6, 6, 6, 6, 6, 6, 9, 9, 9, 9, 9, 9, 9, 9],
    [7, 7, 7, 7, 8, 8, 8, 8, 5, 5, 5, 5, 4, 4, 4, 4],
    [8, 8, 8, 8, 7, 7, 7, 7, 4, 4, 4, 4, 5, 5, 5, 5],
    [9, 9, 9, 9, 9, 9, 9, 9, 6, 6, 6, 6, 6, 6, 6, 6]
  ];

  // Phase2SymCoord is an abstract base class which helps implement phase-2
  // symmetry coordinates.
  //
  // The numRaw argument is the number of raw coordinates.
  // The numSym argument is the number of coordinates which are unique up to
  // symmetry.
  //
  // Symmetry coordinates are pairs (C, S) where C is a unique case up to
  // symmetry and S is a UD symmetry operation. The pair (C, S) represents the
  // state S'*C*S. These coordinates are encoded into integers as (C << 4) | S.
  function Phase2SymCoord(numRaw, numSym) {
    // There are 12 bits for the equivalence class and 4 bits for the symmetry.
    if (numSym >= 0x1000) {
      throw new Error('Phase2SymCoord cannot represent more than 4096 ' +
        'equivalence classes');
    }

    // this._moves maps every pair (C, M) to a symmetry coordinate, where C is a
    // unique edge case up to symmetry and M is a move between 0 and 10.
    this._moves = new Uint16Array(numSym * 10);

    // this._rawToSym maps every raw coordinate to a corresponding symmetry
    // coordinate.
    this._rawToSym = new Uint16Array(numRaw);

    // Set every entry in the moves table to 0xffff.
    for (var i = 0, len = numSym*10; i < len; ++i) {
      this._moves[i] = 0xffff;
    }

    // Set every entry in the rawToSym table to 0xffff.
    for (var i = 0; i < numRaw; ++i) {
      this._rawToSym[i] = 0xffff;
    }
  }

  // move applies a move to a symmetry coordinate and returns a new symmetry
  // coordinate.
  Phase2SymCoord.prototype.move = function(coord, move) {
    var s = coord & 0xf;
    var c = coord >>> 4;

    // Find the move s*m*s'. We do this because s'*(s*m*s')*c*s is equivalent to
    // m*s'*c*s, which is what we are really looking for.
    var moveInvConj = p2MoveSymmetryInvConj(s, move);
    var x = this._moves[c*10 + moveInvConj];

    var s1 = x & 0xf;
    var c1 = x >>> 4;

    // We now have s*m*s'*c expressed as s1'*c1*s1, but we want m*s'*c*s. This is
    // equal to s*x*s', so the result is (s'*s1')*c1*(s1*s).
    return (c1 << 4) | symmetry.udSymmetryProduct(s1, s);
  };

  // rawToSym converts a raw edge coordinate to a symmetry coordinate.
  Phase2SymCoord.prototype.rawToSym = function(raw) {
    return this._rawToSym[raw];
  };

  // _generateMoves fills in the move table for the symmetry coordinate.
  // The rawPerms argument contains the permutations corresponding to the raw
  // coordinate.
  // The moveFunc argument is a function which takes a permutation and a phase-2
  // move and returns an encoded raw coordinate corresponding to the coordinate
  // after applying the given move.
  Phase2SymCoord.prototype._generateMoves = function(rawPerms, moveFunc) {
    for (var i = 0, len = rawPerms.length; i < len; ++i) {
      var symCoord = this._rawToSym[i];

      // We only want symmetry coordinates with the identity symmetry.
      if ((symCoord & 0xf) !== 0) {
        continue;
      }

      var perm = rawPerms[i];
      var symCase = symCoord >>> 4;
      for (var move = 0; move < 10; ++move) {
        if (this._moves[symCase*10 + move] !== 0xffff) {
          continue;
        }

        var res = moveFunc(perm, move);
        var resSym = this._rawToSym[res];
        this._moves[symCase*10 + move] = resSym;

        // Avoid some extra calls to moveFunc (which may be relatively expensive)
        // by also doing the inverse of the move.

        var s = resSym & 0xf;
        var c1 = resSym >>> 4;

        // We know that m*symCase = s'*c1*s. Using some algebra, we can show that
        // (s*m'*s')*c1 = s*symCase*s'.

        var invMove = p2MoveSymmetryInvConj(s, p2MoveInverse(move));
        var invCoord = (symCase << 4) | symmetry.udSymmetryInverse(s);
        this._moves[c1*10 + invMove] = invCoord;
      }
    }
  };

  // _generateRawToSym generates the _rawToSym table which maps raw cases to their
  // symmetry coordinates.
  // The rawPerms argument contains the permutations corresponding to the raw
  // coordinate.
  // The symConjFunc argument is a function which takes a symmetry and a
  // permutation and returns a new permutation which was conjugated by the
  // symmetry.
  Phase2SymCoord.prototype._generateRawToSym = function(rawPerms, symConjFunc) {
    // caseCount is incremented every time a new equivalence class is found. By
    // the end of the loop, this should equal this._moves.length/10.
    var caseCount = 0;

    // Find the first permutation for each symmetry equivalence class.
    for (var i = 0, len = rawPerms.length; i < len; ++i) {
      // Skip this iteration if the permutation has already been accounted for by
      // a symmetrically equivalent permutation.
      if (this._rawToSym[i] !== 0xffff) {
        continue;
      }

      // Get the index of the unique case up to symmetry.
      var symHash = caseCount++;

      // Save this permutation in the table with the identity symmetry operator.
      this._rawToSym[i] = symHash << 4;

      // Generate all the symmetries of this permutation and hash each one.
      var perm = rawPerms[i];
      for (var sym = 1; sym < 0x10; ++sym) {
        var p = symConjFunc(sym, perm);
        var hash = perms.encodeDestructablePerm(p);
        if (this._rawToSym[hash] === 0xffff) {
          this._rawToSym[hash] = (symHash << 4) | sym;
        }
      }
    }
  }

  // Phase2CornerCoord manages everything having to do with the phase-2 corner
  // symmetry coordinate.
  function Phase2CornerCoord(perm8) {
    Phase2SymCoord.call(this, 40320, 2768);

    this._generateRawToSym(perm8, p2CornerSymmetryConj);
    this._generateMoves(perm8, moveYCornerPerm);
  }

  Phase2CornerCoord.prototype = Object.create(Phase2SymCoord.prototype);

  // Phase2EdgeCoord manages everything having to do with the phase-2 edge
  // symmetry coordinate.
  function Phase2EdgeCoord(perm8) {
    Phase2SymCoord.call(this, 40320, 2768);

    this._generateRawToSym(perm8, p2EdgeSymmetryConj);
    this._generateMoves(perm8, moveUDEdgePerm);
  }

  Phase2EdgeCoord.prototype = Object.create(Phase2SymCoord.prototype);

  // moveUDPerm applies a phase-2 move to a given edge permutation case. It then
  // hashes the result and returns said hash. The original permutation is not
  // modified.
  function moveUDEdgePerm(perm, move) {
    // NOTE: this code was generated by translating Go code to JavaScript.
    var p = perm.slice();
    var temp;
    switch (move) {
    case 0:
      temp = p[2];
      p[2] = p[6];
      p[6] = temp;
      break;
    case 1:
      temp = p[0];
      p[0] = p[4];
      p[4] = temp;
      break;
    case 2:
      temp = p[1];
      p[1] = p[5];
      p[5] = temp;
      break;
    case 3:
      temp = p[3];
      p[3] = p[7];
      p[7] = temp;
      break;
    case 4:
      temp = p[3];
      p[3] = p[2];
      p[2] = p[1];
      p[1] = p[0];
      p[0] = temp;
      break;
    case 5:
      temp = p[3];
      p[3] = p[0];
      p[0] = p[1];
      p[1] = p[2];
      p[2] = temp;
      break;
    case 6:
      temp = p[0];
      p[0] = p[2];
      p[2] = temp;
      temp = p[1];
      p[1] = p[3];
      p[3] = temp;
      break;
    case 7:
      temp = p[7];
      p[7] = p[4];
      p[4] = p[5];
      p[5] = p[6];
      p[6] = temp;
      break;
    case 8:
      temp = p[7];
      p[7] = p[6];
      p[6] = p[5];
      p[5] = p[4];
      p[4] = temp;
      break;
    case 9:
      temp = p[4];
      p[4] = p[6];
      p[6] = temp;
      temp = p[5];
      p[5] = p[7];
      p[7] = temp;
      break;
    default:
      break;
    }
    return perms.encodeDestructablePerm(p);
  }

  // moveYCornerPerm applies a phase-2 move to a given corner permutation case. It
  // then hashes the result and returns said hash. The original permutation is not
  // modified.
  function moveYCornerPerm(perm, move) {
    // NOTE: this code was generated by translating Go code to JavaScript.
    var p = perm.slice();
    var temp;
    switch (move) {
    case 0:
      temp = p[5];
      p[5] = p[6];
      p[6] = temp;
      temp = p[4];
      p[4] = p[7];
      p[7] = temp;
      break;
    case 1:
      temp = p[1];
      p[1] = p[2];
      p[2] = temp;
      temp = p[0];
      p[0] = p[3];
      p[3] = temp;
      break;
    case 2:
      temp = p[1];
      p[1] = p[7];
      p[7] = temp;
      temp = p[3];
      p[3] = p[5];
      p[5] = temp;
      break;
    case 3:
      temp = p[0];
      p[0] = p[6];
      p[6] = temp;
      temp = p[2];
      p[2] = p[4];
      p[4] = temp;
      break;
    case 4:
      temp = p[6];
      p[6] = p[7];
      p[7] = p[3];
      p[3] = p[2];
      p[2] = temp;
      break;
    case 5:
      temp = p[6];
      p[6] = p[2];
      p[2] = p[3];
      p[3] = p[7];
      p[7] = temp;
      break;
    case 6:
      temp = p[2];
      p[2] = p[7];
      p[7] = temp;
      temp = p[3];
      p[3] = p[6];
      p[6] = temp;
      break;
    case 7:
      temp = p[0];
      p[0] = p[1];
      p[1] = p[5];
      p[5] = p[4];
      p[4] = temp;
      break;
    case 8:
      temp = p[0];
      p[0] = p[4];
      p[4] = p[5];
      p[5] = p[1];
      p[1] = temp;
      break;
    case 9:
      temp = p[0];
      p[0] = p[5];
      p[5] = temp;
      temp = p[1];
      p[1] = p[4];
      p[4] = temp;
      break;
    default:
      break;
    }
    return perms.encodeDestructablePerm(p);
  }

  // p2CornerSymmetryConj conjugates a phase-2 corner permutation case with a UD
  // symmetry. The result, sym'*array*sym, is returned.
  function p2CornerSymmetryConj(sym, array) {
    // Apply sym to the identity permutation.
    var result = [0, 1, 2, 3, 4, 5, 6, 7];
    p2CornerSymmetryPermute(sym, result);

    // Apply array to get array*sym.
    perms.applyPerm(result, array);

    // Apply sym' to get sym'*array*sym.
    p2CornerSymmetryPermute(symmetry.udSymmetryInverse(sym), result);

    return result;
  }

  // p2CornerSymmetryPermute applies a UD symmetry to a given permutation of 8
  // elements which represent the corner pieces on a phase-2 cube.
  function p2CornerSymmetryPermute(sym, array) {
    var lrFlip = symmetry.udSymmetryLRFlip(sym);

    // Apply whatever y rotation there might be.
    var yRot = symmetry.udSymmetryY(sym);
    if (yRot === 1) {
      // Permute the top and bottom corners. We cannot use permute4Forwards :(.
      var temp = array[2];
      array[2] = array[6];
      array[6] = array[7];
      array[7] = array[3];
      array[3] = temp;
      temp = array[0];
      array[0] = array[4];
      array[4] = array[5];
      array[5] = array[1];
      array[1] = temp;
    } else if (yRot === 3) {
      // Permute the top and bottom corners. We cannot use permute4Backwards :(.
      var temp = array[2];
      array[2] = array[3];
      array[3] = array[7];
      array[7] = array[6];
      array[6] = temp;
      temp = array[0];
      array[0] = array[1];
      array[1] = array[5];
      array[5] = array[4];
      array[4] = temp;
    } else if (yRot === 2) {
      // y2 is equivalent to LRflip*FBflip, so I will do an FBflip and switch
      // lrFlip.
      lrFlip = !lrFlip;

      // Swap the first four corners with the last four corners (0YX + 4 = 1YX).
      for (var i = 0; i < 4; ++i) {
        var temp = array[i];
        array[i] = array[i | 4];
        array[i | 4] = temp;
      }
    }

    if (lrFlip) {
      // Swap even corners with odd corners, since ZY0 + 1 = ZY1.
      for (var i = 0; i < 8; i += 2) {
        var temp = array[i];
        array[i] = array[i | 1];
        array[i | 1] = temp;
      }
    }

    if (symmetry.udSymmetryUDFlip(sym)) {
      // Swap corners with coordinates Z0X with those with coordinates Z1X.
      for (var i = 0; i < 4; ++i) {
        // Right now, I is the number ZX. We want Z0X, so we shift up the second
        // bit.
        var bottomIdx = (i & 1) | ((i & 2) << 1);

        // ORing the bottom index with 2 turns X0Z into X1Z.
        var topIdx = bottomIdx | 2;

        // Do the swap itself.
        var temp = array[bottomIdx];
        array[bottomIdx] = array[topIdx];
        array[topIdx] = temp;
      }
    }
  }

  // p2EdgeSymmetryConj conjugates a phase-2 edge permutation case with a UD
  // symmetry. The result, sym'*array*sym, is returned.
  function p2EdgeSymmetryConj(sym, array) {
    // Apply sym to the identity permutation.
    var result = [0, 1, 2, 3, 4, 5, 6, 7];
    p2EdgeSymmetryPermute(sym, result);

    // Apply array to get array*sym.
    perms.applyPerm(result, array);

    // Apply sym' to get sym'*array*sym.
    p2EdgeSymmetryPermute(symmetry.udSymmetryInverse(sym), result);

    return result;
  }

  // p2EdgeSymmetryPermute applies a UD symmetry to a given permutation of 8
  // elements which represent UD edge pieces on a phase-2 cube.
  function p2EdgeSymmetryPermute(sym, array) {
    var lrFlip = symmetry.udSymmetryLRFlip(sym);

    // Apply whatever y rotation there might be.
    var yRot = symmetry.udSymmetryY(sym);
    if (yRot === 1) {
      permute4Forwards(array, 0);
      permute4Forwards(array, 4);
    } else if (yRot === 3) {
      permute4Backwards(array, 0);
      permute4Backwards(array, 4);
    } else if (yRot === 2) {
      // Doing y^2 is equivalent to doing LRflip*FBflip.
      lrFlip = !lrFlip;

      // Do an FBflip.
      var temp = array[0];
      array[0] = array[2];
      array[2] = temp;
      temp = array[4];
      array[4] = array[6];
      array[6] = temp;
    }

    // If there is an LR reflection, swap [1] with [3] and [5] with [7].
    if (lrFlip) {
      var temp = array[1];
      array[1] = array[3];
      array[3] = temp;
      temp = array[5];
      array[5] = array[7];
      array[7] = temp;
    }

    // If there is a UD reflection, swap the first four elements with the last
    // four elements.
    if (symmetry.udSymmetryUDFlip(sym)) {
      for (var i = 0; i < 4; ++i) {
        var temp = array[i];
        array[i] = array[i + 4];
        array[i + 4] = temp;
      }
    }
  }

  // p2MoveSymmetryInvConj conjugates a move m with a symmetry s' to find s*m*s'.
  function p2MoveSymmetryInvConj(s, m) {
    return moveSymInvConjugates[m][s];
  }

  function permute4Forwards(array, start) {
    // Ignoring start, this does the following:
    // a[0], a[1], a[2], a[3] = a[3], a[0], a[1], a[2].
    var temp = array[start + 3];
    array[start + 3] = array[start + 2];
    array[start + 2] = array[start + 1];
    array[start + 1] = array[start];
    array[start] = temp;
  }

  function permute4Backwards(array, start) {
    // Ignoring start, this does the following:
    // a[0], a[1], a[2], a[3] = a[1], a[2], a[3], a[0]
    var temp = array[start];
    array[start] = array[start + 1];
    array[start + 1] = array[start + 2];
    array[start + 2] = array[start + 3];
    array[start + 3] = temp;
  }

  exports.Phase2CornerCoord = Phase2CornerCoord;
  exports.Phase2EdgeCoord = Phase2EdgeCoord;
  exports.p2CornerSymmetryConj = p2CornerSymmetryConj;
  exports.p2CornerSymmetryPermute = p2CornerSymmetryPermute;
  exports.p2EdgeSymmetryConj = p2EdgeSymmetryConj;
  exports.p2EdgeSymmetryPermute = p2EdgeSymmetryPermute;


  // Phase2Solver implements the backbone of solvePhase2().
  function Phase2Solver(heuristic, coords, deadline) {
    this.heuristic = heuristic;
    this.coords = coords;
    this.deadline = deadline;

    this.depth = 0;
    this.cubes = [];

    this.nodesSinceDate = 0;
  }

  // deepen prepares this solver for a deeper search.
  Phase2Solver.prototype.deepen = function() {
    this.cubes[this.depth] = new Phase2Cube();
    this.depth++;
  };

  // solve runs a search at the current depth.
  Phase2Solver.prototype.solve = function(cube) {
    try {
      return this._search(cube, 0, 0, -1);
    } catch (e) {
      if (e !== 'solve timed out') {
        throw e;
      }
      return null;
    }
  };

  Phase2Solver.prototype._checkExpired = function() {
    if (new Date().getTime() > this.deadline) {
      throw 'solve timed out';
    }
  };

  Phase2Solver.prototype._search = function(cube, depth, lastFace, lastAxis) {
    if (++this.nodesSinceDate === 500000) {
      this.nodesSinceDate = 0;
      this._checkExpired();
    }

    if (depth === this.depth) {
      if (cube.solved()) {
        return [];
      }
      return null;
    } else if (this.heuristic.lowerBound(cube, this.coords) > this.depth-depth) {
      return null;
    }

    var newCube = this.cubes[depth];
    for (var i = 0; i < 10; ++i) {
      var face = p2MoveFace(i);
      if (face === lastFace) {
        continue;
      }
      var axis = p2MoveAxis(i);
      if (axis === lastAxis && face >= lastFace) {
        // Avoid redundancies like L2 R2 L2 and enforce an ordering for moves on
        // the same axis.
        continue;
      }

      newCube.set(cube);
      newCube.move(i, this.coords);

      var res = this._search(newCube, depth+1, face, axis);
      if (res !== null) {
        res.splice(0, 0, i);
        return res;
      }
    }

    return null;
  };

  // solvePhase2 finds a solution to a Phase2Cube and returns it or returns null
  // if no solution was found (either because no solution exists or because of a
  // timeout).
  function solvePhase2(cube, maxLen, heuristic, coords, timeout) {
    timeout = (timeout || 1000000);
    var deadline = new Date().getTime() + timeout;
    var solver = new Phase2Solver(heuristic, coords, deadline);
    for (var depth = 0; depth <= maxLen; ++depth) {
      var solution = solver.solve(cube);
      if (solution !== null) {
        return solution;
      }
      solver.deepen();
    }
    return null;
  }

  exports.solvePhase2 = solvePhase2;


  // Phase2ChooseCoord manages the coordinate for the UD corner "choice". This
  // coordinate keeps track of which corners belong on the bottom layer or the top
  // layer. As a result, there are (8 choose 4) = 70 total cases.
  function Phase2ChooseCoord() {
    // this._invSymmetries stores every case conjugated by every symmetry. The
    // value this._invSymmetries[raw*16 + sym] gives sym*raw*sym'.
    this._invSymmetries = new Uint8Array(70 * 16);

    // this._moves stores every move applied to every configuration. A given move
    // can be applied to a raw state using this.moves[raw*10 + move].
    this._moves = new Uint8Array(70 * 10);

    var cases = this._cases();
    this._generateMoves(cases);
    this._generateInvSymmetries(cases);
  }

  // convertRawCorners converts a raw corner coordinate into a Phase2SliceCoord.
  Phase2ChooseCoord.prototype.convertRawCorners = function(rawCoord) {
    // NOTE: this could be made faster with a conversion table. This may be an
    // issue if a lot of phase-1 solutions are found.
    var permutation = perms.decodePerm(rawCoord, 8);
    return cornerPermToChoose(permutation);
  };

  // invConjSym conjugates a coordinate with the inverse of a symmetry, returning
  // sym*coord*sym'.
  Phase2ChooseCoord.prototype.invConjSym = function(sym, coord) {
    return this._invSymmetries[(coord << 4) | sym];
  }

  // move applies a move to the choose case.
  Phase2ChooseCoord.prototype.move = function(coord, move) {
    return this._moves[coord*10 + move];
  };

  // _cases creates a list of all 70 choices represented as arrays and returns it.
  Phase2ChooseCoord.prototype._cases = function() {
    var res = [];
    for (var a = 0; a < 5; ++a) {
      for (var b = a+1; b < 6; ++b) {
        for (var c = b+1; c < 7; ++c) {
          for (var d = c+1; d < 8; ++d) {
            var theCase = [false, false, false, false, false, false, false,
              false];
            theCase[a] = true;
            theCase[b] = true;
            theCase[c] = true;
            theCase[d] = true;
            res.push(theCase);
          }
        }
      }
    }
    return res;
  };

  // _generateInvSymmetries generates the symmetries for every case.
  Phase2ChooseCoord.prototype._generateInvSymmetries = function(cases) {
    for (var i = 0; i < 70; ++i) {
      // The identity symmetry does not change the case.
      this._invSymmetries[i << 4] = i;

      var cornerPerm = cornerPermFromChoose(cases[i]);
      for (var sym = 1; sym < 0x10; ++sym) {
        var newPerm = p2CornerSymmetryConj(symmetry.udSymmetryInverse(sym),
          cornerPerm);
        this._invSymmetries[(i << 4) | sym] = cornerPermToChoose(newPerm);
      }
    }
  };

  // _generateMoves generates the moves for every case.
  Phase2ChooseCoord.prototype._generateMoves = function(cases) {
    for (var i = 0, len = 70*10; i < len; ++i) {
      this._moves[i] = 0xff;
    }

    for (var i = 0; i < 70; ++i) {
      var choose = cases[i];
      for (var move = 0; move < 10; ++move) {
        if (this._moves[i*10 + move] !== 0xff) {
          continue;
        }

        var appliedCase = moveYCornerChoose(choose, move);
        this._moves[i*10 + move] = appliedCase;

        // Store the inverse of the move to avoid extra moveYCornerChoose calls.
        this._moves[appliedCase*10 + p2MoveInverse(move)] = i;
      }
    }
  };

  // Phase2SliceCoord manages the M slice coordinate for the phase-2 solver. This
  // coordinate is very small (only 24 permutations), so this object is very
  // lightweight.
  function Phase2SliceCoord(perm4) {
    // this._invSymmetries makes it easy and efficient to apply any of the 16
    // symmetries to a slice coordinate. The value
    // this._invSymmetries[raw*16 + sym] is equal to sym*raw*sym'.
    this._invSymmetries = new Uint8Array(24 * 16);

    // this._moves stores every move applied to every configuration. A given move
    // can be applied to a raw state using this._moves[raw*10 + move].
    this._moves = new Uint8Array(24 * 10);

    this._generateMoves(perm4);
    this._generateSymmetries(perm4);
  }

  // invConjSym conjugates a coordinate with the inverse of a symmetry, returning
  // sym*coord*sym'.
  Phase2SliceCoord.prototype.invConjSym = function(sym, coord) {
    return this._invSymmetries[(coord << 4) | sym];
  };

  // move applies a move to the slice.
  Phase2SliceCoord.prototype.move = function(coord, move) {
    return this._moves[coord*10 + move];
  };

  // _generateMoves generates the move table for the slice.
  Phase2SliceCoord.prototype._generateMoves = function(perm4) {
    for (var i = 0; i < 24; ++i) {
      var perm = perm4[i];
      for (var move = 0; move < 10; ++move) {
        var newState = moveESlicePerm(perm, move);
        this._moves[i*10 + move] = newState;
      }
    }
  };

  // _generateSymmetries generates the table for applying symmetries to a given
  // coordinate.
  Phase2SliceCoord.prototype._generateSymmetries = function(perm4) {
    for (var i = 0; i < 24; ++i) {
      var perm = perm4[i];
      for (var sym = 0; sym < 0x10; ++sym) {
        var p = p2SliceSymmetryConj(symmetry.udSymmetryInverse(sym), perm);
        var hash = perms.encodeDestructablePerm(p);
        this._invSymmetries[(i << 4) | sym] = hash;
      }
    }
  };

  // cornerPermFromChoose generates a corner permutation that represents the given
  // choose array for top/bottom corners. A true in the choose array indicates a
  // top-layer corner.
  function cornerPermFromChoose(choose) {
    var cornerPerm = [];
    var topCorners = [2, 3, 6, 7];
    var bottomCorners = [0, 1, 4, 5];
    var topUsed = 0;
    var bottomUsed = 0;
    for (var j = 0; j < 8; ++j) {
      if (choose[j]) {
        cornerPerm[j] = topCorners[topUsed++];
      } else {
        cornerPerm[j] = bottomCorners[bottomUsed++];
      }
    }
    return cornerPerm;
  }

  // cornerPermToChoose turns a corner permutation into a choose array, encodes
  // it, and returns the encoded choose.
  function cornerPermToChoose(perm) {
    var choose = [];
    for (var i = 0; i < 8; ++i) {
      choose[i] = ((perm[i] & 2) === 2);
    }
    return perms.encodeChoose(choose);
  }

  // moveESlicePerm applies a move to a permutation which represents the E slice
  // edges. This returns a perfect hash of the result and does not modify the
  // original permutation.
  function moveESlicePerm(perm, move) {
    var p = perm.slice();
    var temp;
    switch (move) {
    case 0:
      temp = p[0];
      p[0] = p[1];
      p[1] = temp;
      break;
    case 1:
      temp = p[2];
      p[2] = p[3];
      p[3] = temp;
      break;
    case 2:
      temp = p[0];
      p[0] = p[2];
      p[2] = temp;
      break;
    case 3:
      temp = p[1];
      p[1] = p[3];
      p[3] = temp;
    default:
      break;
    }
    return perms.encodeDestructablePerm(p);
  }

  // moveYCornerChoose applies a phase-2 move to a given corner choice. It then
  // then hashes the result and returns said hash. The original permutation is not
  // modified.
  function moveYCornerChoose(choose, move) {
    // NOTE: this code was generated by translating Go code to JavaScript.
    // This does permutations which are equivalent to moveYCornerPerm. By making
    // this an entirely different function, we are helping the JS engine by
    // avoiding polymorphic functions (because this takes an array of booleans
    // while moveYCornerPerm takes an array of numbers).
    var p = choose.slice();
    var temp;
    switch (move) {
    case 0:
      temp = p[5];
      p[5] = p[6];
      p[6] = temp;
      temp = p[4];
      p[4] = p[7];
      p[7] = temp;
      break;
    case 1:
      temp = p[1];
      p[1] = p[2];
      p[2] = temp;
      temp = p[0];
      p[0] = p[3];
      p[3] = temp;
      break;
    case 2:
      temp = p[1];
      p[1] = p[7];
      p[7] = temp;
      temp = p[3];
      p[3] = p[5];
      p[5] = temp;
      break;
    case 3:
      temp = p[0];
      p[0] = p[6];
      p[6] = temp;
      temp = p[2];
      p[2] = p[4];
      p[4] = temp;
      break;
    case 4:
      temp = p[6];
      p[6] = p[7];
      p[7] = p[3];
      p[3] = p[2];
      p[2] = temp;
      break;
    case 5:
      temp = p[6];
      p[6] = p[2];
      p[2] = p[3];
      p[3] = p[7];
      p[7] = temp;
      break;
    case 6:
      temp = p[2];
      p[2] = p[7];
      p[7] = temp;
      temp = p[3];
      p[3] = p[6];
      p[6] = temp;
      break;
    case 7:
      temp = p[0];
      p[0] = p[1];
      p[1] = p[5];
      p[5] = p[4];
      p[4] = temp;
      break;
    case 8:
      temp = p[0];
      p[0] = p[4];
      p[4] = p[5];
      p[5] = p[1];
      p[1] = temp;
      break;
    case 9:
      temp = p[0];
      p[0] = p[5];
      p[5] = temp;
      temp = p[1];
      p[1] = p[4];
      p[4] = temp;
      break;
    default:
      break;
    }
    return perms.encodeChoose(p);
  }

  // p2SliceSymmetryConj conjugates a phase-2 slice permutation case with a UD
  // symmetry. The result, sym'*array*sym, is returned.
  function p2SliceSymmetryConj(sym, array) {
    // Apply sym to the identity permutation.
    var result = [0, 1, 2, 3];
    p2SliceSymmetryPermute(sym, result);

    // Apply array to get array*sym.
    perms.applyPerm(result, array);

    // Apply sym' to get sym'*array*sym.
    p2SliceSymmetryPermute(symmetry.udSymmetryInverse(sym), result);

    return result;
  }

  // p2SliceSymmetryPermute applies a UD symmetry to a given permutation of 4
  // elements which represent slice edge pieces on a phase-2 cube.
  function p2SliceSymmetryPermute(sym, array) {
    var lrFlip = symmetry.udSymmetryLRFlip(sym);

    // NOTE: the edges in the E slice are ordered: FR, FL, BR, BL. This is not a
    // direct ring around the cube, so we have to do permutations manually.

    // Apply whatever y rotation we need to. Unfortunately, we can't use the nice
    // permute4...() functions because the slice array isn't ordered in a ring.
    var yRot = symmetry.udSymmetryY(sym);
    if (yRot === 1) {
      var temp = array[2];
      array[2] = array[3];
      array[3] = array[1];
      array[1] = array[0];
      array[0] = temp;
    } else if (yRot === 3) {
      var temp = array[0];
      array[0] = array[1];
      array[1] = array[3];
      array[3] = array[2];
      array[2] = temp;
    } else if (yRot === 2) {
      // y^2 is LRflip*FBflip.
      lrFlip = !lrFlip;

      // Perform an FBflip.
      var temp = array[0];
      array[0] = array[2];
      array[2] = temp;
      temp = array[1];
      array[1] = array[3];
      array[3] = temp;
    }

    if (lrFlip) {
      var temp = array[0];
      array[0] = array[1];
      array[1] = temp;
      temp = array[2];
      array[2] = array[3];
      array[3] = temp;
    }

    // NOTE: a UD flip has no effect on the E slice.
  }

  exports.Phase2ChooseCoord = Phase2ChooseCoord;
  exports.Phase2SliceCoord = Phase2SliceCoord;
  exports.p2SliceSymmetryConj = p2SliceSymmetryPermute;
  exports.p2SliceSymmetryPermute = p2SliceSymmetryPermute;


  var P2_CORNERS_SLICE_MAX = 12;
  var P2_EDGES_CHOOSE_MAX = 10;
  var P2_EDGES_SLICE_MAX = 9;

  // Phase2Heuristic estimates the lower bound for the number of moves to solve a
  // Phase2Cube.
  function Phase2Heuristic(coords) {
    // This stores the number of moves needed to solve both the corners and the
    // E slice edges for each case. The cases are encoded as:
    // CornerSym*24 + SlicePerm.
    this.cornersSlice = new CompactTable(2768 * 24);

    // This stores the number of moves needed to solve the edges and to bring all
    // the top-layer edges to the top layer.
    this.edgesChoose = new CompactTable(2768 * 70);

    // This stores the number of moves needed to solve both the edges and the E
    // slice edges for each case. The cases are encoded as:
    // EdgeSym*24 + SlicePerm.
    this.edgesSlice = new CompactTable(2768 * 24);

    this._generateCornersSlice(coords);
    this._generateEdgesChoose(coords);
    this._generateEdgesSlice(coords);
  }

  // lowerBound returns a lower bound for the number of moves to solve a given
  // Phase2Cube. This requires a Phase2Coords table.
  Phase2Heuristic.prototype.lowerBound = function(c, coords) {
    // Figure out the corner+slice heuristic coordinate.
    var cHash = hashCornersSlice(c.cornerCoord, c.sliceCoord, coords);
    var cMoves = this.cornersSlice.get(cHash);
    if (cMoves >= P2_EDGES_CHOOSE_MAX && cMoves >= P2_EDGES_SLICE_MAX) {
      return cMoves;
    }

    // Figure out the edge+choose heuristic coordinate.
    var ecHash = hashEdgesChoose(c.edgeCoord, c.chooseCoord, coords);
    var ecMoves = this.edgesChoose.get(ecHash);
    if (ecMoves > cMoves && ecMoves >= P2_EDGES_SLICE_MAX) {
      return ecMoves;
    }

    // Figure out the edge+slice heuristic coordinate.
    var eHash = hashEdgesSlice(c.edgeCoord, c.sliceCoord, coords);
    var eMoves = this.edgesSlice.get(eHash);

    // Don't call Math.max because it's a slight amount of extra overhead and this
    // function's performance is critical.
    if (ecMoves > cMoves) {
      if (ecMoves > eMoves) {
        return ecMoves;
      } else {
        return eMoves;
      }
    } else {
      if (cMoves > eMoves) {
        return cMoves;
      } else {
        return eMoves;
      }
    }
  };

  Phase2Heuristic.prototype._generateCornersSlice = function(coords) {
    this.cornersSlice.fillWith(P2_CORNERS_SLICE_MAX);

    // The arrangement of bits in the queue's nodes are as follows:
    // (LSB) (4 bits: depth) (5 bits: slice) (12 bits: corners) (MSB)

    // Setup the queue to have the start node.
    var queue = new NumberQueue(13590);
    queue.push(0);

    // We have explored the start node. It's depth is zero (obviously).
    this.cornersSlice.set(0, 0);

    // While there's still stuff in the queue, do the search.
    while (!queue.empty()) {
      // Shift a node and extract its bitfields.
      var node = queue.shift();
      var depth = (node & 0xf);
      var slice = (node >>> 4) & 0x1f;
      var corners = (node >>> 9);

      // Apply all 10 moves to the node.
      for (var m = 0; m < 10; ++m) {
        var newSlice = coords.slice.move(slice, m);
        var newCorners = coords.corners.move(corners << 4, m);
        var symSlice = coords.slice.invConjSym(newCorners & 0xf, newSlice);
        var symCorners = (newCorners >>> 4);
        hash = symSlice + symCorners*24;

        // If this node has not been visited, push it to the queue.
        if (this.cornersSlice.get(hash) === P2_CORNERS_SLICE_MAX) {
          this.cornersSlice.set(hash, depth + 1);
          if (depth < P2_CORNERS_SLICE_MAX-2) {
            queue.push((depth + 1) | (symSlice << 4) | (symCorners << 9));
          }
        }
      }
    }
  };

  Phase2Heuristic.prototype._generateEdgesChoose = function(coords) {
    this.edgesChoose.fillWith(P2_EDGES_CHOOSE_MAX);

    // The arrangement of bits in the queue's nodes are as follows:
    // (LSB) (4 bits: depth) (7 bits: choose) (12 bits: edges) (MSB)

    // Setup the queue to have the start node.
    var queue = new NumberQueue(46680);
    queue.push(60 << 4);

    // We have visited the first node.
    this.edgesChoose.set(60, 0);

    while (!queue.empty()) {
      // Shift a node and extract its bitfields.
      var node = queue.shift();
      var depth = (node & 0xf);
      var choose = (node >>> 4) & 0x7f;
      var edges = (node >>> 11);

      // Apply all 10 moves to the node.
      for (var m = 0; m < 10; ++m) {
        var newChoose = coords.choose.move(choose, m);
        var newEdges = coords.edges.move(edges << 4, m);
        var symChoose = coords.choose.invConjSym(newEdges & 0xf, newChoose);
        var symEdges = (newEdges >>> 4);
        hash = symChoose + symEdges*70;

        // If this node has not been visited, push it to the queue.
        if (this.edgesChoose.get(hash) === P2_EDGES_CHOOSE_MAX) {
          this.edgesChoose.set(hash, depth + 1);
          if (depth < P2_EDGES_CHOOSE_MAX-2) {
            queue.push((depth + 1) | (symChoose << 4) | (symEdges << 11));
          }
        }
      }
    }
  };

  Phase2Heuristic.prototype._generateEdgesSlice = function(coords) {
    this.edgesSlice.fillWith(P2_EDGES_SLICE_MAX);

    // The arrangement of bits in the queue's nodes are as follows:
    // (LSB) (4 bits: depth) (5 bits: slice) (12 bits: edges) (MSB)

    // Setup the queue to have the start node.
    var queue = new NumberQueue(19350);
    queue.push(0);

    // We have visited the first node.
    this.edgesSlice.set(0, 0);

    while (!queue.empty()) {
      // Shift a node and extract its bitfields.
      var node = queue.shift();
      var depth = (node & 0xf);
      var slice = (node >>> 4) & 0x1f;
      var edges = (node >>> 9);

      // Apply all 10 moves to the node.
      for (var m = 0; m < 10; ++m) {
        var newSlice = coords.slice.move(slice, m);
        var newEdges = coords.edges.move(edges << 4, m);
        var symSlice = coords.slice.invConjSym(newEdges & 0xf, newSlice);
        var symEdges = (newEdges >>> 4);
        hash = symSlice + symEdges*24;

        // If this node has not been visited, push it to the queue.
        if (this.edgesSlice.get(hash) === P2_EDGES_SLICE_MAX) {
          this.edgesSlice.set(hash, depth + 1);
          if (depth < P2_EDGES_SLICE_MAX-2) {
            queue.push((depth + 1) | (symSlice << 4) | (symEdges << 9));
          }
        }
      }
    }
  };

  function hashCornersSlice(corners, slice, coords) {
    var symSlice = coords.slice.invConjSym(corners & 0xf, slice);
    var symCorners = (corners >>> 4);
    return symSlice + symCorners*24;
  }

  function hashEdgesChoose(edges, choose, coords) {
    var symChoose = coords.choose.invConjSym(edges & 0xf, choose);
    var symEdges = (edges >>> 4);
    return symChoose + symEdges*70;
  }

  function hashEdgesSlice(edges, slice, coords) {
    var symSlice = coords.slice.invConjSym(edges & 0xf, slice);
    var symEdges = (edges >>> 4);
    return symSlice + symEdges*24;
  }

  exports.Phase2Heuristic = Phase2Heuristic;


  // Phase2Coords manages all the coordinates needed for the phase-2 solver.
  function Phase2Coords() {
    var perm8 = perms.allPerms(8);
    this.choose = new Phase2ChooseCoord();
    this.corners = new Phase2CornerCoord(perm8);
    this.edges = new Phase2EdgeCoord(perm8);
    this.slice = new Phase2SliceCoord(perms.allPerms(4));
  }

  // A Phase2Cube represents the state of a cube that is important to the phase-2
  // solver.
  function Phase2Cube() {
    // The solved choose coordinate represents 00110011
    this.chooseCoord = 60;

    this.cornerCoord = 0;
    this.edgeCoord = 0;
    this.sliceCoord = 0;
  }

  // move applies a phase-2 move (a number in the range [0, 10)) to the cube given
  // a pre-computed Phase2Coords table.
  Phase2Cube.prototype.move = function(m, coords) {
    this.chooseCoord = coords.choose.move(this.chooseCoord, m);
    this.cornerCoord = coords.corners.move(this.cornerCoord, m);
    this.edgeCoord = coords.edges.move(this.edgeCoord, m);
    this.sliceCoord = coords.slice.move(this.sliceCoord, m);
  };

  // set updates this cube's coordinates to match the given cube.
  Phase2Cube.prototype.set = function(c) {
    this.chooseCoord = c.chooseCoord;
    this.cornerCoord = c.cornerCoord;
    this.edgeCoord = c.edgeCoord;
    this.sliceCoord = c.sliceCoord;
  };

  // solved returns true if the Phase2Cube is solved.
  Phase2Cube.prototype.solved = function() {
    return (this.cornerCoord >>> 4) === 0 && (this.edgeCoord >>> 4) === 0 &&
      this.sliceCoord === 0;
  };

  // convertCubieToPhase2 converts a Cube to a Phase2Cube on a given axis. This
  // requires a Phase2Coords table to work.
  function convertCubieToPhase2(cube, axis, coords) {
    var res = new Phase2Cube();
    var cornerPerm = 0;
    var edgePerm = 0;
    if (axis === 0) {
      cornerPerm = encodeXCornerPerm(cube.corners);
      edgePerm = encodeRLEdges(cube.edges);
      res.sliceCoord = encodeMSlicePerm(cube.edges);
    } else if (axis === 1) {
      cornerPerm = encodeYCornerPerm(cube.corners);
      edgePerm = encodeUDEdges(cube.edges);
      res.sliceCoord = encodeESlicePerm(cube.edges);
    } else if (axis === 2) {
      cornerPerm = encodeZCornerPerm(cube.corners);
      edgePerm = encodeFBEdges(cube.edges);
      res.sliceCoord = encodeSSlicePerm(cube.edges);
    }
    res.chooseCoord = coords.choose.convertRawCorners(cornerPerm);
    res.cornerCoord = coords.corners.rawToSym(cornerPerm);
    res.edgeCoord = coords.edges.rawToSym(edgePerm);
    return res;
  }

  function encodeESlicePerm(e) {
    var perm = [];
    for (var i = 0; i < 4; ++i) {
      var slot = [1, 3, 7, 9][i];
      var piece = e.edges[slot].piece;
      perm[i] = [-1, 0, -1, 1, -1, -1, -1, 2, -1, 3, -1, -1][piece];
      if (perm[i] < 0) {
        throw new Error('invalid piece in slice: ' + piece);
      }
    }
    return perms.encodeDestructablePerm(perm);
  }

  function encodeFBEdges(e) {
    var perm = [];
    for (var i = 0; i < 8; ++i) {
      var slot = [0, 1, 2, 3, 6, 7, 8, 9][i];
      var piece = e.edges[slot].piece;
      perm[i] = [0, 1, 2, 3, -1, -1, 4, 5, 6, 7, -1, -1][piece];
      if (perm[i] < 0) {
        throw new Error('unexpected edge piece: ' + piece);
      }
    }
    return perms.encodeDestructablePerm(perm);
  }

  function encodeMSlicePerm(e) {
    var perm = [];
    for (var i = 0; i < 4; ++i) {
      var slot = [0, 2, 6, 8][i];
      var piece = e.edges[slot].piece;
      perm[i] = [0, -1, 1, -1, -1, -1, 2, -1, 3, -1, -1, -1][piece];
      if (perm[i] < 0) {
        throw new Error('invalid piece in slice: ' + piece);
      }
    }
    return perms.encodeDestructablePerm(perm);
  }

  function encodeRLEdges(e) {
    var perm = [];
    for (var i = 0; i < 8; ++i) {
      var slot = [9, 4, 3, 10, 7, 5, 1, 11][i];
      var piece = e.edges[slot].piece;
      perm[i] = [-1, 6, -1, 2, 1, 5, -1, 4, -1, 0, 3, 7][piece];
      if (perm[i] < 0) {
        throw new Error('unexpected edge piece: ' + piece);
      }
    }
    return perms.encodeDestructablePerm(perm);
  }

  function encodeSSlicePerm(e) {
    var perm = [];
    for (var i = 0; i < 4; ++i) {
      var slot = [11, 10, 5, 4][i];
      var piece = e.edges[slot].piece;
      perm[i] = [-1, -1, -1, -1, 3, 2, -1, -1, -1, -1, 1, 0][piece];
      if (perm[i] < 0) {
        throw new Error('invalid piece in slice: ' + piece);
      }
    }
    return perms.encodeDestructablePerm(perm);
  }

  function encodeUDEdges(e) {
    var perm = [];
    for (var i = 0; i < 8; ++i) {
      var slot = [6, 5, 0, 4, 8, 11, 2, 10][i];
      var piece = e.edges[slot].piece;
      perm[i] = [2, -1, 6, -1, 3, 1, 0, -1, 4, -1, 7, 5][piece];
      if (perm[i] < 0) {
        throw new Error('unexpected edge piece: ' + piece);
      }
    }
    return perms.encodeDestructablePerm(perm);
  }

  function encodeXCornerPerm(c) {
    var perm = [];
    for (var i = 0; i < 8; ++i) {
      // xCornerIndices is declared in phase1_cube.js.
      var idx = xCornerIndices[i];
      perm[i] = [2, 0, 3, 1, 6, 4, 7, 5][c.corners[idx].piece];
    }
    return perms.encodeDestructablePerm(perm);
  }

  function encodeYCornerPerm(c) {
    var perm = [];
    for (var i = 0; i < 8; ++i) {
      perm[i] = c.corners[i].piece;
    }
    return perms.encodeDestructablePerm(perm);
  }

  function encodeZCornerPerm(c) {
    var perm = [];
    for (var i = 0; i < 8; ++i) {
      // zCornerIndices is declared in phase1_cube.js.
      var idx = zCornerIndices[i];
      perm[i] = [4, 5, 0, 1, 6, 7, 2, 3][c.corners[idx].piece];
    }
    return perms.encodeDestructablePerm(perm);
  }

  // p2MoveAxis returns the axis of a phase-2 move.
  function p2MoveAxis(m) {
    return [2, 2, 0, 0, 1, 1, 1, 1, 1, 1][m];
  }

  // p2MoveFace returns the face of a phase-2 move.
  function p2MoveFace(m) {
    return [3, 4, 5, 6, 1, 1, 1, 2, 2, 2][m];
  }

  // p2MoveInverse finds the inverse of a phase-2 move.
  function p2MoveInverse(m) {
    return [0, 1, 2, 3, 5, 4, 6, 8, 7, 9][m];
  }

  // p2MoveMove returns the Move for a phase-2 move.
  // Along the Y axis (axis 1), the phase-2 moves are F2 B2 R2 L2 U U' U2 D D' D2
  // in that order.
  function p2MoveMove(m, axis) {
    var num = [
      [14, 15, 12, 13, 5, 11, 17, 4, 10, 16],
  		[14, 15, 16, 17, 0, 6, 12, 1, 7, 13],
  		[13, 12, 16, 17, 2, 8, 14, 3, 9, 15]
    ][axis][m];
    return new Move(num);
  }

  exports.Phase2Coords = Phase2Coords;
  exports.Phase2Cube = Phase2Cube;
  exports.convertCubieToPhase2 = convertCubieToPhase2;
  exports.p2MoveFace = p2MoveFace;
  exports.p2MoveInverse = p2MoveInverse;
  exports.p2MoveMove = p2MoveMove;


  // A Solver keeps track of context for a depth-first search.
  function Solver(heuristic, moves, cb, deadline, depth) {
    this.heuristic = heuristic;
    this.moves = moves;
    this.cb = cb;
    this.deadline = deadline;
    this.depth = depth;

    // this.basis caches 18 Move objects to avoid allocation.
    this.basis = [];
    for (var i = 0; i < 18; ++i) {
      this.basis[i] = new Move(i);
    }

    // this.preAllocCubes caches a cube per level of depth in the search.
    this.preAllocCubes = [];
    for (var i = 0; i < depth; ++i) {
      this.preAllocCubes[i] = new Phase1Cube();
    }

    // this.solution is used to track the current solution; using this allows us
    // to avoid memory allocation in some browsers.
    this.solution = [];
    for (var i = 0; i < depth; ++i) {
      this.solution[i] = new Move(0);
    }
  }

  // deepen increases the depth of this solver by 1.
  Solver.prototype.deepen = function() {
    var i = this.depth;
    this.depth++;
    this.preAllocCubes[i] = new Phase1Cube();
    this.solution[i] = new Move(0);
  };

  // solve finds solutions for the cube.
  Solver.prototype.solve = function(cube) {
    return this._search(cube, 0, 0, -1);
  }

  Solver.prototype._expired = function() {
    return new Date().getTime() > this.deadline;
  };

  Solver.prototype._search = function(cube, depth, lastFace, lastAxis) {
    if (depth === this.depth) {
      if (cube.anySolved()) {
        if (this._expired()) {
          return false;
        }
        return this.cb(this.solution.slice(), cube.copy());
      }
      return true;
    } else if (this.heuristic.lowerBound(cube) > this.depth - depth) {
      return true;
    }

    var newCube = this.preAllocCubes[depth];

    // The last move should not be a double turn since that would preserve the
    // phase-1 state.
    var moveCount = (depth === this.depth - 1 ? 12 : 18);
    for (var i = 0; i < moveCount; ++i) {
      var face = (i % 6) + 1;
      var axis = (face - 1) >>> 1;
      if (face === lastFace) {
        continue;
      } else if (axis === lastAxis && face >= lastFace) {
        // Avoid redundancies like L R L' and enforce an ordering (e.g. there can
        // be a solution with L R, but not one with R L).
        continue;
      }

      // Get the cube which results from applying the given move.
      var move = this.basis[i];
      newCube.set(cube);
      newCube.move(move, this.moves);

      // Recurse one level deeper, setting the move in the solution buffer.
      this.solution[depth] = move;
      if (!this._search(newCube, depth+1, face, axis)) {
        return false;
      }

      // this._expired allocates memory and thus consumes time. Luckily, short
      // circuit evaluation makes this a three-liner.
      if (this._depth - depth >= 7 && this._expired()) {
        return false;
      }
    }

    return true;
  };

  // solvePhase1 uses iterative deepening to solve the cube.
  // The cb argument is a callback which receives two arguments, a solution and a
  // Phase1Cube, for each solution. If the callback returns true, the search will
  // continue. If it returns false, the search will stop.
  // The timeout argument represents the number of milliseconds after which the
  // solver should stop. This is 1000000 by default.
  function solvePhase1(cube, heuristic, moves, cb, timeout) {
    var deadline = new Date().getTime() + (timeout || 1000000);
    var depth = 0;
    var solver = new Solver(heuristic, moves, cb, deadline, 0);
    while (true) {
      if (!solver.solve(cube)) {
        return;
      }
      solver.deepen();
      ++depth;
    }
  }

  exports.solvePhase1 = solvePhase1;


  // PHASE1_CO_EO_DEPTH is the maximum depth which will be found in the COEO
  // pruning table. This is not as high as it could be; it is optimized to avoid
  // searching the entire space while still searching most of it.
  var PHASE1_CO_EO_DEPTH = 8;

  // PHASE1_EO_SLICE_DEPTH is the maximum depth which will be found in the EOSLICE
  // pruning table. See PHASE1_CO_EO_DEPTH for more.
  var PHASE1_EO_SLICE_DEPTH = 8;

  // Phase1Heuristic stores the data needed to effectively prune the search for a
  // solution for phase-1.
  function Phase1Heuristic(moves) {
    this.coEO = new CompactTable(PHASE1_CO_COUNT * PHASE1_EO_COUNT);
    this.eoSlice = new CompactTable(PHASE1_SLICE_COUNT * PHASE1_EO_COUNT);  
    this._computeCOEO(moves);
    this._computeEOSlice(moves);
  }

  // lowerBound returns the minimum number of moves needed to solve at least one
  // phase-1 axis.
  Phase1Heuristic.prototype.lowerBound = function(c) {
    var slice0 = this.eoSlice.get(c.xEO | (c.mSlice << 11));
    var slice1 = this.eoSlice.get(c.yEO | (c.eSlice << 11));
    var slice2 = this.eoSlice.get(c.zEO | (c.sSlice << 11));
    var eo0 = this.coEO.get(c.xEO | (c.xCO << 11));
    var eo1 = this.coEO.get(c.yEO | (c.yCO << 11));
    var eo2 = this.coEO.get(c.zEO | (c.zCO << 11));

    // Return the least of the three heuristic values.
    var a = Math.max(slice0, eo0);
    var b = Math.max(slice1, eo1);
    var c = Math.max(slice2, eo2);
    if (b < a) {
      return Math.min(b, c);
    } else {
      return Math.min(a, c);
    }

    // NOTE: using Math.min() with three arguments might slow down v8 since it
    // doesn't like polymorphic functions.
    // return Math.min(Math.max(slice0, eo0), Math.max(slice1, eo1),
    //   Math.max(slice2, eo2));
  };

  // _computeCOEO generates the CO+EO table.
  Phase1Heuristic.prototype._computeCOEO = function(moves) {
    // The number 549711 was found emperically and does not seem to belong in a
    // global constant because it is so specific to the implementation of
    // makePhase1EOHeuristic.
    makePhase1EOHeuristic(549711, PHASE1_SOLVED_CO, PHASE1_CO_EO_DEPTH,
      this.coEO, moves.eo, moves.co);
  };

  // _computeEOSlice generates the EOSlice table.
  Phase1Heuristic.prototype._computeEOSlice = function(moves) {
    // For info on the number 238263, see the comment in _computeCOEO.
    makePhase1EOHeuristic(238263, PHASE1_SOLVED_SLICE, PHASE1_EO_SLICE_DEPTH,
      this.eoSlice, moves.eo, moves.slice);
  };

  // makePhase1Heuristic generates a heuristic which is composed of edge
  // orientations combined with some other coordinate.
  function makePhase1EOHeuristic(queueCap, otherStart, maxDepth, table, eoMoves,
                                 otherMoves) {
    // Some info on bitfields might help you:
    // A hash is computed as: EO | (otherCoord << 11).
    // A search node is computed as: depth | (hash << 4).

    table.fillWith(maxDepth);
    table.set(otherStart << 11, 0);

    var queue = new NumberQueue(queueCap);
    queue.push(otherStart << 15);

    while (!queue.empty()) {
      var node = queue.shift();
      var depth = node & 0xf;
      var eo = (node >>> 4) & 0x7ff;
      var other = (node >>> 15);

      for (var move = 0; move < 18; ++move) {
        var newEO = eoMoves[eo*18 + move];
        var newOther = otherMoves[other*18 + move];
        var hash = (newOther << 11) | newEO;
        if (table.get(hash) === maxDepth) {
          table.set(hash, depth + 1);
          if (depth < maxDepth-2) {
            queue.push((depth + 1) | (hash << 4));
          }
        }
      }
    }
  }

  exports.Phase1Heuristic = Phase1Heuristic;


  // xCornerIndices are the indexes of the corners on the Y axis cube which
  // correspond to the corners on the X axis cube. An index in this array
  // corresponds to the physical slot in the X axis cube. A value in this array
  // corresponds to the physical slot in the Y axis cube.
  var xCornerIndices = [1, 3, 0, 2, 5, 7, 4, 6]

  // xEdgeIndices are the indexes of the edges on the Y axis cube which correspond
  // to edges on the X axis cube. An index in this array corresponds to the
  // physical slot in the X axis cube. A value in this array corresponds to the
  // physical slot in the Y axis cube.
  var xEdgeIndices = [3, 0, 1, 2, 10, 4, 9, 6, 7, 8, 11, 5]

  // xMoveTranslation maps moves from the Y axis phase-1 cube to moves on the X
  // axis cube. The mapping is: F->F, B->B, U->R, D->L, L->U, R->D.
  // For example, doing U on a Y-axis cube is like doing R on the X-axis version
  // of that cube.
  // This mapping is kind of like doing a "z" rotation before the move.
  var xMoveTranslation = [4, 5, 2, 3, 1, 0, 10, 11, 8, 9, 7, 6, 16, 17, 14, 15,
    13, 12];

  // zCornerIndices are like xCornerIndices but for the Z axis cube.
  var zCornerIndices = [2, 3, 6, 7, 0, 1, 4, 5]

  // zEdgeIndices are like xEdgeIndices but for the Z axis cube.
  var zEdgeIndices = [2, 11, 8, 10, 3, 1, 0, 5, 6, 4, 9, 7]

  // zMoveTranslation is like xMoveTranslation, but it's for doing an "x" rotation
  // before applying a move. The mapping is: R->R, L->L, F->U, B->D, U->B, D->F.
  var zMoveTranslation = [3, 2, 0, 1, 4, 5, 9, 8, 6, 7, 10, 11, 15, 14, 12, 13,
    16, 17];

  // These constants store the number of states for each coordinate.
  var PHASE1_CO_COUNT = 2187;
  var PHASE1_EO_COUNT = 2048;
  var PHASE1_SLICE_COUNT = 495;

  // These constants store the solved value for each coordinate.
  var PHASE1_SOLVED_CO = 1093;
  var PHASE1_SOLVED_EO = 0;
  var PHASE1_SOLVED_SLICE = 220;

  var PHASE1_MOVE_COUNT = 18;

  // A Phase1Cube is an efficient way to represent the parts of a cube which
  // matter for the first phase of Kociemba's algorithm.
  // This constructor takes an optional argument which should be a CubieCube if
  // it is supplied.
  function Phase1Cube(cc) {
    if ('undefined' !== typeof cc) {
      var xzCO = encodeXZCO(cc.corners);

      this.xCO = xzCO[0];
      this.yCO = encodeCO(cc.corners);
      this.zCO = xzCO[1];

      this.yEO = encodeYEO(cc.edges);
      this.zEO = encodeZEO(cc.edges);
      this.xEO = convertYEOToXEO(this.yEO)

      var msSlice = encodeMSSlice(cc.edges);
      this.mSlice = msSlice[0];
      this.eSlice = encodeESlice(cc.edges);
      this.sSlice = msSlice[1];
    } else {
      // These fields are intentionally ordered exactly the same as the fields are
      // when decoding a CubieCube. This makes the hidden class the same in some
      // JS engines.
      this.xCO = PHASE1_SOLVED_CO;
      this.yCO = PHASE1_SOLVED_CO;
      this.zCO = PHASE1_SOLVED_CO;
      this.yEO = PHASE1_SOLVED_EO;
      this.zEO = PHASE1_SOLVED_EO;
      this.xEO = PHASE1_SOLVED_EO;
      this.mSlice = PHASE1_SOLVED_SLICE;
      this.eSlice = PHASE1_SOLVED_SLICE;
      this.sSlice = PHASE1_SOLVED_SLICE;
    }
  }

  // anySolved returns true if the phase-1 state is solved along any axis.
  Phase1Cube.prototype.anySolved = function() {
    // I don't use the PHASE1_SOLVED_ globals because accessing global variables
    // is relatively inefficient and this is a hot function.
    if (this.xCO === 1093 && this.mSlice === 220 && this.yEO === 0) {
      return true;
    } else if (this.yCO === 1093 && this.eSlice === 220 && this.yEO === 0) {
      return true;
    } else if (this.zCO === 1093 && this.sSlice === 220 && this.zEO === 0) {
      return true;
    }
    return false;
  };

  // copy returns a copy of the Phase1Cube.
  Phase1Cube.prototype.copy = function() {
    var res = Object.create(Phase1Cube.prototype);

    res.xCO = this.xCO;
    res.yCO = this.yCO;
    res.zCO = this.zCO;
    res.xEO = this.xEO;
    res.yEO = this.yEO;
    res.zEO = this.zEO;
    res.mSlice = this.mSlice;
    res.eSlice = this.eSlice;
    res.sSlice = this.sSlice;

    return res;
  };

  // move applies a move to the Phase1Cube.
  Phase1Cube.prototype.move = function(move, table) {
    var m = move.number;

    // Apply the move to the y-axis cube.
    this.yCO = table.co[this.yCO*18 + m];
    this.yEO = table.eo[this.yEO*18 + m];
    this.eSlice = table.slice[this.eSlice*18 + m];

    // Apply the move to the z-axis cube.
    var zMove = zMoveTranslation[m];
    this.zCO = table.co[this.zCO*18 + zMove];
    this.zEO = table.eo[this.zEO*18 + zMove];
    this.sSlice = table.slice[this.sSlice*18 + zMove];

    // Apply the move to the x-axis cube.
    var xMove = xMoveTranslation[m];
    this.xCO = table.co[this.xCO*18 + xMove];
    this.xEO = table.eo[this.xEO*18 + xMove];
    this.mSlice = table.slice[this.mSlice*18 + xMove];
  };

  // set updates this object's fields to reflect a given Phase1Cube.
  Phase1Cube.prototype.set = function(obj) {
    this.xCO = obj.xCO;
    this.yCO = obj.yCO;
    this.zCO = obj.zCO;
    this.xEO = obj.xEO;
    this.yEO = obj.yEO;
    this.zEO = obj.zEO;
    this.mSlice = obj.mSlice;
    this.eSlice = obj.eSlice;
    this.sSlice = obj.sSlice;
  };

  // solved returns an array with three booleans, [x, y, z], which indicates
  // whether any axis is solved for phase-1.
  Phase1Cube.prototype.solved = function() {
    // I don't use the PHASE1_SOLVED_ globals because accessing global variables
    // is relatively inefficient and this is a hot function.

    var x = true;
    var y = true;
    var z = true;
    if (this.xCO !== 1093) {
      x = false;
    } else if (this.mSlice !== 220) {
      x = false;
    } else if (this.xEO !== 0) {
      x = false;
    }
    if (this.yCO !== 1093) {
      y = false;
    } else if (this.eSlice !== 220) {
      y = false;
    } else if (this.yEO !== 0) {
      y = false;
    }
    if (this.zCO !== 1093) {
      z = false;
    } else if (this.sSlice !== 220) {
      z = false;
    } else if (this.zEO !== 0) {
      z = false;
    }
    return [x, y, z];
  };

  // Phase1Moves is a table containing the necessary data to efficiently perform
  // moves on a Phase1Cube.
  // Note that only one move table is needed for all 3 axes (i.e. all three
  // phase-1 goals). Thus, the move tables apply directly to the Y-oriented
  // phase-1 goal. Moves much be translated for the X-oriented and Z-oriented
  // goals.
  function Phase1Moves() {
    this.slice = new Int16Array(PHASE1_SLICE_COUNT * PHASE1_MOVE_COUNT);
    this.eo = new Int16Array(PHASE1_EO_COUNT * PHASE1_MOVE_COUNT);
    this.co = new Int16Array(PHASE1_CO_COUNT * PHASE1_MOVE_COUNT);

    this._generateCO();
    this._generateEO();
    this._generateESlice();
  }

  Phase1Moves.prototype._generateCO = function() {
    for (var i = 0, len = this.co.length; i < len; ++i) {
      this.co[i] = -1;
    }

    for (var i = 0; i < PHASE1_CO_COUNT; ++i) {
      var corners = decodeCO(i);
      for (var move = 0; move < PHASE1_MOVE_COUNT; ++move) {
        if (this.co[i*PHASE1_MOVE_COUNT + move] >= 0) {
          continue;
        }

        // Set the end state in the table.
        var aCase = corners.copy();
        aCase.move(new Move(move));
        var endState = encodeCO(aCase);
        this.co[i*PHASE1_MOVE_COUNT + move] = endState;

        // Set the inverse in the table.
        this.co[endState*PHASE1_MOVE_COUNT + new Move(move).inverse().number] = i;
      }
    }
  };

  Phase1Moves.prototype._generateEO = function() {
    for (var i = 0, len = this.eo.length; i < len; ++i) {
      this.eo[i] = -1;
    }

    for (var i = 0; i < PHASE1_EO_COUNT; ++i) {
      var edges = decodeEO(i);
      for (var move = 0; move < PHASE1_MOVE_COUNT; ++move) {
        if (this.eo[i*PHASE1_MOVE_COUNT + move] >= 0) {
          continue;
        }

        // Set the end state in the table.
        var aCase = edges.copy();
        aCase.move(new Move(move));
        var endState = encodeYEO(aCase);
        this.eo[i*PHASE1_MOVE_COUNT + move] = endState;

        // Set the inverse in the table.
        this.eo[endState*PHASE1_MOVE_COUNT + new Move(move).inverse().number] = i;
      }
    }
  };

  Phase1Moves.prototype._generateESlice = function() {
    for (var i = 0, len = this.slice.length; i < len; ++i) {
      this.slice[i] = -1;
    }

    // Generate the E slice cases by looping through all the possible ways to
    // choose 4 elements from a set of 12.
    var sliceCase = 0;
    for (var w = 0; w < 12; ++w) {
      for (var x = w + 1; x < 12; ++x) {
        for (var y = x + 1; y < 12; ++y) {
          for (var z = y + 1; z < 12; ++z) {
            // Create a state which has bogus edges at the slice indices.
            var state = new Edges();
            state.edges[w].piece = -1;
            state.edges[x].piece = -1;
            state.edges[y].piece = -1;
            state.edges[z].piece = -1;
            for (var move = 0; move < PHASE1_MOVE_COUNT; ++move) {
              if (this.slice[sliceCase*PHASE1_MOVE_COUNT + move] >= 0) {
                continue;
              }

              // Set the end state in the table.
              var aCase = state.copy();
              aCase.move(new Move(move));
              var encoded = encodeBogusSlice(aCase);
              this.slice[sliceCase*PHASE1_MOVE_COUNT + move] = encoded;

              // Set the inverse in the table.
              var invMove = new Move(move).inverse().number;
              this.slice[encoded*PHASE1_MOVE_COUNT + invMove] =
                sliceCase;
            }
            ++sliceCase;
          }
        }
      }
    }
  };

  // convertYEOToXEO converts a y-axis EO case to the x axis.
  function convertYEOToXEO(yEO) {
    var res = 0;

    // Translate the EO bitmap, noting that xEdgeIndices[10] is 11 and is thus
    // never set in the FB bitmap.
    var parity = 0;
    for (var i = 0; i < 10; ++i) {
      var idx = xEdgeIndices[i];
      if ((yEO & (1 << idx)) !== 0) {
        res |= 1 << i;
        parity ^= 1;
      }
    }

    // If the last thing in the translated bitmap would be a 1, flip the parity.
    if ((yEO & (1 << xEdgeIndices[11])) !== 0) {
      parity ^= 1;
    }

    // If there is parity, then the missing element (i.e. #10) is 1.
    res |= parity << 10;

    return res;
  }

  // decodeCO generates Corners which represent a given CO case.
  function decodeCO(co) {
    var c = new Corners();

    // Compute the orientations of the first 7 corners.
    var scaler = 1;
    for (var x = 0; x < 7; ++x) {
      c.corners[x].orientation = Math.floor(co / scaler) % 3;
      scaler *= 3;
    }

    // Compute the last corner's orientation.
    // The way this works is based on the fact that a sune combo which twists two
    // adjacent corners is all that is necessary to generate any corner
    // orientation case.
    var ordering = [0, 1, 5, 4, 6, 2, 3, 7];
    var orientations = [];
    for (var i = 0; i < 8; ++i) {
      orientations[i] = c.corners[ordering[i]].orientation;
    }
    for (var i = 0; i < 7; ++i) {
      var thisOrientation = orientations[i];
      var nextOrientation = orientations[i+1];
      // Twist thisOrientation to be solved, affecting the next corner in the
      // sequence.
      if (thisOrientation === 2) {
        // y -> x, x -> z, z -> y
        orientations[i+1] = (nextOrientation + 2) % 3;
      } else if (thisOrientation === 0) {
        // z -> x, x -> y, y -> z
        orientations[i+1] = (nextOrientation + 1) % 3;
      }
    }
    // The twist of the last corner is the inverse of what it should be in the
    // scramble.
    if (orientations[7] === 0) {
      c.corners[7].orientation = 2;
    } else if (orientations[7] === 2) {
      c.corners[7].orientation = 0;
    }

    return c;
  }

  // decodeEO generates Edges which represent a given EO case.
  function decodeEO(eo) {
    var edges = new Edges();
    var parity = false;
    for (var x = 0; x < 11; ++x) {
      if ((eo & (1 << x)) !== 0) {
        parity = !parity;
        edges.edges[x].flip = true;
      }
    }
    edges.edges[11].flip = parity;
    return edges;
  }

  // encodeBogusSlice encodes a slice permutation case, treating pieces with
  // values of "-1" as E slice edges.
  function encodeBogusSlice(edges) {
    var list = [];
    for (var i = 0; i < 12; ++i) {
      list[i] = (edges.edges[i].piece === -1);
    }
    return perms.encodeChoose(list);
  }

  // encodeCO encodes the CO case of a given set of Corners.
  function encodeCO(c) {
    var res = 0;
    var scaler = 1;
    for (var i = 0; i < 7; ++i) {
      res += scaler * c.corners[i].orientation;
      scaler *= 3;
    }
    return res;
  }

  // encodeESlice encodes the E slice of a given set of Edges.
  function encodeESlice(edges) {
    var list = [];
    for (var i = 0; i < 12; ++i) {
      var piece = edges.edges[i].piece;
      if (piece === 1 || piece === 3 || piece === 7 || piece === 9) {
        list[i] = true;
      } else {
        list[i] = false;
      }
    }
    return perms.encodeChoose(list);
  }

  // encodeMSSlice encodes the M and S slices of Edges.
  function encodeMSSlice(edges) {
    var mChoice = [];
    var sChoice = [];
    for (var i = 0; i < 12; ++i) {
      var idx = xEdgeIndices[i];
      var p = edges.edges[idx].piece;
      if (p === 0 || p === 2 || p === 6 || p === 8) {
        mChoice[i] = true;
      } else {
        mChoice[i] = false;
      }
    }
    for (var i = 0; i < 12; ++i) {
      var idx = zEdgeIndices[i];
      var p = edges.edges[idx].piece;
      if (p === 4 || p === 5 || p === 10 || p === 11) {
        sChoice[i] = true;
      } else {
        sChoice[i] = false;
      }
    }
    return [perms.encodeChoose(mChoice), perms.encodeChoose(sChoice)];
  }

  // encodeXZCO encodes the CO of Corners on the X and Z axes.
  function encodeXZCO(corners) {
    var x = [];
    var z = [];
    var xVal = 0;
    var zVal = 0;

    // For each corner, find the direction of the x and z stickers.
    for (var i = 0; i < 8; ++i) {
      var corner = corners.corners[i];

      // If the corner was in its original slot, here's what the directions
      // would be.
      var o = corner.orientation;
      if (o === 0) {
        x[i] = 2;
        z[i] = 1;
      } else if (o === 1) {
        x[i] = 0;
        z[i] = 2;
      } else {
        x[i] = 1;
        z[i] = 0;
      }

      // If it takes an odd number of quarter turns to move the corner back to
      // its original slot, swap x and z.
      var d = (corner.piece ^ i) & 7;
      if (d === 1 || d === 2 || d === 4 || d === 7) {
        var oldX = x[i];
        x[i] = z[i];
        z[i] = oldX;
      }
    }

    // Add the information together to generate the final values.
    var scaler = 1;
    for (var i = 0; i < 7; ++i) {
      var xDirection = x[xCornerIndices[i]];
      if (xDirection === 1) {
        xDirection = 0;
      } else if (xDirection === 0) {
        xDirection = 1;
      }
      xVal += scaler * xDirection;

      var zDirection = z[zCornerIndices[i]];
      if (zDirection === 1) {
        zDirection = 2;
      } else if (zDirection === 2) {
        zDirection = 1;
      }
      zVal += scaler * zDirection;

      scaler *= 3;
    }

    return [xVal, zVal];
  }

  // encodeYEO encodes the EO case of a given set of Edges.
  function encodeYEO(e) {
    var res = 0;
    for (var i = 0; i < 11; ++i) {
      if (e.edges[i].flip) {
        res |= (1 << i);
      }
    }
    return res;
  }

  // encodeZEO encodes the EO cases for the z-axis cube.
  function encodeZEO(edges) {
    var res = 0;
    for (var i = 0; i < 11; ++i) {
      var idx = zEdgeIndices[i];
      var edge = edges.edges[idx];
      var flip = edge.flip;
      var p = edge.piece
      if (p === 0 || p === 2 || p === 6 || p === 8) {
        // This is an M slice edge piece, so it changes orientation if it
        // was on the S slice or the E slice.
        if (idx !== 0 && idx !== 2 && idx !== 6 && idx !== 8) {
          flip = !flip;
        }
      } else {
        // This is an E or S slice edge, so it changes orientation if it
        // was on the M slice.
        if (idx === 0 || idx === 2 || idx === 6 || idx === 8) {
          flip = !flip
        }
      }
      if (flip) {
        res |= 1 << i;
      }
    }
    return res;
  }

  exports.Phase1Cube = Phase1Cube;
  exports.Phase1Moves = Phase1Moves;


  // NumberQueue acts as an allocation-free queue for storing numbers.
  function NumberQueue(capacity) {
    this._buffer = new Uint32Array(capacity);
    this._capacity = capacity;
    this._start = 0;
    this._end = 0;
    this._count = 0;
  }

  // empty returns true if and only if the queue contains no numbers.
  NumberQueue.prototype.empty = function() {
    return this._count === 0;
  };

  // push adds a 32-bit number to the queue.
  NumberQueue.prototype.push = function(p) {
    if (this._count === this._capacity) {
      throw new Error('NumberQueue overflow');
    }
    ++this._count;
    this._buffer[this._end] = p;
    ++this._end;
    if (this._end === this._capacity) {
      this._end = 0;
    }
  }

  // shift removes a 32-bit number from the queue and returns it.
  NumberQueue.prototype.shift = function() {
    if (this._count === 0) {
      throw new Error('NumberQueue underflow');
    }
    --this._count;
    var res = this._buffer[this._start];
    ++this._start;
    if (this._start === this._capacity) {
      this._start = 0;
    }
    return res;
  };


  // cancelMoves performs move cancellation on a sequence of moves. The result is
  // returned and the original array is not modified.
  function cancelMoves(moves) {
    var res = moves.slice();

    // TODO: remove redundancy like L R L'.

    // Loop through each move and make sure it has a different face than the move
    // before it.
    var lastFace = 0;
    for (var i = 0; i < res.length; ++i) {
      var face = res[i].face();
      if (face === lastFace) {
        // Figure out the new move (or delete the move altogether).
        var turns = res[i-1].turns() + res[i].turns();
        res.splice(i, 1);
        --i;
        if (turns === 1) {
          res[i] = new Move(face - 1);
        } else if (turns === 2 || turns === -2) {
          res[i] = new Move(face + 11);
        } else if (turns === -1 || turns === 3) {
          res[i] = new Move(face + 5);
        } else {
          // The moves directly cancelled each other out.
          res.splice(i, 1);
          --i;
          lastFace = (i === -1 ? 0 : res[i].face());
          continue;
        }
      }
      lastFace = face;
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

      // Remove all moves which affect this face to prevent redundant moves.
      for (var j = 0; j < moves.length; ++j) {
        if (moves[j].face() === move.face()) {
          moves.splice(j, 1);
          --j;
        }
      }

      result[i] = move;
    }

    return result;
  }

  exports.cancelMoves = cancelMoves;
  exports.scrambleMoves = scrambleMoves;


  // Import the pocketcube's move API.
  var pocketcube = includeAPI('pocketcube');
  var Corner = pocketcube.Corner;
  var Corners = pocketcube.Cube;
  var Move = pocketcube.Move;
  var allMoves = pocketcube.allMoves;
  var movesToString = pocketcube.movesToString;
  var parseMove = pocketcube.parseMove;
  var parseMoves = pocketcube.parseMoves;
  exports.Move = Move;
  exports.allMoves = allMoves;
  exports.movesToString = movesToString;
  exports.parseMove = parseMove;
  exports.parseMoves = parseMoves;

  // Import the permutation API.
  var perms = includeAPI('perms');

  // Import the symmetry API.
  var symmetry = includeAPI('symmetry');


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
    if (m.turns() === 2) {
      this.halfTurn(m.face());
    } else {
      this.quarterTurn(m.face(), m.turns());
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


  // A CompactTable represents an array of 4 bit numbers.
  function CompactTable(count) {
    this._data = new Uint8Array(count >>> 1);
  }

  // fillWith sets every cell in the table to a given 4-bit number.
  CompactTable.prototype.fillWith = function(number) {
    var cell = number | (number << 4);
    for (var i = 0, len = this._data.length; i < len; ++i) {
      this._data[i] = cell;
    }
  };

  // get returns the 4-bit number at a given cell index.
  CompactTable.prototype.get = function(idx) {
    // If idx is even, get the lower 4 bits at idx/2, otherwise get the higher 4
    // bits at idx/2.
    return (this._data[idx >>> 1] >>> ((idx & 1) << 2)) & 0xf;
  };

  // set sets the 4-bit number at a given cell index.
  CompactTable.prototype.set = function(idx, value) {
    var rawIdx = idx >>> 1;
    var shift = (idx & 1) << 2;

    // Zero out the 4-bit field.
    this._data[rawIdx] &= 0xff ^ (0xf << shift);

    // Set the 4-bit field.
    this._data[rawIdx] |= (value << shift);
  };



})();
// puzzlejs.skewb version 0.16.1
//
// Copyright (c) 2015, Alex Nichol.
// All rights reserved.
// 
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
// 
// 1. Redistributions of source code must retain the above copyright notice, this
//    list of conditions and the following disclaimer. 
// 2. Redistributions in binary form must reproduce the above copyright notice,
//    this list of conditions and the following disclaimer in the documentation
//    and/or other materials provided with the distribution.
// 
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
// ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
// WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
// ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
// (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
// LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
// ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
// SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
(function() {

  var exports;
  if ('undefined' !== typeof self) {
    if (!self.puzzlejs) {
      self.puzzlejs = {};
    }
    if (!self.puzzlejs.skewb) {
      self.puzzlejs.skewb = {};
    }
    exports = self.puzzlejs.skewb;
  } else if ('undefined' !== typeof window) {
    if (!window.puzzlejs) {
      window.puzzlejs = {};
    }
    if (!window.puzzlejs.skewb) {
      window.puzzlejs.skewb = {};
    }
    exports = window.puzzlejs.skewb;
  } else if ('undefined' !== typeof module) {
    exports = module.exports;
  }

  function includeAPI(name) {
    if ('undefined' !== typeof self) {
      return self.puzzlejs[name];
    } else if ('undefined' !== typeof window) {
      return window.puzzlejs[name];
    } else if ('function' === typeof require) {
      return require('./' + name + '.js');
    }
    throw new Error('cannot include packages');
  }

  function depthFirst(start, remaining, heuristic, lastFace) {
    if (remaining === 0) {
      if (!start.solved()) {
        return null;
      } else {
        return [];
      }
    } else if (heuristic.lookup(start) > remaining) {
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
        var solution = depthFirst(state, remaining-1, heuristic, i);
        if (solution !== null) {
          return [move].concat(solution);
        }
      }
    }
    return null;
  }

  function solve(state, heuristic) {
    for (var i = 0; i < 11; ++i) {
      var solution = depthFirst(state, i, heuristic, -1);
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


  var randomPermParity = includeAPI('perms').randomPermParity;

  // Generate this using encodeCornerCases(findCornerCases()).
  var allCornerCases = null;

  function SkewbQueue() {
    this._first = null;
    this._last = null;
  }

  SkewbQueue.prototype.empty = function() {
    return this._first === null;
  };

  SkewbQueue.prototype.push = function(s) {
    if (this._first === null) {
      var node = {skewb: s, next: null};
      this._first = node;
      this._last = node;
    } else {
      var node = {skewb: s, next: this._first};
      this._first = node;
    }
  };

  SkewbQueue.prototype.shift = function() {
    var res = this._first.skewb;
    this._first = this._first.next;
    if (this._first === null) {
      this._last = null;
    }
    return res;
  };

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
    var moves = allMoves();
    var nodes = new SkewbQueue();
    nodes.push(new Skewb());
    while (!nodes.empty()) {
      var node = nodes.shift();

      // Mark it as visited or continue if it was already visited.
      var enc = encodeCorners(node.corners);
      if (found.hasOwnProperty(enc)) {
        continue;
      }
      found[enc] = 1;

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

  function scrambleMoves(len) {
    var moves = [];
    var lastAxis = -1;
    for (var i = 0; i < len; ++i) {
      var faces = [0, 1, 2, 3];
      if (i !== 0) {
        faces.splice(lastAxis, 1);
      }
      var idx = Math.floor(Math.random() * faces.length);
      lastAxis = faces[idx];
      moves.push(new Move(lastAxis, Math.random() < 0.5));
    }
    return moves;
  }

  exports.Move = Move;
  exports.allMoves = allMoves;
  exports.movesToString = movesToString;
  exports.parseMove = parseMove;
  exports.parseMoves = parseMoves;
  exports.scrambleMoves = scrambleMoves;


  function Heuristic() {
    this.centerHeuristicData = makeCenterHeuristic();
    this.coHeuristicData = makeCOHeuristic();
  }

  Heuristic.prototype.lookup = function(state) {
    return Math.max(this.coHeuristicData[encodeCO(state.corners)],
      this.centerHeuristicData[encodeCenters(state.centers)]);
  };

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
    var nodes = [{state: new Skewb(), hash: encodeCO(new Skewb().corners),
      depth: 0}];
    var moves = allMoves();
    var visited = {};
    while (nodes.length > 0) {
      var node = nodes[0];
      nodes.splice(0, 1);

      // Check if the state has been visited before.
      if (res.hasOwnProperty(node.hash)) {
        continue;
      }
      res[node.hash] = node.depth;

      // Branch out.
      for (var i = 0, len = moves.length; i < len; ++i) {
        var newNode = node.state.copy();
        newNode.move(moves[i]);

        var hash = encodeCO(newNode.corners);
        if (!visited[hash]) {
          nodes.push({state: newNode, depth: node.depth+1, hash: hash});
          visited[hash] = true;
        }
      }
    }
    return res;
  }

  function makeCenterHeuristic() {
    var res = {};
    var nodes = [{state: new Skewb(), hash: encodeCenters(new Skewb().centers),
      depth: 0}];
    var moves = allMoves();
    var visited = {};
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

        var hash = encodeCenters(newNode.centers);
        if (!visited[hash]) {
          nodes.push({state: newNode, depth: node.depth+1, hash: hash});
          visited[hash] = true;
        }
      }
    }
    return res;
  }

  exports.Heuristic = Heuristic;



})();
// puzzlejs.bigcube version 0.16.1
//
// Copyright (c) 2015, Alex Nichol.
// All rights reserved.
// 
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
// 
// 1. Redistributions of source code must retain the above copyright notice, this
//    list of conditions and the following disclaimer. 
// 2. Redistributions in binary form must reproduce the above copyright notice,
//    this list of conditions and the following disclaimer in the documentation
//    and/or other materials provided with the distribution.
// 
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
// ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
// WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
// ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
// (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
// LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
// ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
// SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
(function() {

  var exports;
  if ('undefined' !== typeof self) {
    if (!self.puzzlejs) {
      self.puzzlejs = {};
    }
    if (!self.puzzlejs.bigcube) {
      self.puzzlejs.bigcube = {};
    }
    exports = self.puzzlejs.bigcube;
  } else if ('undefined' !== typeof window) {
    if (!window.puzzlejs) {
      window.puzzlejs = {};
    }
    if (!window.puzzlejs.bigcube) {
      window.puzzlejs.bigcube = {};
    }
    exports = window.puzzlejs.bigcube;
  } else if ('undefined' !== typeof module) {
    exports = module.exports;
  }

  function includeAPI(name) {
    if ('undefined' !== typeof self) {
      return self.puzzlejs[name];
    } else if ('undefined' !== typeof window) {
      return window.puzzlejs[name];
    } else if ('function' === typeof require) {
      return require('./' + name + '.js');
    }
    throw new Error('cannot include packages');
  }

  // wcaMoveScramble generates a move scramble for a big cube.
  function wcaMoveScramble(cubeSize, moveCount) {
    var basis = wcaMoveBasis(cubeSize);
    var currentBasis = basis.slice();
    var scramble = [];
    var lastAxis = -1;
    for (var i = 0; i < moveCount; ++i) {
      var move = currentBasis[Math.floor(Math.random() * currentBasis.length)];
      scramble.push(move);

      if (move.axis() !== lastAxis) {
        currentBasis = basis.slice();
        lastAxis = move.axis();
      }

      for (var j = 0; j < currentBasis.length; ++j) {
        var aMove = currentBasis[j];
        if (aMove.face === move.face && aMove.width === move.width) {
          currentBasis.splice(j, 1);
          --j;
        }
      }
    }
    return scramble;
  }

  exports.wcaMoveScramble = wcaMoveScramble;


  // A WCAMove represents a wide turn on an NxNxN cube.
  function WCAMove(face, width, turns) {
    this.face = face;
    this.width = width;
    this.turns = turns;
  }

  // axis returns 0 for R and L, 1 for U and D, and 2 for F and B.
  WCAMove.prototype.axis = function() {
    return {
      'R': 0,
      'L': 0,
      'U': 1,
      'D': 1,
      'F': 2,
      'B': 2
    }[this.face];
  };

  // toString converts this move to a WCA move string.
  WCAMove.prototype.toString = function() {
    var turnsStr = ['', '2', "'"][this.turns - 1];
    if (this.width === 1) {
      return this.face + turnsStr;
    }
    return this.width + this.face + 'w' + turnsStr;
  };

  function parseWCAMove(str) {
    var match = /([0-9]*)(U|D|F|B|R|L)w?(2|')?/.exec(str);
    if (match === null) {
      throw new Error('invalid move: ' + str);
    }
    var width = parseInt(match[1] || 1);
    var face = match[2];
    var countStr = (match[3] || '');
    var turns = 1;
    if (countStr === '2') {
      turns = 2;
    } else if (countStr === "'") {
      turns = 3;
    }
    return new WCAMove(face, width, turns);
  }

  function parseWCAMoves(str) {
    var moveStrings = str.split(' ');
    var result = [];
    for (var i = 0, len = moveStrings.length; i < len; ++i) {
      result[i] = parseWCAMove(moveStrings[i]);
    }
    return result;
  }

  function wcaMoveBasis(size) {
    if (size < 2) {
      throw new Error('cube is too small');
    }

    var maxWidth = (size >>> 1);
    var threeGen = ((size & 1) === 0);
    var primaryFacesForAxes = ['R', 'U', 'F'];
    var secondaryFacesForAxes = ['L', 'D', 'B'];

    var basis = [];
    for (var width = 1; width <= maxWidth; ++width) {
      for (var turns = 1; turns <= 3; ++turns) {
        for (var axis = 0; axis < 3; ++axis) {
          basis.push(new WCAMove(primaryFacesForAxes[axis], width, turns));
          if (!threeGen) {
            basis.push(new WCAMove(secondaryFacesForAxes[axis], width, turns));
          }
        }
      }
    }
    return basis;
  }

  function wcaMovesToString(moves) {
    return moves.join(' ');
  }

  exports.WCAMove = WCAMove;
  exports.parseWCAMove = parseWCAMove;
  exports.parseWCAMoves = parseWCAMoves;
  exports.wcaMoveBasis = wcaMoveBasis;
  exports.wcaMovesToString = wcaMovesToString;


  // A StickerCube represents any sized cube in terms of its stickers.
  function StickerCube(size) {
    var sideCount = size * size;
    this.size = size;
    this.stickers = new Uint8Array(sideCount * 6);
    for (var i = 0; i < sideCount*6; ++i) {
      var sticker = Math.floor(i / sideCount);
      this.stickers[i] = sticker;
    }
  }

  StickerCube.prototype.copy = function() {
    var res = new StickerCube(this.size);
    for (var i = 0; i < this.stickers.length; ++i){
      res.stickers[i] = this.stickers[i];
    }
    return res;
  };

  StickerCube.prototype.move = function(move) {
    var res = this;
    for (var i = 0; i < move.turns; ++i) {
      for (var layer = 0; layer < move.width; ++layer) {
        res = res._turnSliceStickersClockwise(move.face, layer);
      }
      res = res._turnOuterStickersClockwise(move.face);
    }
    return res;
  };

  StickerCube.prototype._indicesForBFLayer = function(layer) {
    var indices = [];
    var faceCount = this.size * this.size;

    // Top face.
    for (var i = 0; i < this.size; ++i) {
      indices.push(this.size*layer + i);
    }

    var rightFaceStart = faceCount * 4;
    for (var i = 0; i < this.size; ++i) {
      indices.push(rightFaceStart + this.size*i + (this.size-layer-1));
    }

    var bottomOffset = this.size * (this.size-layer-1);
    var bottomFaceStart = faceCount;
    for (var i = 0; i < this.size; ++i) {
      indices.push(bottomFaceStart + bottomOffset + (this.size-i-1));
    }

    var leftFaceStart = faceCount * 5;
    for (var i = 0; i < this.size; ++i) {
      indices.push(leftFaceStart + this.size*(this.size-i-1) + layer);
    }

    return indices;
  };

  StickerCube.prototype._indicesForLRLayer = function(layer) {
    var indices = [];
    var faceCount = this.size * this.size;

    // Top face.
    for (var i = 0; i < this.size; ++i) {
      indices.push(i*this.size + layer);
    }

    var frontFaceStart = faceCount * 2;
    for (var i = 0; i < this.size; ++i) {
      indices.push(frontFaceStart + i*this.size + layer);
    }

    var bottomFaceStart = faceCount;
    for (var i = 0; i < this.size; ++i) {
      indices.push(bottomFaceStart + i*this.size + layer);
    }

    var backFaceStart = faceCount * 3;
    for (var i = 0; i < this.size; ++i) {
      var backIndex = this.size - (layer + 1);
      indices.push(backFaceStart + (this.size-i-1)*this.size + backIndex);
    }

    return indices;
  };

  StickerCube.prototype._indicesForUDLayer = function(layer) {
    var indices = [];
    var faceCount = this.size * this.size;

    var frontFaceStart = faceCount * 2;
    for (var i = 0; i < this.size; ++i) {
      indices.push(frontFaceStart + this.size*layer + i);
    }

    var rightFaceStart = faceCount * 4;
    for (var i = 0; i < this.size; ++i) {
      indices.push(rightFaceStart + this.size*layer + i);
    }

    var backFaceStart = faceCount * 3;
    for (var i = 0; i < this.size; ++i) {
      indices.push(backFaceStart + this.size*layer + i);
    }

    var leftFaceStart = faceCount * 5;
    for (var i = 0; i < this.size; ++i) {
      indices.push(leftFaceStart + this.size*layer + i);
    }

    return indices;
  };

  StickerCube.prototype._permuteLayerBackwards = function(indices) {
    var res = this.copy();
    for (var i = 0, len = indices.length; i < len; ++i) {
      var sourceIndex = indices[(i + this.size) % len];
      var destIndex = indices[i];
      res.stickers[destIndex] = this.stickers[sourceIndex];
    }
    return res;
  };

  StickerCube.prototype._permuteLayerForwards = function(indices) {
    var res = this.copy();
    for (var i = 0, len = indices.length; i < len; ++i) {
      var sourceIndex = indices[i];
      var destIndex = indices[(i + this.size) % len];
      res.stickers[destIndex] = this.stickers[sourceIndex];
    }
    return res;
  };

  StickerCube.prototype._turnOuterStickersClockwise = function(face) {
    var faceIndex = ['U', 'D', 'F', 'B', 'R', 'L'].indexOf(face);
    if (faceIndex < 0) {
      throw new Error('unknown face: ' + face);
    }
    var faceCount = this.size * this.size;
    var stickerStartIndex = faceCount * faceIndex;
    var res = this.copy();
    for (var x = 0; x < this.size; ++x) {
      for (var y = 0; y < this.size; ++y) {
        var destY = x;
        var destX = (this.size - y - 1);
        res.stickers[stickerStartIndex + destX + destY*this.size] =
          this.stickers[stickerStartIndex + x + y*this.size];
      }
    }
    return res;
  };

  StickerCube.prototype._turnSliceStickersClockwise = function(face, layer) {
    var indices = null;
    var forwards = false;
    if (face === 'R' || face === 'L') {
      var layerLR = layer;
      if (face === 'R') {
        layerLR = this.size - (layer + 1);
      }
      indices = this._indicesForLRLayer(layerLR);
      forwards = (face === 'L');
    } else if (face === 'U' || face === 'D') {
      var layerUD = layer;
      if (face === 'D') {
        layerUD = this.size - (layer + 1);
      }
      indices = this._indicesForUDLayer(layerUD);
      forwards = (face === 'D');
    } else if (face === 'F' || face === 'B') {
      var layerBF = layer;
      if (face === 'F') {
        layerBF = this.size - (layer + 1);
      }
      indices = this._indicesForBFLayer(layerBF);
      forwards = (face === 'F');
    } else {
      throw new Error('unknown face: ' + face);
    }
    if (forwards) {
      return this._permuteLayerForwards(indices);
    } else {
      return this._permuteLayerBackwards(indices);
    }
  };

  exports.StickerCube = StickerCube;



})();
// puzzlejs.pyraminx version 0.16.1
//
// Copyright (c) 2015, Alex Nichol.
// All rights reserved.
// 
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
// 
// 1. Redistributions of source code must retain the above copyright notice, this
//    list of conditions and the following disclaimer. 
// 2. Redistributions in binary form must reproduce the above copyright notice,
//    this list of conditions and the following disclaimer in the documentation
//    and/or other materials provided with the distribution.
// 
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
// ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
// WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
// ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
// (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
// LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
// ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
// SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
(function() {

  var exports;
  if ('undefined' !== typeof self) {
    if (!self.puzzlejs) {
      self.puzzlejs = {};
    }
    if (!self.puzzlejs.pyraminx) {
      self.puzzlejs.pyraminx = {};
    }
    exports = self.puzzlejs.pyraminx;
  } else if ('undefined' !== typeof window) {
    if (!window.puzzlejs) {
      window.puzzlejs = {};
    }
    if (!window.puzzlejs.pyraminx) {
      window.puzzlejs.pyraminx = {};
    }
    exports = window.puzzlejs.pyraminx;
  } else if ('undefined' !== typeof module) {
    exports = module.exports;
  }

  function includeAPI(name) {
    if ('undefined' !== typeof self) {
      return self.puzzlejs[name];
    } else if ('undefined' !== typeof window) {
      return window.puzzlejs[name];
    } else if ('function' === typeof require) {
      return require('./' + name + '.js');
    }
    throw new Error('cannot include packages');
  }

  var MAX_MOVE_COUNT = 11;

  function depthFirst(state, heuristic, lastMove, moves, depth) {
    if (depth === 0) {
      if (state.solved()) {
        return [];
      } else {
        return null;
      }
    } else if (heuristic.lowerBound(state.edges) > depth) {
      return null;
    }

    for (var i = 0; i < 8; ++i) {
      var move = moves[i];
      if (lastMove !== null && move.corner === lastMove.corner) {
        continue;
      }
      var newState = state.copy();
      newState.move(move);
      var solution = depthFirst(newState, heuristic, move, moves, depth-1);
      if (solution !== null) {
        solution.unshift(move);
        return solution;
      }
    }

    return null;
  }

  function solve(state, heuristic, minDepth) {
    for (var depth = minDepth || 0; depth <= MAX_MOVE_COUNT; ++depth) {
      var solution = depthFirst(state, heuristic, null, allMoves(), depth);
      if (solution !== null) {
        return solution;
      }
    }
    return null;
  }

  exports.solve = solve;


  // randomState generates a random Pyraminx.
  function randomState() {
    var res = new Pyraminx();

    for (var i = 0; i < 4; ++i) {
      res.axialTwists[i] = Math.floor(Math.random() * 3);
    }

    var perm = PermsAPI.randomPermParity(6, true);
    for (var i = 0; i < 6; ++i) {
      res.edges.edges[i].piece = perm[i];
    }

    var lastOrientation = true;
    for (var i = 0; i < 5; ++i) {
      if (Math.random() >= 0.5) {
        res.edges.edges[i].orientation = false;
        lastOrientation = !lastOrientation;
      }
    }
    res.edges.edges[5].orientation = lastOrientation;

    return res;
  }

  exports.randomState = randomState;


  // A Pyraminx represents both the edges and the axial pieces (not including the tips) of the
  // pyraminx.
  //
  // The axialTwists is an array of four numbers. Each number ranges between 0 and 2 (inclusive). A
  // value of 0 means the corner is untwisted. 1 means that the corner is twisted clockwise. 2 means
  // counter-clockwise.
  function Pyraminx() {
    this.axialTwists = [0, 0, 0, 0];
    this.edges = new Edges();
  }

  // copy returns a deep copy of the Pyraminx.
  Pyraminx.prototype.copy = function() {
    var res = new Pyraminx();
    for (var i = 0; i < 4; ++i) {
      res.axialTwists[i] = this.axialTwists[i];
    }
    res.edges = this.edges.copy();
    return res;
  };

  // move applies a move to the pyraminx.
  Pyraminx.prototype.move = function(m) {
    this.edges.move(m);
    this.axialTwists[m.corner] += m.clockwise ? 1 : 2;
    if (this.axialTwists[m.corner] >= 3) {
      this.axialTwists[m.corner] -= 3;
    }
  };

  // solved returns true if the Pyraminx is solved.
  Pyraminx.prototype.solved = function() {
    for (var i = 0; i < 4; ++i) {
      if (this.axialTwists[i] !== 0) {
        return false;
      }
    }
    return this.edges.solved();
  };

  exports.Pyraminx = Pyraminx;


  // A Move represents a face turn on the Pyraminx.
  //
  // The corner of a move is a number between 0 and 3 (inclusive), corresponding to the R, L, U and B
  // corners respectively.
  function Move(corner, clockwise) {
    this.corner = corner;
    this.clockwise = clockwise;
  }

  // toString returns the move, represented in WCA notation.
  Move.prototype.toString = function() {
    var cornerName = ['R', 'L', 'U', 'B'][this.corner];
    return cornerName + (this.clockwise ? '' : "'");
  };

  // allMoves returns all the possible moves which can be done on a Pyraminx.
  function allMoves() {
    return parseMoves("R L U B R' L' U' B'");
  }

  // movesToString converts an array of moves to a string.
  function movesToString(moves) {
    return moves.join(' ');
  }

  // parseMove parses a WCA move string and returns the given move.
  // If the move is invalid, this will throw an exception.
  function parseMove(str) {
    if (str.length === 1) {
      var corners = ['R', 'L', 'U', 'B'];
      var corner = corners.indexOf(str);
      if (corner < 0) {
        throw new Error('Invalid move: ' + str);
      }
      return new Move(corner, true);
    } else if (str.length === 2) {
      if (str[1] !== "'") {
        throw new Error('Invalid move: ' + str);
      }
      var res = parseMove(str[0]);
      res.clockwise = false;
      return res;
    } else {
      throw new Error('Invalid move: ' + str);
    }
  }

  // parseMoves parses a space-separated string of moves.
  // If any move is invalid, this will throw an exception.
  function parseMoves(str) {
    var comps = str.split(' ');
    var moves = [];
    for (var i = 0, len = comps.length; i < len; ++i) {
      moves.push(parseMove(comps[i]));
    }
    return moves;
  }

  // randomTipMoves generates moves which create random tip twists.
  function randomTipMoves() {
    var moves = [];
    var tipNames = ['u', 'l', 'r', 'b']
    for (var tipIndex = 0; tipIndex < 4; ++tipIndex) {
      var count = Math.floor(Math.random() * 3);
      if (count === 0) {
        continue;
      } else if (count === 1) {
        moves.push(tipNames[tipIndex]);
      } else {
        moves.push(tipNames[tipIndex] + "'");
      }
    }
    return moves.join(' ');
  }

  exports.Move = Move;
  exports.allMoves = allMoves;
  exports.movesToString = movesToString;
  exports.parseMove = parseMove;
  exports.parseMoves = parseMoves;
  exports.randomTipMoves = randomTipMoves;


  var PermsAPI = includeAPI('perms');


  // EdgesHeuristic determines a lower-bound for the number of moves to solve a set of Edges.
  function EdgesHeuristic(maxDepth) {
    this._table = new Uint8Array(11520);
    for (var i = 0, len = this._table.length; i < len; ++i) {
      this._table[i] = maxDepth + 1;
    }

    var moves = allMoves();
    var queue = [{state: new Edges(), depth: 0}];
    while (queue.length > 0) {
      var node = queue.shift();
      var state = node.state;
      var depth = node.depth;
      var hash = state.hash();

      if (this._table[hash] <= maxDepth) {
        continue;
      }
      this._table[hash] = depth;

      if (depth !== maxDepth) {
        for (var moveIndex = 0; moveIndex < 8; ++moveIndex) {
          var newState = state.copy();
          newState.move(moves[moveIndex]);
          queue.push({state: newState, depth: depth+1});
        }
      }
    }
  }

  // lowerBound returns a lower bound for the number of moves to solve a set of edges.
  EdgesHeuristic.prototype.lowerBound = function(edges) {
    return this._table[edges.hash()];
  };

  exports.EdgesHeuristic = EdgesHeuristic;


  var EDGE_LF = 0;
  var EDGE_RF = 1;
  var EDGE_DF = 2;
  var EDGE_LR = 3;
  var EDGE_LD = 4;
  var EDGE_RD = 5;

  // An Edge represents a single edge on the pyraminx.
  //
  // The piece is a number between 0 and 5 (inclusive) representing the physical slot where the edge
  // belongs on a solved pyraminx. Physical slots are indexed 0 through 5, denoting the LF, RF, DF,
  // LR, LD, and RD edges respectively.
  //
  // The orientation is a boolean indicating whether or not the edge is "oriented". Solved edges are
  // always oriented. The definition of orientation works as follows. Every physical edge piece has a
  // primary sticker and a secondary sticker. For the LF, RF and DF edges, the F sticker is secondary.
  // For the RD and LD edges, the D sticker is secondary. For the LR edge, the R sticker is secondary.
  // An edge is considered oriented if its secondary sticker is in the same place as the secondary
  // sticker of the physical slot where it is situated.
  function Edge(piece, orientation) {
    this.piece = piece;
    this.orientation = orientation;
  }

  // copy returns a copy of the Edge.
  Edge.prototype.copy = function() {
    return new Edge(this.piece, this.orientation);
  };

  // Edges stores and manipulates an array of 6 Edge objects.
  // If pieces is undefined, this will construct solved Edges.
  function Edges(pieces) {
    if (pieces) {
      this.edges = pieces;
    } else {
      this.edges = [];
      for (var i = 0; i < 6; ++i) {
        this.edges[i] = new Edge(i, true);
      }
    }
  }

  // copy returns a copy of these edges.
  Edges.prototype.copy = function() {
    var pieces = [];
    for (var i = 0; i < 6; ++i) {
      pieces[i] = this.edges[i].copy();
    }
    return new Edges(pieces);
  };

  // hash returns the perfect hash of the Edges.
  Edges.prototype.hash = function() {
    var eo = 0;
    for (var i = 0; i < 5; ++i) {
      eo |= this.edges[i].orientation ? (1 << i) : 0;
    }

    var permutation = [];
    for (var i = 0; i < 6; ++i) {
      permutation[i] = this.edges[i].piece;
    }
    var permEncoded = PermsAPI.encodeDestructablePermIgnoringParity(permutation);

    return (permEncoded << 5) | eo;
  };

  // move applies a Move to the Edges.
  Edges.prototype.move = function(m) {
    if (m.clockwise) {
      switch (m.corner) {
      case 0: // R
        var t = this.edges[EDGE_RF];
        this.edges[EDGE_RF] = this.edges[EDGE_DF];
        this.edges[EDGE_DF] = this.edges[EDGE_RD];
        this.edges[EDGE_RD] = t;
        this.edges[EDGE_RF].orientation = !this.edges[EDGE_RF].orientation;
        this.edges[EDGE_RD].orientation = !this.edges[EDGE_RD].orientation;
        break;
      case 1: // L
        var t = this.edges[EDGE_LF];
        this.edges[EDGE_LF] = this.edges[EDGE_LD];
        this.edges[EDGE_LD] = this.edges[EDGE_DF];
        this.edges[EDGE_DF] = t;
        this.edges[EDGE_LF].orientation = !this.edges[EDGE_LF].orientation;
        this.edges[EDGE_DF].orientation = !this.edges[EDGE_DF].orientation;
        break;
      case 2: // U
        var t = this.edges[EDGE_LF];
        this.edges[EDGE_LF] = this.edges[EDGE_RF];
        this.edges[EDGE_RF] = this.edges[EDGE_LR];
        this.edges[EDGE_LR] = t;
        this.edges[EDGE_LF].orientation = !this.edges[EDGE_LF].orientation;
        this.edges[EDGE_LR].orientation = !this.edges[EDGE_LR].orientation;
        break;
      case 3: // B
        var t = this.edges[EDGE_LR];
        this.edges[EDGE_LR] = this.edges[EDGE_RD];
        this.edges[EDGE_RD] = this.edges[EDGE_LD];
        this.edges[EDGE_LD] = t;
        this.edges[EDGE_LD].orientation = !this.edges[EDGE_LD].orientation;
        this.edges[EDGE_RD].orientation = !this.edges[EDGE_RD].orientation;
        break;
      }
    } else {
      switch (m.corner) {
      case 0: // R'
        var t = this.edges[EDGE_RF];
        this.edges[EDGE_RF] = this.edges[EDGE_RD];
        this.edges[EDGE_RD] = this.edges[EDGE_DF];
        this.edges[EDGE_DF] = t;
        this.edges[EDGE_RF].orientation = !this.edges[EDGE_RF].orientation;
        this.edges[EDGE_DF].orientation = !this.edges[EDGE_DF].orientation;
        break;
      case 1: // L'
        var t = this.edges[EDGE_LF];
        this.edges[EDGE_LF] = this.edges[EDGE_DF];
        this.edges[EDGE_DF] = this.edges[EDGE_LD];
        this.edges[EDGE_LD] = t;
        this.edges[EDGE_LF].orientation = !this.edges[EDGE_LF].orientation;
        this.edges[EDGE_LD].orientation = !this.edges[EDGE_LD].orientation;
        break;
      case 2: // U'
        var t = this.edges[EDGE_LF];
        this.edges[EDGE_LF] = this.edges[EDGE_LR];
        this.edges[EDGE_LR] = this.edges[EDGE_RF];
        this.edges[EDGE_RF] = t;
        this.edges[EDGE_LF].orientation = !this.edges[EDGE_LF].orientation;
        this.edges[EDGE_RF].orientation = !this.edges[EDGE_RF].orientation;
        break;
      case 3: // B'
        var t = this.edges[EDGE_LR];
        this.edges[EDGE_LR] = this.edges[EDGE_LD];
        this.edges[EDGE_LD] = this.edges[EDGE_RD];
        this.edges[EDGE_RD] = t;
        this.edges[EDGE_LD].orientation = !this.edges[EDGE_LD].orientation;
        this.edges[EDGE_LR].orientation = !this.edges[EDGE_LR].orientation;
        break;
      }
    }
  };

  // solved returns true if all the edges are permuted and oriented properly.
  Edges.prototype.solved = function() {
    for (var i = 0; i < 6; ++i) {
      if (!this.edges[i].orientation || this.edges[i].piece !== i) {
        return false;
      }
    }
    return true;
  };

  exports.Edge = Edge;
  exports.Edges = Edges;
  exports.EDGE_LF = EDGE_LF;
  exports.EDGE_RF = EDGE_RF;
  exports.EDGE_DF = EDGE_DF;
  exports.EDGE_LR = EDGE_LR;
  exports.EDGE_LD = EDGE_LD;
  exports.EDGE_RD = EDGE_RD;



})();
// puzzlejs.megaminx version 0.16.1
//
// Copyright (c) 2015, Alex Nichol.
// All rights reserved.
// 
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
// 
// 1. Redistributions of source code must retain the above copyright notice, this
//    list of conditions and the following disclaimer. 
// 2. Redistributions in binary form must reproduce the above copyright notice,
//    this list of conditions and the following disclaimer in the documentation
//    and/or other materials provided with the distribution.
// 
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
// ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
// WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
// ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
// (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
// LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
// ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
// SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
(function() {

  var exports;
  if ('undefined' !== typeof self) {
    if (!self.puzzlejs) {
      self.puzzlejs = {};
    }
    if (!self.puzzlejs.megaminx) {
      self.puzzlejs.megaminx = {};
    }
    exports = self.puzzlejs.megaminx;
  } else if ('undefined' !== typeof window) {
    if (!window.puzzlejs) {
      window.puzzlejs = {};
    }
    if (!window.puzzlejs.megaminx) {
      window.puzzlejs.megaminx = {};
    }
    exports = window.puzzlejs.megaminx;
  } else if ('undefined' !== typeof module) {
    exports = module.exports;
  }

  function includeAPI(name) {
    if ('undefined' !== typeof self) {
      return self.puzzlejs[name];
    } else if ('undefined' !== typeof window) {
      return window.puzzlejs[name];
    } else if ('function' === typeof require) {
      return require('./' + name + '.js');
    }
    throw new Error('cannot include packages');
  }

  function pochmannScramble(length) {
    var lines = [];
    for (var i = 0; i < Math.ceil(length / 11); ++i) {
      var moves = [];
      for (var j = 0; j < 10; ++j) {
        var face = (j & 1) === 0 ? 'R' : 'D';
        var direction = Math.random() < 0.5 ? '--' : '++';
        moves.push(face + direction);
      }
      moves.push('U' + (Math.random() < 0.5 ? "'" : ''));
      lines.push('(' + moves.join(' ') + ')');
    }
    return lines.join(' ');
  }

  exports.pochmannScramble = pochmannScramble;



})();
// puzzlejs.scrambler version 0.16.1
//
// Copyright (c) 2015, Alex Nichol.
// All rights reserved.
// 
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
// 
// 1. Redistributions of source code must retain the above copyright notice, this
//    list of conditions and the following disclaimer. 
// 2. Redistributions in binary form must reproduce the above copyright notice,
//    this list of conditions and the following disclaimer in the documentation
//    and/or other materials provided with the distribution.
// 
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
// ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
// WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
// ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
// (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
// LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
// ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
// SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
(function() {

  var exports;
  if ('undefined' !== typeof self) {
    if (!self.puzzlejs) {
      self.puzzlejs = {};
    }
    if (!self.puzzlejs.scrambler) {
      self.puzzlejs.scrambler = {};
    }
    exports = self.puzzlejs.scrambler;
  } else if ('undefined' !== typeof window) {
    if (!window.puzzlejs) {
      window.puzzlejs = {};
    }
    if (!window.puzzlejs.scrambler) {
      window.puzzlejs.scrambler = {};
    }
    exports = window.puzzlejs.scrambler;
  } else if ('undefined' !== typeof module) {
    exports = module.exports;
  }

  function includeAPI(name) {
    if ('undefined' !== typeof self) {
      return self.puzzlejs[name];
    } else if ('undefined' !== typeof window) {
      return window.puzzlejs[name];
    } else if ('function' === typeof require) {
      return require('./' + name + '.js');
    }
    throw new Error('cannot include packages');
  }

  var skewbHeuristic = null;
  var MIN_SKEWB_LENGTH = 7;

  function skewbCenters() {
    var state = new skewb.Skewb();
    state.centers = skewb.randomCenters();
    return solveSkewbState(state, 0);
  }

  function skewbMoves(count) {
    var moves = skewb.scrambleMoves(count);
    return skewb.movesToString(moves);
  }

  function skewbState() {
    while (true) {
      var solution = solveSkewbState(skewb.randomState(), MIN_SKEWB_LENGTH);
      if (solution !== null) {
        return solution;
      }
    }
  }

  function solveSkewbState(state, minLength) {
    if (skewbHeuristic === null) {
      skewbHeuristic = new skewb.Heuristic();
    }
    var solution = skewb.solve(state, skewbHeuristic);
    if (solution.length < minLength) {
      return null;
    }
    return skewb.movesToString(solution);
  }


  var scramblers = null;

  function allPuzzles() {
    if (scramblers === null) {
      createScramblers();
    }

    var res = [];
    for (var i = 0, len = scramblers.length; i < len; ++i) {
      res[i] = scramblers[i].name;
    }
    return res;
  }

  function createScramblers() {
    scramblers = [
      {
        name: "2x2x2",
        scramblers: [
          {
            f: pocketState,
            moves: false,
            name: "State"
          },
          {
            f: pocketOptState,
            moves: false,
            name: "Optimal"
          },
          {
            f: pocketMoves,
            moves: true,
            name: "Moves"
          }
        ]
      },
      {
        name: "3x3x3",
        scramblers: [
          {
            f: rubikState,
            moves: false,
            name: "State"
          },
          {
            f: rubikMoves,
            moves: true,
            name: "Moves"
          },
          {
            f: rubikZBLL,
            moves: false,
            name: "ZBLL"
          },
          {
            f: rubikLastLayer,
            moves: false,
            name: "Last Layer"
          },
          {
            f: rubikCorners,
            moves: false,
            name: "Corners"
          },
          {
            f: rubikEdges,
            moves: false,
            name: "Edges"
          }
        ]
      },
      {
        name: "4x4x4",
        scramblers: [
          {
            f: wcaMoves4x4,
            moves: true,
            name: "WCA Moves"
          }
        ]
      },
      {
        name: "5x5x5",
        scramblers: [
          {
            f: wcaMoves5x5,
            moves: true,
            name: "WCA Moves"
          }
        ]
      },
      {
        name: "6x6x6",
        scramblers: [
          {
            f: wcaMoves6x6,
            moves: true,
            name: "WCA Moves"
          }
        ]
      },
      {
        name: "7x7x7",
        scramblers: [
          {
            f: wcaMoves7x7,
            moves: true,
            name: "WCA Moves"
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
          },
          {
            f: skewbMoves,
            moves: true,
            name: "Moves"
          },
          {
            f: skewbCenters,
            moves: false,
            name: "Centers"
          }
        ]
      },
      {
        name: "Megaminx",
        scramblers: [
          {
            f: megaminx.pochmannScramble,
            moves: true,
            name: "Moves"
          }
        ]
      },
      {
        name: "Pyraminx",
        scramblers: [
          {
            f: pyraminxState,
            moves: false,
            name: "State"
          }
        ]
      }
    ];
  }

  function generateScramble(puzzle, scrambler, moves) {
    if (scramblers === null) {
      createScramblers();
    }

    // Find the info for the scrambler.
    var info = null;
    for (var i = 0, len = scramblers.length; i < len; ++i) {
      if (scramblers[i].name === puzzle) {
        var subs = scramblers[i].scramblers;
        for (var j = 0, len1 = subs.length; j < len1; ++j) {
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

  function scramblersForPuzzle(puzzle) {
    for (var i = 0, len = scramblers.length; i < len; ++i) {
      if (scramblers[i].name === puzzle) {
        var res = [];
        var subs = scramblers[i].scramblers;
        for (var j = 0, len1 = subs.length; j < len1; ++j) {
          res[j] = {moves: subs[j].moves, name: subs[j].name};
        }
        return res;
      }
    }
    throw new Error('unknown puzzle: ' + puzzle);
  }

  exports.allPuzzles = allPuzzles;
  exports.generateScramble = generateScramble;
  exports.scramblersForPuzzle = scramblersForPuzzle;


  var rubikTables = null;
  var rubikTimeouts = null;

  function rubikCorners() {
    return solveRubikState(rubik.randomCorners());
  }

  function rubikEdges() {
    return solveRubikState(rubik.randomEdges());
  }

  function rubikLastLayer() {
    return solveRubikState(rubik.randomLastLayer());
  }

  function rubikMoves(count) {
    var moves = rubik.scrambleMoves(count);
    return rubik.movesToString(moves);
  }

  function rubikState() {
    return solveRubikState(rubik.randomState());
  }

  function rubikZBLL() {
    return solveRubikState(rubik.randomZBLL());
  }

  function solveRubikState(state) {
    // Make sure the needed global variables are there.
    if (rubikTables === null || rubikTimeouts === null) {
      rubikTables = new rubik.SolveTables();
      rubikTimeouts = new rubik.SolveTimeouts();
    }

    // Solve the cube!
    var solution = rubik.solveCube(state, rubikTables, rubikTimeouts);
    if (solution === null) {
      return 'Timeout';
    }
    return rubik.movesToString(solution);
  }


  var pyraminxHeuristic = null;
  var MIN_PYRAMINX_LENGTH = 6;
  var PYRAMINX_HEURISTIC_DEPTH = 7;

  function pyraminxState() {
    if (pyraminxHeuristic === null) {
      pyraminxHeuristic = new pyraminx.EdgesHeuristic(PYRAMINX_HEURISTIC_DEPTH);
    }
    while (true) {
      var solution = pyraminx.solve(pyraminx.randomState(), pyraminxHeuristic);
      if (solution.length < MIN_PYRAMINX_LENGTH) {
        continue;
      }
      var tipMoves = pyraminx.randomTipMoves();
      var solutionStr = pyraminx.movesToString(solution);
      if (tipMoves !== '') {
        return solutionStr + ' ' + tipMoves;
      } else {
        return solutionStr;
      }
    }
  }


  var pocketHeuristic = null;
  var MIN_POCKET_CUBE_LENGTH = 4;
  var REGULAR_POCKET_CUBE_LENGTH = 8;

  function pocketMoves(count) {
    var moves = pocketcube.scrambleMoves(count);
    return pocketcube.movesToString(moves);
  }

  function pocketOptState() {
    if (pocketHeuristic === null) {
      pocketHeuristic = new pocketcube.FullHeuristic(5);
    }
    while (true) {
      var state = pocketcube.randomState();
      var solution = pocketcube.solve(state, pocketHeuristic);
      if (solution.length >= MIN_POCKET_CUBE_LENGTH) {
        return pocketcube.movesToString(solution);
      }
    }
  }

  function pocketState() {
    if (pocketHeuristic === null) {
      pocketHeuristic = new pocketcube.FullHeuristic(5);
    }
    while (true) {
      var state = pocketcube.randomState();
      var solution = pocketcube.solve(state, pocketHeuristic);
      if (solution.length >= MIN_POCKET_CUBE_LENGTH) {
        if (solution.length < REGULAR_POCKET_CUBE_LENGTH) {
          solution = pocketcube.solve(state, pocketHeuristic, REGULAR_POCKET_CUBE_LENGTH);
        }
        return pocketcube.movesToString(solution);
      }
    }
  }


  var rubik = includeAPI('rubik');
  var skewb = includeAPI('skewb');
  var pocketcube = includeAPI('pocketcube');
  var bigcube = includeAPI('bigcube');
  var pyraminx = includeAPI('pyraminx');
  var megaminx = includeAPI('megaminx');


  function wcaMoves4x4(count) {
    return bigcubeWCAMoves(4, count);
  }

  function wcaMoves5x5(count) {
    return bigcubeWCAMoves(5, count);
  }

  function wcaMoves6x6(count) {
    return bigcubeWCAMoves(6, count);
  }

  function wcaMoves7x7(count) {
    return bigcubeWCAMoves(7, count);
  }

  function bigcubeWCAMoves(size, count) {
    return bigcube.wcaMovesToString(bigcube.wcaMoveScramble(size, count));
  }



})();
(function() {

  // If this is not in the browser, we do nothing.
  if ('undefined' === typeof window || 'undefined' === typeof document) {
    return;
  }

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
      workerPath = scripts[scripts.length-1].src.split('?')[0];
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
(function() {

  // If this is not a Web Worker, do nothing.
  if ('undefined' === typeof self) {
    return;
  }

  self.onmessage = function(e) {
    var m = e.data;
    var puzzle = m.puzzle;
    var scrambler = m.scrambler;
    var moves = m.moves;
    var scramble = self.puzzlejs.scrambler.generateScramble(puzzle, scrambler,
      moves);
    self.postMessage({id: m.id, scramble: scramble});
  };

})();
