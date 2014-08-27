part of home_page;

class FadeAnimation extends Animator {
  double animationDuration = 0.7;
  
  void showFinishedState() {
    element.style.pointerEvents = 'auto';
    element.style.opacity = '1.0';
  }
  
  void showInitialState() {
    element.style.opacity = '0.0';
  }
  
  void prepareForInitial() {
    element.style.pointerEvents = 'none';
  }
  
  String get animationName => 'fade-in-animation';
  
  FadeAnimation(Element e) : super(e);
}
