(function() {

  var MINIMUM_SCALE = 5;
  var MAXIMUM_SCALE = 100;

  function Graph() {
    this._$element = $('#graph');
    this.settings = new GraphSettings();

    // For now, we show the settings all the time for debugging.
    this.settings.element().css({position: 'absolute', right: 0});
    this._$element.append(this.settings.element());
  }

  Graph.prototype.layout = function(left, width) {
    this._$element.css({left: left, width: width});
  };

  Graph.prototype.setVisible = function(flag) {
    this._$element.css({display: flag ? 'block' : 'none'});
  };

  function GraphSettings() {
    window.app.EventEmitter.call(this);

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

    // NOTE: we need to add the dropdown before the header so the shadow of the
    // dropdown is covered by the header. I could just use z-index, but that's
    // always a bad idea.
    this._$header.append(this._$modeLabel);
    this._$element.append(this._$modeDropdown, this._$header);

    this._currentPage = 0;
    this._registerModelEvents();
    this._updatePageFromModel();
  }

  GraphSettings.prototype = Object.create(window.app.EventEmitter.prototype);

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
        this.emit('modeChanged', index);
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
    var $content = $('<div class="page-content"></div>');

    var scaleSlider = new Slider(MINIMUM_SCALE, MAXIMUM_SCALE, 0);
    var scale = new ManagedSlider(this, scaleSlider, 'Scale', 'graphMeanScale',
      formatScale.bind(null, 'means'));

    $content.append(scale.element());
    $element.append($content);
    return $element;
  };

  GraphSettings.prototype._generateStandard = function() {
    var $element = $('<div></div>');

    $element.append(new VisualModePicker(this).element());

    var $content = $('<div class="page-content"></div>');

    var scaleSlider = new Slider(MINIMUM_SCALE, MAXIMUM_SCALE, 0);
    var scale = new ManagedSlider(this, scaleSlider, 'Scale',
      'graphStandardScale', formatScale.bind(null, 'solves'));
    $content.append(scale.element());

    $element.append($content);
    return $element;
  };

  GraphSettings.prototype._generateStreak = function() {
    var $element = $('<div></div>');
    var $content = $('<div class="page-content"></div>');

    var scaleSlider = new Slider(MINIMUM_SCALE, MAXIMUM_SCALE, 0);
    var scale = new ManagedSlider(this, scaleSlider, 'Scale',
      'graphStreakScale', formatScale.bind(null, 'days'));
    $content.append(scale.element());

    $element.append($content);
    return $element;
  };

  GraphSettings.prototype._modeLabelClicked = function() {
    this._setShowingDropdown(!this._showingDropdown);
  };

  GraphSettings.prototype._registerModelEvents = function() {
    window.app.observe.activePuzzle('graphMode',
      this._updatePageFromModel.bind(this));
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

  GraphSettings.prototype._updatePageFromModel = function() {
    var pageIdx = window.app.store.getActivePuzzle().graphMode;
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

    var oldValue = this.getValue();
    this.setValue(fraction*(this._maximumValue-this._minimumValue) +
      this._minimumValue);

    if (oldValue !== this.getValue()) {
      this.emit('change');
    }
  };

  // A ScaledSlider uses two functions to scale or transform the value range of
  // a slider.
  function ScaledSlider(toModelValue, toSliderValue, slider) {
    window.app.EventEmitter.call(this);

    this._slider = slider;
    this._toModelValue = toModelValue;
    this._toSliderValue = toSliderValue;

    slider.on('change', this.emit.bind(this, 'change'));
  }

  ScaledSlider.prototype = Object.create(window.app.EventEmitter.prototype);

  ScaledSlider.prototype.element = function() {
    return this._slider.element();
  };

  ScaledSlider.prototype.getValue = function() {
    return this._toModelValue(this._slider.getValue());
  };

  ScaledSlider.prototype.setValue = function(v) {
    return this._slider.setValue(this._toSliderValue(v));
  };

  // A ManagedSlider automatically keeps a slider in sync with the model and
  // updates a label indicating its current value.
  //
  // A ManagedSlider is its own controller. It modifies the model itself.
  function ManagedSlider(emitter, slider, name, modelKey, valueToLabel) {
    this._emitter = emitter;
    this._slider = slider;
    this._modelKey = modelKey;
    this._valueToLabel = valueToLabel;

    this._$element = $('<div></div>');
    this._$valueLabel = $('<label></label>').addClass('value-label');
    var $nameLabel = $('<label></label>').text(name).addClass('name-label');
    var $labels = $('<div class="name-value-labels"></div>');

    this._$element.append($labels.append($nameLabel, this._$valueLabel));
    this._$element.append(this._slider.element());

    this._slider.on('change', this._sliderChanged.bind(this));
    this._updateFromModel();
    this._registerModelEvents();
  }

  ManagedSlider.prototype.element = function() {
    return this._$element;
  };

  ManagedSlider.prototype._registerModelEvents = function() {
    window.app.observe.activePuzzle(this._modelKey,
      this._updateFromModel.bind(this));
  };

  ManagedSlider.prototype._sliderChanged = function() {
    this._emitter.emit('settingChanged', this._modelKey,
      this._slider.getValue());
  };

  ManagedSlider.prototype._updateFromModel = function() {
    var value = window.app.store.getActivePuzzle()[this._modelKey];

    // If the slider's value is rounded, re-setting the value may cause it to
    // jump a bit and that would be ugly.
    if (value !== this._slider.getValue()) {
      this._slider.setValue(value);
    }

    this._updateLabel();
  };

  ManagedSlider.prototype._updateLabel = function() {
    this._$valueLabel.text(this._valueToLabel(this._slider.getValue()));
  };

  // A VisualModePicker allows the user to choose between a bar graph, a line
  // graph and a dot graph.
  //
  // A VisualModePicker is its own controller. It updates the model
  // automatically.
  function VisualModePicker(emitter) {
    this._emitter = emitter;
    this._$element = $('<div class="view-modes"></div>');
    this._svgs = [];
    var images = [LINE_GRAPH_IMAGE, BAR_GRAPH_IMAGE, DOT_GRAPH_IMAGE];
    for (var i = 0; i < 3; ++i) {
      var $viewMode = $('<div class="view-mode"></div>');
      var $svg = $(images[i]);
      $viewMode.addClass('view-mode-' + i);
      $viewMode.append($svg);
      this._svgs.push($svg);
      this._$element.append($viewMode);
      $viewMode.click(this._handleClick.bind(this, i));
    }

    this._updateFromModel();
    this._registerEvents();
  }

  VisualModePicker.prototype.element = function() {
    return this._$element;
  };

  VisualModePicker.prototype._colorSVG = function(i, color) {
    var doc = this._svgs[i][0];
    var fills = doc.getElementsByClassName('color-fill');
    for (var i = 0, len = fills.length; i < len; ++i) {
      fills[i].setAttribute('fill', color);
    }
    var strokes = doc.getElementsByClassName('color-stroke');
    for (var i = 0, len = strokes.length; i < len; ++i) {
      strokes[i].setAttribute('stroke', color);
    }
  }

  VisualModePicker.prototype._handleClick = function(index) {
    this._emitter.emit('settingChanged', 'graphStandardType', index);
  };

  VisualModePicker.prototype._registerEvents = function() {
    window.app.observe.activePuzzle('graphStandardType',
      this._updateFromModel.bind(this));
    window.app.viewEvents.on('flavor.color', this._updateFromModel.bind(this));
  };

  VisualModePicker.prototype._updateFromModel = function() {
    var value = window.app.store.getActivePuzzle().graphStandardType;
    for (var i = 0; i < 3; ++i) {
      if (i === value) {
        this._colorSVG(i, window.app.flavors.getLastEmittedColor());
      } else {
        this._colorSVG(i, '#d5d5d5');
      }
    }
  };

  function ManagedCheckbox(emitter, name, modelKey) {
    this._emitter = emitter;
    this._modelKey = modelKey;
    this._checkbox = window.app.flavors.makeCheckbox();
    this._$element = $('<div class="labeled-checkbox"></div>');
    this._$nameLabel = $('<label></label>');
    this._$element.append(this._$nameLabel, this._checkbox.element());

    this._checkbox.onClick = this._handleChange.bind(this);
    this._updateFromModel(first);
    this._registerModelEvents();
  }

  ManagedCheckbox.prototype.element = function() {
    return this._$element;
  };

  ManagedCheckbox.prototype._handleChange = function() {
    this._emitter.emit('settingChanged', this._modelKey,
      this._checkbox.getChecked());
  };

  ManagedCheckbox.prototype._registerModelEvents = function() {
    window.app.observe.activePuzzle(this._modelKey,
      this._updateFromModel.bind(this));
  };

  ManagedCheckbox.prototype._updateFromModel = function() {
    var flag = window.app.store.getActivePuzzle()[this._modelKey];
    this._checkbox.setChecked(flag);
  };

  function formatScale(unit, value) {
    return Math.round(value) + ' ' + unit;
  }

  window.app.Graph = Graph;

  var BAR_GRAPH_IMAGE = '<svg version="1.1" ' +
    'xmlns="http://www.w3.org/2000/svg" ' +
    'xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" ' +
    'viewBox="0 0 1000 1000" enable-background="new 0 0 1000 1000" ' +
    'preserveAspectRatio="xMidYMid meet" xml:space="preserve">' +
    '<g id="barGraphImage" class="color-fill">' +
    '<rect x="64.8" y="358.3" width="229.2" height="475"/>' +
    '<rect x="369.3" y="101.4" width="229.2" height="731.9"/>' +
    '<rect x="675.1" y="201" width="229.2" height="632.8"/>' +
    '</g>' +
    '</svg>';

  var DOT_GRAPH_IMAGE = '<svg version="1.1" ' +
    'xmlns="http://www.w3.org/2000/svg" ' +
    'xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" ' +
    'viewBox="0 0 1000 1000" enable-background="new 0 0 1000 1000" ' +
    'preserveAspectRatio="xMidYMid meet" xml:space="preserve">' +
    '<g id="dotGraphImage">' +
    '<g><g>' +
    '<path class="color-fill" fill-rule="evenodd" clip-rule="evenodd" '+
    'd="M160.5,355.7c-46.9,0-84.9,38-84.9,84.9s38,84.9,84.9,84.9s84.9-38,' +
    '84.9-84.9 S207.4,355.7,160.5,355.7z M432.1,304.8c-46.9,0-84.9,38-84.9,' +
    '84.9s38,84.9,84.9,84.9s84.9-38,84.9-84.9S479,304.8,432.1,304.8z' +
    'M601.8,525.5c-46.9,0-84.9,38-84.9,84.9s38,84.9,84.9,84.9s84.9-38,' +
    '84.9-84.9S648.7,525.5,601.8,525.5z M839.5,440.6 c-46.9,0-84.9,38-84.9,' +
    '84.9s38,84.9,84.9,84.9s84.9-38,84.9-84.9S886.3,440.6,839.5,440.6z"/>' +
    '</g></g></g></svg>';

  var LINE_GRAPH_IMAGE = '<svg version="1.1" ' +
    'xmlns="http://www.w3.org/2000/svg" ' +
    'xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" ' +
    'viewBox="0 0 1000 1000" enable-background="new 0 0 1000 1000" ' +
    'preserveAspectRatio="xMidYMid meet" xml:space="preserve">' +
    '<g id="Layer_1">' +
    '<path fill-rule="evenodd" clip-rule="evenodd" fill="none" ' +
    'class="color-stroke" stroke-width="70" stroke-miterlimit="10" d="' +
    'M85.9,261c0,0,138.3,327.3,426.6,244.2S911,667.3,914.1,677.3"/>' +
    '</g></svg>';

})();
