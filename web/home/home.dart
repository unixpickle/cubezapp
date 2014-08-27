library home_page;

import 'dart:html';
import 'dart:math';
import 'dart:async';
import '../pentagons/pentagons.dart';
import 'package:crystal/crystal.dart';

part 'lib/theme.dart';
part 'lib/header.dart';
part 'lib/footer.dart';
part 'lib/burger.dart';
part 'lib/volume_button.dart';
part 'lib/login_context.dart';

PentagonView pentagons;
Header header;
Footer footer;
Burger burger;

LoginContext loginContext = new LoginContext();

void main() {
  Theme th = new Theme([0x34, 0x98, 0xd8]);
  th.activate();
  
  handleURLChange();
  
  header = new Header(querySelector('.page-header'));
  footer = new Footer(querySelector('.page-footer'), true);
  
  querySelector('.right-dropdown-stub').onClick.listen((_) {
    loginContext.start(true);
  });
  window.onPopState.listen((PopStateEvent e) {
    handleURLChange();
  });
  
  setupAddDelButtons();
  setupPentagons();
  initializePage();
}

void handleURLChange() {
  if (window.location.hash.length > 0) {
    Match m = new RegExp(r'([a-fA-F0-9]+)$').firstMatch(window.location.hash);
    if (m != null) {
      int colorValue = int.parse(m.group(1), radix: 16);
      List<int> color = [(colorValue >> 16), (colorValue >> 8) & 0xff,
                         colorValue & 0xff];
      Theme th = new Theme(color);
      th.activate();
    } else if (window.location.hash == '#login') {
      loginContext.start();
    }
  } else {
    loginContext.stop();
  }
}

void setupAddDelButtons() {
  VolumeButton addButton = new VolumeButton(querySelector('.plus-button'), 26,
      true);
  VolumeButton minusButton = new VolumeButton(querySelector('.minus-button'),
      26, false);
  addButton.canvas..onMouseEnter.listen((_) {
    addButton.focused = true;
  })..onMouseLeave.listen((_) {
    addButton.focused = false;
  });
  minusButton.canvas..onMouseEnter.listen((_) {
    minusButton.focused = true;
  })..onMouseLeave.listen((_) {
    minusButton.focused = false;
  });
}

void setupPentagons() {
  DpiMonitor monitor = new DpiMonitor();
  CanvasElement canvas = querySelector('#pentagons');
  pentagons = new PentagonView(canvas);
  pentagons.start();
  
  void resizePentagons(_) {
    canvas.width = (window.innerWidth * monitor.pixelRatio).round();
    canvas.height = (window.innerHeight * monitor.pixelRatio).round();
    pentagons.draw();
  };
  
  window.onResize.listen(resizePentagons);
  monitor.onChange.listen(resizePentagons);
  resizePentagons(null);
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
