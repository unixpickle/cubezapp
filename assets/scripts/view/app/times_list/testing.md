# Abstract

It is very difficult to write automated tests for complex UI components like TimesList. Furthermore, such tests are probably not even that important after you know that the UI component works initially.

Instead of creating automated unit tests, I believe it is sufficient to manually test the TimesList. This document will provide detailed instructions on how to do so thoroughly.

# Tips

It is suggested that you open the console and monitor it for errors throughout this process.

# Basic functionality

As a sanity check, make sure all of the following actions do what you'd expect:
 * Create a new puzzle.
 * Perform a small number of solves (10 or so should do).
 * Make sure that all of the solves in the times list are correct.
 * Add a +2 to a solve. Make sure the time says +2.
 * Remove the +2 from the solve. Make sure the time stops saying +2.
 * Do the two steps above, but with DNF instead of +2.
 * Make sure that all PBs are properly indicated on the list.
 * Make sure that scrolling works as expected.
 * Delete a solve from the beginning, middle, and end of the list and make sure it works.

# Testing remote changes

Since Cubezapp can be opened on multiple browser tabs at once, it is important that the times list can receive updates from other tabs.

Note that remote changes may cause the linear list to scroll back to the top. This is considered acceptable behavior.

Basic sanity checks:
 * Open the site in two browser windows side-by-side.
 * In one tab, add a +2 to a solve. Make sure it is reflected in the other tab.
 * Remove the +2 in the other tab. Make sure it is gone in the first.
 * Do the above two steps but with DNF.
 * Make sure that all PBs are properly indicated on both lists.
 * Delete a solve in one tab and make sure it is gone in the other.

PB mechanism:
 * Get a solve which is a PB, then a solve right after it which would have been a PB had the last solve not been one.
 * In one tab, make the PB a DNF or +2 so the next solve is a PB.
 * Make sure the next solve is counted as a PB in the other tab.
 * Undo the second step, and now delete the PB.
 * Make sure the solve after the solve you just deleted is now counted as a PB in both tabs.

Context menu:
 * Scroll to the top of the times list in both tabs.
 * Click on a row in the times list in one tab.
 * In the other tab, mark any solve as a +2 or perform some other simple change.
 * Make sure the dialog is now closed in the first tab.

Note adding:
 * In one tab, click on a solve and say "Add Comment".
 * In the other tab, delete the solve which you clicked in the first tab.
 * In the first tab, type a comment and save it.
 * Make sure no exceptions are printed in the console.
 * Perform the above 4 steps again, but instead of deleting the solve, add a penalty to it.
 * Make sure that the comment was added correctly to the solve.

# Testing offline lazy loading

The times list (actually, it's backing LazySolves) loads a fixed number of solves at a time. It is important to make sure that these chunks of solves are loaded properly. In particular, it is important to be sure that the chunks do not overlap and that there are no gaps in between them. It is also important to make sure the chunks respond properly when solves within them are modified, deleted, or added.

Before testing this, it would be nice to setup the data to be something systematic and easy to navigate. See [Creating many solves](#creating-many-solves) for more info on how to do this.

Loading and modification:
 * Slowly scroll down the list of solves.
 * Make sure that whenever you get near the bottom, the scrollbar gets larger
 * Each time you pass 100 solves, make sure that there are no missing or repeated ones.
 * Add +2 to the last, middle, and first time and make sure it shows up.
 * Do the above step, but with DNF.

Adding:
 * Scroll all the way down in the list to make sure all of the times are loaded.
 * Do another solve.
 * Scroll through the list again, doing the same steps as in "Loading and modification".
 * Refresh the page.
 * Do a few solves, then do the same steps as in "Loading modification".

Deleting:
 * Delete the 99th solve and make sure nothing else is missing.
 * Reset your data
 * Delete the 101st solve and make sure nothing else is missing.
 * Reset your data
 * Delete the last solve and make sure nothing else is missing.

When you first load the site, [check the number of cursors](checking-number-of-cursors). Now, scroll to the bottom of the times list and make sure there are more cursors open. Now, switch to a different puzzle and switch back. Verify that the number of cursors now is the same as it was when you loaded the page.

If you have between 900 and 1000 solves, the times list should use 10 cursors when it is fully loaded.

# Testing "online" lazy loading

Since no server is currently implemented, all we have to work with is LocalStore. To make the best of this situation, we can manipulate LocalStore to emulate bad network connectivity.

**Testing the loading animation:**

Run this code to make loading take 5 seconds:
```js
window.app.LocalCursorTicket.SHORT_TIMEOUT = 3000;
```

Now, make sure the loader is visible whenever you scroll to the bottom of the content (except the last time).

**Testing loading failures:**

Run this code to make loading fail after 3 seconds:
```js
window.getSolvesBackup = window.app.store.getSolves;
window.app.store.getSolves = function(a, b, cb) {
  return new window.app.ErrorTicket(cb, new Error('intentionally broken'));
};
window.app.ErrorTicket.SHORT_TIMEOUT = 3000;
```

Scrolling down should cause a spinner to show for 3 seconds, then a reload button.

You can reverse the above code like this:

```js
window.app.store.getSolves = window.getSolvesBackup;
window.app.ErrorTicket.SHORT_TIMEOUT = 10;
```

# Tests for specific bugs

These tests are designed to help you identify bugs that existed in the past but were fixed.

LocalCursorTicket leaking cursors when cancelled:
 * Create a new puzzle with 0 solves.
 * Run the code in [Creating many solves](#creating-many-solves). 
 * [Make sure](#checking-number-of-open-cursors) there are only a few open cursors.
 * If the bug exists, there will be roughly 2 cursors per solve created.

# Creating many solves

For many tests, it will be nice to have a bunch of solves which are ordered in a systematic way. Here is a procedure by which to create such solves:

First, create a new puzzle and go to it. Now, in the javascript console, enter the following code:
```js
for (var i = 0; i < 1000; ++i) {
    window.app.store.addSolve({
        date: new Date().getTime(),
        dnf: false,
        memo: 0,
        notes: '',
        plus2: false,
        time: i*10,
        scramble: null,
        scrambler: 'None',
        scrambleType: null
    });
}
```

**NOTE:** To address [a bug in Safari 8.0.8](https://bugs.webkit.org/show_bug.cgi?id=149372), you may have to open the JS console, then refresh the page, then paste this code.

# Checking number of open cursors

To see the number of open cursors on the LocalStore, run this in the console:

```js
window.app.store._solves._cursors.length
```
