part of home_page;

class Header extends View {
  final DivElement buttons;
  List<StreamSubscription> subs = [];
  
  bool get slideDirection => true;
  
  Header(Element element) : super(element),
      buttons = element.querySelector('.volume-buttons') {
    element.querySelector('.name-field').onClick.listen((_) {
      if (buttons.classes.contains('volume-buttons-hidden')) {
        buttons.classes.remove('volume-buttons-hidden');
      } else {
        buttons.classes.add('volume-buttons-hidden');
      }
    });
  }
  
  void destroy() {
    for (StreamSubscription sub in subs) {
      sub.cancel();
    }
  }
}
