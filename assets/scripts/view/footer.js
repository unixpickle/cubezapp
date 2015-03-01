(function() {
  
  function Footer() {
    this.topBar = $('#footer .top .bar');
    this.statsButton = $('#footer .top .stats-tab');
    this.settingsButton = $('#footer .top .settings-tab');
    this.currentTab = this.statsButton;
    this.bottom = $('#footer .bottom');
    
    // Register events from tab buttons.
    this.statsButton.click(function() {
      this._tabPressed(this.statsButton);
    }.bind(this));
    this.settingsButton.click(function() {
      this._tabPressed(this.settingsButton);
    }.bind(this));
    
    this._windowResized();
    this.topBar.css({display: 'block'});
    
    $(window).resize(this._windowResized.bind(this));
  }
  
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
  
  Footer.prototype._windowResized = function() {
    var left = this.currentTab.offset().left;
    var width = this.currentTab.outerWidth();
    this.topBar.stop(true, true);
    this.topBar.css({left: left, width: width});
    
    this.bottom.stop(true, true);
    if (this.currentTab === this.statsButton) {
      this.bottom.css({left: 0});
    } else if (this.currentTab === this.settingsButton) {
      this.bottom.css({left: -$(window).width()});
    }
  };
  
  window.app.Footer = Footer;
  
  $(function() {
    new Footer();
  });
  
})();