// The footer is more complex than it first appears. It is resizable, tabbed,
// and closable. This purely implements the view component of the footer. It is
// controlled by a parent view that can handle browser resizing.
(function() {
  
  function Footer() {
    // Get/create views and set them as instance variables.
    this._element = $('#footer');
    this._elementStyler = new window.app.Styler(this._element[0]);
    this._top = new FooterTop();
    this._bottom = this._element.find('.bottom');
    this.stats = new window.app.Stats();
    this.settings = new window.app.Settings();
    
    // Blank event handlers.
    this.onResize = null;
    this.onToggle = null;
    
    // This state is used to know the current page.
    this._currentPage = 0;
    
    // This state is used to figure out which subviews to re-layout on a layout
    // event.
    this._lastWidth = -1;
    this._lastHeight = -1;
    
    // Setup events which are triggered by the top bar.
    this._setupResizing();
    this._top.onSwitch = this._switch.bind(this);
    this._top.onToggle = function() {
      if ('function' === typeof this.onToggle) {
        this.onToggle();
      }
    }.bind(this);
  }
  
  Footer.prototype.closedHeight = function() {
    return this._top.height();
  };
  
  Footer.prototype.layout = function(attrs) {
    if (attrs.footerOpacity === 0) {
      this._elementStyler.css({display: 'none'});
      this.settings.containerHidden();
      this.stats.containerHidden();
      return;
    }
    
    // Use the attributes to layout the footer.
    this._elementStyler.css({
      display: 'block',
      opacity: attrs.footerOpacity,
      height: attrs.footerHeight,
      bottom: -attrs.footerOffset -
        attrs.footerClosedness*(attrs.footerHeight-this._top.height())
    });
    this._top.setClosedness(attrs.footerClosedness);
    
    // Layout all the sub-views if necessary.
    if (this._lastWidth !== window.app.windowSize.width) {
      this._top.layout();
      
      // If the browser width was changed, we may need to re-position the bottom
      // content.
      if (this._current === 1) {
        this._bottom.stop(true, false);
        this._bottom.css({left: -window.app.windowSize.width});
      }
    }
    if (this._lastWidth !== window.app.windowSize.width ||
        this._lastHeight !== attrs.footerHeight) {
      this.stats.layout();
      this.settings.layout();
      
      // Update the cached width/height.
      this._lastWidth = window.app.windowSize.width;
      this._lastHeight = attrs.footerHeight;
    }
  };
  
  Footer.prototype.setPuzzleName = function(name) {
    this.settings.setPuzzleName(name);
  };
  
  Footer.prototype._setupResizing = function() {
    // This state is used to know what's going on in mouse events.
    var mouseIsDown = false;
    var dragOffset = 0;
    
    // Capture mouse events for state.
    this._top.onMouseDown = function(e) {
      mouseIsDown = true;
      var offset = e.clientY || e.pageY;
      var height = this._element.height();
      dragOffset = height - (window.app.windowSize.height - offset);
      
      // This is necessary to prevent selecting the rest of the page if they try
      // to make the footer too big.
      e.stopPropagation();
      e.preventDefault();
      return false;
    }.bind(this);
    $(document).mouseup(function() {
      mouseIsDown = false;
    });
    $(document).mouseleave(function() {
      mouseIsDown = false;
    });
    
    // Handle the drag event.
    $(document).mousemove(function(e) {
      if (!mouseIsDown || 'function' !== typeof this.onResize) {
        return;
      }
      
      // Compute the height based on their mouse.
      var offset = e.clientY || e.pageY;
      var height = Math.round(window.app.windowSize.height - offset +
        dragOffset);
      this.onResize(height);
      
      // This is necessary to prevent selecting the rest of the page if they try
      // to make the footer too big.
      e.stopPropagation();
      e.preventDefault();
      return false;
    }.bind(this));
  }
  
  Footer.prototype._switch = function(page) {
    this._current = page;
    this._bottom.stop(true, false);
    if (page === 0) {
      this._bottom.animate({left: 0});
    } else {
      this._bottom.animate({left: -window.app.windowSize.width});
    }
  };
  
  // FooterTop controls the top of the footer.
  function FooterTop() {
    // Get elements from the DOM.
    this._element = $('#footer .top');
    this._content = this._element.children();
    this._bar = this._element.find('.bar');
    this._stats = this._element.find('.stats-tab');
    this._settings = this._element.find('.settings-tab');
    this._currentTab = this._stats;
    this._closeButton = this._element.find('.close');
    this._contentShowing = true;
    
    // Event callbacks.
    this.onMouseDown = null;
    this.onSwitch = null;
    this.onToggle = null;
    
    // We cache the closedness so we don't repaint every layout().
    this._lastClosedness = -1;
    
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
    return 40;
  };
  
  FooterTop.prototype.layout = function() {
    // Move the tab indicator under the current tab.
    var left = this._currentTab.offset().left;
    var width = this._currentTab.outerWidth();
    this._bar.stop(true, true);
    this._bar.css({left: left, width: width});
  };
  
  FooterTop.prototype.setClosedness = function(closedness) {
    if (closedness === this._lastClosedness) {
      return;
    }
    var last = this._lastClosedness;
    this._lastClosedness = closedness;
    
    if (closedness === 1) {
      this._content.css({display: 'none'});
    } else {
      this._content.css({display: 'inline-block', opacity: 1-closedness});
    }
    if (closedness === 0) {
      this._contentShowing = true;
      this._element.css({cursor: 'ns-resize'});
    } else {
      this._contentShowing = false;
      this._element.css({cursor: 'pointer'});
    }
    // If this was not visible before, it may need to be laid out.
    if (last === 1) {
      this.layout();
    }
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
