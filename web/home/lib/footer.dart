part of home_page;

class Footer {
  final DivElement element;
  final List<ButtonElement> tabs = [];
  final List<DivElement> views = [];
  final List<StreamSubscription> subs = [];
  Burger burger;
  
  bool _expanded;
  
  Footer(this.element, bool isExpanded) {
    ElementList tabEls = element.querySelectorAll('.tab');
    for (ButtonElement el in tabEls) {
      tabs.add(el);
      subs.add(el.onClick.listen(_tabPressed));
    }
    for (int i = 0; i < 3; ++i) {
      views.add(element.querySelector('.view${i + 1}'));
    }
    _expanded = isExpanded;
    burger = new Burger(element.querySelector('.close-button'),
                        32, !isExpanded);
    if (_expanded) {
      element.classes.remove('footer-down');
      element.classes.add('footer-up');
    } else {
      element.classes.remove('footer-up');
      element.classes.add('footer-down');
    }
    burger.onChange.listen((_) {
      expanded = !burger.closed;
    });
  }
  
  void destroy() {
    for (StreamSubscription sub in subs) {
      sub.cancel();
    }
    burger.destroy();
  }
  
  bool get expanded => _expanded;
  
  void set expanded(bool flag) {
    _expanded = flag;
    if (_expanded) {
      element.classes.remove('footer-down');
      element.classes.add('footer-up');
    } else {
      element.classes.remove('footer-up');
      element.classes.add('footer-down');
    }
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
