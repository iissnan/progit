var settings = require("./settings.js");
var convert = require("./converter.js");
var support = settings.translation.support;

support.forEach(function (translation) {
    convert(translation);
});
