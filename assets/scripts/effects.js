(function() {
  
  window.addEventListener('load', function() {
    var pentsCanvas = document.getElementById('pentagons');
    var pents = new window.app.Pentagons(pentsCanvas);
    pents.begin();
    pentsCanvas.width = window.innerWidth;
    pentsCanvas.height = window.innerHeight;
  });

  window.addEventListener('resize', function() {
    var pentsCanvas = document.getElementById('pentagons');
    pentsCanvas.width = window.innerWidth;
    pentsCanvas.height = window.innerHeight;
  });
  
})();
