library timer_page;

import 'dart:html';
import 'dart:async';

part 'time_input.dart';

TimeInput timeInput;

void main() {
  timeInput = new TimeInput(querySelector('#time-input'));
  timeInput.onSubmit.listen((KeyboardEvent e) {
    window.alert('submitted time ${timeInput.time}');
  });
}