(function() {
  
  function layout() {
    window.app.footer.layout();
  }
  
  $(function() {
    window.app.footer = new window.app.Footer();
    $(window).resize(layout);
  });
  
})();