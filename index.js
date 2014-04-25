var fs     = require('fs');
var path   = require('path');
var chalk  = require('chalk');
var JSHINT = require('jshint').JSHINT;
var Filter = require('broccoli-filter');

JSHinter.prototype = Object.create(Filter.prototype);
JSHinter.prototype.constructor = JSHinter;
function JSHinter (inputTree, options) {
  if (!(this instanceof JSHinter)) return new JSHinter(inputTree, options);

  this.inputTree = inputTree;
  this.log       = true;

  options = options || {};

  for (var key in options) {
    if (options.hasOwnProperty(key)) {
      this[key] = options[key]
    }
  }
};

JSHinter.prototype.extensions = ['js'];
JSHinter.prototype.targetExtension = 'jshint.js';

JSHinter.prototype.processString = function (content, relativePath) {
  var passed = JSHINT(content, this.jshintrc);
  var errors = this.processErrors(relativePath, JSHINT.errors);

  if (!passed && this.log) {
    this.logError(errors);
  }

  if (!this.disableTestGenerator) {
    return this.testGenerator(relativePath, passed, errors);
  }
};

JSHinter.prototype.processErrors = function (file, errors) {
  if (!errors) { return ''; }

  var len = errors.length,
  str = '',
  error, idx;

  if (len === 0) { return ''; }

  for (idx=0; idx<len; idx++) {
    error = errors[idx];
    str += file  + ': line ' + error.line + ', col ' +
      error.character + ', ' + error.reason + '\n';
  }

  return str + "\n" + len + ' error' + ((len === 1) ? '' : 's');
}

JSHinter.prototype.testGenerator = function(relativePath, passed, errors) {
  if (errors) {
    errors = "\\n" + errors.replace(/\n/gi, "\\n");
  } else {
    errors = ""
  }

  return "module('JSHint - " + path.dirname(relativePath) + "');\n" +
         "test('" + relativePath + " should pass jshint', function() { \n" +
         "  ok(" + !!passed + ", '" + relativePath + " should pass jshint." + errors + "'); \n" +
         "});"
};

JSHinter.prototype.logError = function(message, color) {
  color = color || 'red';

  console.log(chalk[color](message) + "\n");
};

module.exports = JSHinter;
