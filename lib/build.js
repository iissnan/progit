var settings = require("./settings.js");
var Converter = require("./converter.js");
var support = settings.translation.support;

support.forEach(function (translation) {
    Converter.convert(translation);
});
