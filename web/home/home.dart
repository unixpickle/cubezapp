library home_page;

import 'dart:html';
import 'dart:async';
import '../pentagons/pentagons.dart';

part 'lib/theme.dart';
part 'lib/header.dart';

Header header;

void main() {
  // set the default theme
  Theme th = new Theme([0x34, 0x98, 0xd8]);
  th.activate();
  
  header = new Header(querySelector('.page-header'));
  
  setupPentagons();
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
