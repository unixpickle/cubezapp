// The "flavor" manages the color of pretty much everything.
(function() {

  // ALTERNATION_FLAVOR is the name of the flavor which alternates periodically.
  var ALTERNATION_FLAVOR = 'Fruit Salad';

  // ALTERNATION_PERIOD is the number of milliseconds between flavor changes for
  // the alternating flavor.
  var ALTERNATION_PERIOD = 1000*60*60;

  // TRANSITION_DURATION is the number of milliseconds to spend fading from one
  // color to another.
  var TRANSITION_DURATION = 400;

  // COLOR_FLAVORS contains a key for every solid color flavor.
  var COLOR_FLAVORS = {
    Blueberry: {
      color: [0x65, 0xbc, 0xd4]
    },
    Grape: {
      color: [0xad, 0x75, 0xc5]
    },
    Strawberry: {
      color: [0xe3, 0x6a, 0x8f]
    },
    Peach: {
      color: [0xf1, 0x9e, 0x4d]
    },
    Pineapple: {
      color: [0xd9, 0xa9, 0x17]
    },
    Banana: {
      color: [0xde, 0xc4, 0x32]
    },
    Pear: {
      color: [0x33, 0xbe, 0x6e]
    },
    Oreo: {
      color: [0x1c, 0x1c, 0x1c]
    },
    Chocolate: {
      color: [0x81, 0x49, 0x38]
    }
  };

  // NOTE: do not use Object.keys() here because it is not guaranteed to
  // preserve the proper order.
  var COLOR_FLAVOR_NAMES = [
    'Blueberry',
    'Grape',
    'Strawberry',
    'Peach',
    'Pineapple',
    'Banana',
    'Pear',
    'Oreo',
    'Chocolate'
  ];

  var lastEmittedColor = '#000000';

  // Flavors is the flavor manager. It must be created after the model is
  // loaded.
  function Flavors() {
    handleColorHashtagURLs();

    // this._alternationIndex is used to make sure that alternation does not
    // repeat itself.
    this._alternationIndex = 0;

    // this._alternationInterval is null unless the flavor is
    // ALTERNATION_FLAVOR, in which case it is the result of a setInterval()
    // call.
    this._alternationInterval = null;

    // this._checkboxes is used to update the flavor of checkboxes.
    this._checkboxes = [];

    // this._currentColorFlavor stores an object from COLOR_FLAVORS.
    this._currentColorFlavor = null;

    // this._currentName stores the name of the current flavor. This will be
    // ALTERNATION_FLAVOR if the flavor is alternating.
    this._currentName = null;

    // this._transition is the current Transition object.
    this._transition = null;

    var flavor = this.idToName(window.app.store.getGlobalSettings().flavor);
    this._initializeFlavor(flavor);

    this._registerModelEvents();

    // Now that the flavor style is set correctly, we can set the body's
    // background color.
    document.body.className = 'flavor-background';
  }

  // getLastEmittedColor returns the last hex color code that was emitted as the
  // flavor color. This is useful for determining the hex color to use for a new
  // custom element.
  Flavors.prototype.getLastEmittedColor = function() {
    return lastEmittedColor;
  };

  // idToName converts a flavor ID to a flavor name.
  Flavors.prototype.idToName = function(id) {
    if (id === '#') {
      return ALTERNATION_FLAVOR;
    }
    var parsed = colorForHex(id);
    if (parsed === null) {
      return COLOR_FLAVOR_NAMES[0];
    }
    var closest = null;
    var difference = 0xff*3;
    for (var i = 0, len = COLOR_FLAVOR_NAMES.length; i < len; ++i) {
      var name = COLOR_FLAVOR_NAMES[i];
      var color = COLOR_FLAVORS[name].color;
      var diff = 0;
      for (var j = 0; j < 3; ++j) {
        diff += Math.abs(color[j] - parsed[j]);
      }
      if (diff < difference) {
        difference = diff;
        closest = name;
      }
    }
    return closest;
  };

  // makeCheckbox generates a checkbox that follows the theme color.
  Flavors.prototype.makeCheckbox = function() {
    var rgbColor = [];
    for (var i = 0; i < 3; ++i) {
      rgbColor[i] = this._currentColorFlavor.color[i] / 0xff;
    }
    var result = new window.checkboxjs.Checkbox(rgbColor);
    result.setVisible(true);
    this._checkboxes.push(result);
    return result;
  };

  // nameToId converts a flavor name to an ID.
  Flavors.prototype.nameToId = function(name) {
    if (name === ALTERNATION_FLAVOR) {
      return '#';
    }
    var color = COLOR_FLAVORS[name].color;
    return hexForColor(color);
  };

  // removeCheckbox stops updating the color of a given checkbox.
  Flavors.prototype.removeCheckbox = function(box) {
    var idx = this._checkboxes.indexOf(box);
    if (idx < 0) {
      throw new Error('checkbox not found');
    }
    this._checkboxes.splice(idx, 1);
  };

  // _alternate is called periodically when using ALTERNATION_FLAVOR to change
  // the color flavor.
  Flavors.prototype._alternate = function() {
    this._alternationIndex = (this._alternationIndex + 1) %
      COLOR_FLAVOR_NAMES.length;
    this._transitionToColorFlavor(COLOR_FLAVOR_NAMES[this._alternationIndex]);
  };

  Flavors.prototype._emitColor = function() {
    var color = this._currentColorFlavor.color;
    var hex = hexForColor(color);
    emitFlavorColor(hex);
  };

  Flavors.prototype._initializeFlavor = function(name) {
    this._currentName = name;
    if (name === ALTERNATION_FLAVOR) {
      this._startAlternating();
    } else {
      this._currentColorFlavor = COLOR_FLAVORS[name];
      this._updateCSS();
      this._emitColor();
    }
  };

  Flavors.prototype._modelFlavorChanged = function(name) {
    this._currentName = name;
    this._transitionToFlavor(name);
  };

  Flavors.prototype._registerModelEvents = function() {
    window.app.observe.globalSettings('flavor', function() {
      this._modelFlavorChanged(
        this.idToName(window.app.store.getGlobalSettings().flavor)
      );
    }.bind(this));
  };

  Flavors.prototype._startAlternating = function(alternating) {
    if (this._alternationInterval !== null) {
      clearInterval(this._alternationInterval);
    }

    this._alternationInterval = setInterval(this._alternate.bind(this),
      ALTERNATION_PERIOD);
    this._alternationIndex = Math.floor(COLOR_FLAVOR_NAMES.length *
      Math.random());

    var newColorFlavorName = COLOR_FLAVOR_NAMES[this._alternationIndex];
    var newColorFlavor = COLOR_FLAVORS[newColorFlavorName];
    if (newColorFlavor === this._currentColorFlavor) {
      this._alternate();
    } else if (this._currentColorFlavor === null) {
      this._currentColorFlavor = newColorFlavor;
      this._updateCSS();
      this._emitColor();
    } else {
      this._transitionToColorFlavor(newColorFlavorName);
    }
  };

  Flavors.prototype._stopAlternating = function() {
    if (this._alternationInterval !== null) {
      clearInterval(this._alternationInterval);
      this._alternationInterval = null;
    }
  };

  Flavors.prototype._transitionToColorFlavor = function(name) {
    if (this._transition) {
      this._transition.cancel();
    }

    var lastColor = this._currentColorFlavor.color;
    this._currentColorFlavor = COLOR_FLAVORS[name];

    var newColor = this._currentColorFlavor.color;
    this._transition = new Transition(lastColor, newColor);
    this._transition.onDone = function() {
      this._transition = null;
      this._updateCSS();
      this._emitColor();
    }.bind(this);

    this._updateCheckboxColors();
  };

  Flavors.prototype._transitionToFlavor = function(name) {
    if (name === ALTERNATION_FLAVOR) {
      this._startAlternating();
      return;
    }

    this._stopAlternating();
    this._transitionToColorFlavor(name);
  };

  Flavors.prototype._updateCSS = function() {
    var color = this._currentColorFlavor.color;
    var hex = hexForColor(color);
    var pressed = [color[0]*0.8, color[1]*0.8, color[2]*0.8];
    var pressedHex = hexForColor(pressed);
    setFlavorStyle(hex, pressedHex);
  };

  Flavors.prototype._updateCheckboxColors = function() {
    var colorComponents = [];
    for (var i = 0; i < 3; ++i) {
      colorComponents[i] = this._currentColorFlavor.color[i] / 0xff;
    }
    for (var i = 0, len = this._checkboxes.length; i < len; ++i) {
      this._checkboxes[i].setColor(colorComponents);
    }
  };

  // A Transition animates every themed element from one color to another.
  function Transition(oldColor, newColor) {
    this._updateColors = $('.flavor-text');
    this._updateBg = $('.flavor-background');
    this.onDone = null;
    this._oldColor = oldColor;
    this._newColor = newColor;
    this._cancelled = false;
    this._start = new Date().getTime();
    this._tick();
  }

  Transition.prototype.cancel = function() {
    this._cancelled = true;
  };

  Transition.prototype._intermediateColor = function(percent) {
    var components = [];
    for (var i = 0; i < 3; ++i) {
      components[i] = (this._newColor[i]-this._oldColor[i])*percent +
        this._oldColor[i];
    }
    return hexForColor(components);
  };

  Transition.prototype._percentCompleted = function() {
    var elapsed = Math.max(new Date().getTime() - this._start, 0);
    return elapsed / TRANSITION_DURATION;
  };

  Transition.prototype._requestFrame = function() {
    if ('function' === typeof window.requestAnimationFrame) {
      window.requestAnimationFrame(this._tick.bind(this));
    } else {
      setTimeout(this._tick.bind(this), 1000/60);
    }
  };

  Transition.prototype._tick = function() {
    if (this._cancelled) {
      return;
    }

    var percent = this._percentCompleted();

    if (percent >= 1) {
      var color = hexForColor(this._newColor);
      if ('function' !== typeof this.onDone) {
        throw new Error('invalid onDone callback');
      }
      this.onDone();
      this._updateColors.css({color: ''});
      this._updateBg.css({backgroundColor: ''});
      return;
    }

    var color = this._intermediateColor(percent);
    this._updateColors.css({color: color});
    this._updateBg.css({backgroundColor: color});
    emitFlavorColor(color);

    this._requestFrame();
  };

  function colorForHex(hex) {
    if (hex[0] !== '#' || hex.length != 7) {
      return null;
    }
    var res = [];
    for (var i = 0; i < 3; ++i) {
      var val = parseInt(hex.substr(1 + 2*i, 2), 16);
      if (isNaN(val)) {
        return null;
      }
      res[i] = val;
    }
    return res;
  }

  function emitFlavorColor(color) {
    lastEmittedColor = color;
    window.app.viewEvents.emitFlavorColor(color);
  }

  function handleColorHashtagURLs() {
    var hash = (window.location.hash || '');
    var color = colorForHex(hash);
    if (color !== null) {
      COLOR_FLAVORS[hash] = {color: color};
      COLOR_FLAVOR_NAMES.push(hash);
      window.app.flavorNames = COLOR_FLAVOR_NAMES.slice();
      window.app.flavorNames.push(ALTERNATION_FLAVOR);
      window.app.store.modifyGlobalSettings({flavor: hash});
    }
  }

  function hexForColor(color) {
    var hexCode = '#';
    for (var i = 0; i < 3; ++i) {
      var hexNum = Math.floor(color[i]).toString(16);
      if (hexNum.length === 1) {
        hexCode += '0';
      }
      hexCode += hexNum;
    }
    return hexCode;
  }

  function setFlavorStyle(color, hover) {
    if (document.styleSheets) {
      var rulesLeft = 3;
      for (var i = document.styleSheets.length-1; i >= 0; --i) {
        var sheet = document.styleSheets[i];

        // Get the rule for the given sheet.
        var rules;
        if (sheet.cssRules) {
          rules = sheet.cssRules;
        } else {
          rules = sheet.rules;
        }

        // Loop through the rules and check if they are what we want.
        for (var j = 0, len = rules.length; j < len; j++) {
          var rule = rules[j];
          var selector = rule.selectorText.toLowerCase();
          if (selector === '.flavor-background') {
            rule.style.setProperty('background-color', color);
            --rulesLeft;
          } else if (selector == '.flavor-text') {
            rule.style.setProperty('color', color);
            --rulesLeft;
          } else if (selector == 'button.flavor-background:hover') {
            rule.style.setProperty('background-color', hover);
            --rulesLeft;
          }
          if (rulesLeft === 0) {
            return;
          }
        }
      }
    }

    var obj = document.getElementById('flavor-style');
    if (!obj) {
      // If the stylesheet can't be identified, give up.
      return;
    }

    // Create the new flavor stylesheet.
    obj.innerHTML = '\
      .flavor-background { \n\
        background-color: ' + color + '; \n\
      } \n\
      .flavor-text { \n\
        color: ' + color + '; \n\
      } \n\
      button.flavor-background:hover { \n\
        background-color: ' + hover + '; \n\
      }';
  }

  window.app.Flavors = Flavors;
  window.app.flavorNames = COLOR_FLAVOR_NAMES.slice();
  window.app.flavorNames.push(ALTERNATION_FLAVOR);

})();
