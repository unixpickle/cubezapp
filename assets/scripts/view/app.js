// Many aspects of the main app view interact.  For instance, the footer size
// effects the timer text size, the scramble length effects the footer size, the
// timer state effects the visibility of pretty much everything, etc.
//
// The AppView manages these interacting UI components. It does so by receiving
// callbacks from its subviews and from the DOM.

// In essence, the AppView is a magical genie.
(function() {

  var MIN_FOOTER_SIZE = 250;
  var MAX_FOOTER_SIZE = 400;
  
  function AppView() {
    // Initialize UI components and the animator.
    this._animator = new window.app.Animator();
    this._footer = new window.app.Footer();
    this._header = new window.app.Header();
    this._middle = new window.app.Middle();

    // Initialize state instance variables.
    this._state = null;
    this._userFooterHeight = parseInt(localStorage.footerHeight || '300');

    // Compute the initial state and lay it out.
    this._initializeState();
    this._initializeAnimator();

    // Setup event handlers.
    $(window).resize(this._resized.bind(this));
    this._footer.onToggle = this._toggleFooter.bind(this);
  }

  AppView.prototype._computeState = function() {
    var constraints = this._middle.constraints();
    var available = $(window).height() - this._header.height();
    var headerSize = available - constraints.soft;
    if (headerSize > MIN_HEADER_SIZE) {
      // TODO: something
    }
    if (headerSize < MIN_HEADER_SIZE) {
      if (this._showingScramble) {
        // TODO: something
      }
    }
  };

  AppView.prototype._initializeAnimator = function() {
  };

  AppView.prototype._initializeState = function() {
    // Create the initial state without any input from the UI.
    // We do this mainly so that this._computeState() can work.
    var open = (localStorage.footerOpen === 'true');
    this._state = new State({
      footerOpen: open,
      footerVisible: false,
      scrambleAvailable: false,
      scrambleVisible: false
    });

    // Figure out whether or not the footer should be visible.
  };
  
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
    this.footerHeight = attrs.footerHeight;
  }
  
  window.app.AppView = AppView;
  
})();
