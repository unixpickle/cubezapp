# Overview

The view takes data from the model and presents it to the user. Views emit events for various user actions. The view itself does not process these actions or update the model.

# App views

See [app/README.md](app/README.md) for information on the app view subsystem.

# Popups

See [popups/README.md](popups/README.md) for information on the popup view subsystem.

# ViewEvents

The `window.app.viewEvents` object is used to dispatch various events between views. This object is an [EventEmitter](../event_emitter.md) which may emit the following events:

 * **app.load**() - the application view has finished loading.
 * **flavor.color**(cssColor) - the flavor color has changed. This may be emitted many times during a flavor transition.
 * **footer.fullyVisible**() - the footer has changed to being fully visible. Internally, the footer considers itself hidden when the page loads. As a result, this event will be fired when the page loads if the footer is visible.
 * **footer.hidden**() - the footer has been completely hidden and is now invisible.
 * **footer.partlyVisible**() - the footer's opacity has transitioned from 1 or 0 to a value between 1 and 0.

Most of these events make it possible for various UI components to respond to changes in other UI components. For instance, these events make it possible to hide context menus or dropdowns when the footer is hidden.
