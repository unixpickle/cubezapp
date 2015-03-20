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
    this._footer.onResize = this._resizeFooter.bind(this);
    this._animator.onAnimate = this._layout.bind(this);
    
    // Compute the initial state and lay it out.
    this._initializeState();
    this._initializeAnimator();
    this._layout(this._animator.current());
  }
  
  // setMemo updates the memo time. If the memo time is null, the memo time will
  // be hidden.
  AppView.prototype.setMemo = function(memo) {
    var hasMemo = (memo !== null);
    var oldState = new State(this._state);
    this._state.memoVisible = hasMemo;
    this._updateState();
    
    // If the memo is null, we don't update this._middle because we want it to
    // fade out while it still contains some text.
    if (hasMemo) {
      this._middle.setMemo(memo);
    }
    
    this._animateStateChange(oldState);
  };
  
  // setPB updates the PB status. If the PB time is null, the label will be
  // hidden.
  AppView.prototype.setPB = function(pb) {
    var hasPB = (pb !== null);
    var oldState = new State(this._state);
    this._state.pbAvailable = hasPB;
    this._updateState();
    
    // If the PB is null, we don't update this._middle because we want it to
    // fade out while it still contains some text.
    if (hasPB) {
      this._middle.setPB(pb);
    }
    
    this._animateStateChange(oldState);
  };
  
  // setScramble sets the scramble. If the scramble is null, the scramble will
  // be hidden.
  AppView.prototype.setScramble = function(scramble) {
    var hasScramble = (scramble !== null);
    
    // If the scramble is null, we keep the last scramble in the scramble box so
    // it can fade out.
    if (hasScramble) {
      this._middle.setScramble(scramble);
    }
    
    // Update the state.
    var oldState = new State(this._state);
    this._state.scrambleAvailable = hasScramble;
    this._updateState();
    
    this._animateStateChange(oldState);
  };
  
  // _animateStateChange animates the transition between an old state and the
  // current state.
  AppView.prototype._animateStateChange = function(oldState) {
    var state = this._state;
    
    if (oldState.footerHeight !== state.footerHeight) {
      this._animator.animateAttribute('footerHeight', state.footerHeight);
    }
    if (oldState.footerOpen !== state.footerOpen) {
      this._animator.animateAttribute('footerClosedness',
        state.footerOpen ? 0 : 1);
    }
    if (oldState.footerVisible !== state.footerVisible) {
      this._animator.animateAttribute('footerOpacity',
        state.footerVisible ? 1 : 0);
    }
    if (oldState.headerVisible !== state.headerVisible) {
      this._animator.animateAttribute('headerOpacity',
        state.headerVisible ? 1 : 0);
    }
    if (oldState.memoVisible !== state.memoVisible) {
      this._animator.animateAttribute('memoOpacity',
        state.memoVisible ? 1 : 0);
    }
    if (oldState.scrambleVisible !== state.scrambleVisible) {
      this._animator.animateAttribute('scrambleOpacity',
        state.scrambleVisible ? 1 : 0);
    }
    if (oldState.pbVisible !== state.pbVisible) {
      this._animator.animateAttribute('pbOpacity', state.pbVisible ? 1 : 0);
    }
    
    // Animate middle changes.
    var middleLayout = this._computeMiddleLayout();
    this._animator.animateAttribute('middleHeight', middleLayout.height);
    this._animator.animateAttribute('middleY', middleLayout.y);
    this._animator.animateAttribute('timeSize', middleLayout.timeSize);
    this._animator.animateAttribute('timeY', middleLayout.timeY);
  };
  
  // _computeMiddleLayout figures out the timer bounds and middle bounds for the
  // current state and browser size.
  AppView.prototype._computeMiddleLayout = function() {
    // Figure out the size of everything on-screen for the current state.
    var windowHeight = $(window).height();
    var width = $(window).width();
    if ('number' !== typeof width || 'number' !== typeof windowHeight ||
        isNaN(width) || isNaN(windowHeight)) {
      throw new Error('invalid window dimensions: ' + width + ', ' +
        windowHeight);
    }
    
    // Compute the size taken up by the footer.
    var footerHeight = this._state.footerHeight;
    if (!this._state.footerOpen) {
      footerHeight = this._footer.closedHeight();
    }
    if (!this._state.footerVisible) {
      footerHeight = 0;
    }
    if ('number' !== typeof footerHeight || isNaN(footerHeight)) {
      throw new Error('invalid footerHeight: ' + footerHeight);
    }
    
    // Compute the size taken up by the header.
    var headerHeight = 0;
    if (this._state.headerVisible) {
      headerHeight = this._header.height();
    }
    if ('number' !== typeof headerHeight || isNaN(headerHeight)) {
      throw new Error('invalid headerHeight: ' + headerHeight);
    }
    
    // Compute location and height of middle element.
    var middleHeight = Math.max(windowHeight-headerHeight-footerHeight, 0);
    var middleY = headerHeight;
    
    if ('number' !== typeof middleHeight || isNaN(middleHeight)) {
      throw new Error('invalid middleHeight: ' + middleHeight);
    }
    
    // Pass all the information to this._middle and ask for the time layout.
    var pb = this._state.pbVisible;
    var scramble = this._state.scrambleVisible;
    var memo = this._state.memoVisible;
    var middleLayout = this._middle.computeTimeLayout(width, middleHeight, pb,
      scramble, memo);
    
    // Add middle element information to result.
    middleLayout.y = headerHeight;
    middleLayout.height = middleHeight;
    
    return middleLayout;
  };

  // _initializeAnimator runs the page load animation and syncs the animator up
  // with the initial state.
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

  // _initializeState generates this._state.
  // This loads the footerOpen setting.
  AppView.prototype._initializeState = function() {
    // Create the initial state without any input from the UI.
    // We do this mainly so that this._updateState() can work.
    this._state = new State({
      footerHeight: 0,
      footerOpen: localStorage.footerOpen === 'true',
      footerVisible: false,
      headerVisible: true,
      memoVisible: false,
      pbAvailable: false,
      pbVisible: false,
      scrambleAvailable: false,
      scrambleVisible: false
    });
    
    // Compute the state based on the UI.
    this._updateState();
  };
  
  // _layout applies animator attributes to the app view.
  AppView.prototype._layout = function(attrs) {
    this._footer.layout(attrs);
    this._header.layout(attrs);
    this._middle.layout(attrs);
  };
  
  // _resizeFooter updates the height of the footer given a user-requested size.
  AppView.prototype._resizeFooter = function(height) {
    // The footer might detect mouse events even when its closing or hiding.
    if (!this._state.footerOpen || !this._state.footerVisible) {
      return;
    }
    
    // Update the user's footer height, capping it as necessary.
    this._userFooterHeight = Math.max(Math.min(height, MAX_FOOTER_SIZE),
      MIN_FOOTER_SIZE);
    localStorage.footerHeight = this._userFooterHeight;
    
    // Nothing in the state should change besides the footer height.
    this._updateState();
    var middleLayout = this._computeMiddleLayout();
    this._animator.setAttributes({
      footerHeight: this._state.footerHeight,
      middleHeight: middleLayout.height,
      middleY: middleLayout.y,
      timeSize: middleLayout.timeSize,
      timeY: middleLayout.timeY
    });
    
    // If the animator is not animating, it will never call this._layout for us.
    this._layout(this._animator.current());
  };
  
  // _resized handles browser resize events.
  AppView.prototype._resized = function() {
    var old = new State(this._state);
    this._updateState();
    
    // majorChange will be true if anything important faded in or out.
    var majorChange = false;
    
    if (this._state.footerHeight !== old.footerHeight) {
      // The footer size is never animated after a browser resize.
      this._animator.setAttribute('footerHeight', this._state.footerHeight);
    }
    
    // The major fade-ins or fade-outs.
    if (this._state.footerVisible !== old.footerVisible) {
      this._animator.animateAttribute('footerOpacity',
        this._state.footerVisible ? 1 : 0);
      majorChange = true;
    }
    if (this._state.scrambleVisible !== old.scrambleVisible) {
      this._animator.animateAttribute('scrambleOpacity',
        this._state.scrambleVisible ? 1 : 0);
      majorChange = true;
    }
    if (this._state.pbVisible !== old.pbVisible) {
      this._animator.animateAttribute('pbOpacity',
        this._state.pbVisible ? 1 : 0);
      majorChange = true;
    }
    
    var middleLayout = this._computeMiddleLayout();
    // NOTE: resize events will never change middleY.
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
    
    // If we did not animate anything but we *did* set something, then we need
    // to manually lay ourselves out since the animator might not call
    // this._layout.
    this._layout(this._animator.current());
  };

  AppView.prototype._toggleFooter = function() {
    // Update the state and backup the old state.
    var old = new State(this._state);
    this._state.footerOpen = !this._state.footerOpen;
    this._updateState();
    
    // Save the change in localStorage.
    localStorage.footerOpen = this._state.footerOpen;
    
    // Animate the state change.
    this._animateStateChange(old);
  };
  
  // _updateState uses the browser's constraints and the existing state to
  // figure out the state which the app view should currently have.
  AppView.prototype._updateState = function() {
    // TODO: if the footer is closed, we may wish to make the scramble visible.
    // TODO: if they are in focused-timer-mode, this is really simple.
    
    // Get the constraints from this._middle.
    var pb = (this._state.pbAvailable && !this._state.footerOpen);
    var scramble = this._state.scrambleAvailable;
    var memo = this._state.memoVisible;
    var constraints = this._middle.computeConstraints(pb, scramble, memo);
    
    // Using the constraints, figure out how big the footer can be if all is
    // shown.
    var available = $(window).height() - this._header.height();
    var footerSize = available - constraints.soft;
    
    // If the header size is large enough, everything is visible.
    if (footerSize >= MIN_FOOTER_SIZE) {
      this._state.footerHeight = Math.min(footerSize, this._userFooterHeight);
      this._state.footerVisible = true;
      this._state.pbVisible = (this._state.pbAvailable &&
        !this._state.footerOpen);
      this._state.scrambleVisible = this._state.scrambleAvailable;
      return;
    }
    
    // No room to show the scramble for sure.
    this._state.scrambleVisible = false;
    
    // Make the footer its minimum size and see if it fits.
    this._state.footerHeight = MIN_FOOTER_SIZE;
    if (available-constraints.bare >= MIN_FOOTER_SIZE) {
      this._state.footerVisible = true;
      this._state.pbVisible = (this._state.pbAvailable &&
        !this._state.footerOpen);
    } else {
      this._state.footerVisible = false;
      this._state.pbVisible = false;
    }
  };
  
  function State(attrs) {
    this.footerHeight = attrs.footerHeight;
    this.footerOpen = attrs.footerOpen;
    this.footerVisible = attrs.footerVisible;
    this.headerVisible = attrs.headerVisible;
    this.memoVisible = attrs.memoVisible;
    this.pbAvailable = attrs.pbAvailable;
    this.pbVisible = attrs.pbVisible;
    this.scrambleAvailable = attrs.scrambleAvailable;
    this.scrambleVisible = attrs.scrambleVisible;
    
    // Validate types so we don't shoot ourselves in the foot.
    if ('number' !== typeof this.footerHeight) {
      throw new TypeError('invalid type for footerHeight');
    } else if ('boolean' !== typeof this.footerOpen) {
      throw new TypeError('invalid type for footerOpen');
    } else if ('boolean' !== typeof this.footerVisible) {
      throw new TypeError('invalid type for footerVisible');
    } else if ('boolean' !== typeof this.headerVisible) {
      throw new TypeError('invalid type for headerVisible');
    } else if ('boolean' !== typeof this.memoVisible) {
      throw new TypeError('invalid type for memoVisible');
    } else if ('boolean' !== typeof this.pbAvailable) {
      throw new TypeError('invalid type for pbAvailable');
    } else if ('boolean' !== typeof this.pbVisible) {
      throw new TypeError('invalid type for pbVisible');
    } else if ('boolean' !== typeof this.scrambleAvailable) {
      throw new TypeError('invalid type for scrambleAvailable');
    } else if ('boolean' !== typeof this.scrambleVisible) {
      throw new TypeError('invalid type for scrambleVisible');
    }
  }
  
  window.app.AppView = AppView;
  
})();
