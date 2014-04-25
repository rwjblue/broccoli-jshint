# Broccoli JSHint

[![Build Status](https://travis-ci.org/rjackson/broccoli-jshint.svg?branch=master)](https://travis-ci.org/rjackson/broccoli-jshint)

Run JSHint on the provided tree.

## Usage

```javascript
var jshintTree = require('broccoli-jshint');

// assuming someTree is a built up tree
var tree = jshintTree(someTree);
```

## Documentation

### `jshintTree(inputTree, options)`

---

`options.log` *{true|false}*

Should we log errors to the console?

Default: **true**

---

`options.testGenerator` *{Function}*

The function used to generate test modules. You can provide a custom function for your client side testing framework of choice.

The function receives the following arguments:

* `relativePath` - The relative path to the file being tested.
* `errors` - A generated string of errors found.

Default:

```javascript
var path = require('path');

function(relativePath, errors) {
  return "module('" + path.dirname(relativePath) + '");";
         "test('" + relativePath + "' should pass jshint', function() { " +
         "  ok(passed, moduleName+" should pass jshint."+(errors ? "\n"+errors : '')); " +
         "});
};
```

## ZOMG!!! TESTS?!?!!?

I know, right?

Running the tests:

```javascript
npm install
npm test
```

## License

This project is distributed under the MIT license.
