(function() {
  
  function formatTime(millis) {
    // This is the definition of ugly code.
    var centiseconds = '' + (Math.floor(millis/10)%100);
    var seconds = '' + (Math.floor(millis/1000)%60);
    var minutes = '' + (Math.floor(millis/60000)%60);
    var hours = '' + (Math.floor(millis/3600000)%60);
    if (centiseconds.length < 2) {
      centiseconds = '0' + centiseconds;
    }
    if (minutes === '0' && hours === '0') {
      return seconds + '.' + centiseconds;
    } else if (hours === '0') {
      seconds = padZero(seconds);
      return minutes + ':' + seconds + '.' + centiseconds;
    } else {
      seconds = padZero(seconds);
      minutes = padZero(minutes);
      return hours + ':' + minutes + ':' + seconds + '.' + centiseconds;
    }
  }
  
  function padZero(s) {
    if (s.length < 2) {
      return '0' + s;
    }
    return s;
  }
  
  window.app.formatTime = formatTime;
  
})();