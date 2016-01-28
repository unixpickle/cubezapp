# Cubezapp

Cubezapp will be the best cube timer in existence. It will support scramble generation and 3D rendering (with WebGL), online cloud storage for times, graphs, statistical analysis, and more.

**CURRENT STATUS**: I have stopped development on Cubezapp, but another developer may wish to pick up my work in the future. If this is so, I have included some [handoff notes](#handoff-notes).

# TODO

 * Create mechanism for testing times list:
   * Simple routine to create a bunch of solves.
   * Flags to emulate bad internet connectivity.
 * Use [checkbox.js](https://github.com/unixpickle/checkbox.js/blob/master/checkbox.3.0.0.js) so changing flavors is more elegant--it uses SVG so you don't have to manually update the colors of checkboxes.
 * On creating a puzzle, hovering over an icon name could change the preview.
 * Make it possible to search your list of puzzles.
 * Use [jsbuild](https://github.com/unixpickle/jsbuild) for everything.
 * On mobile, it is possible to touch hidden elements while timing yourself.
 * Fix word wrap in View Scramble popup for megaminx.
 * Make it possible for developers to delete icons (e.g. the Egg)
 * Re-implement Dropdown with animations
 * Implement graph in footer
 * Implement accounts system

# Handoff Notes

This will explain what the next developer(s) will need to do to pick up where I left off. I will use the second person to refer to said developer(s).

Here is the general structure of the application:

 * Dependencies
   * [crystal](https://github.com/unixpickle/crystal) - an API for tracking when the device's DPI changes. This allows <canvas>s to redraw themselves to always be "crystal clear".
   * [jQuery](https://jquery.com) - used for a ton of animations and DOM manipulation.
   * [dropdown.js](https://github.com/unixpickle/dropdown.js) - used for dropdowns throughout the site.
   * [average.js](https://github.com/unixpickle/average.js) - used to compute the user's averages on the site. This will still be in effect when the site uses a server, but it is up to you whether or not the server uses something different.
   * [checkbox.js](https://github.com/unixpickle/checkbox.js) - a custom checkbox that animates in when the user checks it. This needs to be able to change with the user's selected "flavor" color.
   * [clickthru.js](https://github.com/unixpickle/clickthru.js) - a simple library to tell when the user clicks the page. This is used for hiding context menus and other things when the user clicks away from them.
   * [context.js](https://github.com/unixpickle/context.js) - a menu that appears when you click on a time in the times list. The menu can be multiple pages deep, and supports checkboxes, etc.
   * [puzzle.js](https://github.com/unixpickle/puzzle.js) - the API that generates scrambles for the site.
   * [graphalicious](https://github.com/unixpickle/graphalicious) - the in-progress graphing library that Cubezapp will use for its graph view.
 * Stylesheets
   * App CSS - CSS files used for the body of the application, excluding popups.
   * Popups CSS - CSS files used specifically for the popups.
 * Scripts - the scripts are organized into three categories: model, view, and controller.
   * [Model](assets/scripts/model/README.md) - the model manages the data of the application. When you implement a server, you will create a new implementation of the model interface that talks to a server. This way, it will be possible for the user to log in and out and see offline vs. online data all while the rest of the app does not have to worry.
   * View - this is everything the user sees in the application. Whenever the model changes, it emits events that the view uses to update itself. This means that the user can change their data (e.g. do a solve or change a setting) in one browser tab and see the change immediately in another browser tab.
   * Controller - when the view wants to change the model, it tells a controller, which in turn tells the model. This change then propagates back to the view, and the view reflects the change.

I personally believe that graphalicious and puzzle.js are the strongest parts of this project. They are written well and have tests. If you are planning on rewriting a lot of the actual Cubezapp code (e.g. the view, model, or controller, or the structure thereof), that makes sense. However, it would not make very much sense to rewrite graphalicious or puzzle.js, and I am sure you want to be as lazy as possible anyway.

The first thing you will probably want to finish is [graphalicious](https://github.com/unixpickle/graphalicious). All that's left is adding x-axis label support. This can be accomplished by subclassing the YLCV. It may require some modifications to the YLCV, but that should be relatively trivial. Graphalicious has tons of documentation, and I suggest you read it. A lot of thought had to go into it, and it is a lot more complex than you might expect (for good reasons that are not immediately obvious).

After you have completed graphalicious, you may be wondering how you can drop it into Cubezapp. It is not very simple, because there are a number of things Cubezapp must be able to graph. Graphalicious takes its data in the form of a DataSource, which is an agent that can fetch chunks of data asynchronously. This makes sense for Cubezapp because the server will store millions of times. It will be easy to know how many times there are and to fetch subsets of these times, but it will be impractical to fetch all the times at once. The challenge is getting Cubezapp data into a DataSource format.

The model already has something called the [cursor system](https://github.com/unixpickle/cubezapp/tree/master/assets/scripts/model#cursor) which behaves a lot like a DataSource. It lets you fetch Cursors of data given an index and length. These cursors then expand or contract as the user inserts or deletes times. This way, the model can keep track of the index of each solve even if it is not connected to a server. As a consequence, if the user deletes a time in the times list, the graph knows the index that was deleted and can update itself accordingly.

The cursor system will make it relatively easy to implement a basic graphalicious graph that shows all of the user's times. Unfortunately, the cursor system does not support DNF filtering, histogram computation, streak computation, or overall progress computation. You will have to add this to the model in some way, and then translate it into a DataSource format for graphalicious.

Keep in mind as you change the model that it must eventually work from a server. If a model operation would require fetching every time from the server, then it would be impractical. The server will have to do a lot of computation for you, like computing histograms, etc.

Note that computing a histogram using a traditional database on the server is a bad idea. If the user has N times, traditional databases would take O(N) time to compute a histogram of those times. This is not acceptable, since the server might have to spend large parts of a second computing histograms if the user has hundreds of thousands of times. You will, in the very least, need to cache histograms so that you do not recompute them every time a user does a solve. You may be able to do some of this on the client side. I suggest that you use a custom database on the server that organizes solves in a binary tree, since that will allow histogram computation in O(ln(N)) time. If you want more details about this idea, please consult me.

The changes I have outlined for the model are just the beginning. If Cubezapp must let the user see info about and delete their best and worst times, you will have to add methods for doing these operations to the model. The "information about each solve" includes an average of 1000 right before the solve, so viewing information about the user's PB or PW will really require fetching up to 1000 solves before it. The matter is complicated further by the fact that the model only lets you delete times when they are within some cursor. This ensures that indices inside Cursors can be maintained no matter how the user modifies their data. This is essential for graphalicious, which addresses all data by index. You will either need to change this (hard), or add a model operation to fetch a cursor that has N solves and ends with a given solve ID (easy). That way, you can fetch information about the user's PB or PW when all you know is that solve's ID.

Some people have suggested that Cubezapp support keystrokes to do various things. This is all fine and dandy, but I suggest you make sure nothing too shady can happen. For instance, suppose there is a keystroke to switch to a different puzzle. If the user has some kind of popup open (say the "Rename this puzzle" popup), they should not be able to press that keystroke and switch puzzles. Other problems could arise as well. For instance, suppose the user opens a popup about their PB and then switches puzzles while that's open. If you decide that this should be able to happen (although I think it should not), then you have to make sure that deleting the PB from the popup still works. Right now, the model is only designed to modify things about the current puzzle (with the exception of time moving).

Once you have made the necessary changes to the model, implementing the server should not be very difficult. All you have to do is implement a version of the model that connects to the server, probably using WebSockets or long-polling, since you need to be able to get notified when a remote device changes the user's data.

There is a non-data-related matter which will probably distress you. The resizing system for Cubezapp is relatively complicated. The user can resize the footer, change the scramble to something longer or shorter, etc. Things like memo time and the "New PB average of ..." text are also variables that can slightly alter the size of content on the page. Moreover, the user can close or open the footer, further changing how much content can be visible. All of this has to interact so that the user never sees a page with overlapping, ugly content. This means that the footer needs to automatically shrink as they shrink their browser past a certain point, the scramble needs to hide after the browser gets really small, and eventually the footer itself must hide. Some of these changes must be animated (e.g. by fading), while others (i.e. the footer changing height) must not animate. Once something like the footer is hidden, the time and other things may be able to grow and re-center, and these changes need to animate as well. However, you can't use simple CSS transitions, because sometimes the time and memo time will need to move and change size without animating (e.g. if the user resizes the footer and squeezes them).

Everything I described about the resizing system is relatively solved, but now there are a few more variables that you will need to think about. First, the user needs to be able to "open" their scramble to see a 3D rendering of a puzzle. Second, the time should resize based on its width in addition to its height; that way, it can fill the whole width of the browser even if it's only "12:32" when it could eventually be "9:59:59.99". Also keep in mind that an animation plays when the user first opens the page, and this animation involves everything flying in and fading. Right now I use a CSS animation for this, because doing it from JavaScript resulted in lag on some browsers.

I trust that, as you implement animations, you will test them on slower devices. It is easy to implement animations that work smoothly on a powerful Mac, but it is harder to make ones that work on a Chromebook.

# License

**cubezapp2** is licensed under the [Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International Public License](http://creativecommons.org/licenses/by-nc-nd/4.0/legalcode). See [LICENSE.md](LICENSE.md).

```
Copyright (c) 2015, Alexander Nichol and Jonathan Loeb.
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```
