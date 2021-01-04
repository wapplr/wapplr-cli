"use strict";
Object.defineProperty(exports, "__esModule", {
  value: true
});
const tokens = {"someClass":"test_import_2QHOE"};
tokens._getCss = function () {return `/* imported from test_import.css */ .test_import_2QHOE { color: black; display: -ms-flexbox; display: flex; } `;};
tokens._module = (typeof module !== "undefined") ? module : {id:"./dir/test_import_css.js"};
exports["default"] = tokens;