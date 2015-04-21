# View

The view takes data from the model and presents it to the user. Views emit events for various user actions. The view itself does not process the actions of the user or change the model.

# The app views

The [app](app) directory contains a the source code for the main application views. This includes the header, the footer, and the timer. It does not include popups or general UI elements.

## Footer

Out of all the components of the application, the footer presents the user with the most information and grants them the most power. The user can use the footer to change almost every setting and view many statistics about their times. Since the footer is so packed with functionality, it is split up into various subviews.

### Settings

The settings tab of the footer allows the user to change puzzle specific, device specific, and global settings. It also allows the user to open popups which can change even more settings.

The settings API can be found via the `settings` attribute which is present in an instance of `window.app.Footer`. It implements the [EventEmitter interface](../event_emitter.md) and fires the following events:

 * **flavorChanged**(flavorName) - the user has changed the site flavor.
 * **iconChanged**(iconName) - the user has changed the current puzzle's icon.
 * **scramblerChanged**(scrambler, type) - the user has changed the scrambler or subscrambler for the puzzle.

Remember that none of these events indicate whether or not the model has been modified. The controller should register these events and make the necessary changes to the model.

### Stats

This tab will allow the user to do a number of things. However, it is not implemented yet.

## Header

The header shows the user the current puzzle name and allows them to delete their puzzles. In addition, it allows the user to open a dialog to add a puzzle.

The `window.app.Header` class implements the [EventEmitter interface](../event_emitter.md) and fires the following events:

 * **addPuzzle**() - the user wants to add a puzzle
 * **deletePuzzle**(id) - the user wants to delete a given puzzle
 * **switchPuzzle**(id) - the user wants to switch to a given puzzle
