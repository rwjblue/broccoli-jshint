var fs       = require('fs');
var path     = require('path');
var chalk    = require('chalk');
var findup   = require('findup-sync');
var mkdirp   = require('mkdirp');
var walkSync = require('walk-sync');
var JSHINT   = require('jshint').JSHINT;
var helpers  = require('broccoli-kitchen-sink-helpers');

var CachingWriter = require('broccoli-caching-writer');

JSHinter.prototype = Object.create(CachingWriter.prototype);
JSHinter.prototype.constructor = JSHinter;
function JSHinter (inputTree, options) {
  if (!(this instanceof JSHinter)) return new JSHinter(inputTree, options);

  options = options || {};

  this.inputTree = inputTree;
  this.log       = true;

  this.destFile  = options.destFile;
  if (typeof this.destFile !== "string") {
    throw new Error('You must provide a destFile option to broccoli-jshint.');
  }

  for (var key in options) {
    if (options.hasOwnProperty(key)) {
      this[key] = options[key]
    }
  }
};

JSHinter.prototype.updateCache = function (srcDir, destDir) {
  var paths    = walkSync(srcDir);
  var length   = paths.length;
  var contents = [];

  this._errors = [];

  if (!this.jshintrc) {
    this.jshintrc = this.getConfig(path.join(srcDir, this.jshintrcRoot || ''));
  }

  for (var i = 0; i < length; i++) {
    var relativePath = paths[i];

    if (relativePath.slice(-3) !== '.js') { continue; }
    var input  = fs.readFileSync(path.join(srcDir, relativePath), {encoding: 'utf8'});
    contents.push(this.processFile(input, relativePath));
  }

  if (this._errors.length > 0) {
    var label = ' JSHint Error' + (this._errors.length > 1 ? 's' : '')
    console.log('\n' + this._errors.join('\n'));
    console.log(chalk.yellow('===== ' + this._errors.length + label + '\n'));
  }

  var finalPath = path.join(destDir, this.destFile);
  mkdirp.sync(path.dirname(finalPath));

  fs.writeFileSync(path.join(destDir, this.destFile), contents.join('\n\n'));
};

JSHinter.prototype.processFile = function (content, relativePath) {
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
    if (error !== null) {
      str += file  + ': line ' + error.line + ', col ' +
        error.character + ', ' + error.reason + '\n';
    }
  }

  return str + "\n" + len + ' error' + ((len === 1) ? '' : 's');
}

JSHinter.prototype.testGenerator = function(relativePath, passed, errors) {
  if (errors) {
    errors = "\\n" + this.escapeErrorString(errors);
  } else {
    errors = ""
  }

  return "module('JSHint - " + path.dirname(relativePath) + "');\n" +
         "test('" + relativePath + " should pass jshint', function() { \n" +
         "  ok(" + !!passed + ", '" + relativePath + " should pass jshint." + errors + "'); \n" +
         "});\n"
};

JSHinter.prototype.logError = function(message, color) {
  color = color || 'red';

  this._errors.push(chalk[color](message) + "\n");
};

JSHinter.prototype.getConfig = function(rootPath) {
  if (!rootPath) { rootPath = process.cwd(); }

  var jshintrcPath = findup('.jshintrc', {cwd: rootPath, nocase: true});

  if (jshintrcPath) {
    var config = fs.readFileSync(jshintrcPath, {encoding: 'utf8'});

    try {
      return JSON.parse(this.stripComments(config));
    } catch (e) {
      console.error(chalk.red('Error occured parsing .jshintrc.'));
      console.error(e.stack);

      return null;
    }
  }
};

JSHinter.prototype.stripComments = function(string) {
  string = string || "";

  string = string.replace(/\/\*(?:(?!\*\/)[\s\S])*\*\//g, "");
  string = string.replace(/\/\/[^\n\r]*/g, ""); // Everything after '//'

  return string;
};

JSHinter.prototype.escapeErrorString = function(string) {
  string = string.replace(/\n/gi, "\\n");
  string = string.replace(/'/gi, "\\'");

  return string;
};

module.exports = JSHinter;
