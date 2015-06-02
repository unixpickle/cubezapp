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
    this._showingDropdown = false;
    this._generateDropdownOptions();

    this._pageElements = [];
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

    var slider = new Slider(1, 1000, 100);
    var scale = new LabelSlider(slider, 'Scale', function(x) {
      return Math.round(x) + ' Solves';
    });
    $element.append(scale.element());

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
  };

  function Slider(min, max, value, clip) {
    window.app.EventEmitter.call(this);

    this._minimumValue = min;
    this._maximumValue = max;
    this._value = 0;
    this._clipValues = clip || null;

    this._$element = $('<div class="slider"><div class="background"></div>' +
      '<div class="bulb-container">' +
      '<div class="before-bulb flavor-background"></div>' +
      '<div class="bulb"></div></div>');
    this._$beforeBulb = this._$element.find('.before-bulb');
    this._$bulb = this._$element.find('.bulb');

    this.setValue(value);
    this._registerUIEvents();
  }

  Slider.prototype = Object.create(window.app.EventEmitter.prototype);

  Slider.prototype.element = function() {
    return this._$element;
  };

  Slider.prototype.getValue = function() {
    return this._value;
  };

  Slider.prototype.setValue = function(v) {
    this._value = this._closestAllowedValue(v);
    var percent = this._percent();
    this._$bulb.css({left: percent});
    this._$beforeBulb.css({width: percent});
  };

  Slider.prototype._closestAllowedValue = function(v) {
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
    return v;
  };

  Slider.prototype._percent = function() {
    var fraction = (this._value - this._minimumValue) / (this._maximumValue -
      this._minimumValue);
    return (fraction * 100).toPrecision(5) + '%';
  };

  Slider.prototype._registerUIEvents = function() {
    var clicked = false;
    var update = this._updateForMouseEvent.bind(this);
    this._$element.mousedown(function(e) {
      clicked = true;
      update(e);

      // NOTE: this line prevents the cursor from changing in Safari on OS X. It
      // may have the same effect on other platforms as well.
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

  Slider.prototype._updateForMouseEvent = function(e) {
    var x = e.pageX - this._$element.offset().left;
    var startX = this._$bulb.width() / 2;
    var endX = this._$element.width() - startX;

    var fraction = (x - startX) / (endX - startX);
    fraction = Math.max(Math.min(fraction, 1), 0);

    this.setValue(fraction*(this._maximumValue-this._minimumValue) +
      this._minimumValue);

    this.emit('change');
  };

  function LabelSlider(slider, leftText, labelFunc) {
    window.app.EventEmitter.call(this);

    this._slider = slider;
    this._labelFunc = labelFunc;

    this._$element = $('<div></div>');

    this._$right = $('<label></label>').addClass('right-label');
    var $left = $('<label></label>').text(leftText).addClass('left-label');
    var $twoSided = $('<div class="two-sided-label"></div>');

    this._$element.append($twoSided.append($left, this._$right));
    this._$element.append(this._slider.element());

    this._slider.on('change', this._updateLabel.bind(this));
    this._updateLabel();
  }

  LabelSlider.prototype = Object.create(window.app.EventEmitter.prototype);

  LabelSlider.prototype.element = function() {
    return this._$element;
  };

  LabelSlider.prototype.getValue = function() {
    return this._slider.getValue();
  };

  LabelSlider.prototype.setValue = function(v) {
    this._slider.setValue(v);
    this._updateLabel();
  };

  LabelSlider.prototype._updateLabel = function() {
    this._$right.text(this._labelFunc(this.getValue()));
  };

  window.app.Graph = Graph;

})();
