var Converter = require("../lib/converter.js");
var fs = require("fs");

module.exports = {
    setUp: function (callback) {
        this.zh = Converter.convert("zh");
        this.en = Converter.convert("en");

        callback();
    },

    testNew: function (test) {
        test.throws(function () { Converter.convert(); });
        test.throws(function () { Converter.convert("abcd"); } );
        test.done();
    },

    testInit: function (test) {
        test.equal(this.zh.translation, "zh");
        test.ok(this.zh.isDefaultTranslation);
        test.equal(this.en.translation, "en");
        test.ok(!this.en.isDefaultTranslation);
        test.done();
    },

    testPrepare: function (test) {
        test.equal(this.zh.indexPage, "index.html");
        test.ok(fs.existsSync(this.zh.destination));
        test.equal(this.en.indexPage, "index.en.html");
        test.done();
    },

    testTemplate: function (test) {
        test.ok(this.zh.template);
        test.ok(fs.existsSync(this.zh.template.layout));
        test.ok(fs.existsSync(this.zh.template.index));
        test.ok(fs.existsSync(this.zh.template.page));
        test.ok(fs.existsSync(this.zh.template.about));
        test.ok(typeof this.zh.template.indexCompiler === "function");
        test.ok(typeof this.zh.template.pageCompiler === "function");
        test.ok(typeof this.zh.template.aboutCompiler === "function");
        test.done();
    },

    testGenerateContents: function (test) {
        var indexZH = __dirname + "/../index.html";
        var indexEN = __dirname + "/../index.en.html";
        test.ok(fs.existsSync(indexZH));
        test.ok(fs.readFileSync(indexZH) !== "");
        test.ok(fs.existsSync(indexEN));
        test.ok(fs.readFileSync(indexEN) !== "");
        test.done();
    },

    testGeneratePage: function (test) {
        if (fs.existsSync(this.zh.source + "/01-introduction/01-chapter1.markdown")) {
            test.ok(fs.existsSync(this.zh.destination + "/ch1_0.html"));
            test.ok(fs.readFileSync(this.zh.destination + "/ch1_0.html") !== "");
        }
        test.done();
    },

    testAbout: function (test) {
        var about = __dirname + "/../about.html";
        test.ok(fs.existsSync(about));
        test.ok(fs.readFileSync(about) !== "");
        test.done();
    },

    testHeadlinePattern: function (test) {
        var pattern = this.zh.getHeadlinePattern();
        test.ok(pattern.test("# 1 #\n"), "Level 1");
        pattern.lastIndex = 0;
        test.ok(pattern.test("## 2 ##\n"), "Level 2");
        pattern.lastIndex = 0;
        test.ok(pattern.test("### 3 ###\r\n"), "Level 3");
        pattern.lastIndex = 0;
        test.ok(pattern.test("#### 4 ####\r\n "), "Level 4");
        pattern.lastIndex = 0;
        test.ok(pattern.test("##### 5 #####\r\n"), "Level 5");
        pattern.lastIndex = 0;
        test.ok(pattern.test("###### 6 ######\n\n"), "Level 6");
        test.done();
    },

    testGetBuildInfo: function (test) {
        test.ok(this.zh.getBuildSourceRevision());
        test.done();
    }
};