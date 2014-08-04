part of timer_page;

class TimerInput {
  final TextInputElement input;
  String text;
  
  TimerInput(this.input) {
    input.onFocus.listen(handleFocus);
    input.onKeyPress.listen(handleKeyPress);
    text = '';
  }
  
  void handleFocus(Event e) {
    e.preventDefault();
    scheduleMicrotask(() {
      input.selectionStart = input.value.length;
      input.selectionEnd = input.value.length;
    });
  }
  
  void handleKeyPress(KeyboardEvent event) {
    event.preventDefault();
    
    if (event.keyCode < 0x30 || event.keyCode > 0x39) {
      
    }
    int idx = input.selectionStart - 1;
    if (idx < 0 || idx >= input.value.length) {
      return;
    }
    
    String replacing = input.value[idx];
    if (replacing == ':') {
      if (event.keyCode != 0x3a) return;
    } else if (replacing == '.') {
      if (event.keyCode != 0x2e) return;
    } else if (event.keyCode < 0x30 || event.keyCode > 0x39) {
      return;
    }
    String pref = input.value.substring(0, idx);
    String end = input.value.substring(idx + 1);
    String key = new String.fromCharCode(event.keyCode);
    input.value = '$pref$key$end';
    input.selectionEnd = idx - 1;
  }
  
  void updateInputValue() {
    String realText = text;
    while (realText.length < 5) {
      realText = realText + '0';
    } 
    input.value = realText[4] + ':' + realText.substring(2, 4) + '.' +
        realText.substring(0, 2);
  }
}
