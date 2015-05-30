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
    this._dropdownOptions = [];
    for (var i = 0, len = GraphSettings.MODE_NAMES.length; i < len; ++i) {
      var $option = $('<li></li>').text(GraphSettings.MODE_NAMES[i]);
      this._$modeDropdown.append($option);
      this._dropdownOptions.push($option);
      $option.click(function(index) {
        this._switchToPage(index);
        this._setShowingDropdown(false);
      }.bind(this, i));
    }
    this._showingDropdown = false;
    
    this._boundClickThru = this._clickThru.bind(this);

    // TODO: use the last page the user was in.
    this._currentPage = 0;
    this._switchToPage(0);

    // NOTE: we need to add the dropdown after the header so the shadow of the
    // dropdown is covered.
    this._$header.append(this._$modeLabel);
    this._$element.append(this._$modeDropdown).append(this._$header);
  }

  GraphSettings.ANIMATION_DURATION = 150;
  GraphSettings.MODE_NAMES = ['Standard', 'Mean', 'Histogram', 'Streak'];
  GraphSettings.MODE_STANDARD = 0;
  GraphSettings.MODE_MEAN = 1;
  GraphSettings.MODE_HISTOGRAM = 2;
  GraphSettings.MODE_STREAK = 3;

  GraphSettings.prototype.element = function() {
    return this._$element;
  };
  
  GraphSettings.prototype._clickThru = function(e) {
    if (!e.inElement(this._$modeDropdown[0]) &&
        !e.inElement(this._$modeLabel[0])) {
      this._setShowingDropdown(false);
    }
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
      window.clickthru.addListener(this._boundClickThru);
    } else {
      this._$modeDropdown.fadeOut(GraphSettings.ANIMATION_DURATION);
      window.clickthru.removeListener(this._boundClickThru);
    }
  }
  
  GraphSettings.prototype._switchToPage = function(pageIdx) {
    this._dropdownOptions[this._currentPage].removeClass('selected');
    this._currentPage = pageIdx;
    this._dropdownOptions[pageIdx].addClass('selected');
    this._$modeLabel.text(GraphSettings.MODE_NAMES[pageIdx]);
  };

  window.app.Graph = Graph;

})();
