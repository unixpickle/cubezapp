(function() {

  function init() {
    initializeModel();
    initializeView();
    initializeController();
  }

  function initializeController() {
    window.app.settingsController =
      new window.app.SettingsController(window.app.view.footer.settings);
    window.app.timesController =
      new window.app.TimesController(window.app.view.footer.stats.times);
    window.app.headerController =
      new window.app.HeaderController(window.app.view.header);
    window.app.view.on('load', function() {
      window.app.timerController = new window.app.TimerController();
    });
  }

  function initializeModel() {
    window.app.store = new window.app.LocalStore();
    window.app.timer = new window.app.Timer();
  }

  function initializeView() {
    window.app.windowSize = new window.app.WindowSize();
    window.app.fonts = new window.app.Fonts();
    window.app.flavors = new window.app.Flavors();
    window.app.view = new window.app.AppView();
  }

  $(init);

})();
