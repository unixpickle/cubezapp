part of home_page;

class PopupContext {
  Future start() {
    querySelector('body').classes.add('blurring');
    querySelector('body').classes.add('blurred');
    pentagons.pause();
    Future f = new Future.delayed(new Duration(milliseconds: 1200));
    window.history.pushState('login', 'Login', '#login');
    window.onPopState.first.then((_) {
      window.history.replaceState('home', 'Cubezapp - Home', '');
      f.then((_) => stop());
    });
    return f;
  }
  
  Future stop() {
    querySelector('body').classes.remove('blurred');
    return new Future.delayed(new Duration(milliseconds: 1200)).then((_) {
      querySelector('body').classes.remove('blurring');
      pentagons.resume();
      return new Future(() => null);
    });
  }
}
