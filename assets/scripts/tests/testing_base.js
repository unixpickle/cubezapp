(function() {

  window.tests = {};

  window.tests.assert = function(statement, message) {
    if (!statement) {
      throw new Error(message || 'assertion failure');
    }
  };

  window.tests.runAll = function() {
    var keys = Object.keys(window.tests);
    for (var i = 0; i < keys.length; ++i) {
      var key = keys[i];
      if (/^test/.exec(key)) {
        console.log('Running ' + key + '...');
        window.tests[key]();
      }
    }
    console.log('Done');
  };

})();