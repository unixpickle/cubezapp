(function() {
  
  function Header() {
    this._element = $('#header');
    this._puzzles = new Puzzles();
    this._showingDropdown = false;
    
    this._nameLabel = this._element.find('.name');
    this._nameLabel.click(this._toggle.bind(this));
    this._puzzles.onExit = this._toggle.bind(this);
  }

  Header.prototype.height = function() {
    return 44;
  };
  
  Header.prototype.layout = function(attrs) {
    if (attrs.headerOpacity === 0) {
      this._element.css({display: 'none'});
    } else {
      this._element.css({
        display: 'block',
        opacity: attrs.headerOpacity,
        top: attrs.headerOffset
      });
    }
  };
  
  Header.prototype._toggle = function() {  
    if (this._showingDropdown) {
      // Hide the dropdown.
      this._puzzles.hide();
    } else {
      // Show the dropdown.
      this._puzzles.show();
    }
    this._showingDropdown = !this._showingDropdown;
  };
  
  function Puzzles() {
    this._element = $('#puzzles');
    this._showing = false;
    
    // Setup the shielding.
    this._shielding = $('<div />');
    this._shielding.css({
      position: 'fixed',
      'z-index': this._element.css('z-index') - 1,
      width: '100%',
      height: '100%',
      display: 'none',
      'background-color': 'rgba(0, 0, 0, 0.5)'
    });
    
    // If they click on the background shield, the puzzles list closes.
    this._shielding.click(function() {
      if (!this._showing) {
        return;
      }
      if ('function' !== typeof this.onExit) {
        throw new Error('invalid onExit handler');
      }
      this.onExit();
    }.bind(this));
    
    $(document.body).append(this._shielding);
    
    this.onExit = null;
  }
  
  Puzzles.prototype.hide = function() {
    // TODO: here, hide the scrollbar.
    this._element.css({'overflow-x': 'hidden'});
    
    this._element.stop(true, false);
    this._shielding.stop(true, false);
    this._shielding.fadeOut();
    this._element.slideUp();
    
    // Re-enable keyboard events for other things.
    window.app.keyboard.pop();
    
    this._showing = false;
  };
  
  Puzzles.prototype.layout = function() {
  };
  
  Puzzles.prototype.show = function() {
    this._element.stop(true, false);
    this._shielding.stop(true, false);
    this._element.slideDown({
      complete: function() {
        this._element.css({'overflow-x': 'scroll'});
        this._resizeForScrollbar();
      }.bind(this)
    });
    this._shielding.fadeIn();
    
    // Disable keyboard events from other things.
    window.app.keyboard.push({});
    
    this._showing = true;
  };
  
  Puzzles.prototype._resizeForScrollbar = function() {
    // TODO: here, increase/decrease the size of the puzzles dropdown.
  };
  
  window.app.Header = Header;
  
})();
