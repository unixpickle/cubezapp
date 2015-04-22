// The footer is more complex than it first appears. It is resizable, tabbed,
// and closable. This purely implements the view component of the footer. It is
// controlled by a parent view that can handle browser resizing.
(function() {
  
  function Footer() {
    // Get/create views and set them as instance variables.
    this._$element = $('#footer');
    this._$elementStyler = new window.app.Styler(this._$element[0]);
    this._top = new FooterTop();
    this._$bottom = this._$element.find('.bottom');
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
      this._$elementStyler.css({display: 'none'});
      return;
    }
    
    // Use the attributes to layout the footer.
    this._$elementStyler.css({
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
        this._$bottom.stop(true, false);
        this._$bottom.css({left: -window.app.windowSize.width});
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
      var height = this._$element.height();
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
    this._$bottom.stop(true, false);
    if (page === 0) {
      this._$bottom.animate({left: 0});
    } else {
      this._$bottom.animate({left: -window.app.windowSize.width});
    }
  };
  
  // FooterTop controls the top of the footer.
  function FooterTop() {
    // Get elements from the DOM.
    this._$element = $('#footer .top');
    this._$content = this._$element.children();
    this._$bar = this._$element.find('.bar');
    this._$stats = this._$element.find('.stats-tab');
    this._$settings = this._$element.find('.settings-tab');
    this._$currentTab = this._$stats;
    this._$closeButton = this._$element.find('.close');
    this._contentShowing = true;
    
    // Event callbacks.
    this.onMouseDown = null;
    this.onSwitch = null;
    this.onToggle = null;
    
    // We cache the closedness so we don't repaint every layout().
    this._lastClosedness = -1;
    
    // Tab change events.
    this._$stats.click(function() {
      this._switchTab(this._$stats);
    }.bind(this));
    this._$settings.click(function() {
      this._switchTab(this._$settings);
    }.bind(this));
    
    // Close/open events.
    this._$closeButton.click(function(e) {
      if (this._contentShowing && 'function' === typeof this.onToggle) {
        e.stopPropagation();
        this.onToggle();
      }
    }.bind(this));
    this._$element.click(function(e) {
      if (!this._contentShowing && 'function' === typeof this.onToggle) {
        e.stopPropagation();
        this.onToggle();
      }
    }.bind(this));
    
    // Prevent resizing by dragging close button, stats, or settings.
    var sel = '.stats-tab, .settings-tab, .close';
    this._$element.find(sel).mousedown(function(e) {
      e.stopPropagation();
    });
    
    // Mouse down event.
    this._$element.mousedown(function(e) {
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
    var left = this._$currentTab.offset().left;
    var width = this._$currentTab.outerWidth();
    this._$bar.stop(true, true);
    this._$bar.css({left: left, width: width});
  };
  
  FooterTop.prototype.setClosedness = function(closedness) {
    if (closedness === this._lastClosedness) {
      return;
    }
    var last = this._lastClosedness;
    this._lastClosedness = closedness;
    
    if (closedness === 1) {
      this._$content.css({display: 'none'});
    } else {
      this._$content.css({display: 'inline-block', opacity: 1-closedness});
    }
    if (closedness === 0) {
      this._contentShowing = true;
      this._$element.css({cursor: 'ns-resize'});
    } else {
      this._contentShowing = false;
      this._$element.css({cursor: 'pointer'});
    }
    // If this was not visible before, it may need to be laid out.
    if (last === 1) {
      this.layout();
    }
  };
  
  FooterTop.prototype._switchTab = function(tab) {
    // Make sure we don't switch to the current tab.
    if (tab === this._$currentTab) {
      return;
    }
    this._$currentTab = tab;
    
    // Animate the current tab indicator to the right place.
    var left = this._$currentTab.offset().left;
    var width = this._$currentTab.outerWidth();
    this._$bar.stop(true, false);
    this._$bar.animate({left: left, width: width});
    
    // Run the tab callback.
    if ('function' === typeof this.onSwitch) {
      if (tab == this._$stats) {
        this.onSwitch(0);
      } else {
        this.onSwitch(1);
      }
    }
  };
  
  window.app.Footer = Footer;
  
})();
