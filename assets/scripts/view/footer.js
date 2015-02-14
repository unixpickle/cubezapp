(function() {
  
  function Footer() {
    this.element = $('#footer');
    this.open = !(localStorage.footerOpen === 'false');
    this.statsTab = this.element.find('#stats-tab');
    this.settingsTab = this.element.find('#settings-tab');
    this.currentTab = 0;
    
    if (!this.open) {
      this.element.css({'bottom': -256});
    }
    
    var closeButton = this.element.find('#footer-close');
    closeButton.click(this.toggleOpen.bind(this));
    
    $('#stats-tab-button').click(this.showStatsTab.bind(this));
    $('#settings-tab-button').click(this.showSettingsTab.bind(this));
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
  
  if (!window.app) {
    window.app = {};
  }
  window.app.Footer = Footer;
  
})();