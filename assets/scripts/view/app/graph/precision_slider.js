(function() {

  var IMAGE_WIDTH = 40;
  var IMAGE_HEIGHT = 15;
  var OUTWARD_RADIUS = 2;

  function GraphPrecisionSlider(changeEmitter) {
    this._images = generateImages();

    var slider = new window.app.DiscreteGraphSlider();

    var allowedValues = [];
    for (var i = 0; i < this._images.length; ++i) {
      allowedValues[i] = i / (this._images.length - 1);
    }
    slider.setAllowedValues(allowedValues);

    this._manager = new window.app.GraphSliderManager(slider,
      'graphHistogramPrecision', changeEmitter);
    this._$element = $('<div class="graph-settings-labeled-slider"></div>');
    this._$labels = $('<div class="graph-settings-slider-labels"></div>');
    this._$name = $('<label class="graph-settings-name-label"></label>');
    this._$amount = $('<div class="graph-settings-amount-label"></div>');

    this._$name.text('Precision');
    this._$amount.css({width: IMAGE_WIDTH, height: IMAGE_HEIGHT});
    this._$labels.append(this._$name, this._$amount);
    this._$element.append(this._$labels, slider.element());

    this._manager.on('change', this._updateLabel.bind(this));
    this._updateLabel();
  }

  GraphPrecisionSlider.prototype.element = function() {
    return this._$element;
  };

  GraphPrecisionSlider.prototype._updateLabel = function() {
    this._$amount.empty();
    var values = this._manager.getSlider().getAllowedValues();
    var val = this._manager.getSlider().getValue();
    for (var i = 0, len = values.length; i < len; ++i) {
      if (Math.abs(values[i] - val) < 0.0001) {
        this._$amount.append(this._images[i]);
        return;
      }
    }
  };

  function generateImages() {
    var images = [];
    for (var i = 5; i <= 11; ++i) {
      var spacing = Math.ceil(10 / i);
      var barWidth = Math.floor((IMAGE_WIDTH - spacing*(i+1)) / i);
      images.push(generateHistogramImage(i, barWidth, spacing));
    }
    return images;
  }

  function generateHistogramImage(count, barWidth, spacing) {
    var totalWidth = count*barWidth + (count-1)*spacing;
    var xOffset = (IMAGE_WIDTH - totalWidth) / 2;
    var viewBox = '0 0 '
    var svgData = '<svg viewBox="0 0 ' + IMAGE_WIDTH + ' ' + IMAGE_HEIGHT +
      '" version="1.1" style="width: 100%; height: 100%"><g fill="#777">';
    var xSpacing = OUTWARD_RADIUS * 2 / (count+1);
    for (var i = 0; i < count; ++i) {
      var xVal = -OUTWARD_RADIUS + (i+1)*xSpacing;
      var height = Math.floor(IMAGE_HEIGHT * Math.exp(-xVal * xVal / 2));
      var barXVal = xOffset + (spacing+barWidth)*i;
      // TODO: see if we don't need fill="inherit"
      svgData += '<rect fill="inherit" x="' + Math.floor(barXVal) + '" y="' +
        (IMAGE_HEIGHT-height) + '" width="' + barWidth + '" height="' +
        height + '" />';
    }
    return $(svgData + '</g></svg>');
  }
  
  window.app.GraphPrecisionSlider = GraphPrecisionSlider;

})();
