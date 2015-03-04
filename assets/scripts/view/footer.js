(function() {
  
  var MIN_HEIGHT = 250;
  var MAX_HEIGHT = 400;
  
  function Footer() {
    // Get elements and set them as instance variables.
    this.element = $('#footer');
    this.top = $('#footer .top');
    this.topContent = $('#footer .top button, #footer .top div');
    this.topBar = $('#footer .top .bar');
    this.statsButton = $('#footer .top .stats-tab');
    this.settingsButton = $('#footer .top .settings-tab');
    this.currentTab = this.statsButton;
    this.closeButton = $('#footer .top .close');
    this.bottom = $('#footer .bottom');
    this.topHeight = 44;
    
    // This will be changed by the _resizeFooter() and layout() functions.
    this.hidden = false;
    
    // Load configuration from localStorage.
    this.closed = (localStorage.footerOpen === 'false');
    this.height = parseInt(localStorage.footerHeight || '300');
    if (this.closed) {
      this.element.css({height: this.height,
        bottom: -(this.height - this.topHeight)});
      this.top.css({cursor: 'pointer'});
      this.topContent.css({display: 'none'});
    } else {
      this.element.css({height: this.height});
    }
    
    // Register events from tab buttons.
    this.statsButton.click(function() {
      this._tabPressed(this.statsButton);
    }.bind(this));
    this.settingsButton.click(function() {
      this._tabPressed(this.settingsButton);
    }.bind(this));
    
    // Register close/open click events.
    this.closeButton.click(function(e) {
      e.stopPropagation();
      this.toggle();
    }.bind(this));
    this.element.click(function() {
      if (this.closed) {
        this.toggle();
      }
    }.bind(this));
    
    // Setup resizing via dragging.
    this._setupResize();
    
    this._
    this.layout();
    this.topBar.css({display: 'block'});
  }
  
  Footer.prototype.layout = function() {
    // Hide/unhide/squeeze the footer as necessary.
    this._resizeFooter();
    
    // Move the tab indicator bar.
    this._positionIndicator();
    
    // Resize the tab content.
    this.bottom.stop(true, true);
    if (this.currentTab === this.statsButton) {
      this.bottom.css({left: 0});
    } else if (this.currentTab === this.settingsButton) {
      this.bottom.css({left: -$(window).width()});
    }
  };
  
  Footer.prototype.toggle = function() {
    // Stop all the existing animations before running more.
    this.element.stop(true, false);
    this.topContent.stop(true, false);
    if (this.closed) {
      localStorage.footerOpen = 'true';
      
      // Open the footer.
      this.closed = false;
      this.element.animate({bottom: 0});
      this.topContent.fadeIn();
      
      // Give the top the correct cursor for resizing.
      this.top.css({cursor: 'row-resize'});
      
      // While the bar was closed, the indicator's position could not be
      // re-calculated because the top had "display: none".
      this._positionIndicator();
    } else {
      localStorage.footerOpen = 'false';
      
      // Close the footer.
      this.closed = true;
      this.element.animate({bottom: -(this.height - this.topHeight)});
      this.topContent.fadeOut();
      
      // Give the top the correct cursor for opening.
      this.top.css({cursor: 'pointer'});
    }
  };
  
  Footer.prototype.visibleHeight = function() {
    if (this.hidden) {
      return 0;
    } else if (this.closed) {
      return 44;
    } else {
      return this.height;
    }
  };
  
  Footer.prototype._maxHeight = function() {
    // Compute the maximum height that the footer can currently be.
    var neededHeight = $(window).innerHeight() - 400;
    if (neededHeight < MIN_HEIGHT) {
      return 0;
    } else {
      return Math.min(neededHeight, MAX_HEIGHT);
    }
  };
  
  Footer.prototype._positionIndicator = function() {
    // Move the tab indicator under the current tab.
    var left = this.currentTab.offset().left;
    var width = this.currentTab.outerWidth();
    this.topBar.stop(true, true);
    this.topBar.css({left: left, width: width});
  };
  
  Footer.prototype._resizeFooter = function() {
    // Compute new height and hidden status for the footer.
    var lastHidden = this.hidden;
    var lastHeight = this.height;
    if ($(window).innerHeight() - this.height < 400) {
      var neededHeight = $(window).innerHeight() - 400;
      if (neededHeight < MIN_HEIGHT) {
        this.hidden = true;
      } else {
        this.height = neededHeight;
        this.hidden = false;
      }
    } else {
      this.hidden = false;
    }
    
    // Hide/unhide the footer.
    if (this.hidden != lastHidden) {
      if (this.hidden) {
        this.element.css({display: 'none'});
      } else {
        this.element.css({display: 'block'});
      }
    }
    
    // If the height changed, we must resize the element.
    if (this.height != lastHeight) {
      localStorage.footerHeight = '' + this.height;
      this.element.stop(true, true);
      // Make sure the element is properly offset if it was closed.
      if (this.closed) {
        this.element.css({height: this.height,
          bottom: -(this.height - this.topHeight)});
      } else {
        this.element.css({height: this.height});
      }
    }
  };
  
  Footer.prototype._setupResize = function() {
    // This state is used for footer resizing mouse events.
    var mouseIsDown = false;
    var dragOffset = 0;
    
    // Make tabs and close button stop forwarding mouse events.
    $('#footer .top .tab').mousedown(function(e) {
      e.stopPropagation();
    });
    this.closeButton.mousedown(function(e) {
      e.stopPropagation();
    });
    
    // Make sure mouseIsDown is accurate.
    this.top.mousedown(function(e) {
      mouseIsDown = true;
      var offset = e.clientY || e.pageY;
      dragOffset = this.height - ($(window).innerHeight() - offset);
    }.bind(this));
    $(document).mouseup(function() {
      mouseIsDown = false;
    });
    $(document).mouseleave(function() {
      mouseIsDown = false;
    });
    
    // Handle drag events.
    $(document).mousemove(function(e) {
      if (!mouseIsDown || this.closed || this.hidden) {
        return;
      }
      
      // Compute the height based on their mouse.
      var offset = e.clientY || e.pageY;
      var height = Math.round($(window).innerHeight() - offset + dragOffset);
      var maxHeight = this._maxHeight();
      if (height < MIN_HEIGHT) {
        this.height = MIN_HEIGHT;
      } else if (height > maxHeight) {
        this.height = maxHeight;
      } else {
        this.height = height;
      }
      localStorage.footerHeight = '' + this.height;
      
      // Set the height.
      this.element.stop(true, true);
      this.element.css({height: this.height});
    }.bind(this));
  };
  
  Footer.prototype._tabPressed = function(tab) {
    if (tab === this.currentTab) {
      return;
    }
    
    // Animate the current tab indicator to the right place.
    this.currentTab = tab;
    var left = this.currentTab.offset().left;
    var width = this.currentTab.outerWidth();
    this.topBar.stop(true, true);
    this.topBar.animate({left: left, width: width});
    
    // Animate the bottom contents to the right page.
    this.bottom.stop(true, true);
    if (this.currentTab === this.statsButton) {
      this.bottom.animate({left: 0});
    } else if (this.currentTab === this.settingsButton) {
      this.bottom.animate({left: -$(window).width()});
    }
  };
  
  window.app.Footer = Footer;
  
})();