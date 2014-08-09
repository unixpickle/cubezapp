part of timer_page;

class Header {
  final DivElement element;
  DivElement puzzleButtons;
  DivElement puzzleName;
  bool hidden = true;
  
  Header(this.element) {
    puzzleName = this.element.querySelector('#puzzle-name-header');
    puzzleButtons = this.element.querySelector('#puzzle-button-header');
    puzzleName.onClick.listen(showHide);
  }
  
  showHide(_) {
    if (hidden) {
      puzzleButtons.classes.remove('button-header-hidden');
      puzzleButtons.classes.add('button-header-visible');
    } else {
      puzzleButtons.classes.remove('button-header-visible');
      puzzleButtons.classes.add('button-header-hidden');
    }
    hidden = !hidden;
  }
}
