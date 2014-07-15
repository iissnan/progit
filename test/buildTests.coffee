fs = require 'fs'
path = require 'path'
should = require('chai').should()
settings = require '../lib/settings'
i18n = require '../lib/i18n.js'
convert = require('../lib/converter')

SOURCE_DIR = settings.SOURCE_DIR
DESTINATION_DIR = settings.DESTINATION_DIR
TEMPLATE_DIR = settings.TEMPLATE_DIR

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

describe 'Converter', ->

  zh = convert 'zh'
  en = convert 'en'

  describe '#init', ->
    it 'should throw an error when directory of the translation does not present', ->
      fn = ->
        convert 'noExistTranslation'
      fn.should.throws Error, /Source of translation/

    it 'should have a `source` instance property', ->
      zh.should.have.property 'source', path.join(SOURCE_DIR, 'zh')

  describe '#prepare', ->
    it 'should have a `destination` property', ->
      zh.should.have.property 'destination', path.join(DESTINATION_DIR, 'zh')

    it "should have a `#{DESTINATION_DIR}` directory", ->
      fs.existsSync(DESTINATION_DIR).should.be.ok

    it "should have a `#{DESTINATION_DIR}/zh` directory", ->
      fs.existsSync(zh.destination).should.be.ok

    it 'should have a chapters array, contains paths of chapters', ->
      zh.should.have.property 'chapters'

    describe '#getRender', ->
      it 'should have jade templates exist', ->
        templates = [
          'layout.jade',
          'index.jade',
          'chapter.jade',
          'about.jade'
        ]
        isTemplateExist = (template) ->
          return fs.existsSync path.join(TEMPLATE_DIR, template)

        isTemplateExist(template).should.be.ok for template in templates

      it 'should have a `render` property', ->
        zh.should.have.property 'template'
        zh.render.should.be.an 'object'

  describe '#generate', ->
    describe '#readChaptersContent', ->
      it 'should have a `chaptersContent` property', ->
        zh.should.have.property 'chaptersContent'
        zh.chaptersContent.should.be.an 'array'

      it 'should have a `html` property', ->
        zh.should.have.property 'html'
        zh.html.should.be.an 'object'