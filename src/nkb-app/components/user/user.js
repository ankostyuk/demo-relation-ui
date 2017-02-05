//
// @author ankostyuk
//
define(function(require, exports, module) {'use strict';

    var angular         = require('angular');
    //

    //
    return angular.module('app.user', ['ngResource'])
        //
        .factory('userHelper', ['$q', '$window', '$resource', '$rootScope', function($q, $window, $resource, $rootScope){
            var scope = $rootScope;

            var UserResource = $resource($window._APP_CONFIG.apiUrl + '/users/me/info');

            //
            return {
                initUser: function() {
                    scope.user = UserResource.get(function(){
                        $rootScope.$emit('authenticate', scope.user);
                    });

                    return scope.user;
                },

                isAuthenticated: function() {
                    return scope.user && scope.user.userId && scope.user.userId !== 'anonymous';
                }
            };
        }]);
    //
});
