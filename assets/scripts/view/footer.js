// The footer is more complex than it first appears. It is resizable, tabbed,
// and closable. Furthermore, the footer becomes completely hidden if the
// browser window is too short. In addition to all this, the state of the
// footer is saved and loaded to and from localStorage.
//
// As a result of all the above features, the footer requires a significant
// amount of code. I have documented the code so it's easier to navigate and
// maintain, but at the moment it's probably not as clean as it could be.
(function() {
  
  var MIN_HEIGHT = 250;
  var MAX_HEIGHT = 400;
  
  function Footer() {
    // Get/create views and set them as instance variables.
    this._element = $('#footer');
    this._top = new FooterTop();
    this._bottom = this._element.find('.bottom');
    this._maxHeight = MAX_HEIGHT;
    this.graph = new window.app.Graph();
    this.stats = new window.app.Stats();
    this.timesList = new window.app.TimesList();
    
    // Load configuration from localStorage.
    this._closed = (localStorage.footerOpen === 'false');
    this._height = parseInt(localStorage.footerHeight || '300');
    if (this._closed) {
      this._top.hideContent(false);
    }
    
    // This lets us know whether or not to restart the footer fade animation.
    this._tooSmall = false;
    
    // Setup events which are triggered by the top bar.
    this._setupResizing();
    this._top.onToggle = this.toggle.bind(this);
    this._top.onSwitch = this._switch.bind(this);
  }
  
  Footer.prototype.layout = function(maxHeight) {
    this._maxHeight = Math.min(maxHeight, MAX_HEIGHT);
    
    // If there's not enough room, we must hide the footer.
    if (maxHeight < MIN_HEIGHT) {
      if (!this._tooSmall) {
        this._element.stop(true, false);
        this._element.fadeOut();
        this._tooSmall = true;
      }
      // As long as this element is at least partially visible, we should layout
      // the content.
      if (this._element.css('display') === 'block') {
        this._top.layout();
        this.graph.layout();
        this.stats.layout();
        this.timesList.layout();
      }
      return;
    }
    
    // Fade in the footer if it was faded out.
    if (this._tooSmall) {
      this._element.stop(true, false);
      this._element.fadeIn();
      this._tooSmall = false;
    }
    
    // Layout the entire footer element.
    if (this._closed) {
      this._layoutClosed();
    } else {
      this._layoutOpen();
    }
    
    // Layout the top part of the footer.
    this._top.layout();
    this.graph.layout();
    this.timesList.layout();
    this.stats.layout();
  };
  
  Footer.prototype.toggle = function() {
    this._element.stop(true, true);
    if (this._closed) {
      // Change the state.
      localStorage.footerOpen = 'true';
      this._closed = false;
      
      // Update top bar.
      this._top.showContent();
      
      // Update footer element.
      this._element.animate({bottom: 0});
    } else {
      // Change the state.
      localStorage.footerOpen = 'false';
      this._closed = true;
      
      // Update top bar.
      this._top.hideContent(true);
      
      // Update footer element.
      var height = this._element.height();
      this._element.animate({bottom: -(height-this._top.height()) + 'px'});
    }
  };
  
  Footer.prototype._layoutClosed = function() {
    var height = this._maxHeight;
    if (height > this._height) {
      height = this._height;
    }
    this._element.css({
      bottom: -(height-this._top.height()) + 'px',
      height: height + 'px',
      display: 'block'
    });
  };
  
  Footer.prototype._layoutOpen = function(maxHeight) {
    var height = this._maxHeight;
    if (height > this._height) {
      height = this._height;
    }
    this._element.css({
      bottom: 0,
      height: height + 'px',
      display: 'block'
    });
  };
  
  Footer.prototype._setupResizing = function() {
    // This state is used to know what's going on in mouse events.
    var mouseIsDown = false;
    var dragOffset = 0;
    
    // Capture mouse events for state.
    this._top.onMouseDown = function(e) {
      mouseIsDown = true;
      var offset = e.clientY || e.pageY;
      dragOffset = this._height - ($(window).innerHeight() - offset);
    }.bind(this);
    $(document).mouseup(function() {
      mouseIsDown = false;
    });
    $(document).mouseleave(function() {
      mouseIsDown = false;
    });
    
    // Handle the drag event.
    $(document).mousemove(function(e) {
      if (!mouseIsDown || this._closed || this._tooSmall) {
        return;
      }
      
      // Compute the height based on their mouse.
      var offset = e.clientY || e.pageY;
      var height = Math.round($(window).innerHeight() - offset + dragOffset);
      if (height < MIN_HEIGHT) {
        this._height = MIN_HEIGHT;
      } else if (height > this._maxHeight) {
        this._height = this._maxHeight;
      } else {
        this._height = height;
      }
      localStorage.footerHeight = '' + this._height;
      
      // Set the height.
      this.layout(this._maxHeight);
    }.bind(this));
  }
  
  Footer.prototype._switch = function(page) {
    this._bottom.stop(true, false);
    if (page === 0) {
      this._bottom.animate({left: 0});
    } else {
      this._bottom.animate({left: -$(window).width()});
    }
  };
  
  function FooterTop() {
    this._element = $('#footer .top');
    this._content = this._element.children();
    this._bar = this._element.find('.bar');
    this._stats = this._element.find('.stats-tab');
    this._settings = this._element.find('.settings-tab');
    this._currentTab = this._stats;
    this._closeButton = this._element.find('.close');
    this._contentShowing = true;
    
    this.onMouseDown = null;
    this.onSwitch = null;
    this.onToggle = null;
    
    // Tab change events.
    this._stats.click(function() {
      this._switchTab(this._stats);
    }.bind(this));
    this._settings.click(function() {
      this._switchTab(this._settings);
    }.bind(this));
    
    // Close/open events.
    this._closeButton.click(function(e) {
      if (this._contentShowing && 'function' === typeof this.onToggle) {
        e.stopPropagation();
        this.onToggle();
      }
    }.bind(this));
    this._element.click(function(e) {
      if (!this._contentShowing && 'function' === typeof this.onToggle) {
        e.stopPropagation();
        this.onToggle();
      }
    }.bind(this));
    
    // Prevent resizing by dragging close button, stats, or settings.
    var sel = '.stats-tab, .settings-tab, .close';
    this._element.find(sel).mousedown(function(e) {
      e.stopPropagation();
    });
    
    // Mouse down event.
    this._element.mousedown(function(e) {
      if ('function' === typeof this.onMouseDown) {
        this.onMouseDown(e);
      }
    }.bind(this));
  }
  
  FooterTop.prototype.height = function() {
    return 44;
  };
  
  FooterTop.prototype.hideContent = function(animate) {
    this._contentShowing = false;
    this._content.stop(true, true);
    if (animate) {
      this._content.fadeOut();
    } else {
      this._content.css({display: 'none'});
    }
    this._element.css({cursor: 'pointer'});
  };
  
  FooterTop.prototype.layout = function() {
    // Move the tab indicator under the current tab.
    var left = this._currentTab.offset().left;
    var width = this._currentTab.outerWidth();
    this._bar.stop(true, true);
    this._bar.css({left: left, width: width});
  };
  
  FooterTop.prototype.showContent = function() {
    this._contentShowing = true;
    this._content.stop(true, true);
    this._content.fadeIn();
    this._element.css({cursor: 'row-resize'});
    
    // Make sure the indicator bar is in the right place.
    this.layout();
  };
  
  FooterTop.prototype._switchTab = function(tab) {
    // Make sure we don't switch to the current tab.
    if (tab === this._currentTab) {
      return;
    }
    this._currentTab = tab;
    
    // Animate the current tab indicator to the right place.
    var left = this._currentTab.offset().left;
    var width = this._currentTab.outerWidth();
    this._bar.stop(true, false);
    this._bar.animate({left: left, width: width});
    
    // Run the tab callback.
    if ('function' === typeof this.onSwitch) {
      if (tab == this._stats) {
        this.onSwitch(0);
      } else {
        this.onSwitch(1);
      }
    }
  };
  
  window.app.Footer = Footer;
  
})();
