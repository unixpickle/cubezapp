part of home_page;

class FooterSlideup extends Animator {
  double animationDuration = 0.7;
  
  void showFinishedState() {
    element.style.bottom = '0';
  }
  
  void showInitialState() {
    element.style.bottom = '-260px';
  }
  
  String get animationName => 'footer-slide-up';
  
  FooterSlideup(Element e) : super(e);
}
