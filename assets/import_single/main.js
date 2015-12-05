function importTime() {
  try {
    var timestamp = parseTimestamp();
    timestamp = Math.min(timestamp, new Date().getTime());
    
    var time = parseFloat(document.getElementById('time').value);
    if (isNaN(time) || time < 0) {
      throw 'Invalid time';
    }
    var memo = parseFloat(document.getElementById('memo').value) || -1;
    if (memo > time || (memo < 0 && memo !== -1)) {
      throw 'Invalid memo';
    }
    var scramble = document.getElementById('scramble').value;
    var scrambler = document.getElementById('scrambler').value;
    var scrambleType = document.getElementById('scramble-type').value;

    var solve = {
      date: timestamp,
      dnf: false,
      memo: Math.floor(memo * 1000),
      notes: '',
      plus2: false,
      scramble: scramble || null,
      scrambler: scrambler,
      scrambleType: scrambleType,
      time: Math.floor(time * 1000),
      lastPB: -1,
      lastPW: -1,
      id: generateId()
    };

    data = JSON.parse(localStorage.localStoreData);
    if (!data || !data.puzzles || !data.puzzles.length) {
      throw 'Bad existing data.';
    }

    var puzzleId = document.getElementById('puzzle').value;
    var solves = null;
    for (var i = 0, len = data.puzzles.length; i < len; ++i) {
      if (data.puzzles[i].id === puzzleId) {
        solves = data.puzzles[i].solves;
        break;
      }
    }
    if (!solves) {
      throw 'Puzzle was not found.';
    }

    solves.push(solve);
    solves.sort(function(a, b) {
      return a.date - b.date;
    });

    localStorage.localStoreData = JSON.stringify(data);
    document.body.innerHTML = '<strong>Import complete.</strong> Please refresh any instances of Cubezapp you have open. <strong>Otherwise, your PB might not be marked correctly.</strong>';
  } catch (e) {
    alert('Got an error, and I bet you know why... ' + e);
  }
}

function parseTimestamp() {
  var keys = ['month', 'day', 'year', 'hour', 'minute', 'second'];
  var values = {};
  for (var i = 0, len = keys.length; i < len; ++i) {
    var v = parseInt(document.getElementById(keys[i]).value);
    if (isNaN(v)) {
      throw 'Invalid date component: ' + keys[i];
    }
    values[keys[i]] = v;
  }
  var time = new Date(values.year, values.month-1, values.day, values.hour, values.minute,
    values.second).getTime();
  if (isNaN(time)) {
    throw 'Invalid date';
  }
  return time;
}

function populateScrambler() {
  var options = window.puzzlejs.scrambler.allPuzzles();
  var select = document.getElementById('scrambler');
  options.splice(0, 0, 'None');
  for (var i = 0, len = options.length; i < len; ++i) {
    var opt = document.createElement('option');
    opt.value = options[i];
    opt.innerText = options[i];
    select.appendChild(opt);
  }
  select.value = '3x3x3';
}

function populateScrambleType() {
  var select = document.getElementById('scramble-type');
  select.innerHTML = '';
  var current = document.getElementById('scrambler').value;
  if (current === 'None') {
    select.innerHTML = '<option value="None">None</option>';
    return;
  }

  var options = window.puzzlejs.scrambler.scramblersForPuzzle(current);
  for (var i = 0, len = options.length; i < len; ++i) {
    var opt = document.createElement('option');
    opt.value = options[i].name;
    opt.innerText = options[i].name;
    select.appendChild(opt);
  }
  select.value = options[0].name;
}

function populatePuzzle() {
  var data;

  try {
    data = JSON.parse(localStorage.localStoreData);
    if (!data || !data.puzzles || !data.puzzles.length) {
      throw new Error('bad data');
    }
  } catch (e) {
    document.body.innerHTML = 'You must load the homepage at least once before importing a time.';
    throw e;
  }

  var puzzles = data.puzzles;
  var select = document.getElementById('puzzle');
  for (var i = 0, len = puzzles.length; i < len; ++i) {
    var opt = document.createElement('option');
    opt.value = puzzles[i].id;
    opt.innerText = puzzles[i].name;
    select.appendChild(opt);
  }
  select.value = puzzles[0].id;
}

function generateId() {
  // Use window.crypto.getRandomValues() if it is available.
  if ('crypto' in window && 'getRandomValues' in window.crypto) {
    var arr = new Uint8Array(16);
    window.crypto.getRandomValues(arr);
    var result = '';
    for (var i = 0; i < 16; ++i) {
      var s = arr[i].toString(16);
      if (s.length === 1) {
        result += '0';
      }
      result += s;
    }
    return result;
  }

  // We must fall back on the Math.random() function.
  var identifier = '';
  var time = (new Date()).getTime() % 0x100;
  for (var i = 0; i < 16; ++i) {
    var number = (Math.floor(Math.random()*0x100)^time) % 0x100;
    var numStr = number.toString(16);
    if (numStr.length === 1) {
      identifier += '0';
    }
    identifier += numStr;
  }
  return identifier;
}

window.addEventListener('load', function() {
  populatePuzzle();
  populateScrambler();
  populateScrambleType();
  document.getElementById('scrambler').addEventListener('change', populateScrambleType);
});
