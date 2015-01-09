(function() {
  
  $(function() {
    var canvas = $('#pentagons')[0];
    var pents = new window.app.Pentagons(canvas);
    pents.begin();
    var resizeFunc = function() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      pents.draw();
    };
    $(window).resize(resizeFunc);
    resizeFunc();
  });
  
})();
