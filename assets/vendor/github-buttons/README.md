## GitHub Buttons

Basically, a copy-pasta, standalone, Javascript version of [mdo/github-buttons](https://github.com/mdo/github-buttons). The reason for this library is that @mdo's version doesn't work with SSL and using iframes is just silly.

The CSS is prepended with `.github-btn` to prepend to increase specificity to avoid conflicts with your own CSS.

GitHub, you suck for not supporting this yourself.

### Installation

```bash
bower install github-buttons
component install jonathanong/github-buttons
```

### API

Place the buttons wherever on the page. They should have `class="github-btn"`. You may want to have a `class="hide"` as well. You should handle the loading states yourself.

All options as shown on [mdo/github-buttons](https://github.com/mdo/github-buttons) are available through `data-*` attributes. View the demo for basically every possible variation of buttons.

```html
<span class="github-btn hide" data-user="jonathanong" data-repo="github-buttons" data-type="watch" data-count="1"></span>

<script src="github-buttons.js"></script>
```

Note that the script should be loaded after all button definitions.

#### githubButtons(el)

You can load a single button yourself if you'd like. Use this if you load the script before any button definitions.

```js
githubButtons(document.querySelector('.github-btn'))
```

#### githubButtons.all()

Loads all buttons on the page. This is run on script load automatically.

### License

The MIT License (MIT)

Copyright (c) 2013 Jonathan Ong me@jongleberry.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.