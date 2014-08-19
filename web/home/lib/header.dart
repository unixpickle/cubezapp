part of home_page;

class Header {
  final DivElement element;
  final DivElement buttons;
  bool showing;
  List<StreamSubscription> subs = [];
  
  Header(DivElement element) : element = element,
      buttons = element.querySelector('.buttons') {
    showing = buttons.classes.contains('buttons-visible');
    subs.add(element.querySelector('.name-field').onClick.listen(_showHide));
  }
  
  void destroy() {
    for (StreamSubscription sub in subs) {
      sub.cancel();
    }
  }
  
  void _showHide(_) {
    if (showing) {
      buttons.classes.remove('buttons-visible');
      buttons.classes.add('buttons-hidden');
    } else {
      buttons.classes.remove('buttons-hidden');
      buttons.classes.add('buttons-visible');
    }
    showing = !showing;
  }
}
