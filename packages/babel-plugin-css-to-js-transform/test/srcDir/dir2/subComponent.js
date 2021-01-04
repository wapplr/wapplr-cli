import importStyle from "../dir/test_import.css"
console.log(importStyle);

const requireStyle = require("../dir/test_require.css");
console.log(requireStyle);

const requireStyleAgain = require("../dir/test_require.css");
console.log(requireStyleAgain);

const requireStyleAgain2 = require("../../srcDir/dir/test_require.css");
console.log(requireStyleAgain2);
