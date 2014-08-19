library home_page;

import 'dart:html';
import 'dart:math';
import 'dart:async';
import '../pentagons/pentagons.dart';

part 'lib/theme.dart';
part 'lib/header.dart';
part 'lib/footer.dart';
part 'lib/burger.dart';

Header header;
Footer footer;
Burger burger;

void main() {
  // set the default theme
  
  // 33ce75
  Theme th = new Theme([0x34, 0x98, 0xd8]);
  //Theme th = new Theme([0x33, 0xce, 0x75]);
  //Theme th = new Theme([0xe7, 0x4c, 0x3c]);
  //Theme th = new Theme([0x2c, 0x3e, 0x50]);
  //Theme th = new Theme([0x9b, 0x59, 0xb6]);
  //Theme th = new Theme([230, 126, 34]);
  th.activate();
  
  header = new Header(querySelector('.page-header'));
  footer = new Footer(querySelector('.page-footer'), false);
  
  setupPentagons();
  initialAnimations();
}

void setupPentagons() {
  CanvasElement canvas = querySelector('#pentagons');
  PentagonView pents = new PentagonView(canvas);
  pents.start();
  window.onResize.listen((_) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    pents.draw();
  });
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  pents.draw();
}

void initialAnimations() {
  for (Element e in querySelectorAll('.slide-in-item')) {
    print('foo');
    e.classes.remove('slide-down-start');
    e.classes.remove('slide-up-start');
  }
  new Timer(new Duration(seconds: 1), () {
    for (Element e in querySelectorAll('.slide-in-item')) {
      e.classes.remove('slide-in-item');
    }
  });
}
