//
// @Deprecated: use rsearch
// @author ankostyuk
//
define(function(require, exports, module) {'use strict';

                          require('lodash');
    var angular         = require('angular');
    //


    //
    return angular.module('app.relations', [])
        //
        .factory('relationsHelper', ['$log', '$q', '$http', '$window', function($log, $q, $http, $window){
            var apiUrl = $window._APP_CONFIG.apiUrl;

            var SearchRelationsConfig = {
                method: 'GET',
                url: apiUrl + '/node/'
            };

            //
            var relationsHelper = {

                search: function(options) {
                    var node            = options.node,
                        nodeId          = node._id,
                        relationType    = options.relationType,
                        direction       = options.direction,
                        filter          = options.filter,
                        pageConfig      = options.pageConfig,
                        callback        = options.callback;

                    var params = _.extend({}, filter, pageConfig);

                    var canceler = $q.defer();

                    var config = _.extend({}, SearchRelationsConfig, {
                        url: SearchRelationsConfig.url + nodeId + '/' + relationType + '/' + direction,
                        params: params,
                        timeout: canceler.promise
                    });

                    var promise = $http(config);

                    promise.success(function(data, status){
                        callback(data);
                    });

                    return {
                        canceler: canceler,
                        promise: promise
                    };
                }
            };

            return relationsHelper;
        }]);
    //
});
