(function() {
  
  function AppView() {
    this.footer = new window.app.Footer();
    $(window).resize(this.layout.bind(this));
    this.layout();
  }
  
  AppView.prototype.layout = function() {
    this.footer.layout($(window).height() - 300);
  };
  
  function State(attrs) {
    this.footerOpen = attrs.footerOpen;
    this.footerVisible = attrs.footerVisible;
    this.scrambleAvailable = attrs.scrambleAvailable;
    this.scrambleVisible = attrs.scrambleVisible;
  }
  
  State.prototype.equals = function(attrs) {
    return this.footerOpen === attrs.footerOpen &&
      this.footerVisible === attrs.footerVisible &&
      this.scrambleAvailable === attrs.scrambleAvailable &&
      this.scrambleVisible === attrs.scrambleVisible;
  };
  
  window.app.AppView = AppView;
  
})();