# Model

The model stores and manipulates data. In the future, the model will be responsible for syncing with a server.

This document will provide some documentation on the interface that the model provides the rest of the app.

# The Format API

The model provides some functions on the `window.app` object which manipulate times:

 * `formatSeconds(millis)` - this generates a representation of a time in milliseconds without including centiseconds.
 * `formatTime(millis)` - this generates the canonical time representation of a time in milliseconds.

# Identifiers

The store uses unique identifiers a lot. To generate a 32-digit hex identifier, call `window.app.generateId`.

# The store

The global object `window.app.store` has various methods which provide data to the application.

The store has the following properties for event handlers:

 * `onExternalChange` - the model was changed remotely and all data should be reloaded in the UI.
 * `onExternalDelete` - the current puzzle was deleted remotely and has been changed locally.
 * `onStatsComputed` - the statistics for the current puzzle were re-computed.
 * `onStatsLoading` - the statistics for the current puzzle are out of date and are being re-computed.

There are many data manipulation methods on the store. Some of these options take a `cb` (callback) argument. If the method takes a `cb` argument, it is an asynchronous operation and may fail. If the method does not take a `cb` argument, it is synchronous. Synchronous operations are guaranteed to work, although they may not synchronize with a server until later.

Here are the methods which the store provides:

 * `addPuzzle(puzzle)` - create a new [Puzzle](#puzzle-object) in the store. This will automatically switch to the added puzzle.
 * `addSolve(solve)` - add a [Solve](#solve-object) to the current puzzle.
 * `deletePuzzle(id)` - delete a puzzle (besides the current puzzle) given its identifier.
 * `deleteSolve(id)` - delete a solve from the current puzzle. While this is a synchronous operation, it may still fail. If the delete operation fails, it will be as if the puzzle was deleted (upon the `deleteSolve` call) and then re-added externally (once the request failed).
 * `getActivePuzzle()` - get the current [Puzzle](#puzzle-object).
 * `getPuzzles()` - get the ordered list of [Puzzle](#puzzle-object) objects.
 * `getSolveCount(cb)` - get the number of [Solve](#solve-object) objects for the current puzzle.
 * `getSolves(start, count, cb)` - get a list of [Solve](#solve-object) objects asynchronously.
 * `modifyPuzzle(attrs)` - modify attributes of the current puzzle. Provide a dictionary of attributes to set on the current puzzle.
 * `modifySolve(id, attrs)` - modify attributes of a solve in the current puzzle. Provide a solve id and an object containing attributes to set.
 * `switchPuzzle(id, cb)` - switch to a new puzzle. If this fails, the active puzzle is not changed.

<a name="solve-object" />
## Solve

The **Solve** object stores all the information for a single recorded time. Here are the fields and their types:

 * `date` - int - the UNIX time in milliseconds when the timer was stopped
 * `dnf` - bool - whether or not the solve was a DNF
 * `inspection` - int - the number of milliseconds of inspection time used
 * `memo` - int - the number of milliseconds the user took to memorize the cube for a blindfolded solve
 * `notes` - string - user-added notes
 * `plus2` - bool - whether or not the solve was a +2. If this is true, the extra two seconds should be *added* to `time`.
 * `scramble` - string - the scramble that was given
 * `time` - int - the number of milliseconds that the solve physically took.
 * `id` - string - the unique identifier of the solve. **This field will not be present if the solve has not been added to the store.**

<a name="puzzle-object" />
## Puzzle

The **Puzzle** object stores the general information about a puzzle. Here are the fields it contains:

 * `name` - string - the user-assigned puzzle name
 * `icon` - string - the icon identifier
 * `scrambler` - string - the type of puzzle.js scrambler to use
 * `scrambleType` - string - the subtype of the scrambler to use
 * `scrambleLength` - int - the number of moves to use in the scramble if applicable
 * `lastUsed` - int - the UNIX time in milliseconds that the user last modified or switched to this puzzle
 * `id` - string - the unique identifier of the puzzle. **This field will not be present if the puzzle has not been added to the store.**
