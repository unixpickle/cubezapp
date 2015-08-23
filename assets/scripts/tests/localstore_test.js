(function() {

  var assert = window.tests.assert;

  window.tests.testLocalStoreAddRemovePuzzle = function() {
    var oldId = window.app.store.getActivePuzzle().id;
    var oldDefaultAccuracy = window.app.store.getGlobalSettings().timerAccuracy;
    var defaultAccuracy = 1;
    if (oldDefaultAccuracy === 1) {
      defaultAccuracy = 2;
    }
    window.app.store.modifyGlobalSettings({timerAccuracy: defaultAccuracy});

    var name = 'Puzzle ' + window.app.generateId();
    window.app.store.addPuzzle({
      name: name,
      icon: '3x3x3',
      scrambler: 'None',
      scrambleType: 'None'
    });
    window.app.store.modifyGlobalSettings({timerAccuracy: oldDefaultAccuracy});
    var puzzle = window.app.store.getActivePuzzle();
    var newId = puzzle.id;
    assert(newId !== oldId, 'puzzle did not switch after addPuzzle');
    assert(puzzle.timerAccuracy === defaultAccuracy, 'invalid timerAccuracy');
    assert(puzzle.name === name, 'invalid name');
    assert(puzzle.icon === '3x3x3', 'invalid icon');
    assert(puzzle.scrambler === 'None', 'invalid scrambler');
    assert(puzzle.scrambleType === 'None', 'invalid scrambleType');

    window.app.store.switchPuzzle(oldId);
    window.app.store.deletePuzzle(newId);
    var puzzles = window.app.store.getPuzzles();
    for (var i = 0; i < puzzles.length; ++i) {
      assert(puzzles[i].id !== newId, 'removePuzzle did not remove the puzzle');
    }
  };

})();
