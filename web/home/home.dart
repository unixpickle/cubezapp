library timer_page;

import 'dart:html';
import 'dart:async';
import '../pentagons/pentagons.dart';
import '../close_burger/close_burger.dart' as burger;

part 'lib/time_input.dart';
part 'lib/footer.dart';
part 'lib/header.dart';

burger.BurgerView burgerView;
TimeInput timeInput;
Footer footer;
Header header;

void main() {
  timeInput = new TimeInput(querySelector('#time-input'));
  timeInput.onSubmit.listen((KeyboardEvent e) {
    window.alert('submitted time ${timeInput.time}');
  });
  footer = new Footer(querySelector('#footer'));
  header = new Header(querySelector('#header'));
  
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
