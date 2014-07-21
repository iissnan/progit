var fs = require("fs");
var jade = require("jade");
var path = require('path');

var settings = require("./settings");
var SOURCE_DIR = settings.SOURCE_DIR;
var DESTINATION_DIR = settings.DESTINATION_DIR;

var cached = {};

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
        throw new Error("Configuration for default translation is invalid.");
    }

    if (!translation) {
        throw new Error("Expect an translation argument.");
    }

    console.log("\nConverting translation [" + translation + "]: ");

    this.translation = translation;
    this.init();

    console.timeEnd("Totally spends");

    function isValidDefaultTranslation () {
        var dt = settings.translation.defaults;
        var filePath = getPath(SOURCE_DIR, dt);
        return dt && isFileExist(filePath);
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

    this.localization = this.getLocalization();
    this.render = this.getRender();
    this.chaptersContent = readChaptersContent();
    this.html = getSharedHTML();
    this.siteTitle = this.localization.TITLE;
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
    }

    // Shared HTML.
    function getSharedHTML () {
        return {
            menuLevel1: getMenu(1),
            menuLevel2: getMenu(2),
            footer: getFooter(),
            analytics: getAnalytics()
        };

        function getFooter () {
            console.time(" - getFooter");

            var buildDate = self.localization.BUILD_DATE + getBuildDate();
            var buildSourceRevision = self.localization.SOURCE_REVISION + getBuildSourceRevision();
            var buildVersion = self.localization.APP_VERSION + getBuildVersion();

            console.timeEnd(" - getFooter");

            return self.render.footerCompiler({
                buildDate: buildDate,
                buildSourceRevision: buildSourceRevision,
                applicationVersion: buildVersion,
                symbolComma: self.localization.COMMA,
                symbolPeriod: self.localization.PERIOD,
                madeBy: self.localization.MADE_BY
            });

            function getBuildDate () {
                var moment = require("moment");
                return moment().format("YYYY-MM-DD HH:mm:ss");
            }

            function getBuildVersion() {
                return cached.applicationVersion ||
                    require('../package.json').version;
            }

            function getBuildSourceRevision() {
                if (cached.sourceRevisionLink) {
                    return cached.sourceRevisionLink;
                }

                var sh = require("shelljs");
                var command = "git submodule status";
                var output;
                var sourceRevision;
                var result = sh.exec(command, {async: false, silent: true});

                if (result.code === 0) {
                    output = result.output.split(" ");
                    if (output.length > 2) {
                        sourceRevision = output[1];
                        cached.sourceRevisionLink = '<a href="https://github.com/progit/progit/tree/' +
                            sourceRevision + '" target="_blank">' +
                            sourceRevision.substring(0, 7) + '</a>';
                        return cached.sourceRevisionLink;
                    }
                }

                return '';
            }
        }

        function getMenu (level) {
            console.time(" - getMenu");

            var render = jade.compile(
                fs.readFileSync(getPath(settings.TEMPLATE_DIR, "menu.jade")),
                "utf-8"
            );
            var menu = render({
                toc: getTOC(),
                supportTranslations: getAllSupportTranslation(),
                about: getAboutContext()
            });

            console.timeEnd(" - getMenu");

            return menu;

            function getTOC () {
                var tableOfContents = self.getTableOfContents();
                var links = [];

                tableOfContents.forEach(function (chapter, chapterIndex) {
                    chapter.forEach(function (section) {
                        getChapterTOC(chapterIndex, section);
                    });
                });

                return {
                    title: self.localization.TOC,
                    index: getIndexPageLink(),
                    chapters: links
                };

                function getIndexPageLink () {
                    var uriPrefix = level === 1 ? "": "../../";
                    var href = uriPrefix + (self.isDefaultTranslation(self.translation) ?
                        "index.html" :
                        "index." + self.translation + ".html"
                        );
                    return {
                        href: href,
                        text: self.localization.TOC
                    };
                }

                function getChapterTOC (chapterIndex, section) {
                    section = formatSectionHref(section);
                    if (section.level === 1) {
                        links[chapterIndex] = section;
                        links[chapterIndex].sections = links[chapterIndex].sections || [];
                    } else {
                        links[chapterIndex].sections.push(section);
                    }

                    function formatSectionHref (section) {
                        var pathPrefix = level === 1 ?
                            'html/' + self.translation + '/' :
                            '';
                        section.href = getPath(pathPrefix, section.name);
                        return section;
                    }
                }
            }

            function getAllSupportTranslation () {
                var links = [];
                settings.translation.support.forEach(function (translation) {
                    links.push({
                        text: getLanguageName(translation),
                        link: getUrlPrefix() + getIndexPageName(translation)
                    });
                });
                return {
                    title: self.localization.ALL_TRANSLATIONS,
                    links: links
                };

                function getLanguageName (translation) {
                    return self.localization.LANGUAGES[translation] ||
                        self.localization.LANGUAGES.unknown;
                }

                function getIndexPageName (translation) {
                    return self.isDefaultTranslation(translation) ?
                        "index.html" :
                        "index." + translation + ".html";
                }
            }

            function getAboutContext() {
                var link = level === 1 ? "about.html" : "../../about.html";
                return {
                    link: link,
                    text: self.localization.ABOUT
                };
            }

            function getUrlPrefix () {
                return level === 1 ? "" : "../../";
            }
        }

        function getAnalytics () {
            return {
                google: settings.googleAnalyticsID
            };
        }
    }
};

Converter.prototype.generate = function () {
    this.generateIndexPage();
    this.generateChapters();
    this.isDefaultTranslation(this.translation) && this.generateAboutPage();
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
                    name: 'ch' + index + "_" + sectionIndex + '.html',
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
        title: this.siteTitle,
        menu: this.html.menuLevel1,
        tableOfContents:  tableOfContents,
        footer: this.html.footer,
        analytics: this.html.analytics
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
                analytics: self.html.analytics
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
            return '<li class="nav-header">' +
                   '<a href="ch' + index + '_0.html">' +
                   chapterHeadline + '</a></li>' +
                   sectionItems;
        }

        function getPageTitle(sectionContent) {
            var h2Pattern = />(.*?)<\/h2>/;
            var title = h2Pattern.exec(sectionContent);
            return (title ? title[1] + ' - ' : '') +
                chapterHeadline +
                " - " + self.siteTitle;
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
        title: this.localization.ABOUT,
        menu: this.html.menuLevel1,
        footer: this.html.footer,
        analytics: this.html.analytics
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

    return {
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

Converter.prototype.getChaptersContent = function () {
    return this.chaptersContent;
};

Converter.prototype.isDefaultTranslation = function (translation) {
    translation = translation || this.translation;
    return translation === settings.translation.defaults;
};

Converter.prototype.getLocalization = function () {
    var localization = {};
    var common = require('./localization/common.js');

    try {
        localization = require('./localization/' + this.translation);
    } catch (e) {
        localization = require('./localization/en');
    }

    for (var p in common) {
        if (common.hasOwnProperty(p)) {
            localization[p] = common[p];
        }
    }

    return localization;
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