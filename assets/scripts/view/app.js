(function() {
  
  function AppView() {
    // Create instance variables
    this._animator = new window.app.Animator();
    this._footer = new window.app.Footer();
    this._state = null;

    // Setup event handlers.
    $(window).resize(this._resized.bind(this));
    this._footer.onToggle = this._toggleFooter.bind(this);
  }
  
  AppView.prototype._resized = function() {
  };

  AppView.prototype._toggleFooter = function() {
    // TODO: open/close footer here and animate the change.
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
