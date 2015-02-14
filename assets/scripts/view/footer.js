// I know all this code is disgusting. It is a rough draft.

(function() {
  
  function Footer() {
    this.element = $('#footer');
    this.open = !(localStorage.footerOpen === 'false');
    this.statsTab = this.element.find('#stats-tab');
    this.settingsTab = this.element.find('#settings-tab');
    this.currentTab = 0;
    
    this.onIconChanged = null;
    this.onNameChanged = null;
    
    if (!this.open) {
      this.element.css({'bottom': -256});
    }
    
    var closeButton = this.element.find('#footer-close');
    closeButton.click(this.toggleOpen.bind(this));
    
    $('#stats-tab-button').click(this.showStatsTab.bind(this));
    $('#settings-tab-button').click(this.showSettingsTab.bind(this));
    
    // Temporary settings.
    $('#change-name').click(function() {
      var newName = prompt('Enter a new name for ' +
        window.app.store.getActivePuzzle().name);
      if (newName == '') {
        return;
      }
      if ('function' === typeof this.onNameChanged) {
        this.onNameChanged(newName);
      }
    }.bind(this));
    
    $('#icon-dropdown').change(function() {
      var newIcon = $('#icon-dropdown').val();
      if ('function' === typeof this.onIconChanged) {
        this.onIconChanged(newIcon);
      }
    }.bind(this));
  }
  
  Footer.prototype.showSettingsTab = function() {
    if (this.currentTab === 1) {
      return;
    }
    this.currentTab = 1;
    $('#stats-tab-button').attr('class', 'tab');
    $('#settings-tab-button').attr('class', 'tab-selected');
    this.settingsTab.css({display: 'block'});
    this.statsTab.css({display: 'none'});
  };
  
  Footer.prototype.showStatsTab = function() {
    if (this.currentTab === 0) {
      return;
    }
    this.currentTab = 0;
    $('#stats-tab-button').attr('class', 'tab-selected');
    $('#settings-tab-button').attr('class', 'tab');
    this.settingsTab.css({display: 'none'});
    this.statsTab.css({display: 'block'});
  };
  
  Footer.prototype.toggleOpen = function() {
    if (this.open) {
      localStorage.footerOpen = 'false';
      this.open = false;
      this.element.stop(true, true);
      this.element.animate({'bottom': -256});
    } else {
      localStorage.footerOpen = 'true';
      this.open = true;
      this.element.stop(true, true);
      this.element.animate({'bottom': 0});
    }
  };
  
  Footer.prototype.updateSettings = function() {
    var current = window.app.store.getActivePuzzle();
    this.element.find('#settings-tab .puzzle label').text(current.name);
    this.element.find('#settings-tab .puzzle img').attr('src',
      'images/puzzles/' + current.icon + '.png');
    this.element.find('#icon-dropdown').val(current.icon);
  };
  
  if (!window.app) {
    window.app = {};
  }
  window.app.Footer = Footer;
  
})();