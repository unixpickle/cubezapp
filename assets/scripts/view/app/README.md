# Overview

This directory contains the source code for the main application views. This includes the header, the footer, and the timer. It does not include popups or general UI elements.

# AppView

The class corresponding to the app view is `window.app.AppView`. There should never be more than one instance of AppView!

The AppView implements the [EventEmitter interface](../event_emitter.md) and fires the following events:

 * **load**() - the load animation has finished playing.

The AppView has the following properties:

 * **footer** - the [Footer](#footer-object) instance
 * **header** - the [Header](#header-object) instance
 * **timer** - the [TimerView](#timer-view-object) instance

AppView implements the following methods:

 * **blinkTime**() - blink the cursor which is visible when the user is manually entering the time.
 * **loading**() - get a boolean indicating whether or not the application view is still loading.
 * **setTheaterMode**(flag) - enter or leave "theater mode".
 * **setMemo**(text) - set the memo time text. Pass `null` to hide the memo time.
 * **setPB**(text) - set the text of the PB label. Pass `null` to hide the PB label.
 * **setScramble**(text) - set the scramble text. Pass `null` to hide the scramble text.
 * **setTime**(text) - set the text to show in the time label.
 * **setTimeBlinking**(flag) - enable or disable the blinker (to indicate whether the user can enter a time manually).

<a name="footer-object"></a>
# Footer

Out of all the components of the application, the footer presents the user with the most information and grants them the most power. The user can use the footer to change almost every setting and view many statistics about their times. Since the footer is so packed with functionality, it is split up into various subviews.

The footer itself is represented by the `window.app.Footer` class. A Footer should only be instantiated by the AppView class.

An instance of Footer has the following properties:

 * **settings** - the [Settings](#settings-object) instance
 * **stats** - the [Stats](#stats-object) instance

The footer implements the following method:

 * **visible**() - returns a boolean indicating whether or not the footer is currently visible.

The footer implements the [EventEmitter interface](../event_emitter.md) and fires the following events:

 * **hidden**() - the footer is now invisible
 * **shown**() - the footer is now visible

<a name="settings-object"></a>
## Settings

The settings tab of the footer allows the user to change puzzle specific, device specific, and global settings. It also allows the user to open popups to change even more settings.

It implements the [EventEmitter interface](../event_emitter.md) and fires the following events:

 * **bldChanged**() - the user has changed the BLD checkbox.
 * **flavorChanged**() - the user has changed the site flavor.
 * **iconChanged**() - the user has changed the current puzzle's icon.
 * **inspectionChanged**() - the user has changed the inspection checkbox.
 * **rightyChanged**() - the user has changed the right handed checkbox.
 * **scrambleTypeChanged**() - the user has changed the scramble type. This will not be called for scrambler changes.
 * **scramblerChanged**() - the user has changed the scrambler.
 * **theaterModeChanged**() - the user has changed the theater mode setting.
 * **timerInputChanged**() - the user has changed the timer input dropdown.
 * **updateChanged**() - the user has changed the timer accuracy.

Remember that none of these events indicate whether or not the model has been modified. The controller should register these events and make the necessary changes to the model.

The settings tab also implements the following methods to get options which the user has selected:

 * **getBLD**() - get the BLD setting the user has chosen.
 * **getFlavorName**() - get the name of the flavor the user has chosen.
 * **getIconName**() - get the name of the icon the user has chosen.
 * **getInspection**() - get whether the user has set inspection mode.
 * **getRighty**() - get the right handed setting the user has chosen.
 * **getScrambleType**() - get the name of the scramble type the user has chosen.
 * **getScrambler**() - get the name of the scrambler the user has chosen.
 * **getTheaterMode**() - get the theater mode flag the user has chosen.
 * **getTimerInput**() - either 'Regular', 'Manual Entry', or 'Stackmat'.
 * **getUpdate**() - get the integer value for the timer accuracy.

<a name="stats-object"></a>
## Stats

This tab has several sub-panes. These can be accessed via these properties:

 * **times** - the [Times](#times-object) instance
 * **graph** - the [Graph](#graph-object) instance

<a name="times-object"></a>

<a name="graph-object"></a>
### Graph

The graph has this property:

 * **settings** - the [GraphSettings](#graph-settings-object) instance

<a name="graph-settings-object">
#### GraphSettings

This view allows the user to control the configuration of the graph. It emits the following events:

 * **settingChanged**(settingName, newValue) - emitted when a setting (given by settingName) has been set to newValue. The setting should be updated on the current puzzle.
 * **settingChanging**(settingName, newValue) - emitted when the user is in the middle of changing a setting. Usually, this is emitted for sliding a slider or some other operation where many modifications may occur in a very brief interval of time.
 * **modeChanged**(modeIndex) - emitted when the user attempts to switch the mode for the graph.

<a name="timer-view-object"></a>
# TimerView

The TimerView presents the user's current time. It is responsible for entering and leaving theater mode and for formatting times according to the user's update setting. It also manages the current scramble.

The TimerView class has the following properties:

 * **controls** - the [Controls](#timer-controls-object) instance

The TimerView class has the following methods:

 * **cancel**() - the user has cancelled the solve.
 * **currentScramble**() - returns the current scramble or `null` if no scramble is being displayed.
 * **setManualEntry**(flag) - enable or disable manual entry mode.
 * **start**() - the user has initiated a solve.
 * **stop**() - the user has fully completed a solve.
 * **update**(millis, addTwo) - show the user a given number of milliseconds, optionally adding a +2.
 * **updateDone**(millis, addTwo) - show the user their time after they have finished timing themselves but before they have stopped the solve (i.e. before they have released the space bar). This may be different than *update* because it provides full accuracy.
 * **updateInspection**(millis) - show the user that they have been inspecting for a given number of milliseconds.
 * **updateMemo**(millis) - show the user their memo time.

Note that the update methods should only be called while the user is doing a solve (i.e. when start() has been called more recently than stop()).

<a name="timer-controls-object"></a>
## Controls

The user can control the timer using the space bar (or by tapping their screen, if they have a touchscreen). The controls object manages this interaction.

By default, the controls are disabled. This means that the space bar will do nothing (as will the touchscreen).

Controls implements the [EventEmitter interface](../event_emitter.md) and fires the following events:

 * **cancel**() - the user has cancelled the time (i.e. hit the escape key).
 * **down**() - the user has pressed the space bar or tapped the screen.
 * **up**() - the user has released the space bar or lifted their finger.

Controls implements the following methods:

 * **disable**() - disable the user's timer controls
 * **enable**() - enable the user's timer controls

<a name="header-object"></a>
# Header

The header shows the user the current puzzle name and allows them to delete their puzzles. In addition, it allows the user to open a popup to add a puzzle.

The `window.app.Header` class implements the [EventEmitter interface](../event_emitter.md) and fires the following events:

 * **addPuzzle**() - the user wants to add a puzzle
 * **deletePuzzle**(id) - the user wants to delete a given puzzle
 * **switchPuzzle**(id) - the user wants to switch to a given puzzle
