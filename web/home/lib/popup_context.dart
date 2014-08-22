part of home_page;

class PopupContext {
  void start() {
    querySelector('.page-header').classes.add('blurred');
    querySelector('.page-footer').classes.add('blurred');
    querySelector('#pentagons').classes.add('blurred');
  }
  
  void stop() {
    querySelector('.page-header').classes.remove('blurred');
    querySelector('.page-footer').classes.remove('blurred');
    querySelector('#pentagons').classes.remove('blurred');
  }
}
