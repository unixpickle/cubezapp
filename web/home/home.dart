library timer_page;

import 'dart:html';
import 'dart:async';

part 'lib/time_input.dart';
part 'lib/footer.dart';

TimeInput timeInput;
Footer footer;

void main() {  
  timeInput = new TimeInput(querySelector('#time-input'));
  timeInput.onSubmit.listen((KeyboardEvent e) {
    window.alert('submitted time ${timeInput.time}');
  });
  footer = new Footer(querySelector('#footer'));
}
