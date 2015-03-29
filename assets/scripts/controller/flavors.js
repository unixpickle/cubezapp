// The "flavor" manages the color of pretty much everything.
(function() {
  
  // FLAVORS will be used to associate colors with flavor names.
  var FLAVORS = {
    Blueberry: {
      color: [0x65, 0xbc, 0xd4]
    }
  };
  
  // Flavors is the flavor manager. It must be created after the data store is
  // available.
  function Flavors() {
    // TODO: here, use the user-selected theme.
    setThemeStyle('#65bcd4', '#5196aa');
    
    // Now that the theme style is set correctly, we can set the body's
    // background color.
    document.body.className = 'theme-background';
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