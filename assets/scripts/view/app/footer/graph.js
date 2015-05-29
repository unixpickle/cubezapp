(function() {

  var SETTINGS_BACKGROUND = '#e6e6e6';
  var SETTINGS_HEADER_HEIGHT = 40;
  var SETTINGS_MODE_ARROW_SIZE = 30;
  var SETTINGS_WIDTH = 170;

  function Graph() {
    this._$element = $('#graph');
    this._settings = new GraphSettings();

    // For now, we show the settings all the time for debugging.
    this._settings.element().css({position: 'absolute', right: 0});
    this._$element.append(this._settings.element());
  }

  Graph.prototype.layout = function(left, width) {
    this._$element.css({left: left, width: width});
  };

  Graph.prototype.setVisible = function(flag) {
    this._$element.css({display: flag ? 'block' : 'none'});
  };

  function GraphSettings() {
    this._$element = $('<div></div>').css({
      height: '100%',
      width: SETTINGS_WIDTH,
      backgroundColor: SETTINGS_BACKGROUND,
      position: 'absolute'
    });

    this._$header = $('<div></div>').addClass('flavor-background').css({
      position: 'absolute',
      top: 0,
      left: 0,
      height: SETTINGS_HEADER_HEIGHT,
      width: '100%'
    });

    this._$modeTitle = $('<label></label>').css({
      display: 'block',
      float: 'left',
      height: SETTINGS_HEADER_HEIGHT,
      lineHeight: SETTINGS_HEADER_HEIGHT + 'px',
      paddingRight: SETTINGS_MODE_ARROW_SIZE,
      paddingLeft: 10,
      backgroundImage: 'url(images/downarrow.png)',
      backgroundSize: '20px 20px',
      backgroundPosition: 'right center',
      backgroundRepeat: 'no-repeat',
      color: 'white',
      fontSize: 22
    });

    this._$modeTitle.text('Standard');

    this._$header.append(this._$modeTitle);

    this._$element.append(this._$header);
  }
  
  GraphSettings.MODE_STANDARD = 'Standard';
  GraphSettings.MODE_MEAN = 'Mean';
  GraphSettings.MODE_HISTOGRAM = 'Histogram';
  GraphSettings.MODE_STREAK = 'Streak';

  GraphSettings.prototype.element = function() {
    return this._$element;
  };

  window.app.Graph = Graph;

})();
