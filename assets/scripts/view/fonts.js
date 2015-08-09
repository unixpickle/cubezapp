(function() {

  var CHECK_INTERVAL = 50;
  var FAR_OFFSCREEN = -10000;
  var FONT_LOAD_TIMEOUT = 1000;
  var REFERENCE_FONT = 'serif';
  var TEST_FONT_SIZE = '40px';
  var TEST_TEXT = '0123456789:.abcdefghijklmnopqrstuvwxyz' +
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var WEB_FONTS = ['Roboto'];

  function Fonts() {
    window.app.EventEmitter.call(this);
    this._loaded = false;
    this._listenForLoad();
  }

  Fonts.prototype = Object.create(window.app.EventEmitter.prototype);

  Fonts.prototype.loaded = function() {
    return this._loaded;
  };

  Fonts.prototype._listenForLoad = function() {
    var waitingCount = WEB_FONTS.length;
    for (var i = 0, len = WEB_FONTS.length; i < len; ++i) {
      pollFontLoad(WEB_FONTS[i], function() {
        if (--waitingCount === 0) {
          this.emit('load');
          this._loaded = true;
        }
      }.bind(this));
    }
  };

  function pollFontLoad(fontFamily, callback) {
    // The logic behind this comes from
    // https://gist.github.com/smnh/1bc5aaead6ce52c39e9e#file-onfontsload-js

    var $container = $('<div></div>').css({
      position: 'fixed',
      left: -FAR_OFFSCREEN,
      top: -FAR_OFFSCREEN,
      fontFamily: REFERENCE_FONT,
      fontSize: TEST_FONT_SIZE
    });
    $(document.body).append($container);

    var $referenceDiv = $('<div>' + TEST_TEXT + '</div>').css({
      position: 'absolute',
      whiteSpace: 'nowrap'
    });
    $container.append($referenceDiv);
    var referenceWidth = $referenceDiv.width();
    var referenceHeight = $referenceDiv.height();
    $referenceDiv.remove();

    var $fontElement = $('<div>' + TEST_TEXT + '</div>').css({
      position: 'absolute',
      whiteSpace: 'nowrap',
      fontFamily: fontFamily + ', ' + REFERENCE_FONT
    });
    $container.append($fontElement);

    var interval;
    interval = setInterval(function() {
      if ($fontElement.width() !== referenceWidth ||
          $fontElement.height() !== referenceHeight) {
        clearInterval(interval);
        interval = null;
        $container.remove();
        callback(true);
      }
    }, CHECK_INTERVAL);

    setTimeout(function() {
      if (interval !== null) {
        clearInterval(interval);
        $container.remove();
        callback(false);
      }
    }, FONT_LOAD_TIMEOUT);
  }

  window.app.Fonts = Fonts;

})();
