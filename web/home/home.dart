library home_page;

import 'dart:html';
import 'dart:math';
import 'dart:async';
import '../pentagons/pentagons.dart';
import 'package:crystal/crystal.dart';
import 'package:presenter/presenter.dart';

part 'lib/animations.dart';
part 'lib/theme.dart';
part 'lib/header.dart';
part 'lib/footer.dart';
part 'lib/burger.dart';
part 'lib/volume_button.dart';
part 'lib/application.dart';
part 'lib/lsdialog.dart';
part 'lib/puzzles_view.dart';
part 'lib/puzzle_view.dart';

Application app;

void main() {
  app = new Application();
  
  Theme th = new Theme([0x34, 0x98, 0xd8], app);
  th.activate();
}
