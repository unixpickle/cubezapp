(function() {
  
  $(function() {
    window.app.view = new window.app.AppView();
    
    // Create a temporary button that shows a scramble.
    var scrambles = [
      null,
      "U2' F3' R32 U R3' U3 R3 F2 R2' U32 F3' R2 U22 R2 F2' U3' F32 U3' R22 U32 R3' U R32 F' R2 U22 F2 U' F U2 F3 R F3' U3' F22 U2 R' F3' U2 F3 R2 F' U2 R' F' R3 F' U2 F3' R2 U3 R2' U' F2 U2 R2' U R2' F32 U22 R22 U32 R22 U2 R3' F U' F2 U3 F22 R22 F3 R3' F2 U3' R3 U R' F2 R22 F2 U3 R3' F U3 R2 F U3' F22 R3'",
      "R2 U D F B R2 L' D2 B2 D' L2 R D2 B2 U L2 D' F2 D B2",
    ];
    var scrambleIdx = 0;
    var button = $('<button>Change scramble</button>');
    button.click(function() {
      scrambleIdx++;
      if (scrambleIdx >= scrambles.length) {
        scrambleIdx = 0;
      }
      window.app.view.setScramble(scrambles[scrambleIdx]);
    });
    $('#header .top').append(button);
    
    // Create temporary button that toggles memo time.
    var hasMemo = false;
    button = $('<button>Memo</button>');
    button.click(function() {
      if (!hasMemo) {
        window.app.view.setMemo("13:37.15")
      } else {
        window.app.view.setMemo(null);
      }
      hasMemo = !hasMemo;
    });
    $('#header .top').append(button);
    
    // Create temporary button that toggles PB text.
    var hasPB = false;
    button = $('<button>PB</button>');
    button.click(function() {
      if (!hasPB) {
        window.app.view.setPB('New PB average');
      } else {
        window.app.view.setPB(null);
      }
      hasPB = !hasPB;
    });
    $('#header .top').append(button);
    
    var timer = new window.app.Timer();
    timer.onCancel = function() {
      window.app.view.setTheaterMode(false);
    };
    timer.onDone = function(record) {
      window.app.view.setTheaterMode(false);
      console.log(record);
    };
    timer.onStart = function() {
      window.app.view.setMemo(null);
      window.app.view.setTheaterMode(true);
    };
    timer.setMode(window.app.Timer.MODE_BLD);
    timer.setAccuracy(window.app.Timer.ACCURACY_CENTISECONDS);
  });
  
})();