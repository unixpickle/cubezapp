(function() {

  function init() {
    initializeModel();
    initializeView();
    initializeController();
  }

  function initializeController() {
    window.app.settingsController =
      new window.app.SettingsController(window.app.view.footer.settings);
    window.app.headerController =
      new window.app.HeaderController(window.app.view.header);
    window.app.view.on('load', function() {
      window.app.timerController = new window.app.TimerController();
    });
  }

  function initializeModel() {
    var store = new window.app.LocalStore();
    window.app.store = store;
  }

  function initializeView() {
    window.app.windowSize = new window.app.WindowSize();
    window.app.flavors = new window.app.Flavors();
    window.app.view = new window.app.AppView();
  }

  $(init);

})();
