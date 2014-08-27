part of home_page;

class Footer extends View {
  final Element tabsElement;
  final List<ButtonElement> tabs = [];
  final List<DivElement> views = [];
  final List<StreamSubscription> subs = [];
  Burger burger;
  
  bool get slideDirection => false;
  
  Future _expandFuture = new Future(() => null);
  FooterSlideup slideupAnimation;
  FadeAnimation fadeAnimation;
  
  Footer(Element e, {bool expand: true}) : super(e),
      tabsElement = e.querySelector('.tabs') {
    ElementList tabEls = tabsElement.querySelectorAll('.tab');
    for (ButtonElement el in tabEls) {
      tabs.add(el);
      subs.add(el.onClick.listen(_tabPressed));
    }
    for (int i = 0; i < 3; ++i) {
      views.add(element.querySelector('.view${i + 1}'));
    }
    
    slideupAnimation = new FooterSlideup(element);
    fadeAnimation = new FadeAnimation(tabsElement);
    
    burger = new Burger(element.querySelector('.close-button'),
                        32, !expand);
    burger.onChange.listen((_) {
      setExpanded(!burger.closed);
    });
    setExpanded(expand, animate: false);
  }
  
  void destroy() {
    for (StreamSubscription sub in subs) {
      sub.cancel();
    }
    burger.destroy();
  }
  
  void setExpanded(bool flag, {bool animate: true}) {
    _expandFuture = _expandFuture.then((_) {
      return Future.wait([slideupAnimation.setFinished(flag, animate: animate),
                          fadeAnimation.setFinished(flag, animate: animate)]);
    });
  }
  
  void _tabPressed(MouseEvent tabEvent) {
    ButtonElement tab = tabEvent.target;
    int idx = tabs.indexOf(tab);
    for (int i = 0; i < 3; ++i) {
      if (i == idx) {
        views[i].classes.remove('footer-view-hidden');
        views[i].classes.add('footer-view-visible');
        tabs[i].classes.remove('tab-unselected');
        tabs[i].classes.add('tab-selected');
      } else {
        views[i].classes.remove('footer-view-visible');
        views[i].classes.add('footer-view-hidden');
        tabs[i].classes.remove('tab-selected');
        tabs[i].classes.add('tab-unselected');
      }
    }
  }
}
