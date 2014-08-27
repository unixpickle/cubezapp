part of home_page;

abstract class Animator {
  final Element element;
  bool _finished = null;
  Future _currentFuture = new Future.sync(() => null);
  
  void showFinishedState();
  void showInitialState();
  
  void prepareForFinished() {
  }
  
  void prepareForInitial() {
  }
  
  String get animationName;
  double get animationDuration;
  
  Animator(this.element);
  
  Future setFinished(bool flag, {bool animate: true}) {
    return _currentFuture = _currentFuture.then((_) {
      if (flag == _finished) return null;
      if (flag) prepareForFinished();
      else prepareForInitial();
      
      _finished = flag;
      if (!animate) {
        if (flag) {
          showFinishedState();
        } else {
          showInitialState();
        }
        return new Future(() => null);
      }
      
      element.style.animation = animationName;
      element.style.animationDuration = '${animationDuration}s';
      element.style.animationDirection = flag ? 'normal' : 'reverse';
      element.style.animationFillMode = 'forwards';
      return Window.animationEndEvent.forElement(element).first.then((_) {
        if (flag) {
          showFinishedState();
        } else {
          showInitialState();
        }
        element.style.animation = '';
      });
    });
  }
}
