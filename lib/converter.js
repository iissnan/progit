var fs = require("fs");
var jade = require("jade");
var path = require('path');
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

    if (!isFileExist(SOURCE_DIR)) {
        throw new Error(
                "Book source does NOT exist. Please checkout the source first. run:\n" +
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
        var filePath = getPath(SOURCE_DIR, dt);

        return (
            dt &&
            isFileExist(filePath) &&
            isI18NValid()
        );

        function isI18NValid() {
            return ['menu', 'page', 'footer'].every(function(section) {
                return i18n[section][dt] !== void 0;
            });
        }
    }
}

Converter.prototype.init = function () {
    this.source = getPath(SOURCE_DIR, this.translation);
    if (!isFileExist(this.source) ||
        fs.readdirSync(this.source).length === 0) {
        throw new Error("Source of translation: [" + this.translation + "] does not exist");
    }
    this.destination = getPath(DESTINATION_DIR, this.translation);
    this.prepare();
};

Converter.prototype.prepare = function () {
    var self = this;

    mkdir(DESTINATION_DIR);
    mkdir(this.destination);

    this.getRender();
    this.chaptersContent = readChaptersContent();
    this.html = getSharedHTML();
    this.generate();

    function readChaptersContent () {
        console.time(" - readChaptersContent");

        var chaptersContent = [];
        var chaptersDirectoriesName = fs.readdirSync(self.source);

        // source directory structure: :translation/:chapter/:chapter.md
        chaptersDirectoriesName.forEach(function (chapterDirectoryName) {
            var chapterDirectoryPath = getPath(self.source, chapterDirectoryName);
            var chapterFiles = fs.readdirSync(chapterDirectoryPath);
            var chapterFilePath;
            var chapterContent;

            if (chapterFiles.length > 0) {
                chapterFilePath = getPath(chapterDirectoryPath, chapterFiles[0]);
                chapterContent = fs.readFileSync(chapterFilePath);
            } else {
                console.log('[Warn] No file for ' + chapterDirectoryName + ' found.');
                chapterContent = null;
            }
            chaptersContent.push(chapterContent);
        });

        console.timeEnd(" - readChaptersContent");

        return chaptersContent;
    };

    // Shared HTML.
    function getSharedHTML () {
        return {
            footer: getFooter(),
            analytics: getAnalytics(),
            menuLevel1: getMenu(1),
            menuLevel2: getMenu(2)
        };

        function getAnalytics () {
            return getGoogleAnalytics();

            // TODO: Place this script into template.
            function getGoogleAnalytics () {
                var injector = "(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){" +
                    "(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o)," +
                    "m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)" +
                    "})(window,document,'script','//www.google-analytics.com/analytics.js','ga');";
                var tracker = "ga('create', '" + settings.gaID + "' , 'auto');";
                var sender = "ga('send', 'pageview');";

                return injector + tracker + sender;
            };
        }

        function getFooter () {
            console.time(" - getFooter");

            var buildDate = self.getLabel({
                section: "footer",
                label: "buildDate"
            }) + getBuildDate();

            var buildSourceRevision = self.getLabel({
                section: "footer",
                label: "sourceRevision"
            }) + getBuildSourceRevision();

            var buildVersion = self.getLabel({
                section: "footer",
                label: "version"
            }) + getBuildVersion();

            var symbolComma = self.getLabel({
                section: "symbol",
                label: "comma"
            });

            var symbolPeriod = self.getLabel({
                section: "symbol",
                label: "period"
            });

            console.timeEnd(" - getFooter");

            return self.render.footerCompiler({
                buildDate: buildDate,
                buildSourceRevision: buildSourceRevision,
                applicationVersion: buildVersion,
                symbolComma: symbolComma,
                symbolPeriod: symbolPeriod
            });

            function getBuildDate () {
                var moment = require("moment");
                return moment().format("YYYY-MM-DD HH:mm:ss");
            };

            function getBuildVersion() {
                return pkg.version;
            };

            function getBuildSourceRevision() {
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
        };

         function getMenu (level) {
            console.time(" - getMenu");

            var itemCompiler = getCompiler("menu-item.jade");
            var menuCompiler = getCompiler("menu.jade");
            var menuItems = "";
            var supportTranslations = settings.translation.support;

            for (var i = 0; i < supportTranslations.length; i++) {
                var translation = supportTranslations[i];
                var chaptersPath = fs.readdirSync(getPath(SOURCE_DIR, translation));
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
                    fs.readFileSync(getPath(settings.TEMPLATE_DIR, tpl)),
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
                return getPath(SOURCE_DIR, translation, chapter);
            }
        };
    }
};

Converter.prototype.generate = function () {
    this.generateIndexPage();
    this.generateChapters();
    this.generateAboutPage();
};

Converter.prototype.getTableOfContents = function () {
    console.time(" - getTableOfContents");

    var self = this;
    var tableOfContents = [];
    var chaptersContent = this.getChaptersContent();

    chaptersContent.forEach(function (chapterContent, index) {
        if (chapterContent) {
            tableOfContents.push(getChapterContents(chapterContent, index));
        }
    });

    console.timeEnd(" - getTableOfContents");

    return tableOfContents;

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

Converter.prototype.generateIndexPage = function () {
    console.time(" - generateIndexPage");

    var tableOfContents = this.getTableOfContents();
    var indexPageName = this.isDefaultTranslation(this.translation) ?
        'index.html' :
        'index.' + this.translation + '.html';
    var indexPagePath = getPath(__dirname, "/../", indexPageName);
    var render = this.render.indexCompiler;

    fs.writeFileSync(indexPagePath, render({
        title: this.title,
        menu: this.html.menuLevel1,
        tableOfContents:  tableOfContents,
        footer: this.html.footer,
        AnalyticsScript: this.html.analytics
    }));

    console.timeEnd(" - generateIndexPage");
};

Converter.prototype.generateChapters = function () {
    console.time(" - generateChapters");

    var self = this;
    var md = require("markdown").markdown;
    var menu = this.html.menuLevel2;
    var chaptersContent = this.getChaptersContent();

    chaptersContent.forEach(function (chapterContent, index) {
        if (chapterContent) {
            generateChapter(chapterContent.toString(), index);
        }
    });

    console.timeEnd(" - generateChapters");

    // Generate pages according to sections(split with <h2).
    function generateChapter(chapterContent, index) {
        var html = md.toHTML(chapterContent);

        // Chapters' index starts from 1.
        index = index + 1;
        var chapterHeadline = getChapterHeadline();
        var pageUriPrefix = "ch" + index + "_";
        var pageSidebar = getPageSidebar();

        var sections = html.split("<h2");
        for (var i = 0; i < sections.length; i++) {
            var pagePath = self.destination + "/" + pageUriPrefix + i + ".html";
            var pageTitle = getPageTitle(sections[i]);
            var pageContent = getPageContent(sections[i], i);

            // Write to file.
            fs.writeFileSync(pagePath, self.render.pageCompiler({
                title: pageTitle,
                menu: menu,
                sidebar: pageSidebar,
                content: imageReplace(pageContent),
                footer: self.html.footer,
                AnalyticsScript: self.html.analytics
            }));
        }

        function getChapterHeadline() {
            var match = /<h1>(.*?)<\/h1>/.exec(html);
            return match ? match[1] : "";
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
            return '<li class="nav-header"><a href="ch' + index + '_0.html">' + chapterHeadline + '</a></li>' +
                   sectionItems; 
        }

        function getPageTitle(sectionContent) {
            var h2Pattern = />(.*?)<\/h2>/;
            var title = h2Pattern.exec(sectionContent);
            return (title ? title[1] + " - " + chapterHeadline : chapterHeadline) + " - " + self.title;
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

    var aboutPage = getPath(__dirname, "/../", "about.html");
    var render = this.render.aboutCompiler;

    fs.writeFileSync(aboutPage, render({
        title: "About",
        menu: this.html.menuLevel1,
        footer: this.html.footer,
        AnalyticsScript: this.html.analytics
    }));

    console.timeEnd(" - generateAboutPage");
};

Converter.prototype.getHeadlinePattern = function () {
    // Contain at least one newline to distinguish headline and inline content.
    return /(#{1,6})(.*?)\1[\r\n|\n]+/g;
};

Converter.prototype.getRender = function () {
    console.time(" - getRender");

    var tplLayout = "layout.jade";
    var tplIndex = "index.jade";
    var tplPage = "chapter.jade";
    var tplAbout = "about.jade";
    var tplFooter = "footer.jade";

    this.render = {
        indexCompiler: getCompiler(tplIndex, tplLayout),
        pageCompiler:  getCompiler(tplPage, tplLayout),
        aboutCompiler: getCompiler(tplAbout, tplLayout),
        footerCompiler: getCompiler(tplFooter)
    };

    console.timeEnd(" - getRender");

    function getCompiler(tpl, relativeTemplateName) {
        var templateString = fs.readFileSync(getTemplatePath(tpl), "utf-8");
        var compileOptions = relativeTemplateName ?
            {filename: getTemplatePath(relativeTemplateName)} :
            {};
        var compiler = jade.compile(templateString, compileOptions);

        return function (data) {
            return compiler(data);
        };
    }

    function getTemplatePath(template) {
        return getPath(settings.TEMPLATE_DIR, template);
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

Converter.prototype.getChaptersContent = function () {
    return this.chaptersContent;
};

Converter.prototype.isDefaultTranslation = function (translation) {
    return translation === settings.translation.defaults;
};

/**
 * TODO: Use separated language files.
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

function isFileExist(file) {
    return fs.existsSync(file);
}

function getPath() {
    return path.join.apply(path, arguments);
}

function mkdir(dir) {
    !isFileExist(dir) && fs.mkdirSync(dir);
}