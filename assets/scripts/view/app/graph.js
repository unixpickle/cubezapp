(function() {

  var MINIMUM_MEAN_SIZE = 3;
  var MAXIMUM_MEAN_SIZE = 50;

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

    var $modeLabel = $('<label></label>');
    this._dropdown = new ModeDropdown(this, $modeLabel);
    this._pageElements = [this._generateStandardPage(),
      this._generateMeanPage(), this._generateHistogramPage(),
      this._generateStreakPage()];

    // NOTE: we need to add the dropdown before the header so the shadow of the
    // dropdown is covered by the header. I could just use z-index, but that's
    // always a bad idea.
    this._$header.append($modeLabel);
    this._$element.append(this._dropdown.element(), this._$header);

    this._currentPage = 0;
    this._registerModelEvents();
    this._updatePageFromModel();
  }

  GraphSettings.prototype = Object.create(window.app.EventEmitter.prototype);

  GraphSettings.prototype.element = function() {
    return this._$element;
  };

  GraphSettings.prototype._generateHistogramPage = function() {
    var $element = $('<div class="page"></div>');
    var $content = $('<div class="page-content"></div>');

    var scaleSlider = new IntegerSlider(new Slider(MINIMUM_SCALE,
      MAXIMUM_SCALE, 0));
    var scale = new ManagedSlider(this, scaleSlider, 'Scale',
      'graphHistogramScale', emptyStringFunc);
    $content.append(scale.element());

    var spanRawSlider = new Slider(0, 1, 0);
    var spanSlider = new ScaledSlider(function(sliderValue) {
      var value = Math.round(5 * Math.exp(6.908 * sliderValue));
      return value === 5001 ? -1 : value;
    }, function(modelValue) {
      if (modelValue === -1) {
        return 1;
      }
      return modelValue === -1 ? 1 : Math.log(modelValue / 5) / 6.908;
    }, spanRawSlider);
    var span = new ManagedSlider(this, spanSlider, 'Span',
      'graphHistogramSpan', function(solveCount) {
        if (solveCount === -1) {
          return 'all solves';
        } else {
          return solveCount + ' solves';
        }
      });
    $content.append(span.element());

    var precisions = [250, 500];
    for (var i = 1; i <= 20; ++i) {
      precisions.push(i * 1000);
    }
    var precisionSlider = new Slider(250, 20000, 1, precisions);
    var precision = new ManagedSlider(this, precisionSlider, 'Precision',
      'graphHistogramPrecision', function(x) {
        if (x === 250) {
          return '1/4 second';
        } else if (x === 500) {
          return '1/2 second';
        } else if (x === 1000) {
          return '1 second';
        } else {
          return Math.round(x / 1000) + ' seconds';
        }
      });
    $content.append(precision.element());

    $content.append(new ManagedCheckbox(this, 'Include DNF',
      'graphHistogramIncludeDNF').element());

    $element.append($content);
    return $element;
  };

  GraphSettings.prototype._generateMeanPage = function() {
    var $element = $('<div class="page"></div>');
    var $content = $('<div class="page-content"></div>');

    var scaleSlider = new IntegerSlider(new Slider(MINIMUM_SCALE,
      MAXIMUM_SCALE, 0));
    var scale = new ManagedSlider(this, scaleSlider, 'Scale', 'graphMeanScale',
      emptyStringFunc);
    $content.append(scale.element());

    var meanOfSlider = new IntegerSlider(new Slider(MINIMUM_MEAN_SIZE,
      MAXIMUM_MEAN_SIZE, 0));
    var meanOf = new ManagedSlider(this, meanOfSlider, 'Mean of',
      'graphMeanCount', formatInteger.bind(null, 'solves'));
    $content.append(meanOf.element());

    $content.append(new ManagedCheckbox(this, 'Show DNF',
      'graphMeanShowDNF').element());

    $element.append($content);
    return $element;
  };

  GraphSettings.prototype._generateStandardPage = function() {
    var $element = $('<div class="page"></div>');
    $element.append(new VisualModePicker(this).element());

    var $content = $('<div class="page-content"></div>');

    var scaleSlider = new IntegerSlider(new Slider(MINIMUM_SCALE,
      MAXIMUM_SCALE, 0));
    var scale = new ManagedSlider(this, scaleSlider, 'Scale',
      'graphStandardScale', emptyStringFunc);
    $content.append(scale.element());

    $content.append(new ManagedCheckbox(this, 'Show DNF',
      'graphStandardShowDNF').element());

    $element.append($content);
    return $element;
  };

  GraphSettings.prototype._generateStreakPage = function() {
    var $element = $('<div class="page"></div>');
    var $content = $('<div class="page-content"></div>');

    var scaleSlider = new IntegerSlider(new Slider(MINIMUM_SCALE,
      MAXIMUM_SCALE, 0));
    var scale = new ManagedSlider(this, scaleSlider, 'Scale',
      'graphStreakScale', emptyStringFunc);
    $content.append(scale.element());

    var thresholdRawSlider = new Slider(0, 1, 0);
    var thresholdSlider = new ScaledSlider(function(sliderValue) {
      return Math.round(500 * Math.exp(6.397 * sliderValue));
    }, function(modelValue) {
      return Math.log(modelValue / 500) / 6.397;
    }, thresholdRawSlider);
    var threshold = new ManagedSlider(this, thresholdSlider, 'Threshold',
      'graphStreakUpperBound', function(x) {
        return 'sub ' + window.app.formatSeconds(x);
      });
    $content.append(threshold.element());

    $content.append(new ManagedCheckbox(this, 'Use %',
      'graphStreakUsePercent').element());

    $content.append(new ManagedCheckbox(this, 'Include DNF',
      'graphStreakIncludeDNF').element());

    $element.append($content);
    return $element;
  };

  GraphSettings.prototype._registerModelEvents = function() {
    window.app.observe.activePuzzle('graphMode',
      this._updatePageFromModel.bind(this));
  };

  GraphSettings.prototype._updatePageFromModel = function() {
    var pageIdx = window.app.store.getActivePuzzle().graphMode;
    this._pageElements[this._currentPage].detach();
    this._currentPage = pageIdx;
    this._dropdown.element().before(this._pageElements[pageIdx]);
  };

  function ModeDropdown(emitter, $modeLabel) {
    this._$element = $('<ul class="mode-dropdown"></ul>').css({
      display: 'none'
    });
    this._$modeLabel = $modeLabel;

    this._showing = false;
    this._currentPage = 0;
    this._boundClickThru = this._clickThru.bind(this);

    this._options = [];
    for (var i = 0, len = ModeDropdown.MODE_NAMES.length; i < len; ++i) {
      var $option = $('<li></li>').text(ModeDropdown.MODE_NAMES[i]);
      this._$element.append($option);
      this._options.push($option);
      $option.click(function(index) {
        emitter.emit('modeChanged', index);
        this.hide();
      }.bind(this, i));
    }

    this._registerModelEvents();
    this._registerUIEvents();
    this._updateFromModel();
  }

  ModeDropdown.ANIMATION_DURATION = 150;
  ModeDropdown.MODE_NAMES = ['Standard', 'Mean', 'Histogram', 'Streak'];

  ModeDropdown.prototype.element = function() {
    return this._$element;
  };

  ModeDropdown.prototype.hide = function() {
    if (!this._showing) {
      return;
    }
    this._showing = false;
    this._$element.fadeOut(ModeDropdown.ANIMATION_DURATION);
    window.clickthru.removeListener(this._boundClickThru);
  };

  ModeDropdown.prototype.show = function() {
    if (this._showing) {
      return;
    }
    this._showing = true;
    this._$element.css({display: 'block', opacity: 1});
    window.clickthru.addListener(this._boundClickThru);
  };

  ModeDropdown.prototype._clickThru = function(e) {
    if (!e.inElement(this._$element[0]) &&
        !e.inElement(this._$modeLabel[0])) {
      this.hide();
    }
  };

  ModeDropdown.prototype._registerModelEvents = function() {
    window.app.observe.activePuzzle('graphMode',
      this._updateFromModel.bind(this));
  };

  ModeDropdown.prototype._registerUIEvents = function() {
    this._$modeLabel.click(function() {
      if (this._showing) {
        this.hide();
      } else {
        this.show();
      }
    }.bind(this));
  };

  ModeDropdown.prototype._updateFromModel = function() {
    var pageIdx = window.app.store.getActivePuzzle().graphMode;
    this._options[this._currentPage].removeClass('selected');
    this._currentPage = pageIdx;
    this._options[pageIdx].addClass('selected');
    this._$modeLabel.text(ModeDropdown.MODE_NAMES[pageIdx]);
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

    // This element is put in front of the entire page while the user drags the
    // slider so that no hover events can be triggered on the rest of the page.
    this._$shielding = $('<div></div>').css({
      position: 'fixed',
      width: '100%',
      height: '100%'
    });

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
      $(document.body).append(this._$shielding);

      clicked = true;
      update(e);

      // NOTE: this line prevents the cursor from changing in Safari on OS X. It
      // may have the same effect on other platforms as well.
      e.preventDefault();
    }.bind(this));
    $(document.body).mouseup(function() {
      clicked = false;
      this._$shielding.detach();
      this.emit('release');
    }.bind(this));
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
    slider.on('release', this.emit.bind(this, 'release'));
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

  // An IntegerSlider makes an integer only use whole values.
  function IntegerSlider(slider) {
    ScaledSlider.call(this, Math.round, Math.round, slider);
  };

  IntegerSlider.prototype = Object.create(ScaledSlider.prototype);

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
    this._slider.on('release', this._sliderReleased.bind(this));
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
    this._emitter.emit('settingChanging', this._modelKey,
      this._slider.getValue());
    this._updateLabel();
  };

  ManagedSlider.prototype._sliderReleased = function() {
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
    this._hoveringIndex = -1;
    var images = [LINE_GRAPH_IMAGE, BAR_GRAPH_IMAGE, DOT_GRAPH_IMAGE];
    for (var i = 0; i < 3; ++i) {
      var $viewMode = $('<div class="view-mode"></div>');
      var svg = new SVGImage(images[i]);
      $viewMode.addClass('view-mode-' + i);
      $viewMode.append(svg.element());
      this._$element.append($viewMode);
      $viewMode.click(this._handleClick.bind(this, i));
      this._registerHoverEvents($viewMode, i);
      this._svgs.push(svg);
    }

    this._updateFromModel();
    this._registerEvents();
  }

  VisualModePicker.prototype.element = function() {
    return this._$element;
  };

  VisualModePicker.prototype._colorSVG = function(i, color) {
    this._svgs[i].setColor(color);
  }

  VisualModePicker.prototype._handleClick = function(index) {
    this._emitter.emit('settingChanged', 'graphStandardType', index);
  };

  VisualModePicker.prototype._registerEvents = function() {
    window.app.observe.activePuzzle('graphStandardType',
      this._updateFromModel.bind(this));
    window.app.viewEvents.on('flavor.color', this._updateFromModel.bind(this));
  };

  VisualModePicker.prototype._registerHoverEvents = function($viewMode, i) {
    $viewMode.mouseenter(function() {
      $viewMode.css({backgroundColor: '#e6e6e6', cursor: 'pointer'});
      this._hoveringIndex = i;
      this._updateFromModel();
    }.bind(this));
    $viewMode.mouseleave(function() {
      $viewMode.css({backgroundColor: '', cursor: ''});
      if (this._hoveringIndex === i) {
        this._hoveringIndex = -1;
        this._updateFromModel();
      }
    }.bind(this));
  }

  VisualModePicker.prototype._updateFromModel = function() {
    var value = window.app.store.getActivePuzzle().graphStandardType;
    for (var i = 0; i < 3; ++i) {
      if (i === value) {
        this._colorSVG(i, window.app.flavors.getLastEmittedColor());
      } else {
        if (this._hoveringIndex === i) {
          this._colorSVG(i, '#999999');
        } else {
          this._colorSVG(i, '#d5d5d5');
        }
      }
    }
  };

  // SVGImage allows you to easily create and manipulate an SVG. I only need
  // this because IE's SVG DOM is very limited (whereas other browsers give a
  // findElementsByClassName function).
  function SVGImage(code) {
    this._element = $(code)[0];
    this._fillElements = [];
    this._strokeElements = [];
    this._findFillAndStroke();
  }

  // element gets the SVG element.
  SVGImage.prototype.element = function() {
    return this._element;
  };

  // setColor updates both the stroke and fill color of the SVG.
  SVGImage.prototype.setColor = function(color) {
    for (var i = 0, len = this._fillElements.length; i < len; ++i) {
      this._fillElements[i].setAttribute('fill', color);
    }
    for (var i = 0, len = this._strokeElements.length; i < len; ++i) {
      this._strokeElements[i].setAttribute('stroke', color);
    }
  };

  SVGImage.prototype._findFillAndStroke = function() {
    // Perform a breadth-first search on the SVG DOM.
    var nodes = [this._element];
    while (nodes.length > 0) {
      var node = nodes[0];
      nodes.splice(0, 1);
      var className = node.getAttribute('class');
      if ('string' === typeof className) {
        var classes = className.split(' ');
        if (classes.indexOf('svg-color-fill') >= 0) {
          this._fillElements.push(node);
        }
        if (classes.indexOf('svg-color-stroke') >= 0) {
          this._strokeElements.push(node);
        }
      }
      for (var i = 0, len = node.childNodes.length; i < len; ++i) {
        var aNode = node.childNodes[i];
        if (aNode.nodeName === '#text') {
          continue;
        }
        nodes.push(aNode);
      }
    }
  };

  function ManagedCheckbox(emitter, name, modelKey) {
    this._emitter = emitter;
    this._modelKey = modelKey;
    this._checkbox = window.app.flavors.makeCheckbox(
      window.app.store.getActivePuzzle()[this._modelKey]
    );
    var $checkElement = $(this._checkbox.element()).addClass('checkbox');
    this._$element = $('<div class="labeled-checkbox"></div>');
    this._$nameLabel = $('<label></label>').text(name);
    this._$element.append(this._$nameLabel, $checkElement);

    this._checkbox.onChange = this._handleChange.bind(this);
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

  function elementHasParent(element, parent) {
    var node = element;
    while (node) {
      if (node === parent) {
        return true;
      }
      node = node.parentNode;
    }
    return false;
  }

  function emptyStringFunc() {
    return '';
  }

  function formatInteger(unit, value) {
    return Math.round(value) + ' ' + unit;
  }

  window.app.Graph = Graph;

  // The following are three SVG images which are used for the graph settings.
  // Since the rest of the graph settings DOM is created programmatically, it
  // seems to make sense to create these programmatically as well. I do not use
  // external files for the SVGs because they are so small that it is much
  // easier to load them synchronously and adjust their colors immediately.

  var BAR_GRAPH_IMAGE = '<svg version="1.1" ' +
    'xmlns="http://www.w3.org/2000/svg" ' +
    'xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" ' +
    'viewBox="0 0 1000 1000" enable-background="new 0 0 1000 1000" ' +
    'preserveAspectRatio="xMidYMid meet" xml:space="preserve">' +
    '<g class="svg-color-fill">' +
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
    '<g><g><g>' +
    '<path class="svg-color-fill" fill-rule="evenodd" clip-rule="evenodd" '+
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
    '<g>' +
    '<path fill-rule="evenodd" clip-rule="evenodd" fill="none" ' +
    'class="svg-color-stroke" stroke-width="70" stroke-miterlimit="10" d="' +
    'M85.9,261c0,0,138.3,327.3,426.6,244.2S911,667.3,914.1,677.3"/>' +
    '</g></svg>';

})();
