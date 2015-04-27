# Model

The model stores the user's data. In the future, it will be responsible for syncing with a server.

This document will provide some documentation on the interface that the model provides for the rest of the app.

# The Format API

The model provides some functions on the `window.app` object which manipulate times:

 * **formatSeconds**(millis) - this generates a representation of a time in milliseconds without including centiseconds.
 * **formatTime**(millis) - this generates the canonical time representation of a time in milliseconds.

# Identifiers

The store uses unique identifiers a lot. To generate a pseudorandom 32-digit hex identifier, call `window.app.generateId`.

# The store

The global object `window.app.store` has various methods which provide data to the application. In addition, it implements the [EventEmitter interface](../event_emitter.md) to notify observers about data changes.

The store sends a number of events. These events are listed to look like functions in order to highlight the arguments they will receive.

 * **addedPuzzle**(puzzle) - the user added a puzzle and it is now the current puzzle. Not triggered by remote changes.
 * **addedSolve**(solve) - the user saved a new solve. Not triggered by remote changes.
 * **computedStats**(stats) - the statistics for the current puzzle were re-computed.
 * **deletedPuzzle**(id) - the user deleted a puzzle. Not triggered by remote changes.
 * **deletedSolve**(id) - the user deleted a solve. Not triggered by remote changes.
 * **loadingStats**() - the current statistics are invalid because the statistics are being recomputed.
 * **modifiedGlobalSettings**(attrs) - the user modified the global settings. Not triggered by remote changes.
 * **modifiedPuzzle**(attrs) - the user modified the current puzzle. Not triggered by remote changes.
 * **modifiedSolve**(id, attrs) - the user modified a solve in the current puzzle. Not triggered by remote changes.
 * **remoteChange**() - the user changed *something* on a remote device.
 * **switchPuzzleError**(err) - the puzzle could not be switched because of an error.
 * **switchedPuzzle**() - the current puzzle has been changed. Not triggered by remote changes.

There are many data manipulation methods on the store. Some of these options take a `cb` (callback) argument. If the method takes a `cb` argument, it is an asynchronous operation and may fail. If the method does not take a `cb` argument, it is synchronous. Synchronous operations are guaranteed to work, although they may not synchronize with a server until later.

Here are the methods which the store provides:

 * **addPuzzle**(puzzle) - create a new [Puzzle](#puzzle-object) in the store. This will automatically switch to the added puzzle.
 * **addSolve**(solve) - add a [Solve](#solve-object) to the current puzzle.
 * **deletePuzzle**(id) - delete a puzzle (besides the current puzzle) given its identifier.
 * **deleteSolve**(id) - delete a solve from the current puzzle. While this is a synchronous operation, it may still fail. If the delete operation fails, it will be as if the puzzle was deleted (upon the `deleteSolve` call) and then re-added externally (once the request failed).
 * **getActivePuzzle**() - get the current [Puzzle](#puzzle-object).
 * **getGlobalSettings**() - get the current [Global Settings](#global-settings-object).
 * **getLatestSolve**() - get the latest solve for the current puzzle. This returns `null` if no solves have been completed for the current puzzle. Notice that this is synchronous whereas *getSolves(0, 1, cb)* would be asynchronous.
 * **getPuzzles**() - get the ordered list of [Puzzle](#puzzle-object) objects.
 * **getSolveCount**(cb) - get the number of [Solve](#solve-object) objects for the current puzzle.
 * **getSolves**(start, count, cb) - get a list of [Solve](#solve-object) objects asynchronously.
 * **modifyGlobalSettings**(attrs) - modify attributes of the global settings.
 * **modifyPuzzle**(attrs) - modify attributes of the current puzzle. Provide a dictionary of attributes to set on the current puzzle.
 * **modifySolve**(id, attrs) - modify attributes of a solve in the current puzzle. Provide a solve id and an object containing attributes to set.
 * **switchPuzzle**(id, cb) - switch to a new puzzle. If this fails, the active puzzle is not changed.

<a name="solve-object"></a>
## Solve

The **Solve** object stores all the information for a single recorded time. Here are the fields and their types:

 * **date** - int - the UNIX time in milliseconds when the timer was stopped
 * **dnf** - bool - whether or not the solve was a DNF
 * **inspection** - int - the number of milliseconds of inspection time used
 * **memo** - int - the number of milliseconds the user took to memorize the cube for a blindfolded solve
 * **notes** - string - user-added notes
 * **plus2** - bool - whether or not the solve was a +2. If this is true, the extra two seconds should be *added* to `time`.
 * **scramble** - string - the scramble that was given
 * **time** - int - the number of milliseconds that the solve physically took.
 * **id** - string - the unique identifier of the solve. **This field will not be present if the solve has not been added to the store.**

<a name="puzzle-object"></a>
## Puzzle

The **Puzzle** object stores the general information about a puzzle. Here are the fields it contains:

 * **name** - string - the user-assigned puzzle name
 * **icon** - string - the icon identifier
 * **scrambler** - string - the type of puzzle.js scrambler to use
 * **scrambleType** - string - the subtype of the scrambler to use
 * **lastUsed** - int - the UNIX time in milliseconds that the user last modified or switched to this puzzle
 * **timerInput** - int - an enum for the input method. The values of this setting are given meaning by the view and controller.
 * **id** - string - the unique identifier of the puzzle. **This field will not be present if the puzzle has not been added to the store.**

<a name="global-settings-object"></a>
## Global Settings

The **Global Settings** object stores the user's global settings. Here are the fields it contains and their defaults:

 * **flavor** - string - the name of the flavor the user has set. **Default:** "Blueberry"
 * **righty** - bool - true if the user is right handed. **Default:** true
 * **timerAccuracy** - int - an enum for the accuracy to show in the timer. The values of this setting are given meaning by the view and controller.
 * **theaterMode** - bool - enter theater mode while timing.
