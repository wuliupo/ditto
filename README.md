# Ditto

Markdown docs paser from https://github.com/chutsu/ditto

## Used

- [store.js](https://github.com/marcuswestin/store.js): localStorage wrapper for all browsers
- [ditto.js](https://github.com/chutsu/ditto): lightweight markdown doc system
- [marked.js](https://github.com/chjj/marked): full-featured markdown parser and compiler
- [prism.js](http://prismjs.com/): lightweight, extensible syntax highlighter

## Usage

```JavaScript
// your website's title
ditto.document_title = 'Document title';
// index page
ditto.index = 'README.md';
// sidebar file
ditto.sidebar_file = 'sidebar.md';
// where the docs are actually stored on github - so you can edit
ditto.base_url = 'https://github.com/wuliupo/ditto/edit/master';
ditto.git_url = 'https://github.com/wuliupo/ditto';
ditto.run();
```

