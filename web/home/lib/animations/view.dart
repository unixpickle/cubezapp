part of home_page;

abstract class View extends Animator {
  /**
   * Return `true` to slide down, `false` to slide up.
   */
  bool get slideDirection;
  
  String get animationName => slideDirection ? 'introduction-down-animation' :
      'introduction-up-animation';
  
  double get animationDuration => 1.0;
  
  void showFinishedState() {
    element.style.pointerEvents = 'auto';
    element.style.transform = 'none';
    element.style.opacity = '1.0';
  }
  
  void showInitialState() {
    element.style.transform = slideDirection ? 'translate(0px, -30px)' :
        'translate(0px, 30px)';
    element.style.opacity = '0.0';
    element.style.display = 'none';
  }
  
  void prepareForInitial() {
    element.style.pointerEvents = 'none';
  }
  
  void prepareForFinished() {
    element.style.display = 'block';
  }
  
  View(Element element) : super(element) {
    setFinished(false, animate: false);
  }
}
