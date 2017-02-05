//
// @author ankostyuk
//
define(function(require, exports, module) {'use strict';

                          require('lodash');
                          require('atmosphere');
    var angular         = require('angular');
    //

    //
    return angular.module('app.data-update', [])
        //
        .factory('dataUpdateHelper', ['$log', '$q', '$http', '$window', '$rootScope', 'atmosphereDataUpdater', 'nodeHelper', function($log, $q, $http, $window, $rootScope, atmosphereDataUpdater, nodeHelper){
            //
            var apiUrl              = $window._APP_CONFIG.apiUrl,
                EGRUL_DATA_SOURCE   = ['egrul', 'egrul_individual_founder', 'egrul_individual_executive'],
                EGRUL_DATA_UPDATE   = {};

            //
            $rootScope.$on('authenticate', function(e, user){
                atmosphereDataUpdater.reset(user.userId);
            });

            $rootScope.$on('graph-change-node-set', function(e, nodes, linkNodes){
                atmosphereDataUpdater.pushState({
                    nodes: nodes,
                    linkNodes: linkNodes
                });
            });

            $rootScope.$on('do-egrul-data-update', function(e, node){
                doEgrulDataUpdate(node);
            });

            $rootScope.$on('data-update', function(e, data){
                $rootScope.safeApply(function(){
                    if (_.contains(EGRUL_DATA_SOURCE, data.source)) {
                        onEgrulDataUpdate(data);
                    }
                });
            });

            function doEgrulDataUpdate(node) {
                if (dataUpdateHelper.isEgrulUpdateEnabled(node)) {
                    EGRUL_DATA_UPDATE[node.__uid] = {
                        node: node,
                        status: 'PENDING'
                    };

                    dataUpdateHelper.purchaseEgrul(node);

                    $rootScope.$emit('notification', node._type + '_EGRUL_PENDING', {
                        node: node
                    });
                }
            }

            function onEgrulDataUpdate(data) {
                var holder          = data.holder,
                    holderNodeUID   = nodeHelper.buildNodeUIDByType(holder._id, holder._type),
                    holderNodeInfo  = EGRUL_DATA_UPDATE[holderNodeUID];

                if (holderNodeInfo) {
                    holderNodeInfo.status = 'DONE';

                    $rootScope.$emit('notification', 'DATA_UPDATE_' + data.source, {
                        node: holderNodeInfo.node,
                        type: data.type
                    });
                }
            }

            //
            var dataUpdateHelper = {
                getEgrulUpdateStatus: function(node){
                    var info = EGRUL_DATA_UPDATE[node.__uid];

                    if (!info) {
                        return 'UNKNOWN';
                    }

                    return info.status;
                },

                doEgrulDataUpdate: doEgrulDataUpdate,

                canEgrulUpdate: function(node){
                    return node && node.subtype !== 'foreign';
                },

                isEgrulUpdateEnabled: function(node){
                    var updated = dataUpdateHelper.getEgrulUpdatedDate(node);

                    // один раз за "сегодня"
                    if (updated) {
                        var d1 = new Date(),
                            d2 = new Date(updated);

                        if (d1.getFullYear() === d2.getFullYear() &&
                            d1.getMonth() === d2.getMonth() &&
                            d1.getDate() === d2.getDate()) {
                            return false;
                        }
                    }

                    var status = dataUpdateHelper.getEgrulUpdateStatus(node);

                    return status !== 'PENDING';
                },

                getEgrulUpdatedDate: function(node){
                    if (!node || !node._info || !node._info.updates) {
                        return null;
                    }
                    var updates = node._info.updates;
                    return (updates.egrul ||
                            updates.egrul_individual_founder ||
                            updates.egrul_individual_executive);
                },

                purchaseCompanyEgrul: function(node){
                    return $http({
                        method: 'POST',
                        url: apiUrl + '/product/egrulCompanyReport/purchase',
                        data: {
                            'companyName': node['namesort'],
                            'ogrn': node['ogrn']
                        }
                    });
                },

                purchaseIndividualEgrul: function(node){
                    var p1 = $http({
                        method: 'POST',
                        url: apiUrl + '/product/egrulFounderPersonReport/purchase',
                        data: {
                            'name': node['name']
                        }
                    });

                    var p2 = $http({
                        method: 'POST',
                        url: apiUrl + '/product/egrulChiefReport/purchase',
                        data: {
                            'name': node['name']
                        }
                    });

                    return $q.all([p1, p2]);
                },

                purchaseEgrul: function(node){
                    if (node._type === 'COMPANY') {
                        return dataUpdateHelper.purchaseCompanyEgrul(node);
                    }

                    if (node._type === 'INDIVIDUAL') {
                        return dataUpdateHelper.purchaseIndividualEgrul(node);
                    }
                }
            };

            return dataUpdateHelper;
        }])
        .factory('atmosphereDataUpdater', ['$log', '$window', '$rootScope', function($log, $window, $rootScope){
            //
            var apiUrl      = $window._APP_CONFIG.apiUrl,
                atmosphere  = $window.atmosphere,
                subSocket   = null;

            //
            var atmosphereDataUpdater = {
                reset: function(subscribe) {
                    atmosphere.unsubscribe();

                    if (subscribe) {
                        subSocket = atmosphere.subscribe({
                            url: apiUrl + '/push/report/update',
                            contentType : 'application/json',
                            transport : 'long-polling',
                            fallbackTransport: 'long-polling',
                            onMessage: function(response){
                                try {
                                    var data = angular.fromJson(response.responseBody);
                                    $rootScope.$emit('data-update', data);
                                } catch(e) {
                                    $log.warn('AtmosphereDataUpdater: fail JSON: ', response.responseBody);
                                }
                            }
                        });
                    }
                },

                pushState: function(data) {
                    if (!subSocket) {
                        return;
                    }

                    var nodes = new Array(_.size(data.nodes));

                    _.each(data.nodes, function(node, i){
                        nodes[i] = {
                            'id': node._id,
                            'type': node._type
                        };
                    });

                    subSocket.push(angular.toJson({
                        nodes: nodes
                    }));
                }
            };

            return atmosphereDataUpdater;
        }])
        //
        .directive('companyEgrulListView', ['$log', '$window', 'egrulHelper', function($log, $window, egrulHelper){
            return {
                restrict: 'A',
                replace: false,
                scope: {
                    node: '=companyEgrulListView'
                },
                template: viewTemplates['company-egrul-list-view'].html,
                controller: ['$scope', '$element', '$attrs', function($scope, $element, $attrs) {
                    var scope   = $scope,
                        element = $element,
                        attrs   = $attrs;

                    //
                    var canceler;

                    getList();

                    function getList() {
                        if (canceler) {
                            canceler.resolve();
                        }

                        var request = egrulHelper.getCompanyEgrulList({
                            node: scope.node,
                            callback: function(data){
                                if (_.has(data, 'error')) {
                                    scope.egrulList = [];
                                    return;
                                }

                                _.each(data, function(egrul, key){
                                    egrul['_link']          = $window._APP_CONFIG['nkb.file.download.template'].replace('FILE_ID_VALUE', key);
                                    egrul['_downloadName']  = egrul.ogrn + '.' + egrul.fileFormat;
                                });

                                scope.egrulList = _.sortBy(_.toArray(data), function(egrul){
                                    return -(egrul.fileDate);
                                });
                            }
                        });

                        canceler = request.canceler;
                    }
                }]
            };
        }])
        //
        .factory('egrulHelper', ['$log', '$q', '$http', '$window', function($log, $q, $http, $window){
            //
            var egrulHelper = {
                getCompanyEgrulList: function(options) {
                    var node        = options.node,
                        callback    = options.callback;

                    var canceler = $q.defer();

                    var promise = $http({
//                        method: 'GET',
//                        url: '/nkbrelation/static/test/egrul-list.json',
                        method: 'POST',
                        url: $window._APP_CONFIG['egrul.list.url'],
                        headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
                        data: 'json=' + angular.toJson({
                            'inn': node.inn,
                            'ogrn': node.ogrn
                        }),
                        timeout: canceler.promise
                    });

                    promise.success(function(data, status){
                        data = data['serviceError'] ? [] : data;
                        callback(data);
                    });

                    return {
                        canceler: canceler,
                        promise: promise
                    };
                }
            };

            return egrulHelper;
        }])
        //
        .filter('egrulUpdatedDate', ['$filter', 'dataUpdateHelper', 'l10nMessages', function($filter, dataUpdateHelper, l10nMessages){
            return function(node, format){
                var updated = dataUpdateHelper.getEgrulUpdatedDate(node);

                if (!updated) {
                    return null;
                }

                var message = l10nMessages.dataUpdate['UPDATED_TIME'],
                    date    = $filter('amDateFormat')(updated, format);

                return message + ' ' + date;
            };
        }]);
    //
});
