//
// @Deprecated: use rsearch
// @author ankostyuk
//
define(function(require, exports, module) {'use strict';

                          require('lodash');
    var angular         = require('angular');
    //


    //
    return angular.module('app.search', [])
        //
        .factory('searchHelper', ['$log', '$q', '$http', '$window', 'npResource', function($log, $q, $http, $window, npResource){
            var apiUrl = $window._APP_CONFIG.apiUrl;

            var SearchConfig = {
                method: 'GET',
                url: apiUrl + '/nodes/'
            };

            //
            var searchHelper = {

                search: function(options) {
                    var nodeType    = options.nodeType,
                        q           = options.q,
                        filter      = options.filter,
                        pageConfig  = options.pageConfig,
                        callback    = options.callback;

                    if (_.isString(q) && _.isBlank(q)) {
                        callback(null);
                        return;
                    }

                    var params = _.extend({}, filter, pageConfig, {
                        q: q
                    });

                    var canceler = $q.defer();

                    var config = _.extend({}, SearchConfig, {
                        url: SearchConfig.url + nodeType,
                        params: params,
                        timeout: canceler.promise
                    });

                    $http(config).success(function(data, status){
                        callback(data);
                    });

                    return canceler;
                },

                nodesByIds: function(options) {
                    return npResource.request({
                        method: 'POST',
                        url: apiUrl + '/nodes',
                        data: options.data
                    }, null, options);
                }
            };

            return searchHelper;
        }]);
    //
});
