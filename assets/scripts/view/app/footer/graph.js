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
    this._settings.layout();
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
    this._showingDropdown = false;
    this._generateDropdownOptions();

    this._pageElements = [];
    this._sliders = [];
    var elements = [this._generateStandard(), this._generateMean(),
      this._generateHistogram(), this._generateStreak()];
    for (var i = 0, len = elements.length; i < len; ++i) {
      this._pageElements.push(elements[i].addClass('page'));
    }

    this._boundClickThru = this._clickThru.bind(this);

    // TODO: use the last page the user was in.
    this._currentPage = 0;
    this._switchToPage(0);

    // NOTE: we need to add the dropdown after the header so the shadow of the
    // dropdown is covered.
    this._$header.append(this._$modeLabel);
    this._$element.append(this._$modeDropdown, this._$header);
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

  GraphSettings.prototype.layout = function() {
    for (var i = 0, len = this._sliders.length; i < len; ++i) {
      this._sliders[i].layout();
    }
  }

  GraphSettings.prototype._clickThru = function(e) {
    if (!e.inElement(this._$modeDropdown[0]) &&
        !e.inElement(this._$modeLabel[0])) {
      this._setShowingDropdown(false);
    }
  };

  GraphSettings.prototype._generateDropdownOptions = function() {
    for (var i = 0, len = GraphSettings.MODE_NAMES.length; i < len; ++i) {
      var $option = $('<li></li>').text(GraphSettings.MODE_NAMES[i]);
      this._$modeDropdown.append($option);
      this._dropdownOptions.push($option);
      $option.click(function(index) {
        this._switchToPage(index);
        this._setShowingDropdown(false);
      }.bind(this, i));
    }
  };

  GraphSettings.prototype._generateHistogram = function() {
    var $element = $('<div></div>');
    return $element;
  };

  GraphSettings.prototype._generateMean = function() {
    var $element = $('<div></div>');
    $element.append(generateTwoSidedLabel('Scale', 'Something'));

    var slider = new Slider();
    this._sliders.push(slider);
    $element.append(slider.element());

    return $element;
  };

  GraphSettings.prototype._generateStandard = function() {
    var $element = $('<div></div>');
    return $element;
  };

  GraphSettings.prototype._generateStreak = function() {
    var $element = $('<div></div>');
    return $element;
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
    this._pageElements[this._currentPage].detach();
    this._currentPage = pageIdx;
    this._dropdownOptions[pageIdx].addClass('selected');
    this._$modeDropdown.before(this._pageElements[pageIdx]);
    this._$modeLabel.text(GraphSettings.MODE_NAMES[pageIdx]);
    this.layout();
  };

  function Slider() {
    this._minimumValue = 0;
    this._maximumValue = 1;
    this._value = 0.5;
    this._clipValues = null;

    this._$filledPart = $('<div></div>').css({
      position: 'absolute',
      top: (Slider.BULB_SIZE - Slider.THICKNESS) / 2,
      left: 0,
      width: 0,
      height: Slider.THICKNESS
    }).addClass('flavor-background');
    this._$background = $('<div></div>').css({
      position: 'absolute',
      top: (Slider.BULB_SIZE - Slider.THICKNESS) / 2,
      left: 0,
      width: '100%',
      height: Slider.THICKNESS,
      backgroundColor: '#cccccc'
    });
    this._$bulb = $('<div></div>').css({
      position: 'absolute',
      top: 0,
      left: 0,
      width: Slider.BULB_WIDTH,
      height: Slider.BULB_SIZE,
      backgroundColor: 'white'
    });
    this._$element = $('<div></div>').css({
      position: 'relative',
      height: Slider.BULB_SIZE,
      marginTop: 5
    }).append(this._$background, this._$filledPart, this._$bulb);
    
    this._registerUIEvents();
  }

  Slider.BULB_SIZE = 10;
  Slider.BULB_WIDTH = 4;
  Slider.THICKNESS = 4;

  Slider.prototype.element = function() {
    return this._$element;
  };

  Slider.prototype.getValue = function() {
    return this._value;
  };

  Slider.prototype.layout = function() {
    var percent = (this.getValue() - this._minimumValue) / (this._maximumValue -
      this._minimumValue);
    var xValue = Math.round(Slider.BULB_WIDTH/2 +
      percent*(this._$element.width()-Slider.BULB_WIDTH));

    // If xValue is less than 0, the slider must be off-screen or is too narrow.
    if (xValue < 0) {
      return;
    }

    this._$filledPart.css({width: xValue});
    this._$bulb.css({left: xValue - Slider.BULB_WIDTH/2});
  };

  Slider.prototype.setClipValues = function(values) {
    this._clipValues = values;
    this.setValue(this._value);
  };

  Slider.prototype.setMaximumValue = function(v) {
    this._maximumValue = v;
    this.setValue(this._value);
  };

  Slider.prototype.setMinimumValue = function(v) {
    this._minimumValue = v;
    this.setValue(this._value);
  };

  Slider.prototype.setValue = function(v) {
    v = Math.max(Math.min(v, this._maximumValue), this._minimumValue);
    if (this._clipValues !== null) {
      var useValue = this._clipValues[0];
      var diff = Math.abs(v - useValue);
      for (var i = 1, len = this._clipValues.length; i < len; ++i) {
        var d = Math.abs(v - this._clipValues[i]);
        if (d < diff) {
          diff = d;
          useValue = this._clipValues[i];
        }
      }
      v = useValue;
    }
    this._value = v;
    this.layout();
  };
  
  Slider.prototype._registerUIEvents = function() {
    var clicked = false;
    var update = function(e) {
      var x = e.pageX - this._$element.offset().left;
      var startX = Slider.BULB_WIDTH / 2;
      var endX = this._$element.width() - startX;
      var percent = (x - startX) / (endX - startX);
      percent = Math.max(Math.min(percent, 1), 0);
      this.setValue(percent*(this._maximumValue-this._minimumValue) +
        this._minimumValue);
    }.bind(this);
    
    this._$element.mousedown(function(e) {
      clicked = true;
      update(e);
      e.preventDefault();
    });
    $(document.body).mouseup(function() {
      clicked = false;
    });
    $(document.body).mousemove(function(e) {
      if (clicked) {
        update(e);
      }
    });
  };

  function generateTwoSidedLabel(left, right) {
    var $left = $('<label></label>').text(left).addClass('left-label');
    var $right = $('<label></label>').text(right).addClass('right-label');
    return $('<div class="two-sided-label"></div>').append($left, $right);
  }

  window.app.Graph = Graph;

})();
