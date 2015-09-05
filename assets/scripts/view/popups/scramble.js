(function() {

  function ScramblePopup(solve) {
    this._useful = false;
    if (!solve.scramble) {
      this._setupMessage('No scramble.', false);
    } else if (solve.scrambler === '3x3x3') {
      try {
        this._setup3x3Scramble(solve.scramble);
        this._useful = true;
      } catch (e) {
        this._setupMessage(solve.scramble, true);
      }
    } else {
      this._setupMessage(solve.scramble, true);
    }
  }

  // hasUsefulInformation returns true if the popup has some information
  // besides the scramble itself.
  ScramblePopup.prototype.hasUsefulInformation = function() {
    return this._useful;
  };

  ScramblePopup.prototype.show = function() {
    this._dialog.show();
  };

  ScramblePopup.prototype._setup3x3Scramble = function(scramble) {
    var moves = window.puzzlejs.bigcube.parseWCAMoves(scramble);
    var cube = new window.puzzlejs.bigcube.StickerCube(3);
    for (var i = 0, len = moves.length; i < len; ++i) {
      cube = cube.move(moves[i]);
    }

    var colors = ['white', '#ffff00', '#38d838', '#3b6de0', '#e9364b',
      'orange'];

    var rightIDs = ['rect1350', 'rect1352', 'rect1354', 'rect1356',
      'rect1358', 'rect1360', 'rect1362', 'rect1364', 'rect1366'];
    var frontIDs = ['rect1396', 'rect1370', 'rect1372', 'rect1374',
      'rect1368', 'rect1376', 'rect1380', 'rect1378', 'rect1382'];
    var topIDs = ['rect1390', 'rect1394', 'rect1402', 'rect1388', 'rect1392',
      'rect1400', 'rect1386', 'rect1384', 'rect1398'];
    var $content = $('<div class="message-popup-content"></div>');
    $content.append($('<span class="selectable"></span>').text(scramble));
    var $object;
    window.app.cubePreviewLoad = function() {
      for (var i = 0; i < 9; ++i) {
        var rightIndex = 36 + i;
        var frontIndex = 18 + i;
        var topIndex = i;
        var doc = $object[0].contentDocument;
        doc.getElementById(rightIDs[i]).setAttribute('fill',
          colors[cube.stickers[rightIndex]]);
        doc.getElementById(frontIDs[i]).setAttribute('fill',
          colors[cube.stickers[frontIndex]]);
        doc.getElementById(topIDs[i]).setAttribute('fill',
          colors[cube.stickers[topIndex]]);
      }
    };
    $object = $('<object data="images/3d_cube_preview.svg" ' +
      'type="image/svg+xml" onload="window.app.cubePreviewLoad()" ' +
      'class="svg-cube-preview"></object>');
    $content.append($object);
    this._dialog = new window.app.Dialog('Scramble', $content, ['OK']);
    this._dialog.on('action', this._dialog.close.bind(this._dialog));
  };

  ScramblePopup.prototype._setupMessage = function(content, selectable) {
    var $content = $('<div class="message-popup-content"></div>').text(content);
    if (selectable) {
      $content.addClass('selectable');
    }
    this._dialog = new window.app.Dialog('Scramble', $content, ['OK']);
    this._dialog.on('action', this._dialog.close.bind(this._dialog));
  };

  window.app.ScramblePopup = ScramblePopup;

})();
