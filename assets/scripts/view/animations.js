(function() {
  
  window.app.runShakeAnimation = function(element) {
    var prefixes = ['webkitAnimation', 'animation'];
    for (var i = 0; i < 2; ++i) {
      var prefix = prefixes[i];
      element.style[prefix + 'Name'] = 'shake';
      element.style[prefix + 'Duration'] = '0.5s';
      element.style[prefix + 'Direction'] = 'normal';
      element.style[prefix + 'Delay'] = '0s';
      element.style[prefix + 'FillMode'] = 'none';
    }
    element.addEventListener('animationend', function() {
      element.style.animationName = 'none';
      element.style.webkitAnimationName = 'none';
    });
    element.addEventListener('webkitAnimationEnd', function() {
      element.style.animationName = 'none';
      element.style.webkitAnimationName = 'none';
    });
  };
  
})();