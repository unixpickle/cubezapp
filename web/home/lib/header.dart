part of home_page;

class Header extends Animatable {
  final Application application;
  final DivElement buttons;
  final DivElement rightDropdown;
  final DivElement leftDropdown;
  List<StreamSubscription> subs = [];
  
  bool get slideDirection => true;
  
  Header(this.application, Element element)
      : super(element, headerPresentation),
        buttons = element.querySelector('.volume-buttons'),
        leftDropdown = element.querySelector('.left-dropdown-stub '
                                             '.name-field'),
        rightDropdown = element.querySelector('.right-dropdown-stub') {
    leftDropdown.onClick.listen((_) {
      if (buttons.classes.contains('volume-buttons-hidden')) {
        buttons.classes.remove('volume-buttons-hidden');
        application.puzzles.show();
      } else {
        buttons.classes.add('volume-buttons-hidden');
        application.puzzles.hide();
      }
    });
  }
  
  void destroy() {
    for (StreamSubscription sub in subs) {
      sub.cancel();
    }
  }
}
