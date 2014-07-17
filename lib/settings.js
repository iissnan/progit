var rootPath = __dirname + '/..';

module.exports = {
    TEMPLATE_DIR: rootPath + "/template",
    SOURCE_DIR: rootPath + "/book_src",
    DESTINATION_DIR: rootPath + "/html",

    translation: {
        defaults: "zh",
        support: ["en", "zh", "zh-tw"]
    },

    // Google Analytics ID
    googleAnalyticsID: "UA-47021013-1"
};