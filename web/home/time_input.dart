part of timer_page;

class TimeInput {
  final TextInputElement input;
  final List<int> numbers;
  
  final List<StreamSubscription> _subs;
  final StreamController<KeyboardEvent> _onSubmitController;
  
  Stream<KeyboardEvent> get onSubmit => _onSubmitController.stream;
  
  double get time {
    assert(numbers.length <= 7);
    List<double> fractions = [0.01, 0.1, 1.0, 10.0, 60.0, 600.0, 3600.0];
    double result = 0.0;
    for (int i = 0; i < numbers.length; i++) {
      result += fractions[i] * _digitAt(i); 
    }
    return result;
  }
  
  void set time(double t) {
    int number = (t * 100.0).round();
    List<int> moduli = [10, 10, 10, 6, 10, 6, 10];
    numbers.clear();
    for (int i = 0; i < 7 && number > 0; i++) {
      numbers.insert(0, number % moduli[i]);
      number ~/= moduli[i];
    }
    _updateInputValue();
  }
  
  TimeInput(this.input) : numbers = <int>[], _subs = <StreamSubscription>[],
      _onSubmitController = new StreamController<KeyboardEvent>.broadcast() {
    _subs.add(input.onFocus.listen(_positionCursor));
    _subs.add(input.onKeyUp.listen(_positionCursor));
    _subs.add(input.onMouseUp.listen(_positionCursor));
    _subs.add(input.onKeyPress.listen(_handleKeyPress));
    _subs.add(input.onKeyDown.listen(_handleKeyDown));
  }
  
  void detach() {
    for (StreamSubscription sub in _subs) {
      sub.cancel();
    }
    _subs.clear();
  }
  
  void _positionCursor(Event e) {
    input.selectionStart = input.value.length;
    input.selectionEnd = input.value.length;
  }
  
  void _handleKeyPress(KeyboardEvent event) {
    event.preventDefault();
    if (event.keyCode == 0xd || event.keyCode == 0x20) {
      _onSubmitController.add(event);
      return;
    }
    
    if (numbers.length > 6) return;
    if (event.keyCode < 0x30 || event.keyCode > 0x39) {
      return;
    }
    numbers.add(event.keyCode - 0x30);
    _updateInputValue();
  }
  
  void _handleKeyDown(KeyboardEvent event) {
    if (event.keyCode == 8) {
      event.preventDefault();
      if (numbers.length > 0) {
        numbers.removeLast();
        _updateInputValue();
      }
    }
  }
  
  void _updateInputValue() {
    String str = '${_digitAt(5)}${_digitAt(4)}:${_digitAt(3)}${_digitAt(2)}.' +
        '${_digitAt(1)}${_digitAt(0)}';
    for (int i = 6; i < numbers.length; i++) {
      if (i == 6) str = ':' + str;
      str = '${_digitAt(i)}$str';
    }
    input.value = str;
  }
  
  int _digitAt(int idx) {
    if (idx >= numbers.length) return 0;
    return numbers[numbers.length - idx - 1];
  }
}
