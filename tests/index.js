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
    console.log('Root was: ' + process.cwd());
    console.log('Changing root to: ' + root);
    process.chdir(root);

    loggerOutput = [];
  });

  afterEach(function() {
    if (builder) {
      builder.cleanup();
    }
  });

  describe('jshintrc', function() {
    it('uses the jshintrc as configuration for hinting', function(){
      var sourcePath = 'tests/fixtures/some-files-ignoring-missing-semi-colons';
      process.chdir(sourcePath);

      var tree = jshintTree('.', {
        logError: function(message) { loggerOutput.push(message) }
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function(dir) {

        expect(loggerOutput[0]).to.not.match(/Missing semicolon./)
      });
    });

    it('can handle jshintrc if it has comments', function(){
      var sourcePath = 'tests/fixtures/comments-in-jshintrc';
      process.chdir(sourcePath);

      var tree = jshintTree('.', {
        logError: function(message) { loggerOutput.push(message) }
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function(dir) {
        expect(loggerOutput.length).to.eql(0);
      });
    });
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

    it('does not log if `log` = false', function(){
      var sourcePath = 'tests/fixtures/some-files-without-semi-colons';
      var tree = jshintTree(sourcePath, {
        logError: function(message) { loggerOutput.push(message) },
        log: false
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function(dir) {

        expect(loggerOutput.length).to.eql(0);
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

    it('does not generate tests if disableTestGenerator is set', function(){
      var sourcePath = 'tests/fixtures/some-files-without-semi-colons';
      var tree = jshintTree(sourcePath, {
        logError: function(message) { loggerOutput.push(message) },
        disableTestGenerator: true
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function(dir) {
        expect(readFile(dir + '/core.jshint.js')).to.not.match(/Missing semicolon./)

        expect(readFile(dir + '/look-no-errors.jshint.js')).to.not.match(/ok\(true, 'look-no-errors.js should pass jshint.'\);/)
      });
    });
  });
});
