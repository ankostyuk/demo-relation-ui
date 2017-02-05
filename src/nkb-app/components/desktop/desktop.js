//
// @author ankostyuk
//
define(function(require, exports, module) {'use strict';

                          require('less!./styles/desktop');
    var template        = require('text!./views/desktop.html');

                          require('lodash');
    var Commons         = require('commons-utils');
    var i18n            = require('i18n');
    var raphael         = require('raphael');
    var angular         = require('angular');
    //

    var directiveName = 'app-desktop';

    //
    var transparentMask, graphElement, graphPaper;

    var DesktopSettings = {
        // Почти "магические" константы.
        // Значения высчитаны из высоты app-top-panel
        // и смещения положения нод относительно app-graph-layout.
        // TODO Автоматическое определение, исходя из DOM.
        graphDOMOffset: {
            left: 5,
            top: 46
        }
    };


    //
    return angular.module('app.desktop', [])
        //
        .run([function(){
            template = i18n.translateTemplate(template);
        }])
        //
        .directive(_.camelize(directiveName), [function(){
            return {
                restrict: 'A',
                replace: true,
                template: template,
                scope: false,
                link: function(scope, element, attrs){
                    transparentMask = element.find('[app-transparent-mask]');
                }
            };
        }])
        //
        .factory('desktopHelper', ['$log', function($log){
            var desktopHelper = {
                getGraphDOMOffset: function() {
                    return DesktopSettings.graphDOMOffset;
                },

                showTransparentMask: function() {
                    transparentMask.show();
                },

                hideTransparentMask: function() {
                    transparentMask.hide();
                }
            };

            return desktopHelper;
        }]);
    //
});
