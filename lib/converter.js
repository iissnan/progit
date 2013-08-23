var fs = require("fs");
var md = require("markdown").markdown;
var jade = require("jade");

var I18N = require("./i18n.js").I18N;
var CONFIG = require("./config.js").CONFIG;

exports.Converter = Converter;

Converter.convert = function (translation) {
    return new Converter(translation);
};

/**
 * Converter Class
 *
 * @param {String} translation
 * @constructor
 */
function Converter (translation) {
    if (!translation) {
        throw new Error("Expect an translation argument.");
    }

    if (!isValidDefaultTranslation()) {
        throw new Error("Configurations for default translation are invalid.");
    }

    this.translation = translation;
    this.title = I18N.page[translation] && ["titleLabel"] ?
        I18N.page[translation]["titleLabel"] :
        I18N.page[CONFIG.defaultTranslation]["titleLabel"];
    this.init();

    function isValidDefaultTranslation () {
        var result = true;
        var dt = CONFIG.defaultTranslation;
        var source = CONFIG.SOURCE_DIR + "/" + dt;
        !dt && (result = false);
        !fs.existsSync(source) && (result = false);
        if (!I18N.menu[dt] || !I18N.page[dt] || !I18N.footer[dt]) {
            result = false;
        }
        return result;
    }
}

Converter.prototype.init = function () {
    this.source = CONFIG.SOURCE_DIR + "/" + this.translation;
    if (!fs.existsSync(this.source) || fs.readdirSync(this.source).length === 0) {
        throw new Error("Specified translation: " + this.translation + " does not exist");
    }
    this.prepare();
};

Converter.prototype.prepare = function () {
    this.destination = CONFIG.DESTINATION_DIR + "/" + this.translation;
    !fs.existsSync(this.destination) && fs.mkdirSync(this.destination);

    this.indexPage = this.translation === CONFIG.defaultTranslation ?
        "index.html" :
        "index." + this.translation + ".html";

    // Store real path of chapters.
    var self = this;
    var chapters = fs.readdirSync(this.source);
    this.chapters = chapters.map(function(chapter) {
        return self.source + "/" + chapter;
    });

    this.getTemplate();
    this.generate();
};

Converter.prototype.generate = function () {
    this.generateContents();
    this.generateChapters();
    this.generateAboutPage();
};

Converter.prototype.generateContents = function () {
    var contents = '<ul class="toc">';
    var self = this;

    for (var i = 0; i < this.chapters.length; i++) {
        var chapterRawContent = "";
        var chapter = fs.readdirSync(this.chapters[i]);
        chapter.length > 0 && (chapterRawContent = fs.readFileSync(this.chapters[i] + "/" + chapter[0]));
        if (chapterRawContent) {
            contents = contents + getChapterContents(chapterRawContent, i);
        }
    }

    contents = contents + '</ul>';

    fs.writeFileSync(__dirname + "/../" + this.indexPage, this.template.indexCompiler({
        title: this.title,
        menu: this.getMenu(1),
        content: contents,
        footer: this.getFooter()
    }));

    function getChapterContents(chapterRawContent, index) {
        var headline,
            result,
            level,
            sectionIndex = 0,
            sectionTitlePrefix;
        var html = "";
        var templateLink = jade.compile('li(class="headline#{level}"): a(href="#{href}") #{text}');
        var headlinePattern = self.getHeadlinePattern();

        // Chapters' index starts from 1.
        index = index + 1;

        while((result = headlinePattern.exec(chapterRawContent)) !== null) {
            level = result[1].length;
            headline = result[2];

            if (level < 3) {
                sectionTitlePrefix = level === 1 ? index : index + "." + sectionIndex;
                html = html + templateLink({
                    level: level,
                    href: 'html/' + self.translation + '/ch' + index + "_" + sectionIndex + '.html',
                    text: sectionTitlePrefix + "  " + headline
                });
                sectionIndex++;
            }
        }
        return html;
    }
};

Converter.prototype.generateChapters = function () {
    var self = this;

    for (var i = 0; i < this.chapters.length; i++) {
        var chapterRawContent;
        var chapter = fs.readdirSync(this.chapters[i]);
        if (chapter.length > 0) {
            chapterRawContent = fs.readFileSync(this.chapters[i] + "/" + chapter[0]);
            generatePages(chapterRawContent.toString(), i);
        }
    }

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
                menu: self.getMenu(),
                sidebar: pageSidebar,
                content: imageReplace(pageContent),
                footer: self.getFooter()
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
            return '<ul class="nav nav-tabs nav-stacked sub-nav affix">' +
                       '<li class="nav-header">' + h1 + '</li>' +
                       sectionItems +
                   '</ul>';
        }

        function getPageTitle(sectionContent) {
            var h2Pattern = />(.*?)<\/h2>/;
            var title = h2Pattern.exec(sectionContent);
            return self.title + " " + (title ? h1 + " - " + title[1] : h1);
        }

        function getPageContent(sectionContent, sectionIndex) {
            return sectionIndex === 0 ? sectionContent : "<h2" + sectionContent;
        }

        function imageReplace(text) {
            return text.replace(/Insert ([^\.]+).png/g, function (all, figure) {
                return '<img src="../../book_src/figures/' + figure + '-tn.png"></br>';
            });
        }
    }
};

Converter.prototype.generateAboutPage = function () {
    var aboutPage = __dirname + "/../" + "about.html";
    fs.writeFileSync(aboutPage, this.template.aboutCompiler({
        title: "About",
        menu: this.getMenu(1),
        footer: this.getFooter()
    }));
};

Converter.prototype.getFooter = function () {
    var self = this;

    return getLabel("footer", "buildDate") + this.getBuildDate() + getLabel("symbol", "comma") +
        getLabel("footer", "sourceRevision") + this.getBuildSourceRevision() + getLabel("symbol", "period");

    function getLabel (section, labelName) {
        return I18N[section][self.translation] && I18N[section][self.translation][labelName] ?
            I18N[section][self.translation][labelName] :
            I18N[section][CONFIG.defaultTranslation][labelName];
    }
};

Converter.prototype.getHeadlinePattern = function () {
    // Contain at least one newline to distinguish headline and inline content.
    return /(#{1,6})(.*?)\1[\r\n|\n]+/g;
};

Converter.prototype.getTemplate = function () {
    this.template = {
        layout: CONFIG.TEMPLATE_DIR + "/layout.jade",
        index: CONFIG.TEMPLATE_DIR + "/index.jade",
        page: CONFIG.TEMPLATE_DIR + "/page.jade",
        about: CONFIG.TEMPLATE_DIR + "/about.jade",
        indexCompiler: function (data) {
            var compiler = jade.compile(
                fs.readFileSync(this.index, "utf-8"),
                {filename: this.layout}
            );
            return compiler(data);
        },
        pageCompiler: function (data) {
            var compiler = jade.compile(
                fs.readFileSync(this.page, "utf-8"),
                {filename: this.layout}
            );
            return compiler(data);
        },
        aboutCompiler: function (data) {
            var compiler = jade.compile(
                fs.readFileSync(this.about, "utf-8"),
                {filename: this.layout}
            );
            return compiler(data);
        }
    };
};

Converter.prototype.getBuildDate = function () {
    var moment = require("moment");
    return moment().format("YYYY-MM-DD HH:mm:ss");
};

Converter.prototype.getBuildSourceRevision = function () {
    var sh = require("execSync");
    var command = "git submodule status";
    var output;
    var sourceRevision;
    var result = sh.exec(command);

    if (!result.code) {
        output = result.stdout.split(" ");
        if (output.length > 2) {
            sourceRevision = output[1];
            return '<a href="https://github.com/progit/progit/tree/' +
                sourceRevision + '" target="_blank">' +
                sourceRevision.substring(0, 7) + '</a>';
        }
    }

    return false;
};

Converter.prototype.getMenu = function (level) {
    var self = this;
    var itemCompiler = jade.compile(
        fs.readFileSync(CONFIG.TEMPLATE_DIR + "/menu-item.jade"),
        "utf-8"
    );
    var menuCompiler = jade.compile(
        fs.readFileSync(CONFIG.TEMPLATE_DIR + "/menu.jade"),
        "utf-8"
    );
    var menuItems = "";

    for (var i = 0; i < CONFIG.supportTranslations.length; i++) {
        var translation = CONFIG.supportTranslations[i];
        var chapters = fs.readdirSync(CONFIG.SOURCE_DIR + "/" + translation);
        chapters = chapters.map(function(chapter) {
            return CONFIG.SOURCE_DIR + "/" + translation + "/" + chapter;
        });
        menuItems = menuItems + itemCompiler({
            MenuItemLabel: getMenuItemLabel(translation),
            TransitionIndexTitle: getContentsLink(translation),
            TransitionChapterLinks: self.getHeadline(chapters, getUriPrefix(translation))
        });
    }

    return menuCompiler({
        "translations": menuItems,
        "about": getAboutLink(self.translation)
    });

    function getUriPrefix (translation) {
        return level === 1 ? "html/" + translation : (translation === self.translation ? "" : "../" + translation);
    }

    function getMenuItemLabel (translation) {
        return I18N.menu[self.translation] && I18N.menu[self.translation]["titleLabel"] ?
            I18N.menu[self.translation]["titleLabel"][translation] :
            I18N.menu[CONFIG.defaultTranslation]["titleLabel"][CONFIG.defaultTranslation];
    }

    function getContentsLink (translation) {
        var link = (level === 1 ? "": "../../") + (translation === CONFIG.defaultTranslation ?
            "index.html" :
            "index." + translation + ".html");
        var label = I18N.menu[translation] && I18N.menu[translation]["indexLabel"]  ?
            I18N.menu[translation]["indexLabel"] :
            I18N.menu["en"]["indexLabel"];
        return '<a href="' + link + '">' + label + '</a>';
    }

    function getAboutLink(translation) {
        var linkCompiler = jade.compile('a(href="#{link}") #{text}');
        var link = level === 1 ? "about.html" : "../../about.html";
        return linkCompiler({
            link: link,
            text: I18N.menu[translation] ?
                I18N.menu[translation]["aboutLabel"] :
                I18N.menu[CONFIG.defaultTranslation]["aboutLabel"]
        });
    }
};

Converter.prototype.getHeadline = function (chapters, chapterUriPrefix) {
    var chapterFiles,
        chapter,
        chapterContent,
        chapterLinks = [];
    var templateLink = jade.compile('li: a(href="#{href}") #{text}');
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
                        chapterLinks.push(templateLink({
                            href: chapterUriPrefix + 'ch' + chapterIndex + '_' + j + '.html',
                            text: chapterIndex + result[2]
                        }));
                    }
                }
            }
        }
    }

    return chapterLinks.join("");
};