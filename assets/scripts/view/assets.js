(function() {

  window.app.iconFiles = [
    '2x2x2', '3x3x3', '4x4x4', '5x5x5', '6x6x6', '7x7x7', 'BLD', 'clock',
    'feet', 'fox', 'megaminx', 'OH', 'pyraminx', 'skewb', 'square1'
  ];

  window.app.iconNames = [
    '2x2x2', '3x3x3', '4x4x4', '5x5x5', '6x6x6', '7x7x7', 'BLD',
    "Rubik's Clock", 'Feet', 'Fox', 'Megaminx', 'OH', 'Pyraminx', 'Skewb',
    'Square-1'
  ];

  window.app.iconFilesToNames = {
  };

  for (var i = 0, len = window.app.iconFiles.length; i < len; ++i) {
    var file = window.app.iconFiles[i];
    var name = window.app.iconNames[i];
    window.app.iconFilesToNames[file] = name;
  }

})();
