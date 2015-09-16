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


