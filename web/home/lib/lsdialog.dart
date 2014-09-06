part of home_page;

/**
 * Login/signup dialog
 */
class LSDialog extends Animatable {
  bool get slideDirection => true;
  Animatable signinView;
  List<Animatable> signupViews;
  
  int page = 0;
  
  LSDialog(Element e) : super(e, headerPresentation) {
    signinView = new Animatable(e.querySelector('.signin-view'),
        lsPagePresentation);
    signupViews = [];
    for (int i = 1; i < 4; ++i) {
      signupViews.add(new Animatable(e.querySelector('.signup-view-page-$i'),
          lsPagePresentation));
    }
    signinView.element.querySelector('.register').onClick.listen(_showNext);
    signupViews[0].element.querySelector('.enter').onClick.listen(_showNext);
    signupViews[1].element.querySelector('.enter').onClick.listen(_showNext);
  }
  
  void reset() {
    page = 0;
    for (Animatable a in signupViews) {
      a.run(false);
    }
    signinView.run(true);
  }
  
  void _showNext(_) {
    if (page == 0) {
      signinView.run(false, duration: 0.5).then((_) {
        signupViews.first.run(true, duration: 0.5);
      });
    } else if (page == 1) {
      signupViews.first.run(false, duration: 0.5).then((_) {
        signupViews[1].run(true, duration: 0.5);
      });
    } else if (page == 2) {
      signupViews[1].run(false, duration: 0.5).then((_) {
        signupViews[2].run(true, duration: 0.5);
      });
    } else {
      return;
    }
    ++page;
  }
}
