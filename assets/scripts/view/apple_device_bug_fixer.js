(function() {

  // If you reset Safari before navigating to Cubezapp, you will be greated with a cut-off page like
  // this: http://1mage.us/nav/750. So far, I have managed to prove that the problem occurs because
  // "width: 100%" makes an element wider than the width of <body> in a rare case. Right now, the
  // problem can be solved by forcing the page to refresh when the problem is detected. I do not
  // know why this workaround works. Stay tuned for more.
  function AppleDeviceBugFixer() {
    this._remainingChecks = 10;
    setTimeout(this._checkBug.bind(this), AppleDeviceBugFixer.CHECK_INTERVAL);
  }

  AppleDeviceBugFixer.MINIMUM_TIME_DIFFERENCE = 30000;

  AppleDeviceBugFixer.prototype._checkBug = function() {
    if ($('#time').width() > $(document.body).width()) {
      this._handleBug();
    } else if (--this._remainingChecks > 0) {
      setTimeout(this._checkBug.bind(this), AppleDeviceBugFixer.CHECK_INTERVAL);
    }
  };

  AppleDeviceBugFixer.prototype._handleBug = function() {
    try {
      var lastBugFix = parseInt(localStorage.lastAppleDeviceBugFix || '0');
      var now = new Date().getTime();
      if (lastBugFix + AppleDeviceBugFixer.MINIMUM_TIME_DIFFERENCE > now) {
        this._showUnfixable();
      } else {
        localStorage.lastAppleDeviceBugFix = now;
        window.location.reload();
      }
    } catch (e) {
      this._showUnfixable();
    }
  };

  AppleDeviceBugFixer.prototype._showUnfixable = function() {
    window.alert('WARNING: a bug in your browser will degrade your ' +
      'Cubezapp experience. We suggest that you refresh this page.');
  };

  window.app.AppleDeviceBugFixer = AppleDeviceBugFixer;

})();
