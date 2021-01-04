"use strict";
Object.defineProperty(exports, "__esModule", {
  value: true
});
const tokens = {"someClass":"test_require_IFOaB"};
tokens._getCss = function () {return `/* imported from test_require.css */ .test_require_IFOaB { color: red; display: -ms-flexbox; display: flex; } `;};
tokens._module = (typeof module !== "undefined") ? module : {id:"./dir/test_require_css.js"};
exports["default"] = tokens;