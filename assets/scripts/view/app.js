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
  
  AppView.prototype.setScramble = function(scramble) {
    if (scramble !== null) {
      this._middle.setScramble(scramble);
    }
    
    // Update the state.
    var oldState = this._state;
    this._state = new State(this._state);
    this._state.scrambleAvailable = (scramble !== null);
    if (!this._state.scrambleAvailable) {
      this._state.scrambleVisible = false;
    }
    this._state = this._computeState();
    
    // Animate changes.
    this._animateAllChanges(oldState, this._state);
  };
  
  AppView.prototype._animateAllChanges = function(oldState, state) {
    if (oldState.footerHeight != state.footerHeight) {
      this._animator.animateAttribute('footerHeight', state.footerHeight);
    }
    if (oldState.footerOpen != state.footerOpen) {
      this._animator.animateAttribute('footerClosedness',
        state.footerOpen ? 0 : 1);
    }
    if (oldState.footerVisible != state.footerVisible) {
      this._animator.animateAttribute('footerOpacity',
        state.footerVisible ? 1 : 0);
    }
    if (oldState.headerVisible != state.headerVisible) {
      this._animator.animateAttribute('headerOpacity',
        state.headerVisible ? 1 : 0);
    }
    if (oldState.scrambleVisible != state.scrambleVisible) {
      this._animator.animateAttribute('scrambleOpacity',
        state.scrambleVisible ? 1 : 0);
    }
    
    // Animate middle changes.
    var middleLayout = this._computeMiddleLayout();
    this._animator.animateAttribute('middleHeight', middleLayout.height);
    this._animator.animateAttribute('middleY', middleLayout.y);
    this._animator.animateAttribute('timeSize', middleLayout.timeSize);
    this._animator.animateAttribute('timeY', middleLayout.timeY);
  };
  
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
    
    // Compute the middle layout.
    var middleHeight = windowHeight - (headerHeight + footerHeight);
    var middleY = headerHeight;
    var middleLayout = this._middle.computeLayout(middleHeight,
      this._state.scrambleVisible);
    middleLayout.y = headerHeight;
    middleLayout.height = middleHeight;
    
    return middleLayout;
  };

  AppView.prototype._computeState = function() {
    // TODO: if the footer is closed, some logic is different.
    
    var constraints = this._middle.constraints();
    var available = $(window).height() - this._header.height();
    var footerSize = available - constraints.soft;
    
    // If the header size is large enough, everything is visible.
    if (footerSize >= MIN_FOOTER_SIZE) {
      var res = new State(this._state);
      res.footerHeight = Math.min(footerSize, this._userFooterHeight);
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
    if (available-constraints.bare >= MIN_FOOTER_SIZE) {
      res.footerVisible = true;
    } else {
      res.footerVisible = false;
    }
    return res;
  };

  AppView.prototype._footerResized = function(height) {
    this._userFooterHeight = Math.max(Math.min(height, MAX_FOOTER_SIZE),
      MIN_FOOTER_SIZE);
    localStorage.footerHeight = this._userFooterHeight;
    
    // Nothing in the state should change besides the footer height.
    this._state = this._computeState();
    var middleLayout = this._computeMiddleLayout();
    this._animator.setAttributes({
      footerHeight: this._state.footerHeight,
      middleHeight: middleLayout.height,
      middleY: middleLayout.y,
      timeSize: middleLayout.timeSize,
      timeY: middleLayout.timeY
    });
    this._layout(this._animator.current());
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
      // Middle attributes
      middleHeight: middleLayout.height,
      middleY: middleLayout.y,
      // Miscellaneous attributes
      memoOpacity: 0,
      pbOpacity: 0,
      scrambleOpacity: 0,
      // Time attributes
      timeOpacity: 0,
      timeScale: 1.2,
      timeSize: middleLayout.timeSize,
      timeY: middleLayout.timeY
    });
    
    // Run the page-load animation.
    this._animator.animateAttribute('footerOffset', 0, 0.3);
    if (this._state.footerVisible) {
      this._animator.animateAttribute('footerOpacity', 1, 0.3);
    }
    this._animator.animateAttribute('headerOffset', 0, 0.3);
    this._animator.animateAttribute('headerOpacity', 1, 0.3);
    this._animator.animateAttribute('timeOpacity', 1, 0.25, 0.1);
    this._animator.animateAttribute('timeScale', 1, 0.25, 0.1);
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
    this._footer.layout(attrs);
    this._header.layout(attrs);
    this._middle.layout(attrs);
  };
  
  AppView.prototype._resized = function() {
    var state = this._computeState();
    var old = this._state;
    this._state = state;
    
    // Animate/update the view changes as needed.
    var majorChange = false;
    if (state.footerHeight != old.footerHeight) {
      this._animator.setAttribute('footerHeight', state.footerHeight);
    }
    if (state.footerVisible != old.footerVisible) {
      this._animator.animateAttribute('footerOpacity',
        state.footerVisible ? 1 : 0);
      majorChange = true;
    }
    if (state.scrambleVisible != old.scrambleVisible) {
      this._animator.animateAttribute('scrambleOpacity',
        state.scrambleVisible ? 1 : 0);
      majorChange = true;
    }
    
    var middleLayout = this._computeMiddleLayout();
    if (majorChange) {
      // Animate middle changes.
      this._animator.animateAttribute('middleHeight', middleLayout.height);
      this._animator.animateAttribute('timeSize', middleLayout.timeSize);
      this._animator.animateAttribute('timeY', middleLayout.timeY);
    } else {
      // Set middle changes without animation.
      this._animator.setAttributes({
        middleHeight: middleLayout.height,
        timeSize: middleLayout.timeSize,
        timeY: middleLayout.timeY
      });
    }
    
    this._layout(this._animator.current());
  };

  AppView.prototype._toggleFooter = function() {
    var old = this._state;
    this._state = new State(this._state);
    this._state.footerOpen = !this._state.footerOpen;
    this._state = this._computeState();
    var state = this._state;
    
    localStorage.footerOpen = state.footerOpen;
    
    this._animateAllChanges(old, state);
  };
  
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
