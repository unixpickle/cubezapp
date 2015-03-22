(function() {
  
  function formatSeconds(millis) {
    var seconds = '' + (Math.floor(millis/1000)%60);
    var minutes = '' + (Math.floor(millis/60000)%60);
    var hours = '' + (Math.floor(millis/3600000)%60);
    if (minutes === '0' && hours === '0') {
      return seconds;
    } else if (hours === '0') {
      return minutes + ':' + padZero(seconds);
    } else {
      return hours + ':' + padZero(minutes) + ':' + padZero(seconds);
    }
  }
  
  function formatTime(millis) {
    // This is the definition of ugly code.
    var centiseconds = padZero('' + (Math.floor(millis/10)%100));
    var seconds = '' + (Math.floor(millis/1000)%60);
    var minutes = '' + (Math.floor(millis/60000)%60);
    var hours = '' + (Math.floor(millis/3600000)%60);
    if (minutes === '0' && hours === '0') {
      return seconds + '.' + centiseconds;
    } else if (hours === '0') {
      return minutes + ':' + padZero(seconds) + '.' + centiseconds;
    } else {
      seconds = padZero(seconds);
      minutes = padZero(minutes);
      return hours + ':' + padZero(minutes) + ':' + padZero(seconds) + '.' +
        centiseconds;
    }
  }
  
  function padZero(s) {
    if (s.length < 2) {
      return '0' + s;
    }
    return s;
  }
  
  window.app.formatSeconds = formatSeconds;
  window.app.formatTime = formatTime;
  
})();