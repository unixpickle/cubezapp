// The "flavor" manages the color of pretty much everything.
(function() {
  
  // FLAVORS will be used to associate colors with flavor names.
  var FLAVORS = {
    Blueberry: {
      color: [0x65, 0xbc, 0xd4]
    },
    Banana: {
      color: [0xbb, 0xbb, 0]
    }
  };
  
  // Flavors is the flavor manager. It must be created after the data store is
  // available.
  function Flavors() {
    // this._checkboxes is used to update the theme of checkboxes.
    this._checkboxes = [];
    
    // this._current stores the current theme information.
    this._current = null;
    
    // TODO: here, use the user-selected theme.
    this._initializeTheme('Blueberry');
    
    // Now that the theme style is set correctly, we can set the body's
    // background color.
    document.body.className = 'theme-background';
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
  
  Flavors.prototype.switchToTheme = function(name) {
    // TODO: animate the theme change here...
    this._initializeTheme(name);
    
    // Set colors of checkboxes.
    var rgbColor = [];
    for (var i = 0; i < 3; ++i) {
      rgbColor[i] = this._current.color[i]/0xff;
    }
    for (var i = 0, len = this._checkboxes.length; i < len; ++i) {
      this._checkboxes[i].setColor(rgbColor);
    }
  };
  
  Flavors.prototype._initializeTheme = function(name) {
    var color = FLAVORS[name].color;
    var hex = hexForColor(color);
    var pressed = [color[0]*0.8, color[1]*0.8, color[2]*0.8];
    var pressedHex = hexForColor(pressed);
    setThemeStyle(hex, pressedHex);
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
  
  function setThemeStyle(color, hover) {
    // If we don't have true stylesheet control, we will try modifying the
    // stylesheet object itself.
    // TODO: actually support stylesheets here...
    var isAlexLazy = true;
    if (!('styleSheets' in document) || isAlexLazy) {
      var obj = document.getElementById('flavor-style');
      if (!obj) {
        // If the stylesheet can't be identified, give up.
        return;
      }
      obj.innerHTML = '\
        .theme-background { \n\
          background-color: ' + color + '; \n\
        } \n\
        .theme-text { \n\
          color: ' + color + '; \n\
        } \n\
        button.theme-background:hover { \n\
          background-color: ' + hover + '; \n\
        }';
      return;
    }
  }
  
  window.app.Flavors = Flavors;
  
})();