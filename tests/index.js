'use strict';

var path = require('path');
var jshintTree = require('..');
var expect = require('expect.js');
var rimraf = require('rimraf');
var root = process.cwd();

var fs = require('fs');
var broccoli = require('broccoli');

var builder;

describe('broccoli-jshint', function(){
  var loggerOutput;

  function readFile(path) {
    return fs.readFileSync(path, {encoding: 'utf8'});
  }

  function chdir(path) {
    process.chdir(path);
  }

  beforeEach(function() {
    chdir(root);

    loggerOutput = [];
  });

  afterEach(function() {
    if (builder) {
      builder.cleanup();
    }
  });

  it('can output to a non-existent path', function() {
    var tree = jshintTree('tests/fixtures/some-files-without-semi-colons', {
      destFile: '/some/deeply/nested/file.js',
      logError: function(message) { loggerOutput.push(message) }
    });

    builder = new broccoli.Builder(tree);
    return builder.build().then(function(results) {
      var dir = results.directory;

      expect(fs.existsSync(dir + '/some/deeply/nested/file.js')).to.be.ok();
    });
  });

  describe('constructor', function() {
    it('requires a destFile option', function() {
      function createTree() {
        jshintTree('.')
      }
      expect(createTree).to.throwException(/You must provide a destFile option/);
    });
  });

  describe('jshintrc', function() {
    it('uses the jshintrc as configuration for hinting', function(){
      var sourcePath = 'tests/fixtures/some-files-ignoring-missing-semi-colons';
      chdir(sourcePath);

      var tree = jshintTree('.', {
        destFile: 'jshint-tests.js',
        logError: function(message) { loggerOutput.push(message) }
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function() {
        expect(loggerOutput.join('\n')).to.not.match(/Missing semicolon./)
      });
    });

    it('can handle too many errors', function(){
      var sourcePath = 'tests/fixtures/some-files-with-too-many-errors';
      chdir(sourcePath);

      var tree = jshintTree('.', {
        destFile: 'jshint-tests.js',
        logError: function(message) { loggerOutput.push(message) }
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function() {
        expect(loggerOutput.join('\n')).to.match(/Too many errors./)
      });
    });

    it('can handle jshintrc if it has comments', function(){
      var sourcePath = 'tests/fixtures/comments-in-jshintrc';
      chdir(sourcePath);

      var tree = jshintTree('.', {
        destFile: 'jshint-tests.js',
        logError: function(message) { loggerOutput.push(message) }
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function() {
        expect(loggerOutput.length).to.eql(0);
      });
    });

    it('can find a jshintrc in a specified jshintrcRoot path', function(){
      var sourcePath = 'tests/fixtures/some-files-ignoring-missing-semi-colons-non-default-jshintrc-path';

      var tree = jshintTree(sourcePath, {
        jshintrcRoot: 'blah',
        destFile: 'jshint-tests.js',
        logError: function(message) { loggerOutput.push(message) }
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function() {
        expect(loggerOutput.join('\n')).to.not.match(/Missing semicolon./)
      });
    });

    it('can find a jshintrc in the root of the provided tree', function(){
      var sourcePath = 'tests/fixtures/some-files-ignoring-missing-semi-colons';

      var tree = jshintTree(sourcePath, {
        destFile: 'jshint-tests.js',
        logError: function(message) { loggerOutput.push(message) }
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function() {
        expect(loggerOutput.join('\n')).to.not.match(/Missing semicolon./)
      });
    });
  });

  describe('logError', function() {
    it('logs errors using custom supplied function', function(){
      var sourcePath = 'tests/fixtures/some-files-without-semi-colons';
      var tree = jshintTree(sourcePath, {
        destFile: 'jshint-tests.js',
        logError: function(message) { loggerOutput.push(message) }
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function() {
        expect(loggerOutput.join('\n')).to.match(/Missing semicolon./)
      });
    });

    it('does not log if `log` = false', function(){
      var sourcePath = 'tests/fixtures/some-files-without-semi-colons';
      var tree = jshintTree(sourcePath, {
        destFile: 'jshint-tests.js',
        logError: function(message) { loggerOutput.push(message) },
        log: false
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function() {
        expect(loggerOutput.length).to.eql(0);
      });
    });
  });

  describe('testGenerator', function() {
    it('generates test files for jshint errors', function(){
      var sourcePath = 'tests/fixtures/some-files-without-semi-colons';
      var tree = jshintTree(sourcePath, {
        destFile: 'jshint-tests.js',
        logError: function(message) { loggerOutput.push(message) }
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function(results) {
        var dir = results.directory;

        expect(readFile(dir + '/jshint-tests.js')).to.match(/Missing semicolon./)

        expect(readFile(dir + '/jshint-tests.js')).to.match(/ok\(true, 'look-no-errors.js should pass jshint.'\);/)
      });
    });

    it('calls escapeErrorString on the error string provided', function() {
      var escapeErrorStringCalled = false;

      var sourcePath = 'tests/fixtures/some-files-without-semi-colons';
      var tree = jshintTree(sourcePath, {
        destFile: 'jshint-tests.js',
        logError: function(message) { loggerOutput.push(message) },
        escapeErrorString: function(string) {
          escapeErrorStringCalled = true;

          return "blazhorz";
        }
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function(results) {
        var dir = results.directory;

        expect(escapeErrorStringCalled).to.be.ok();
        expect(readFile(dir + '/jshint-tests.js')).to.match(/blazhorz/)
      });
    });

    it('does not generate tests if disableTestGenerator is set', function(){
      var sourcePath = 'tests/fixtures/some-files-without-semi-colons';
      var tree = jshintTree(sourcePath, {
        destFile: 'jshint-tests.js',
        logError: function(message) { loggerOutput.push(message) },
        disableTestGenerator: true
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function(results) {
        var dir = results.directory;

        expect(readFile(dir + '/jshint-tests.js')).to.not.match(/Missing semicolon./)

        expect(readFile(dir + '/jshint-tests.js')).to.not.match(/ok\(true, 'look-no-errors.js should pass jshint.'\);/)
      });
    });
  });

  describe('escapeErrorString', function() {
    var tree;

    beforeEach(function() {
      tree = jshintTree('.', {
        destFile: 'jshint-tests.js',
        logError: function(message) { loggerOutput.push(message) }
      });
    });

    it('escapes single quotes properly', function() {
      expect(tree.escapeErrorString("'something'")).to.equal('\\\'something\\\'');
    });
  });
});
