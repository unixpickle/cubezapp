part of home_page;

class LoginContext {
  Future _animation = new Future(() => null);
  bool _showing = false;
  
  bool get showing => _showing;
  
  void start([bool pushState = false]) {
    _animation = _animation.then((_) {
      if (_showing) return null;
      _showing = true;
      if (pushState) {
        window.history.pushState('login', 'Login', '#login');
      }
      pentagons.pause();
      querySelector('body').classes.add('blurring');
      return new Future(() => null);
    }).then((_) {
      querySelector('body').classes.add('blurred');
      return new Future.delayed(new Duration(milliseconds: 1200));
    });
  }
  
  void stop() {
    _animation = _animation.then((_) {
      if (!_showing) return null;
      _showing = false;
      querySelector('body').classes.remove('blurred');
      pentagons.resume();
      return new Future.delayed(new Duration(milliseconds: 1200)).then((_) {
        querySelector('body').classes.remove('blurring');
      });
    });
  }
}
