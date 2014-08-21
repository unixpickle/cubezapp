library home_page;

import 'dart:html';
import 'dart:math';
import 'dart:async';
import '../pentagons/pentagons.dart';

part 'lib/scale.dart';
part 'lib/theme.dart';
part 'lib/header.dart';
part 'lib/footer.dart';
part 'lib/burger.dart';
part 'lib/volume_button.dart';

Header header;
Footer footer;
Burger burger;

void main() {
  List<int> color = [0x34, 0x98, 0xd8];
  if (window.location.hash != null) {
    Match m = new RegExp(r'([a-fA-F0-9]+)$').firstMatch(window.location.hash);
    if (m != null) {
      int colorValue = int.parse(m.group(1), radix: 16);
      color = [(colorValue >> 16), (colorValue >> 8) & 0xff, colorValue & 0xff];
    }
  }
  // 33ce75
  //Theme th = new Theme([0x34, 0x98, 0xd8]);
  //Theme th = new Theme([46, 204, 113]);
  //Theme th = new Theme([239, 72, 54]);
  //Theme th = new Theme([0x2c, 0x3e, 0x50]);
  //Theme th = new Theme([0x9b, 0x59, 0xb6]);
  //Theme th = new Theme([230, 126, 34]);
  //Theme th = new Theme([149, 165, 166]);
  //Theme th = new Theme([149, 165, 166]);
  //Theme th = new Theme([232, 201, 47]);
  //Theme th = new Theme([0, 0, 0]);
  //Theme th = new Theme([0xf2, 0xc3, 0x00]);
  //Theme th = new Theme([0x59, 0x30, 0x01]);
  //Theme th = new Theme([152,68,24]);
  Theme th = new Theme(color);
  th.activate();
  
  header = new Header(querySelector('.page-header'));
  footer = new Footer(querySelector('.page-footer'), false);
  
  VolumeButton addButton = new VolumeButton(querySelector('.plus-button'), 26,
      true);
  VolumeButton minusButton = new VolumeButton(querySelector('.minus-button'),
      26, false);
  addButton.element..onMouseEnter.listen((_) {
    addButton.focused = true;
  })..onMouseLeave.listen((_) {
    addButton.focused = false;
  });
  minusButton.element..onMouseEnter.listen((_) {
    minusButton.focused = true;
  })..onMouseLeave.listen((_) {
    minusButton.focused = false;
  });
  
  setupPentagons();
  initializePage();
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

void initializePage() {
  new Future(() {
    document.body.classes.add('before-load-animation');
    document.body.classes.remove('uninitialized');
    return new Future(() => null);
  }).then((_) {
    document.body.classes.add('load-animation');
    return new Future(() => null);
  }).then((_) {
    document.body.classes.remove('before-load-animation');
    return new Future.delayed(new Duration(milliseconds: 1200));
  }).then((_) {
    document.body.classes.add('loaded');
    document.body.classes.remove('load-animation');
  });
}
