# Model

The model stores and manipulates data. In the future, the model will be responsible for syncing with a server.

This document will provide some basic documentation, both on the internal workings of the code but also on the interface it provides.

# Time manipulation

The model provides some functions on the `window.app` object which manipulate times:

 * `filterDigits(str)` - this function takes a string, removes characters which are not digits, and returns the result.
 * `parseTime(str)` - parse a "microwave" time (i.e. HH:MM:SS.CC) and returns a number in milliseconds.
 * `solveFromTime(time)` - creates a [Solve](#solve-object) with default fields from a time in milliseconds.
 * `solveTime(solve)` - returns the time (with any +2) for a [Solve](#solve-object).
 * `solveToHTML(solve)` - turns a solve into HTML with DNF and +2 visually indicated.
 * `timeToString(millis)` - turns a time in milliseconds into a "microwave" string.

# Identifiers

The store uses unique identifiers a lot. To generate a 32-digit hex identifier, call `window.app.generateId`.

# The store

The global object `window.app.store` has various properties and methods which provide data to the application.

The store has the following properties for event handlers:

 * `onSessionChanged` - something in the session was changed remotely by another window or client.
 * `onPuzzlesChanged` - a puzzle was changed, deleted, or re-ordered remotely by another window or client.
 * `onStatsComputed` - the overall puzzle stats were computed.
 * `onStatsLoading` - the overall puzzle stats are being calculated and are not currently available.

The store provides the following methods which make it possible to manipulate data:

 * `addPuzzle(puzzle)` - provide a [Puzzle](#puzzle-object) to add to the store. This will automatically switch to the added puzzle and create a blank session.
 * `addSolve(solve)` - adds a solve to the session. Provide a [Solve](#solve-object).
 * `changePuzzle(attrs)` - modifies the current puzzle. Provide a dictionary containing keys to set on the current puzzle.
 * `changeSolve(id, attrs)` - modifies the properties of a solve in the current session. Provide a solve id and an object containing properties to set.
 * `deleteSession(id)` - delete a session from the current puzzle, provided it is not the current session.
 * `deleteSolve(id)` - delete a solve from the current session.
 * `getActivePuzzle()` - get the current [Puzzle](#puzzle-object)
 * `getActiveSession()` - get the current [Session](#session-object)
 * `getPuzzles()` - get a list of [Puzzle](#puzzle-object) objects.
 * `newSession(keepLast, callback)` - create a new session. If `keepLast` is false, the current session will be deleted after a new one is added. The `callback` is called with an error argument after the session is added or the addition fails.
 * `switchPuzzle(id, callback)` - switch to a new puzzle. The `callback` is called with an error argument after the puzzle is switched or an error occurs.

<a name="solve-object" />
## Solve

The **Solve** object stores all the information for a single recorded time. Here are the fields and their types:

 * `dnf` - bool - indicates if the solve was a DNF
 * `inspection` - int - the number of milliseconds the user inspected for
 * `memo` - int - the number of milliseconds the user took to memorize a cube for BLD
 * `notes` - string - optional user-added notes
 * `plus2` - bool - if the solve was a +2
 * `scramble` - string - the scramble that was given
 * `time` - int - the number of milliseconds that the solve took

Additionally, Solve objects which have been added to the store have an `id` attribute which is a string.

<a name="puzzle-object" />
## Puzzle

The **Puzzle** object stores the general information about a puzzle. Currently, here are the fields it contains:

 * `name` - string - the user-assigned puzzle name
 * `icon` - string - the icon identifier

Additionally, Puzzle objects which have been added to the store have an `id` attribute which is a string.

<a name="session-object" />
## Session

The **Session** object stores general information about a session. Here are its fields:

 * `solves` - string - an array of [Solves](#solve-object)
 * `id` - string - an identifier for the session in the store
