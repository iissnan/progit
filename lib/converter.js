var fs = require("fs");
var md = require("markdown").markdown;
var jade = require("jade");

var pkg = require("../package.json");
var i18n = require("./i18n");
var settings = require("./settings");
var SOURCE_DIR = settings.SOURCE_DIR;
var DESTINATION_DIR = settings.DESTINATION_DIR;

module.exports = function converter(translation) {
    return new Converter(translation);
};

/**
 * Converter Class
 *
 * @param {String} translation
 * @constructor
 */
function Converter (translation) {
    console.time("Totally spends");

    if (!fs.existsSync(SOURCE_DIR)) {
        throw new Error(
                "Source of the book does NOT exist. Please checkout the source first. run:\n" +
                "    git submodule init\n" +
                "    git submodule update\n"
        );
    }

    if (!isValidDefaultTranslation()) {
        throw new Error("Configurations for default translation are invalid.");
    }

    if (!translation) {
        throw new Error("Expect an translation argument.");
    }

    console.log("\nConverting translation [" + translation + "]: ");

    this.translation = translation;
    this.title = this.getLabel({
        translation: this.translation,
        section: "page",
        label: "titleLabel"
    });
    this.init();

    console.timeEnd("Totally spends");

    function isValidDefaultTranslation () {
        var dt = settings.translation.defaults;

        return (
            dt &&
            fs.existsSync(SOURCE_DIR + "/" + dt) &&
            (i18n.menu[dt] && i18n.page[dt] && i18n.footer[dt])
        );
    }
}

Converter.prototype.init = function () {
    this.source = SOURCE_DIR + "/" + this.translation;
    if (!fs.existsSync(this.source) || fs.readdirSync(this.source).length === 0) {
        throw new Error("Source of translation: [" + this.translation + "] does not exist");
    }
    this.prepare();
};

Converter.prototype.prepare = function () {
    this.destination = DESTINATION_DIR + "/" + this.translation;
    !fs.existsSync(DESTINATION_DIR) && fs.mkdirSync(DESTINATION_DIR);
    !fs.existsSync(this.destination) && fs.mkdirSync(this.destination);

    this.indexPage = this.isDefaultTranslation(this.translation) ?
        "index.html" :
        "index." + this.translation + ".html";

    // Store real path of chapters.
    var self = this;
    var chapters = fs.readdirSync(this.source);
    this.chapters = chapters.map(function(chapter) {
        return self.source + "/" + chapter;
    });

    this.getTemplate();
    this.chapterRawContents = this.getChapterRawContents();
    this.html = {};
    this.html.footer = this.getFooter();
    this.html.menuLevel1 = this.getMenu(1);
    this.html.menuLevel2 = this.getMenu(2);
    this.generate();
};

Converter.prototype.generate = function () {
    this.generateTableOfContents();
    this.generateChapters();
    this.generateAboutPage();
};

Converter.prototype.generateTableOfContents = function () {
    console.time(" - generateTableOfContents");

    var tableOfContents = [];
    var self = this;

    for (var i = 0; i < this.chapterRawContents.length; i++) {
        if (this.chapterRawContents[i]) {
            tableOfContents.push(getChapterContents(this.chapterRawContents[i], i));
        }
    }

    fs.writeFileSync(__dirname + "/../" + this.indexPage, this.template.indexCompiler({
        title: this.title,
        menu: this.html.menuLevel1,
        tableOfContents:  tableOfContents,
        footer: this.html.footer,
        AnalyticsScript: this.getAnalytics()
    }));

    console.timeEnd(" - generateTableOfContents");

    function getChapterContents(chapterRawContent, index) {
        var headline,
            result,
            level,
            sectionIndex = 0,
            sectionTitlePrefix;
        var chapterTOC = [];
        var headlinePattern = self.getHeadlinePattern();

        // Chapters' index starts from 1.
        index = index + 1;

        while((result = headlinePattern.exec(chapterRawContent)) !== null) {
            level = result[1].length;
            headline = result[2];

            if (level < 3) {
                sectionTitlePrefix = level === 1 ? index : index + "." + sectionIndex;
                chapterTOC.push({
                    level: level,
                    href: 'html/' + self.translation + '/ch' + index + "_" + sectionIndex + '.html',
                    text: sectionTitlePrefix + "  " + headline
                });
                sectionIndex++;
            }
        }
        return chapterTOC;
    }
};

Converter.prototype.generateChapters = function () {
    console.time(" - generateChapters");

    var self = this;
    var menu = this.html.menuLevel2;

    for (var i = 0; i < this.chapterRawContents.length; i++) {
        if (this.chapterRawContents[i]) {
            generatePages(this.chapterRawContents[i].toString(), i);
        }
    }

    console.timeEnd(" - generateChapters");

    // Generate pages according to sections(split with <h2).
    function generatePages(chapterRawContent, index) {
        var html = md.toHTML(chapterRawContent);

        // Chapters' index starts from 1.
        index = index + 1;
        var h1 = (/<h1>(.*?)<\/h1>/.exec(html)) ? (/<h1>(.*?)<\/h1>/.exec(html))[1] : "";
        var pageUriPrefix = "ch" + index + "_";

        var pageSidebar = getPageSidebar();

        var sections = html.split("<h2");
        for (var i = 0; i < sections.length; i++) {
            var pagePath = self.destination + "/" + pageUriPrefix + i + ".html";
            var pageTitle = getPageTitle(sections[i]);
            var pageContent = getPageContent(sections[i], i);

            // Write to file.
            fs.writeFileSync(pagePath, self.template.pageCompiler({
                title: pageTitle,
                menu: menu,
                sidebar: pageSidebar,
                content: imageReplace(pageContent),
                footer: self.html.footer,
                AnalyticsScript: self.getAnalytics()
            }));
        }

        function getPageSidebar() {
            var h2Pattern = /<h2>(.*?)<\/h2>/g;
            var h2;
            var sectionIndex = 1;
            var sectionItems = "";
            var templateLink = jade.compile('li: a(href="#{href}") #{text}');

            while (h2 = h2Pattern.exec(html)) {
                sectionItems = sectionItems + templateLink({
                    href: 'ch' + index + '_' + sectionIndex +'.html',
                    text: h2[1]
                });
                sectionIndex++;
            }
            return '<li class="nav-header"><a href="ch' + index + '_0.html">' + h1 + '</a></li>' +
                   sectionItems; 
        }

        function getPageTitle(sectionContent) {
            var h2Pattern = />(.*?)<\/h2>/;
            var title = h2Pattern.exec(sectionContent);
            return (title ? title[1] + " - " + h1 : h1) + " - " + self.title;
        }

        function getPageContent(sectionContent, sectionIndex) {
            return sectionIndex === 0 ? sectionContent : "<h2" + sectionContent;
        }

        function imageReplace(text) {
            return text.replace(/Insert ([^\.]+).png/g, function (all, figure) {
                return '<img class="img-responsive center-block" src="../../book_src/figures/' + figure + '-tn.png"></br>';
            });
        }
    }
};

Converter.prototype.generateAboutPage = function () {
    console.time(" - generateAboutPage");

    var aboutPage = __dirname + "/../" + "about.html";
    fs.writeFileSync(aboutPage, this.template.aboutCompiler({
        title: "About",
        menu: this.html.menuLevel1,
        footer: this.html.footer,
        AnalyticsScript: this.getAnalytics()
    }));

    console.timeEnd(" - generateAboutPage");
};

Converter.prototype.getFooter = function () {
    console.time(" - getFooter");

    var buildDate = this.getLabel({
        section: "footer",
        label: "buildDate"
    }) + this.getBuildDate() ;

    var buildSourceRevision = this.getLabel({
        section: "footer",
        label: "sourceRevision"
    }) + this.getBuildSourceRevision();

    var buildVersion = this.getLabel({
        section: "footer",
        label: "version"
    }) + this.getBuildVersion();

    var symbolComma = this.getLabel({
        section: "symbol",
        label: "comma"
    });

    var symbolPeriod = this.getLabel({
        section: "symbol",
        label: "period"
    });

    console.timeEnd(" - getFooter");

    return this.template.footerCompiler({
        buildDate: buildDate,
        buildSourceRevision: buildSourceRevision,
        applicationVersion: buildVersion,
        symbolComma: symbolComma,
        symbolPeriod: symbolPeriod
    });
};

Converter.prototype.getHeadlinePattern = function () {
    // Contain at least one newline to distinguish headline and inline content.
    return /(#{1,6})(.*?)\1[\r\n|\n]+/g;
};

Converter.prototype.getTemplate = function () {
    console.time(" - getTemplate");

    var tplLayout = "layout.jade";
    var tplIndex = "index.jade";
    var tplPage = "chapter.jade";
    var tplAbout = "about.jade";
    var tplFooter = "footer.jade";

    this.template = {
        indexCompiler: getCompiler(tplIndex, tplLayout),
        pageCompiler:  getCompiler(tplPage, tplLayout),
        aboutCompiler: getCompiler(tplAbout, tplLayout),
        footerCompiler: getCompiler(tplFooter)
    };

    console.timeEnd(" - getTemplate");

    function getCompiler(tpl, relativeTemplateName) {
        var templateString = fs.readFileSync(getTemplatePath(tpl), "utf-8");
        var compileOptions = relativeTemplateName ? {filename: getTemplatePath(relativeTemplateName)} : {};
        var compiler = jade.compile(templateString, compileOptions);

        return function (data) {
            return compiler(data);
        };
    }

    function getTemplatePath(template) {
        return settings.TEMPLATE_DIR + "/" + template;
    }
};

Converter.prototype.getBuildDate = function () {
    var moment = require("moment");
    return moment().format("YYYY-MM-DD HH:mm:ss");
};

Converter.prototype.getBuildVersion = function () {
    return pkg.version;
};

Converter.prototype.getBuildSourceRevision = function () {
    var sh = require("shelljs");
    var command = "git submodule status";
    var output;
    var sourceRevision;
    var result = sh.exec(command, {async: false, silent: true});

    if (result.code === 0) {
        output = result.output.split(" ");
        if (output.length > 2) {
            sourceRevision = output[1];
            return '<a href="https://github.com/progit/progit/tree/' +
                sourceRevision + '" target="_blank">' +
                sourceRevision.substring(0, 7) + '</a>';
        }
    }

    return false;
};

Converter.prototype.getAnalytics = function () {
    return this.getGoogleAnalytics();
};

Converter.prototype.getGoogleAnalytics = function () {
    var injector = "(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){" +
        "(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o)," +
        "m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)" +
        "})(window,document,'script','//www.google-analytics.com/analytics.js','ga');";
    var tracker = "ga('create', '" + settings.gaID + "' , 'auto');";
    var sender = "ga('send', 'pageview');";

    return injector + tracker + sender;
};

Converter.prototype.getMenu = function (level) {
    console.time(" - getMenu");

    var self = this;
    var itemCompiler = getCompiler("menu-item.jade");
    var menuCompiler = getCompiler("menu.jade");
    var menuItems = "";
    var supportTranslations = settings.translation.support;

    for (var i = 0; i < supportTranslations.length; i++) {
        var translation = supportTranslations[i];
        var chaptersPath = fs.readdirSync(SOURCE_DIR + "/" + translation);
        var chapters = chaptersPath.map(getChapterPath);
        menuItems = menuItems + itemCompiler({
            MenuItemLabel: getMenuItemLabel(translation),
            TransitionTableOfContentsLink: getTableOfContentsLink(translation),
            TransitionChapterLinks: self.getHeadline(chapters, getUriPrefix(translation))
        });
    }

    console.timeEnd(" - getMenu");

    return menuCompiler({
        "translations": menuItems,
        "about": getAboutTemplateData()
    });

    function getCompiler (tpl) {
        return jade.compile(
            fs.readFileSync(settings.TEMPLATE_DIR + "/" + tpl),
            "utf-8"
        );
    }

    function getUriPrefix (translation) {
        return level === 1 ?
            "html/" + translation :
            (translation === self.translation ? "" : "../" + translation);
    }

    function getMenuItemLabel (translation) {
        return self.getLabel({
            translation: translation,
            section: "menu",
            label: "titleLabel",
            translationFor: translation
        });
    }

    function getTableOfContentsLink (translation) {
        var uriPrefix = level === 1 ? "": "../../";
        var href = uriPrefix + (self.isDefaultTranslation(translation) ?
            "index.html" :
            "index." + translation + ".html"
        );
        var text = self.getLabel({
            translation: translation,
            section: "menu",
            label: "indexLabel"
        });
        return {
            href: href,
            text: text
        };
    }

    function getAboutTemplateData() {
        var link = level === 1 ? "about.html" : "../../about.html";
        return {
            link: link,
            text: self.getLabel({
                translation: self.translation,
                section: "menu",
                label: "aboutLabel"
            })
        };
    }

    function getChapterPath(chapter) {
        return SOURCE_DIR + "/" + translation + "/" + chapter;
    }
};

Converter.prototype.getHeadline = function (chapters, chapterUriPrefix) {
    var chapterFiles,
        chapter,
        chapterContent,
        chapterLinks = [];
    var headlinePattern = this.getHeadlinePattern();

    chapterUriPrefix = chapterUriPrefix ? chapterUriPrefix + "/" : "";

    for( var i = 0; i < chapters.length; i++) {
        chapterFiles = fs.readdirSync(chapters[i]);

        if (chapterFiles.length > 0) {
            chapter = chapterFiles[0];
            chapterContent = fs.readFileSync(chapters[i] + "/" + chapter, "utf-8");
            if (chapterContent) {
                var result;
                var j = 0;
                var chapterIndex = i + 1;

                while((result = headlinePattern.exec(chapterContent)) !== null) {
                    if (result[1].length === 1) {
                        chapterLinks.push({
                            href: chapterUriPrefix + 'ch' + chapterIndex + '_' + j + '.html',
                            text: chapterIndex + result[2]
                        });
                    }
                }
            }
        }
    }

    return chapterLinks;
};

Converter.prototype.getChapterRawContents = function () {
    console.time(" - getChapterRawContents");

    // source directory structure: :translation/:chapter/:chapter.md
    var chapterFiles = [];
    var chapter;
    var chapterRawContents = [];
    for (var i = 0; i < this.chapters.length; i++) {
        chapterFiles = fs.readdirSync(this.chapters[i]);
        if (chapterFiles.length > 0) {
            chapter = fs.readFileSync(this.chapters[i] + "/" + chapterFiles[0]);
            chapterRawContents.push(chapter);
        } else {
            chapterRawContents[chapterRawContents.length + 1] = null;
        }
    }

    console.timeEnd(" - getChapterRawContents");

    return chapterRawContents;
};

Converter.prototype.isDefaultTranslation = function (translation) {
    return translation === settings.translation.defaults;
};

/**
 * Get label of specific translation.
 * Structure of the label object is:
 * <code>
 * {
 *     section: {
 *         translation: {
 *             label: "",
 *             label: "",
 *             label: {
 *                 translation: "",
 *                 translation: ""
 *             }
 *         },
 *         translation: {},
 *         translation: {}
 *     }
 * }
 * </code>
 *
 * @param {Object} config
 * @param {String} config.section
 * @param {String} config.label
 * @param {String} [config.translation] Default to this.translation.
 * @param {String} [config.translationFor]
 * @returns {*}
 */
Converter.prototype.getLabel = function (config) {
    var translation = config.translation || this.translation;
    var labelSection = i18n[config.section][translation];
    var labelSectionDefault = i18n[config.section][settings.translation.defaults];
    var label = labelSection && labelSection[config.label] ?
        labelSection[config.label] :
        labelSectionDefault[config.label];

    if (config.translationFor) {
        label = label[config.translationFor] ?
            label[config.translationFor] :
            labelSectionDefault[config.translationFor];
    }

    return label;
};