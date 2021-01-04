"use strict";

var importStyle = require("./dir/test_import_css.js")["default"];

console.log(importStyle);

var requireStyle = require("./dir/test_require_css.js")["default"];

console.log(requireStyle);