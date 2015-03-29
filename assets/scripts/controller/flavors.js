// The "flavor" manages the color of pretty much everything.
(function() {
  
  var ANIMATION_DURATION = 400;
  
  // FLAVORS will be used to associate colors with flavor names.
  var FLAVORS = {
    Blueberry: {
      color: [0x65, 0xbc, 0xd4]
    },
    Banana: {
      color: [0xcc, 0xcc, 0x00]
    },
    Grape: {
      color: [0x5e, 0x17, 0x78]
    }
  };
  
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
      this._updateColors.css({color: color});
      this._updateBg.css({backgroundColor: color});
      if ('function' !== typeof this.onDone) {
        throw new Error('invalid onDone callback');
      }
      this.onDone();
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
    
    // TODO: here, use the user-selected flavor.
    this._initializeFlavor('Blueberry');
    
    // Now that the flavor style is set correctly, we can set the body's
    // background color.
    document.body.className = 'flavor-background';
  }
  
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
  
  Flavors.prototype.removeCheckbox = function(box) {
    var idx = this._checkboxes.indexOf(box);
    if (idx < 0) {
      throw new Error('checkbox not found');
    }
    this._checkboxes.splice(idx, 1);
  };
  
  Flavors.prototype.switchToFlavor = function(name) {
    if (this._animation) {
      this._animation.cancel();
    }
    
    // Start an animation to the new color.
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
  
  Flavors.prototype._initializeFlavor = function(name) {
    var color = FLAVORS[name].color;
    var hex = hexForColor(color);
    var pressed = [color[0]*0.8, color[1]*0.8, color[2]*0.8];
    var pressedHex = hexForColor(pressed);
    setFlavorStyle(hex, pressedHex);
    this._current = FLAVORS[name];
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
    // TODO: if we can, use document.styleSheets for this.
    
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
  
})();