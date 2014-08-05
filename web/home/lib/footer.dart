part of timer_page;

class Footer {
  final DivElement element;
  final List<ButtonElement> tabs;
  bool expanded;
  
  Footer(this.element) : tabs = <ButtonElement>[] {
    expanded = true;
    element.querySelector('.close-button').onClick.listen(expand);
    for (int i = 1; i <= 3; ++i) {
      tabs.add(element.querySelector('.tab$i'));
      tabs[i - 1].onClick.listen((_) {
        tabPressed(i - 1);
      });
    }
    tabPressed(0);
  }
  
  void expand(_) {
    if (expanded) {
      element.classes.remove('footer-up');
      element.classes.add('footer-down');
    } else {
      element.classes.remove('footer-down');
      element.classes.add('footer-up');
    }
    expanded = !expanded;
    setTabsEnabled(expanded);
  }
  
  void tabPressed(int idx) {
    for (int i = 0; i < 3; ++i) {
      if (i == idx) {
        if (tabs[i].classes.contains('tab-unselected')) {
          tabs[i].classes.remove('tab-unselected');
        }
        tabs[i].classes.add('tab-selected');
      } else {
        if (tabs[i].classes.contains('tab-selected')) {
          tabs[i].classes.remove('tab-selected');
        }
        tabs[i].classes.add('tab-unselected');
      }
    }
  }
  
  void setTabsEnabled(bool flag) {
    for (ButtonElement b in tabs) {
      b.disabled = !flag;
      b.style.cursor = flag ? 'pointer' : 'auto';
    }
  }
  
}
