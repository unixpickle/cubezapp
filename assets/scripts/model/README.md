# Model

The model stores the user's data. In the future, it will be responsible for syncing with a server.

This document will provide some documentation on the interface that the model provides for the rest of the app.

Here are the sections of this document:

 * [The Format API](#format-api-section)
 * [Identifiers](#identifiers-section)
 * [The store](#store-section)
 * [Observe](#observe-section)

<a name="format-api-section"></a>
# The Format API

The model provides some functions on the `window.app` object which manipulate times:

 * **formatSeconds**(millis) - this generates a representation of a time in milliseconds without including centiseconds.
 * **formatTime**(millis) - this generates the canonical time representation of a time in milliseconds.

<a name="identifiers-section"></a>
# Identifiers

The store uses unique identifiers a lot. To generate a pseudorandom 32-digit hex identifier, call `window.app.generateId`.

<a name="store-section"></a>
# The store

The global object `window.app.store` has various methods which provide data to the application. In addition, it implements the [EventEmitter interface](../event_emitter.md) to notify other parts of the app about data changes.

The store emits a number of events. These events are listed to look like functions in order to highlight the arguments they will receive.

 * **addedPuzzle**(puzzle) - the user added a puzzle and it is now the current puzzle. Not triggered by remote changes.
 * **addedSolve**(solve) - the user saved a new solve. Not triggered by remote changes.
 * **computedStats**(stats) - the statistics for the current puzzle were re-computed. The stats argument is a [Stats](#stats-object) object.
 * **deletedPuzzle**(id) - the user deleted a puzzle. Not triggered by remote changes.
 * **deletedSolve**(id) - the user deleted a solve. Not triggered by remote changes.
 * **loadingStats**() - the current statistics are invalid because the statistics are being recomputed.
 * **modifiedGlobalSettings**(attrs) - the user modified the global settings. Not triggered by remote changes.
 * **modifiedPuzzle**(attrs) - the user modified the current puzzle. Not triggered by remote changes.
 * **modifiedSolve**(id, attrs) - the user modified a solve in the current puzzle. Not triggered by remote changes.
 * **remoteChange**() - the user changed *something* on a remote device.
 * **switchPuzzleError**(err) - the puzzle could not be switched because of an error.
 * **switchedPuzzle**() - the current puzzle has been changed. Not triggered by remote changes.

There are many data manipulation methods on the store. Some of these methods take a `cb` (callback) argument. If a method takes a `cb` argument, it is an asynchronous operation and may fail. If the method does not take a `cb` argument, it is synchronous. Synchronous operations are guaranteed to work, although they may not synchronize with a server until later.

Here are the methods which the store provides:

 * **addPuzzle**(puzzle) - create a new [Puzzle](#puzzle-object) in the store. This will automatically switch to the added puzzle.
 * **addSolve**(solve) - add a [Solve](#solve-object) to the current puzzle.
 * **deletePuzzle**(id) - delete a puzzle (besides the current puzzle) given its identifier.
 * **deleteSolve**(id) - delete a solve from the current puzzle. While this is a synchronous operation, it may still fail. If the delete operation fails, it will be as if the puzzle was deleted (upon the `deleteSolve` call) and then re-added externally (once the request failed).
 * **getActivePuzzle**() - get the current [Puzzle](#puzzle-object).
 * **getGlobalSettings**() - get the current [Global Settings](#global-settings-object).
 * **getLatestSolve**() - get the latest solve for the current puzzle. This returns `null` if no solves have been completed for the current puzzle. Notice that this is synchronous whereas *getSolves(0, 1, cb)* would be asynchronous.
 * **getPuzzles**() - get the ordered list of [Puzzle](#puzzle-object) objects.
 * **getSolveCount**() - get the number of [Solve](#solve-object) objects for the current puzzle.
 * **getSolves**(start, count, cb) - get a list of [Solve](#solve-object) objects asynchronously.
 * **getStats**() - get the current [Stats](#stats-object) object. This returns null if the stats are currently being recomputed.
 * **modifyGlobalSettings**(attrs) - modify attributes of the global settings.
 * **modifyPuzzle**(attrs) - modify attributes of the current puzzle. Provide a dictionary of attributes to set on the current puzzle.
 * **modifySolve**(id, attrs) - modify attributes of a solve in the current puzzle. Provide a solve id and an object containing attributes to set.
 * **switchPuzzle**(id, cb) - switch to a new puzzle. If this fails, the active puzzle is not changed.

<a name="solve-object"></a>
## Solve

The **Solve** object stores all the information for a single recorded time. Here are the fields and their types:

 * **date** - int - the UNIX time in milliseconds when the timer was stopped
 * **dnf** - bool - whether or not the solve was a DNF
 * **memo** - int - the number of milliseconds the user took to memorize the cube for a blindfolded solve. If the solve was not a blindfolded solve, this is -1.
 * **notes** - string - user-added notes. By default, this should be the empty string.
 * **plus2** - bool - whether or not the solve was a +2. If this is true, the extra two seconds should be *added* to `time`.
 * **scramble** - string - the scramble that was given. If no scramble was given, this is null.
 * **scrambler** - string - the type of puzzle.js scrambler to use. If no scrambler was used for this time, this is "None".
 * **scrambleType** - string - the subtype of scrambler. For the "None" scrambler, the value of this field should be ignored.
 * **time** - int - the number of milliseconds that the solve physically took.
 * **lastPB** - int - the number of milliseconds for the most recent personal best before this solve. For all solves up to and including the first non-DNF solve, this is -1. This can be used to tell if a given solve is a PB, because all PBs will have times less than the last PB. **This field will not be present if the solve has not been added to the store. The store maintains this field automatically.**
 * **lastPW** - int - the number of milliseconds for the most recent personal worst before this solve. See **lastPB** for more.
 * **id** - string - the unique identifier of the solve. **This field will not be present if the solve has not been added to the store.**

The store also provides some helper functions for solves:

 * window.app.copySolve(solve) - get a copy of a solve object.
 * window.app.solveIsPB(solve) - get a boolean indicating whether a solve is a PB. This does not look at milliseconds; it complies with the WCA regulations.
 * window.app.solveTime(solve) - get the time of a solve, counting penalties.

<a name="stats-object"></a>
## Stats

The **Stats** object stores averages, PBs, and other information about the user's solves. Here are the fields it has:

 * **count** - int - the total number of solves in the current puzzle.
 * **nonDNF** - int - the total number of solves which were not marked as DNF.
 * **mean** - int - the global mean of all non-DNF solve times in the current puzzle. If no mean is available, this is -1.
 * **best** - [Solve](#solve-object) - the user's best timed solve. If no solve times are available, this is null.
 * **worst** - [Solve](#solve-object) - the user's worst timed solve. If no solve times are available, this is null.
 * **averages** - array - the averages table. Every element in this table will have the following fields:
   * **name** - string - usually, this is a numeric string like "5", but it may also be "mo3".
   * **count** - int - the number of these averages that have been taken. This will start as 0 and increase by 1 for every valid average that exists in the set of times. For instance, if this is the average of 5 and the user has 16 solves (and no DNFs), the count will be 12.
   * **last** - [AverageInfo](#average-info-object) - the most recent average of this size or null if no average exists.
   * **best** - [AverageInfo](#average-info-object) - the best average of this size or null if no average exists.
   * **size** - int - the number of solves required for this average to exist.
   * **lastWasPB** - bool - if this is true, *last* is equal to *best*.

<a name="average-info-object"></a>
### AverageInfo

The **AverageInfo** object stores information about a single average. It contains the following fields:

 * **time** - int - the average time in milliseconds.
 * **stdDev** - int - the standard deviation for the times which were counted.
 * **beat** - int - the time needed to beat this average. This is NaN if no such time exists.
 * **solves** - array of [SolveExclude](#solve-exclude-object) objects.

<a name="solve-exclude-object"></a>
### SolveExclude

This object is a solve which can either be excluded or included. It has the following fields:

 * **exclude** - bool - true if the solve was excluded, false if it was included.
 * **solve** - [Solve](#solve-object) - the solve.

<a name="puzzle-object"></a>
## Puzzle

The **Puzzle** object stores the general information about a puzzle. Here are the fields it contains:

 * **name** - string - the user-assigned puzzle name
 * **icon** - string - the icon identifier
 * **scrambler** - string - the type of puzzle.js scrambler to use
 * **scrambleType** - string - the subtype of the scrambler to use
 * **lastUsed** - int - the UNIX time in milliseconds that the user last modified or switched to this puzzle
 * **timerInput** - int - an enum for the input method
   * 0 - INPUT_REGULAR - the timer is a normal
   * 1 - INPUT_INSPECTION - inspection time is used
   * 2 - INPUT_BLD - blindfolded (two-stage) mode
   * 3 - INPUT_STACKMAT - an external stackmat is used
   * 4 - INPUT_ENTRY - manual entry is used
 * **graphMode** - int - an enum representing the type of graph the user wishes to see
   * 0 - MODE_STANDARD - the graph is in standard mode and the "graphStandard*" settings are used
   * 1 - MODE_MEAN - the graph is in mean mode and the "graphMean*" settings are used
   * 2 - MODE_HISTOGRAM - the graph is in histogram mode and the "graphHistogram*" settings are used
   * 3 - MODE_STREAK - the graph is in streak mode and the "graphStreak*" settings are used
 * **graphStandardType** - int - an enum representing the graph sub-type.
   * 0 - TYPE_LINE - a line graph
   * 1 - TYPE_BAR - a bar graph
   * 2 - TYPE_DOT - a dot graph
 * **graphStandardScale** - int - the scale of the graph in view-defined units
 * **graphStandardShowDNF** - bool - whether or not DNFs should be included in the standard graph
 * **graphMeanScale** - int - the scale of the graph in view-defined units
 * **graphMeanCount** - int - the number of solves to average into each data point
 * **graphMeanShowDNF** - bool - whether or not DNFs should be used in the mean graph
 * **graphHistogramScale** - int - the scale of the graph in view-defined units
 * **graphHistogramSpan** - int - the number of solves to include in the histogram. If this is -1, it is considered infinite.
 * **graphHistogramPrecision** - number - a number between 0 and 1 indicating approximately how many buckets should be used in the histogram.
 * **graphHistogramIncludeDNF** - bool - whether or not the times of DNFs should be counted
 * **graphStreakScale** - int - the scale of the graph in view-defined units
 * **graphStreakUsePercent** - bool - if this is true, each bar in the streak represents the percent of solves below the upper bound. Otherwise, each bar represents the raw number of solves below the upper bound.
 * **graphStreakUpperBound** - int - a time below which a solve must be in order to count towards the streak. This is measured in milliseconds.
 * **graphStreakIncludeDNF** - bool - whether or not DNFs should be considered when computing the percent (if applicable)
 * **id** - string - the unique identifier of the puzzle. **This field will not be present if the puzzle has not been added to the store.**

<a name="global-settings-object"></a>
## Global Settings

The **Global Settings** object stores the user's global settings. Here are the fields it contains and their defaults:

 * **flavor** - string - a hex color identifier (e.g. #f0d5a9) which indicates the color of the current flavor. If the flavor is the alternation flavor, this is simply "#" with no hex after it. The flavor view must give unrecognized values meaning for legacy purposes. **Default:** "" (empty string)
 * **righty** - bool - true if the user is right handed. **Default:** true
 * **timerAccuracy** - int - an enum for the accuracy to show in the timer. The values of this setting are given meaning by the view and controller. **Default:** 0
 * **theaterMode** - bool - enter theater mode while timing. **Default:** true

<a name="observe-section"></a>
# Observe

Although `window.app.store` does emit various events, it does not provide fine-tuned observation functionality. To supplement these events, the `window.app.observe` object provides several methods to observe specific pieces of information within the model.

`window.app.observe` implements the following methods:

 * **activePuzzle**(attrOrList, callback) - observe changes in the active puzzle.
 * **globalSettings**(attrOrList, callback) - observe changes in the global settings.
 * **latestSolve**(attrOrList, callback) - observe changes in the latest solve.
 * **puzzleCount**(callback) - observe changes in the number of puzzles.

All of these methods take a callback argument. The callback receives no arguments.

The `attrOrList` argument specifies which properties on the specified object to track. This argument can be a string or an array of strings.

These methods all return an [Observation](#observation-object) object.

## Example

To track changes to the name and/or icon of the active puzzle, you can do this:

```javascript
window.app.observe.activePuzzle(['name', 'icon'], function() {
  console.log('change detected');
});
```

To track the time of the latest solve, you can do this:

```javascript
window.app.observe.latestSolve('time', function() {
  console.log('change detected');
});
```

<a name="observation-object"></a>
## Observation

An Observation object is returned by calls to functions on `window.app.observe`. The object controls that particular observation. By default, the observation is running, meaning that a callback will be triggered when changes occur.

An instance of Observation implements the following methods:

 * **isRunning**() - returns a boolean indicating whether or not the observation is running.
 * **start**() - start the observation.
 * **stop**() - stop the observation.
