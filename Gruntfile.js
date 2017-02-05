//
var _       = require("lodash"),
    path    = require('path'),
    webapp  = require('nullpointer-web-app');

//
module.exports = function(grunt) {
    webapp.setBuildMeta({
        appId: 'relation-ui',
        APP_BUILD_TYPE: 'production',
        cwd: __dirname,
        name: 'nkb-app',
        rootpath: '/relation-ui/'
    });

    var gruntConfig = webapp.getDefaultGruntConfig(),
        buildMeta   = webapp.getBuildMeta();

    // extend copy
    _.set(gruntConfig, 'copy.dist.options.noProcess', '**/*.{ico,properties,js,gif}');

    webapp.initGrunt(grunt, gruntConfig);
};
