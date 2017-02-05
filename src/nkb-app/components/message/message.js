//
// @author ankostyuk
//
define(function(require, exports, module) {'use strict';

                          require('less!./styles/message');
    var template        = require('text!./views/message.html');

                          require('lodash');
    var i18n            = require('i18n');
    var angular         = require('angular');
    //

    var directiveName   = 'app-message';

    //
    return angular.module('app.message', [])
        //
        .run([function(){
            template = i18n.translateTemplate(template);
        }])
        //
        .directive(_.camelize(directiveName), ['$log', function($log){
            return {
                restrict: 'A',
                replace: true,
                template: template,
                scope: false,
                controller: ['$scope', '$element', '$attrs', '$transclude', function($scope, $element, $attrs, $transclude) {
                    $scope.message = {
                        on: false
                    };
                }]
            };
        }])
        //
        .factory('messageHelper', ['$rootScope', function($rootScope){
            var scope = $rootScope;

            function message(level, contentKey, type, callback, data) {
                scope.safeApply(function(){
                    _.extend(scope.message, {
                        on: true,
                        level: level,
                        contentKey: contentKey,
                        type: type,
                        callback: _.isFunction(callback) ? callback : angular.noop,
                        data: data
                    });
                });
            }

            return {
                message: function(contentKey, callback, data){
                    message('info', contentKey, 'closable', callback, data);
                },
                confirm: function(contentKey, callback, data){
                    message('info', contentKey, 'confirm', callback, data);
                },
                error: function(contentKey, closable, callback, data){
                    message('error', contentKey, closable ? 'closable' : '', callback, data);
                }
            };
        }]);
    //
});
