var Builder = require("../lib/build.js").Builder;
var fs = require("fs");

module.exports = {
    setUp: function (callback) {
        this.zh = new Builder({language: "zh", default: true});
        this.en = new Builder({language: "en"});

        callback();
    },

    testNew: function (test) {
        test.throws(function () { new Builder(); });
        test.throws(function () { new Builder({language: "abcd"}); } );
        test.done();
    },

    testInit: function (test) {
        test.equal(this.zh.language, "zh");
        test.ok(this.zh.defaultLanguage);
        test.equal(this.en.language, "en");
        test.done();
    },

    testPrepare: function (test) {
        test.equal(this.zh.index, "index.html");
        test.ok(fs.existsSync(this.zh.destination));
        test.equal(this.en.index, "index.en.html");
        test.done();
    },

    testTemplate: function (test) {
        test.ok(this.zh.template);
        test.ok(fs.existsSync(this.zh.template.layout));
        test.ok(fs.existsSync(this.zh.template.index));
        test.ok(fs.existsSync(this.zh.template.page));
        test.ok(fs.existsSync(this.zh.template.about));
        test.ok(typeof this.zh.template.compiledIndex() === "function");
        test.ok(typeof this.zh.template.compiledPage() === "function");
        test.ok(typeof this.zh.template.compiledAbout() === "function");
        test.done();
    },

    testGenerateIndex: function (test) {
        var indexZH = __dirname + "/../index.html";
        var indexEN = __dirname + "/../index.en.html";
        test.ok(fs.existsSync(indexZH));
        test.ok(fs.readFileSync(indexZH) !== "");
        test.ok(fs.existsSync(indexEN));
        test.ok(fs.readFileSync(indexEN));
        test.done();
    },

    testGeneratePage: function (test) {
        if (fs.existsSync(this.zh.source + "/01-introduction/01-chapter1.markdown")) {
            test.ok(fs.existsSync(this.zh.destination + "/ch1_0.html"));
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
        test.ok(pattern.test("# 1 #"));
        test.ok(pattern.test("## 2 ##"));
        test.ok(pattern.test("### 3 ###"));
        test.ok(pattern.test("#### 4 ####"));
        test.ok(pattern.test("##### 5 #####"));
        test.ok(pattern.test("###### 6 ######"));
        test.done();
    }
};