fs = require 'fs'
path = require 'path'
should = require('chai').should()
settings = require '../lib/settings'
i18n = require '../lib/i18n.js'
convert = require '../lib/converter'

SOURCE_DIR = settings.SOURCE_DIR

describe 'Detection', ->
  describe 'CHECK source directory', ->
    it 'should throw an error when source directory does not exist', ->
      convert.should.throws Error unless fs.existsSync SOURCE_DIR

  describe 'CHECK default translation', ->
    it 'should throw an error when default translation does not exist', ->
      translation = settings.translation
      dt = translation.defaults
      dir = path.join SOURCE_DIR, dt
      isInvalidDefaultTranslation = ->
        return !translation ||
          !dt ||
          !fs.existsSync(dir) ||
          !i18n.menu[dt] ||
          !i18n.page[dt] ||
          !i18n.footer[dt]

      convert.should.throws Error if isInvalidDefaultTranslation()

  describe 'CHECK the required translation argument', ->
    it 'should throw an error when the translation argument is not present', ->
      convert.should.throws Error;


