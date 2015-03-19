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

    // Setup event handlers.
    $(window).resize(this._resized.bind(this));
    this._footer.onToggle = this._toggleFooter.bind(this);
    this._footer.onResize = this._footerResized.bind(this);
    this._animator.onAnimate = this._layout.bind(this);
    
    // Compute the initial state and lay it out.
    this._initializeState();
    this._initializeAnimator();
    this._layout(this._animator.current());
  }
  
  AppView.prototype._computeMiddleLayout = function() {
    // Figure out the size of everything on-screen for the current state.
    var windowHeight = $(window).height();
    
    // Compute the size taken up by the footer.
    var footerHeight = this._state.footerHeight;
    if (!this._state.footerOpen) {
      footerHeight = this._footer.closedHeight();
    }
    if (!this._state.footerVisible) {
      footerHeight = 0;
    }
    
    // Compute the size taken up by the header.
    var headerHeight = 0;
    if (this._state.headerVisible) {
      headerHeight = this._header.height();
    }
    
    // Return the layout of the middle part.
    var middleHeight = windowHeight - (headerHeight + footerHeight);
    return this._middle.computeLayout(middleHeight,
      this._state.scrambleVisible);
  };

  AppView.prototype._computeState = function() {
    var constraints = this._middle.constraints();
    var available = $(window).height() - this._header.height();
    var headerSize = available - constraints.soft;
    
    // If the header size is large enough, everything is visible.
    if (headerSize >= MIN_FOOTER_SIZE) {
      var res = new State(this._state);
      res.footerHeight = headerSize;
      res.footerVisible = true;
      if (res.scrambleAvailable) {
        res.scrambleVisible = true;
      }
      return res;
    }
    
    // No room to show the scramble for sure.
    var res = new State(this._state);
    res.scrambleVisible = false;
    
    // Make the footer its minimum size and see if it fits.
    res.footerHeight = MIN_FOOTER_SIZE;
    if (available-constraints.hard >= MIN_FOOTER_SIZE) {
      res.footerVisible = true;
    } else {
      res.footerVisible = false;
    }
    return res;
  };

  AppView.prototype._footerResized = function(height) {
    this._userFooterHeight = Math.min(height, MAX_FOOTER_SIZE);
    localStorage.footerHeight = height;
    this._updateState(true);
  };

  AppView.prototype._initializeAnimator = function() {
    // Poise the page for the on-load animation.
    var middleLayout = this._computeMiddleLayout();
    this._animator.setAttributes({
      // Footer attributes
      footerClosedness: (this._state.footerOpen ? 0 : 1),
      footerHeight: this._state.footerHeight,
      footerOffset: 20,
      footerOpacity: 0,
      // Header attributes
      headerOffset: -20,
      headerOpacity: 0,
      // Miscellaneous attributes
      memoOpacity: 0,
      pbOpacity: 0,
      scrambleOpacity: 0,
      // Time attributes
      timeOpacity: 0,
      timeScale: 1.5,
      timeSize: middleLayout.timeSize,
      timeY: middleLayout.timeY
    });
    
    // Run the page-load animation.
    this._animator.animateAttribute('footerOffset', 0);
    if (this._state.footerVisible) {
      this._animator.animateAttribute('footerOpacity', 1);
    }
    this._animator.animateAttribute('headerOffset', 0);
    this._animator.animateAttribute('headerOpacity', 1);
    this._animator.animateAttribute('timeOpacity', 1);
    this._animator.animateAttribute('timeScale', 1);
  };

  AppView.prototype._initializeState = function() {
    // Create the initial state without any input from the UI.
    // We do this mainly so that this._computeState() can work.
    var open = (localStorage.footerOpen === 'true');
    this._state = new State({
      footerHeight: 0,
      footerOpen: open,
      footerVisible: false,
      headerVisible: true,
      scrambleAvailable: false,
      scrambleVisible: false
    });
    
    // Compute the state based on the UI.
    this._state = this._computeState();
  };
  
  AppView.prototype._layout = function(attrs) {
    
  };
  
  AppView.prototype._resize = function() {
    this._updateState(true);
  };

  AppView.prototype._toggleFooter = function() {
    // TODO: open/close footer here and animate the change.
  };
  
  AppView.prototype._updateState = function(resize) {
    var old = this._state;
    var state = this._computeState();
    
    // Animate the state change as needed.
    if (state.footerHeight != old.footerHeeight) {
      if (resize) {
        this._animator.setAttribute('footerHeight', newState.footerHeight);
      } else {
        this._animator.animateAttribute('footerHeight', newState.footerHeight);
      }
    }
    if (state.footerOpen != old.footerOpen) {
      this._animator.animateAttribute('footerClosedness',
        state.footerClosed ? 1 : 0);
    }
    if (state.footerVisible != old.footerVisible) {
      this._animator.animateAttribute('footerOpacity',
        state.footerVisible ? 1 : 0);
    }
    if (state.headerVisible != old.headerVisible) {
      this._animator.animateAttribute('headerOpacity',
        state.headerVisible ? 1 : 0);
    }
    if (state.scrambleVisible != old.scrambleVisible) {
      this._animator.animateAttribute('scrambleOpacity',
        state.scrambleVisible ? 1 : 0);
    }
    
    this._state = state;
  }
  
  function State(attrs) {
    this.footerHeight = attrs.footerHeight;
    this.footerOpen = attrs.footerOpen;
    this.footerVisible = attrs.footerVisible;
    this.headerVisible = attrs.headerVisible;
    this.scrambleAvailable = attrs.scrambleAvailable;
    this.scrambleVisible = attrs.scrambleVisible;
  }
  
  window.app.AppView = AppView;
  
})();
