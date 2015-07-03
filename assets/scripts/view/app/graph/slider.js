(function() {

  function GraphSlider() {
    window.app.EventEmitter.call(this);

    this._$element = $('<div class="graph-settings-slider">' +
      '<div class="graph-settings-slider-background"></div>' +
      '<div class="graph-settings-slider-container">' +
      '<div class="graph-settings-slider-highlight flavor-background">' +
      '</div><div class="graph-settings-slider-knob"></div></div>');
    this._$highlight = this._$element.find('.graph-settings-slider-highlight');
    this._$knob = this._$element.find('.graph-settings-slider-knob');

    // This element is put in front of the entire page while the user drags the
    // slider so that no hover events can be triggered on the rest of the page.
    this._$shielding = $('<div></div>').css({
      position: 'fixed',
      width: '100%',
      height: '100%'
    });

    this._min = 0;
    this._max = 1;
    this._value = 0.5;

    this._registerMouseEvents();
    this._updateUI();
  }

  GraphSlider.prototype = Object.create(window.app.EventEmitter.prototype);

  GraphSlider.prototype.element = function() {
    return this._$element;
  };

  GraphSlider.prototype.getMax = function() {
    return this._max;
  };

  GraphSlider.prototype.getMin = function() {
    return this._min;
  };

  GraphSlider.prototype.getValue = function() {
    return this._value;
  };

  GraphSlider.prototype.setMax = function(max) {
    this._max = max;
    this.setValue(this._value);
  };

  GraphSlider.prototype.setMin = function(min) {
    this._min = min;
    this.setValue(this._value);
  };

  GraphSlider.prototype.setValue = function(val) {
    this._value = Math.max(Math.min(val, this._max), this._min);
    this._updateUI();
  };

  GraphSlider.prototype._registerMouseEvents = function() {
    var clicked = false;
    var update = this._updateForMouseEvent.bind(this);
    this._$element.mousedown(function(e) {
      $(document.body).append(this._$shielding);

      clicked = true;
      update(e);

      // NOTE: this line of code prevents the cursor from changing on drag in
      // Safari on OS X. It may have the same effect on other platforms as well.
      e.preventDefault();
    }.bind(this));
    $(document.body).mouseup(function() {
      if (!clicked) {
        return;
      }
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

  GraphSlider.prototype._updateForMouseEvent = function(e) {
    var x = e.pageX - this._$element.offset().left;
    var startX = this._$knob.width() / 2;
    var endX = this._$element.width() - startX;

    var fraction = (x - startX) / (endX - startX);
    fraction = Math.max(Math.min(fraction, 1), 0);

    var oldValue = this.getValue();
    this.setValue(fraction*(this._max-this._min) + this._min);

    // NOTE: the user may not have actually changed the value if the mouse moved
    // along the y-axis but not the x-axis. This if-statement prevents
    // extraneous events.
    if (oldValue !== this.getValue()) {
      this.emit('change');
    }
  };

  GraphSlider.prototype._updateUI = function() {
    if (this._min >= this._max) {
      return;
    }
    var fraction = (this._value - this._min) / (this._max - this._min);
    var percent = (fraction * 100).toFixed(1) + '%';
    this._$knob.css({left: percent});
    this._$highlight.css({width: percent});
  };

  function DiscreteGraphSlider() {
    GraphSlider.call(this);
    this._allowedValues = null;
  }

  DiscreteGraphSlider.prototype = Object.create(GraphSlider.prototype);

  DiscreteGraphSlider.prototype.getAllowedValues = function() {
    return this._allowedValues;
  };

  DiscreteGraphSlider.prototype.setAllowedValues = function(v) {
    this._allowedValues = v;
    this.setValue(this.getValue());
  };

  DiscreteGraphSlider.prototype.setValue = function(v) {
    if (this._allowedValues === null) {
      GraphSlider.prototype.setValue.call(this, v);
      return;
    }
    var closestAllowed = this._allowedValues[0];
    var distance = Math.abs(closestAllowed - v);
    for (var i = 1, len = this._allowedValues.length; i < len; ++i) {
      var val = this._allowedValues[i];
      var dist = Math.abs(val - v);
      if (dist < distance) {
        distance = dist;
        closestAllowed = val;
      }
    }
    GraphSlider.prototype.setValue.call(this, closestAllowed);
  };

  function TranslatedGraphSlider(slider) {
    window.app.EventEmitter.call(this);
    this._slider = slider;
    this._sliderToExternal = function(x) {
      return x;
    };
    this._externalToSlider = function(x) {
      return x;
    };
    this._slider.on('change', this.emit.bind(this, 'change'));
    this._slider.on('release', this.emit.bind(this, 'release'));
  }

  TranslatedGraphSlider.prototype =
    Object.create(window.app.EventEmitter.prototype);

  TranslatedGraphSlider.prototype.element = function() {
    return this._slider.element();
  };

  TranslatedGraphSlider.prototype.getExternalToSlider = function() {
    return this._externalToSlider;
  };

  TranslatedGraphSlider.prototype.getMax = function() {
    return this._sliderToExternal(this._slider.getMax());
  };

  TranslatedGraphSlider.prototype.getMin = function() {
    return this._sliderToExternal(this._slider.getMin());
  };

  TranslatedGraphSlider.prototype.getSliderToExternal = function() {
    return this._sliderToExternal();
  };

  TranslatedGraphSlider.prototype.getValue = function() {
    return this._sliderToExternal(this._slider.getValue());
  };

  TranslatedGraphSlider.prototype.setExternalToSlider = function(f) {
    this._externalToSlider = f;
  };

  TranslatedGraphSlider.prototype.setMax = function(max) {
    this._slider.setMax(this._externalToSlider(max));
  };

  TranslatedGraphSlider.prototype.setMin = function(min) {
    this._slider.setMin(this._externalToSlider(min));
  };

  TranslatedGraphSlider.prototype.setSliderToExternal = function(f) {
    this._sliderToExternal = f;
  };

  TranslatedGraphSlider.prototype.setValue = function(v) {
    this._slider.setValue(this._externalToSlider(v));
  };

  // A GraphSliderManager makes sure a slider updates the controller with
  // changes and updates the slider to reflect changes in the model.
  //
  // A GraphSliderManager will emit 'change' events whenever the value of the
  // slider changes due to the model or the user dragging the slider.
  function GraphSliderManager(slider, modelKey, changeEmitter) {
    window.app.EventEmitter.call(this);

    this._slider = slider;
    this._modelKey = modelKey;
    this._changeEmitter = changeEmitter;

    this._slider.on('change', this._handleChange.bind(this));
    this._slider.on('release', this._handleRelease.bind(this));
    this._registerModelEvents();

    slider.setValue(window.app.store.getActivePuzzle()[this._modelKey]);
  }

  GraphSliderManager.prototype =
    Object.create(window.app.EventEmitter.prototype);

  GraphSliderManager.prototype.changedExternally = function() {
    this._changeEmitter.emit('settingChanged', this._modelKey,
      this._slider.getValue());
    this.emit('change');
  };

  GraphSliderManager.prototype.getSlider = function() {
    return this._slider;
  };

  GraphSliderManager.prototype._handleChange = function() {
    this._changeEmitter.emit('settingChanging', this._modelKey,
      this._slider.getValue());
    this.emit('change');
  };

  GraphSliderManager.prototype._handleRelease = function() {
    this._changeEmitter.emit('settingChanged', this._modelKey,
      this._slider.getValue());
  };

  GraphSliderManager.prototype._registerModelEvents = function() {
    window.app.observe.activePuzzle(this._modelKey, function() {
      var newVal = window.app.store.getActivePuzzle()[this._modelKey];
      if (this._slider.getValue() !== newVal) {
        this._slider.setValue(newVal);
        this.emit('change');
      }
    }.bind(this));
  };

  function LabeledGraphSlider(manager, name) {
    this._manager = manager;
    this._$element = $('<div class="graph-settings-labeled-slider"></div>');
    this._$labels = $('<div class="graph-settings-slider-labels"></div>');
    this._$name = $('<label class="graph-settings-name-label"></label>');
    this._$amount = $('<label class="graph-settings-amount-label"></label>');

    this._$name.text(name);
    this._$labels.append(this._$name, this._$amount);
    this._$element.append(this._$labels, manager.getSlider().element());

    this._labelFunc = function() {
      return '';
    };

    manager.on('change', this._updateLabel.bind(this));
  }

  LabeledGraphSlider.prototype.element = function() {
    return this._$element;
  };

  LabeledGraphSlider.prototype.getManager = function() {
    return this._manager;
  };

  LabeledGraphSlider.prototype.getSlider = function() {
    return this._manager.getSlider();
  };

  LabeledGraphSlider.prototype.setLabelFunc = function(f) {
    this._labelFunc = f;
    this._updateLabel();
  };

  LabeledGraphSlider.prototype._updateLabel = function() {
    this._$amount.text(this._labelFunc(this.getSlider().getValue()));
  };

  window.app.GraphSlider = GraphSlider;
  window.app.DiscreteGraphSlider = DiscreteGraphSlider;
  window.app.TranslatedGraphSlider = TranslatedGraphSlider;
  window.app.GraphSliderManager = GraphSliderManager;
  window.app.LabeledGraphSlider = LabeledGraphSlider;

})();
