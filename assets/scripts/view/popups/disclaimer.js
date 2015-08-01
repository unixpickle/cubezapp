(function() {

  function DisclaimerPopup() {
    var $content = $('<div class="disclaimer-popup-content"></div>').text(
      'This website is still under development. We do not recommend using ' +
      'this website as your main timer until we release a more stable version.'
    );

    this._checkbox = window.app.flavors.makeCheckbox();

    var $checkboxContainer = $('<div class=' +
      '"disclaimer-popup-checkbox-container"></div>');
    $checkboxContainer.append(this._checkbox.element());
    $checkboxContainer.append('<label ' +  
      'class="disclaimer-popup-checkbox-label">Never show this again</label>');
    $content.append($checkboxContainer);

    var $label = $checkboxContainer.find('.disclaimer-popup-checkbox-label');
    $label.click(function() {
      this._checkbox.setChecked(!this._checkbox.getChecked());
    }.bind(this));

    this._dialog = new window.app.Dialog('Disclaimer', $content, ['OK']);
    this._dialog.on('action', this._action.bind(this));
  }

  DisclaimerPopup.prototype.show = function() {
    this._dialog.show();
  };

  DisclaimerPopup.prototype._action = function() {
    if (this._checkbox.getChecked()) {
      try {
        localStorage.dontShowDisclaimer = 'true';
      } catch (e) {
      }
    }
    window.app.flavors.removeCheckbox(this._checkbox);
    this._dialog.close();
  };

  window.app.DisclaimerPopup = DisclaimerPopup;

})();
