(function() {
  
  function Footer() {
    this.element = $('#footer');
    this.open = !(localStorage.footerOpen === 'false');
    
    if (!this.open) {
      this.element.css({'bottom': -256});
    }
    
    var closeButton = this.element.find('#footer-close');
    closeButton.click(this.toggleOpen.bind(this));
  }
  
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