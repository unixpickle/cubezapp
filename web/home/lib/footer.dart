part of home_page;

class Footer extends Animatable {
  final Element tabsElement;
  final List<ButtonElement> tabs = [];
  final List<DivElement> views = [];
  final List<StreamSubscription> subs = [];
  Burger burger;
  
  bool get slideDirection => false;
  
  Future _expandFuture = new Future(() => null);
  Animatable slideUpAnimation;
  Animatable fadeInAnimation;
  
  Footer(Element e, {bool expand: true}) : super(e, footerPresentation),
      tabsElement = e.querySelector('.tabs') {
    slideUpAnimation = new Animatable(element, propertyKeyframes('bottom',
        '-260px', '0px'));
    fadeInAnimation = new Animatable(tabsElement, propertyKeyframes('opacity',
        '0.0', '1.0'));
    
    ElementList tabEls = tabsElement.querySelectorAll('.tab');
    for (ButtonElement el in tabEls) {
      tabs.add(el);
      subs.add(el.onClick.listen(_tabPressed));
    }
    for (int i = 0; i < 3; ++i) {
      views.add(element.querySelector('.view${i + 1}'));
    }
        
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
      double duration = animate ? 0.5 : 0.0;
      if (!flag) {
        tabsElement.style.pointerEvents = 'none';
      } else {
        tabsElement.style.pointerEvents = 'auto';
      }
      return Future.wait([slideUpAnimation.run(flag, duration: duration),
                          fadeInAnimation.run(flag, duration: duration)]);
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
