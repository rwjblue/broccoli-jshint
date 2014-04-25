'use strict';

var path = require('path');
var jshintTree = require('..');
var expect = require('expect.js');
var root = process.cwd();

var fs = require('fs');
var broccoli = require('broccoli');

var builder;

describe('broccoli-jshint', function(){
  var loggerOutput;

  function readFile(path) {
    return fs.readFileSync(path, {encoding: 'utf8'});
  }

  beforeEach(function() {
    loggerOutput = [];
  });

  afterEach(function() {
    if (builder) {
      builder.cleanup();
    }
  });

  describe('logError', function() {
    it('logs errors using custom supplied function', function(){
      var sourcePath = 'tests/fixtures/some-files-without-semi-colons';
      var tree = jshintTree(sourcePath, {
        logError: function(message) { loggerOutput.push(message) }
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function(dir) {

        expect(loggerOutput[0]).to.match(/Missing semicolon./)
      });
    });
  });

  describe('testGenerator', function() {
    it('generates test files for jshint errors', function(){
      var sourcePath = 'tests/fixtures/some-files-without-semi-colons';
      var tree = jshintTree(sourcePath, {
        logError: function(message) { loggerOutput.push(message) }
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function(dir) {
        expect(readFile(dir + '/core.jshint.js')).to.match(/Missing semicolon./)

        expect(readFile(dir + '/look-no-errors.jshint.js')).to.match(/ok\(true, 'look-no-errors.js should pass jshint.'\);/)
      });
    });
  });
});
