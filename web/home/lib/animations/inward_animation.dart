part of home_page;

class InwardAnimation extends Animator {
  double animationDuration = 1.0;
  
  void showFinishedState() {
    element.style.width = '100%';
    element.style.height = '100%';
    element.style.top = '0';
    element.style.left = '0';
    element.style.opacity = '1.0';
  }
  
  void showInitialState() {
    element.style.width = '110%';
    element.style.height = '110%';
    element.style.top = '-5%';
    element.style.left = '-5%';
    element.style.opacity = '0.0';
  }
  
  String get animationName => 'introduction-forward-animation';
  
  InwardAnimation(Element e) : super(e);
}
