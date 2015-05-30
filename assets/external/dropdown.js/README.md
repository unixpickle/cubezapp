# dropdown.js

This is a nice, beautiful dropdown UI component for websites. It is fairly complete, although it could use some minor improvements.

# Dependencies

This depends on [jQuery](https://jquery.com) and [clickthru.js](https://github.com/unixpickle/clickthru.js). You must include both source files before dropdown.js.

# Usage

In order to use dropdown.js in your project, copy this directory into your project. Then import the various components in your HTML. This should look something like this:

```html
<link rel="stylesheet" type="text/css" href="dropdownjs/dropdown.css">
<script src="dropdownjs/dropdown.js"></script>
```

You can create a dropdown using the Dropdown constructor:

```javascript
new window.dropdownjs.Dropdown(width, [bgcolor, [height, [fontSize]]])
```

If you supply a falsy value for an optional argument, it will be set to its default value. Here is the meaning of each argument:

 * **width** - number - the width in pixels of the dropdown
 * **bgcolor** - string - default **#ffffff** - the CSS background color for the dropdown
 * **height** - number - default **30** - the height in pixels of the dropdown
 * **fontSize** - number - default **height \* 18/30** - the font size to use throughout the dropdown

Once you have an instance of *Dropdown*, you can use the following functions on it:

 * close() - if the dropdown was open, close it.
 * element() - returns the HTML DOM node which represents the dropdown. You can append this to your webpage in order to display the dropdown. By default, it will behave as an `inline-block` element
 * getFontSize() - get the font size in pixels.
 * getHeight() - get the height of the dropdown in pixels.
 * getSelected() - get the index of the selected item. If there are no options, this will always be 0.
 * getValue() - get the string value of the selected item. If there are no options, this will always be the empty string.
 * getWidth() - get the width of the dropdown in pixels.
 * isOpen() - get a boolean indicating whether or not the dropdown is open.
 * open() - if the dropdown was not open, open it.
 * setOptions(list, [selected]) - set the options (an array of strings) for the dropdown. The optional selected argument indicates the index of the option to select. If this is not specified, the first option is selected.
 * setSelected(index) - select the option at the selected index.
 * setValue(value) - select the option with a given string value.

# LICENSE

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
