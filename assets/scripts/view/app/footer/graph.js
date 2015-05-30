(function() {

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
    this._$element = $('<div id="graph-settings"></div>');
    this._$header = $('<div class="title flavor-background"></div>');
    this._$modeLabel = $('<label></label>');

    this._$modeLabel.text('Standard');
    this._$header.append(this._$modeLabel);
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
