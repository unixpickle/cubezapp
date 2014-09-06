part of home_page;

class Application {
  final PentagonView pentagons;
  final Header header;
  final Footer footer;
  final LSDialog dialog;
  Theme theme;
  
  bool switchedPage = false;
  bool get isLoginPage => window.location.hash == '#login';
  Future switchFuture = new Future(() => null);
  
  Application() : header = new Header(querySelector('.page-header')),
      footer = new Footer(querySelector('.page-footer')),
      dialog = new LSDialog(querySelector('.login-signup')),
      pentagons = new PentagonView(querySelector('#pentagons')) {
    Animatable pentFade = new Animatable(pentagons.element,
        pentagonsPresentation);
    
    new Future.delayed(new Duration(milliseconds: 150)).then((_) {
      pentFade.run(true, duration: 0.7);
    });
    
    _setupPentagons();
    _setupAddDelButtons();
    
    header.rightDropdown.onClick.listen((_) {
      switchedPage = true;
      window.history.pushState('login', 'Cubezapp - Login', '#login');
      switchPage();
    });
    window.onPopState.listen((_) {
      switchPage();
    });
    
    if (!isLoginPage) {
      header.run(true, duration: 0.7);
      footer.run(true, duration: 0.7);
      dialog.run(false);
    } else {
      dialog.reset();
      dialog.run(true, duration: 0.7);
      header.run(false);
      footer.run(false);
    }
  }
  
  void _setupPentagons() {
    DpiMonitor monitor = new DpiMonitor();
    CanvasElement canvas = querySelector('#pentagons');
    pentagons.start();
    
    void resizePentagons(_) {
      canvas.width = (window.innerWidth * monitor.pixelRatio).round();
      canvas.height = (window.innerHeight * monitor.pixelRatio).round();
      pentagons.draw();
    };
    
    window.onResize.listen(resizePentagons);
    monitor.onChange.listen(resizePentagons);
    resizePentagons(null);
  }
  
  void _setupAddDelButtons() {
    VolumeButton addButton = new VolumeButton(querySelector('.plus-button'), 26,
        true);
    VolumeButton minusButton = new VolumeButton(querySelector('.minus-button'),
        26, false);
    addButton.canvas..onMouseEnter.listen((_) {
      addButton.focused = true;
    })..onMouseLeave.listen((_) {
      addButton.focused = false;
    });
    minusButton.canvas..onMouseEnter.listen((_) {
      minusButton.focused = true;
    })..onMouseLeave.listen((_) {
      minusButton.focused = false;
    });
  }
  
  void switchPage() {
    if (!switchedPage) return; // deal with Safari
    bool showLogin = isLoginPage;
    switchFuture = switchFuture.then((_) {
      String easing = 'ease-out';
      if (showLogin) {
        dialog.reset();
        return Future.wait([
            dialog.run(true, duration: 0.7, delay: 0.45,
                       timingFunction: easing),
            header.run(false, duration: 0.7, timingFunction: easing),
            footer.run(false, duration: 0.7, timingFunction: easing)
        ]);
      } else {
        return Future.wait([
            dialog.run(false, duration: 0.7, timingFunction: easing),
            header.run(true, duration: 0.7, delay: 0.45,
                       timingFunction: easing),
            footer.run(true, duration: 0.7, delay: 0.45,
                       timingFunction: easing)
        ]);
      }
    });
  }
}
