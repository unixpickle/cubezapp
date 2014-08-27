part of home_page;

class Application {
  final PentagonView pentagons;
  final Header header;
  final Footer footer;
  final LSDialog dialog;
  Theme theme;
  
  bool get isLoginPage => window.location.hash == '#login';
  
  Application() : header = new Header(querySelector('.page-header')),
      footer = new Footer(querySelector('.page-footer')),
      dialog = new LSDialog(querySelector('.login-signup')),
      pentagons = new PentagonView(querySelector('#pentagons')) {
    new Future.delayed(new Duration(milliseconds: 150)).then((_) {
      InwardAnimation anim = new InwardAnimation(pentagons.element);
      anim.setFinished(true);
      pentagons.element.style.display = 'block';
    });
    
    _setupPentagons();
    _setupAddDelButtons();
    if (!isLoginPage) {
      header.setFinished(true);
      footer.setFinished(true);
    } else {
      dialog.setFinished(true);
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
}
