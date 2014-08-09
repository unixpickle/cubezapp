part of timer_page;

class Footer {
  final DivElement element;
  final List<ButtonElement> tabs;
  final List<DivElement> tabContent;
  bool expanded;
  
  Footer(this.element) : tabs = [], tabContent = [] {
    expanded = true;
    element.querySelector('.close-button').onClick.listen(expand);
    for (int i = 1; i <= 3; ++i) {
      tabs.add(element.querySelector('.tab$i'));
      tabs[i - 1].onClick.listen((_) {
        tabPressed(i - 1);
      });
    }
    for (String name in ['session-view', 'puzzle-view', 'settings-view']) {
      tabContent.add(element.querySelector('#$name'));
    }
    tabPressed(0);
    
    burgerView = new burger.BurgerView(element.querySelector('.close-button'));
    burgerView.draw();
  }
  
  void expand(_) {
    if (expanded) {
      element.classes.remove('footer-up');
      element.classes.add('footer-down');
      burgerView.setClosed(true);
    } else {
      element.classes.remove('footer-down');
      element.classes.add('footer-up');
      burgerView.setClosed(false);
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
        if (tabContent[i].classes.contains('footer-view-hidden')) {
          tabContent[i].classes.remove('footer-view-hidden');
        }
        tabContent[i].classes.add('footer-view-visible');
      } else {
        if (tabs[i].classes.contains('tab-selected')) {
          tabs[i].classes.remove('tab-selected');
        }
        tabs[i].classes.add('tab-unselected');
        if (tabContent[i].classes.contains('footer-view-visible')) {
          tabContent[i].classes.remove('footer-view-visible');
        }
        tabContent[i].classes.add('footer-view-hidden');
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
