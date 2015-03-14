(function() {
  
  function AppView() {
    this.footer = new window.app.Footer();
    $(window).resize(this.layout.bind(this));
    this.layout();
  }
  
  AppView.prototype.layout = function() {
    this.footer.layout($(window).height() - 300);
  };
  
  window.app.AppView = AppView;
  
})();