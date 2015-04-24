# View

The view takes data from the model and presents it to the user. Views emit events for various user actions. The view itself does not process the actions of the user or change the model.

# App

The [app](app) directory contains the source code for the main application views. This includes the header, the footer, and the timer. It does not include popups or general UI elements.

The class corresponding to the app view is `window.app.AppView`. Its implementation can be found in [app/app_view.js](app/app_view.js). There should never be more than one instance of AppView!

The AppView implements the [EventEmitter interface](../event_emitter.md) and fires the following events:

 * **load**() - the load animation has finished playing.

The AppView has the following properties:

 * **footer** - the [Footer](#footer-object) instance
 * **header** - the [Header](#header-object) instance

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
## Footer

Out of all the components of the application, the footer presents the user with the most information and grants them the most power. The user can use the footer to change almost every setting and view many statistics about their times. Since the footer is so packed with functionality, it is split up into various subviews.

The footer itself is represented by the `window.app.Footer` class. Its implementation can be found in [app/footer.js](app/footer.js). A Footer should only be instantiated by the AppView class.

An instance of Footer has the following properties:

 * **settings** - the [Settings](#settings-object) instance
 * **stats** - the [Stats](#stats-object) instance

Footer has no methods which you should need to call.

<a name="settings-object"></a>
### Settings

The settings tab of the footer allows the user to change puzzle specific, device specific, and global settings. It also allows the user to open popups to change even more settings.

It implements the [EventEmitter interface](../event_emitter.md) and fires the following events:

 * **flavorChanged**(flavorName) - the user has changed the site flavor.
 * **iconChanged**(iconName) - the user has changed the current puzzle's icon.
 * **scramblerChanged**(scrambler, type) - the user has changed the scrambler or subscrambler for the puzzle.

Remember that none of these events indicate whether or not the model has been modified. The controller should register these events and make the necessary changes to the model.

<a name="stats-object"></a>
### Stats

This tab will allow the user to do a number of things. However, it is not implemented yet.

<a name="header-object"></a>
## Header

The header shows the user the current puzzle name and allows them to delete their puzzles. In addition, it allows the user to open a popup to add a puzzle.

The `window.app.Header` class implements the [EventEmitter interface](../event_emitter.md) and fires the following events:

 * **addPuzzle**() - the user wants to add a puzzle
 * **deletePuzzle**(id) - the user wants to delete a given puzzle
 * **switchPuzzle**(id) - the user wants to switch to a given puzzle
