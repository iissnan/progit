var rootPath = __dirname + '/..';

module.exports = {
    TEMPLATE_DIR: rootPath + "/template",
    SOURCE_DIR: rootPath + "/book_src",
    DESTINATION_DIR: rootPath + "/html",

    translation: {
        defaults: "zh",
        support: ["en", "zh"]
    },

    // Google Analytics ID
    gaID: "UA-47021013-1"
};