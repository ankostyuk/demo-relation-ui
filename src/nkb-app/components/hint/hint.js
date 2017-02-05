//
// @author ankostyuk
//
define(function(require, exports, module) {'use strict';

                          require('less!./styles/hint');
    var template        = require('text!./views/hint.html');

                          require('lodash');
    var Commons         = require('commons-utils');
    var i18n            = require('i18n');
    var angular         = require('angular');
    //

    var directiveName   = 'app-hint';

    //
    return angular.module('app.hint', [])
        //
        .run([function(){
            template = i18n.translateTemplate(template);
        }])
        //
        .directive(_.camelize(directiveName), ['$log', '$document', 'npExpandContentHelper', function($log, $document, npExpandContentHelper){
            return {
                restrict: 'A',
                replace: false,
                template: template,
                scope: false,
                controller: ['$scope', '$element', '$attrs', function($scope, $element, $attrs) {
                    var scope   = $scope,
                        element = $element,
                        attrs   = $attrs;

                    //
                    var settingsContent = $('[np-expand-content-uniq-class="app-report-toolbar-expand-content"]');

                    //
                    var hints       = {},
                        hintsEmpty  = true;

                    scope.hint = {
                        // TODO взять из cookie и положить в cookie
                        on: true,
                        close: function(){
                            hideHint();
                        },
                        openSettings: function(){
                            npExpandContentHelper.openContent(settingsContent, 'nkb-actions');
                        }
                    };

                    scope.$on('show-hint', function(e, hint) {
                        showHint(hint);
                    });

                    scope.$on('hide-hint', function(e, hint) {
                        hideHint(hint);
                    });

                    //
                    function showHint(hint) {
                        if (!scope.hint.on) {
                            return;
                        }

                        hints[hint] = true;

                        doState();
                    }

                    function hideHint(hint) {
                        if (hintsEmpty || (hint && !hints[hint])) {
                            return;
                        }

                        if (hint) {
                            hints[hint] = null;
                        } else {
                            _.each(hints, function(hint, key){
                                hints[key] = null;
                            });
                        }

                        doState();
                    }

                    function doState() {
                        var state = {};

                        hintsEmpty = true;

                        _.each(hints, function(hint, key){
                            state[key] = hint ? 'on' : null;
                            hintsEmpty = hint ? false : hintsEmpty;
                        });

                        state.show = hintsEmpty ? null : 'on';

                        Commons.DOMUtils.attrAsClass(element, state);
                    }

                    //
                    $document.click(function(){
                        hideHint('START');
                        hideHint('ADD_NODES_FROM_URL');
                        hideHint('ADD_NODES_FROM_GRID');
                    });
                }]
            };
        }])
        //
        .factory('hintHelper', ['$rootScope', function($rootScope){
            var scope = $rootScope;

            return {
            };
        }]);
    //
});
