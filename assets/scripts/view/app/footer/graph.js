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
    this._$modeLabel.click(this._modeLabelClicked.bind(this));

    this._$modeDropdown = $('<ul class="mode-dropdown"></ul>').css({
      display: 'none'
    });
    for (var i = 0, len = GraphSettings.MODES.length; i < len; ++i) {
      this._$modeDropdown.append($('<li></li>').text(GraphSettings.MODES[i]));
    }
    this._showingDropdown = false;

    // TODO: switch to the page the user was last on.
    this._$modeLabel.text('Standard');

    // NOTE: we need to add the dropdown after the header so the shadow of the
    // dropdown is covered.
    this._$header.append(this._$modeLabel);
    this._$element.append(this._$modeDropdown).append(this._$header);
  }

  GraphSettings.ANIMATION_DURATION = 150;
  GraphSettings.MODES = ['Standard', 'Mean', 'Histogram', 'Streak'];
  GraphSettings.MODE_STANDARD = 'Standard';
  GraphSettings.MODE_MEAN = 'Mean';
  GraphSettings.MODE_HISTOGRAM = 'Histogram';
  GraphSettings.MODE_STREAK = 'Streak';

  GraphSettings.prototype.element = function() {
    return this._$element;
  };

  GraphSettings.prototype._modeLabelClicked = function() {
    this._setShowingDropdown(!this._showingDropdown);
  };

  GraphSettings.prototype._setShowingDropdown = function(x) {
    if (x == this._showingDropdown) {
      return;
    }
    this._showingDropdown = x;
    if (x) {
      this._$modeDropdown.stop(true, true).css({display: 'block', opacity: 1});
    } else {
      this._$modeDropdown.fadeOut(GraphSettings.ANIMATION_DURATION);
    }
  }

  window.app.Graph = Graph;

})();
