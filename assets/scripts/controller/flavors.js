// The "flavor" manages the color of pretty much everything.
(function() {
  
  // ANIMATION_DURATION is the duration of the flavor-change animation in
  // milliseconds.
  var ANIMATION_DURATION = 400;
  
  // ALTERNATION_PERIOD is the amount of time between flavor changes in the
  // alternating flavor.
  var ALTERNATION_PERIOD = 1000*60*60;
  
  // ALTERNATION_FLAVOR is the name of the flavor which alternates periodically.
  var ALTERNATION_FLAVOR = 'Fruit Salad';
  
  // FLAVORS will be used to associate colors with flavor names.
  var FLAVORS = {
    Blueberry: {
      color: [0x65, 0xbc, 0xd4]
    },
    Grape: {
      color: [0xad, 0x75, 0xc5]
    },
    Cherry: {
      color: [0xb9, 0x4e, 0x4e]
    },
    Peach: {
      color: [0xf1, 0x9e, 0x4d]
    },
    Pineapple: {
      color: [0xd9, 0xa9, 0x17]
    },
    Kiwi: {
      color: [0x27, 0xba, 0x92]
    },
    Oreo: {
      color: [0x1c, 0x1c, 0x1c]
    },
    Chocolate: {
      color: [0x81, 0x49, 0x38]
    }
  };
  
  var FLAVOR_NAMES = [];
  for (var key in FLAVORS) {
    if (FLAVORS.hasOwnProperty(key)) {
      FLAVOR_NAMES.push(key);
      FLAVORS[key].name = key;
    }
  }
  
  // An Animation animates the color change of every themed element.
  function Animation(oldColor, newColor) {
    this._updateColors = $('.flavor-text');
    this._updateBg = $('.flavor-background');
    this.onDone = null;
    this._oldColor = oldColor;
    this._newColor = newColor;
    this._cancelled = false;
    this._start = new Date().getTime();
    this._tick();
  }
  
  Animation.prototype.cancel = function() {
    this._cancelled = true;
  };
  
  Animation.prototype._requestFrame = function() {
    if ('function' === typeof window.requestAnimationFrame) {
      window.requestAnimationFrame(this._tick.bind(this));
    } else {
      setTimeout(this._tick.bind(this), 1000/60);
    }
  };
  
  Animation.prototype._tick = function() {
    if (this._cancelled) {
      return;
    }
    
    // Get the amount of the animation that's been completed.
    var elapsed = Math.max(new Date().getTime() - this._start, 0);
    var pct = elapsed/ANIMATION_DURATION;
    
    // If the animation is done, set everything to the new color and return.
    if (pct >= 1) {
      var color = hexForColor(this._newColor);
      if ('function' !== typeof this.onDone) {
        throw new Error('invalid onDone callback');
      }
      this.onDone();
      this._updateColors.css({color: ''});
      this._updateBg.css({backgroundColor: ''});
      return;
    }
    
    // Generate the intermediate color and set it everywhere.
    var frame = [];
    for (var i = 0; i < 3; ++i) {
      frame[i] = this._oldColor[i] + (this._newColor[i]-this._oldColor[i])*pct;
    }
    var hex = hexForColor(frame);
    this._updateColors.css({color: hex});
    this._updateBg.css({backgroundColor: hex});
    
    this._requestFrame();
  };
  
  // Flavors is the flavor manager. It must be created after the data store is
  // available.
  function Flavors() {
    // this._animation is the current change animation.
    this._animation = null;
    
    // this._checkboxes is used to update the flavor of checkboxes.
    this._checkboxes = [];
    
    // this._current stores the current flavor information.
    this._current = null;
    
    // this._alternationInterval is null unless the flavor is currently
    // ALTERNATION_FLAVOR.
    this._alternationInterval = null;
    
    // TODO: here, use the user-selected flavor.
    this._startAlternating();
    //this._initializeFlavor(ALTERNATION_FLAVOR);
    
    // Now that the flavor style is set correctly, we can set the body's
    // background color.
    document.body.className = 'flavor-background';
  }

  // current returns the name of the current flavor.
  Flavors.prototype.current = function() {
    if (this._alternationInterval !== null) {
      return ALTERNATION_FLAVOR;
    } else {
      return this._current.name;
    }
  };
  
  // makeCheckbox generates a checkbox that follows the theme color.
  Flavors.prototype.makeCheckbox = function() {
    var rgbColor = [];
    for (var i = 0; i < 3; ++i) {
      rgbColor[i] = this._current.color[i]/0xff;
    }
    var result = new window.checkboxjs.Checkbox(rgbColor);
    result.setVisible(true);
    this._checkboxes.push(result);
    return result;
  };
  
  // removeCheckbox stops updating the color of a given checkbox.
  Flavors.prototype.removeCheckbox = function(box) {
    var idx = this._checkboxes.indexOf(box);
    if (idx < 0) {
      throw new Error('checkbox not found');
    }
    this._checkboxes.splice(idx, 1);
  };
  
  // switchToFlavor animates to a new flavor.
  Flavors.prototype.switchToFlavor = function(name) {
    if (name === ALTERNATION_FLAVOR) {
      this._startAlternating();
    } else {
      this._animateToFlavor(name);
    }
  };
  
  // _animateToFlavor animates to a new flavor that's not the alternation
  // flavor.
  Flavors.prototype._animateToFlavor = function(name) {
    if (this._animation) {
      this._animation.cancel();
    }
    
    // Start an animation to the new color.
    if (this._current === null) {
      this._initializeFlavor(name);
      return;
    }
    
    // Animate the text and background color change.
    var color = FLAVORS[name].color;
    this._animation = new Animation(this._current.color, color);
    this._animation.onDone = function() {
      this._animation = null;
      this._initializeFlavor(name);
    }.bind(this);
    
    // Set colors of checkboxes.
    var rgbColor = [];
    for (var i = 0; i < 3; ++i) {
      rgbColor[i] = color[i]/0xff;
    }
    for (var i = 0, len = this._checkboxes.length; i < len; ++i) {
      this._checkboxes[i].setColor(rgbColor);
    }
  };
  
  // _initializeFlavor sets a flavor instantly without an animation.
  Flavors.prototype._initializeFlavor = function(name) {
    var color = FLAVORS[name].color;
    var hex = hexForColor(color);
    var pressed = [color[0]*0.8, color[1]*0.8, color[2]*0.8];
    var pressedHex = hexForColor(pressed);
    setFlavorStyle(hex, pressedHex);
    this._current = FLAVORS[name];
  }
  
  // _startAlternation begins the flavor alternation process.
  Flavors.prototype._startAlternating = function(alternating) {
    if (this._alternationInterval !== null) {
      clearInterval(this._alternationInterval);
    }
    var idx = Math.floor(Math.random() * FLAVOR_NAMES.length);
    this._alternationInterval = setInterval(function() {
      idx = (idx + 1) % FLAVOR_NAMES.length;
      this._animateToFlavor(FLAVOR_NAMES[idx]);
    }.bind(this), ALTERNATION_PERIOD);
    this._animateToFlavor(FLAVOR_NAMES[idx]);
  };
  
  // _stopAlternation stops the alternation process.
  Flavors.prototype._stopAlternating = function() {
    if (this._alternationInterval !== null) {
      clearInterval(this._alternationInterval);
      this._alternationInterval = null;
    }
  };
  
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
    // TODO: if we can, use document.styleSheets for this.
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
  window.app.flavorNames = FLAVOR_NAMES.slice();
  window.app.flavorNames.push(ALTERNATION_FLAVOR);
  
})();
