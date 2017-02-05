//
// @author ankostyuk
//
define(function(require, exports, module) {'use strict';

                          require('lodash');

    var Commons         = require('commons-utils'),
        purl            = require('purl'),
        angular         = require('angular'),
        npl10n          = require('np.l10n');
    //

    //
    var ReportSettings = {
        reportShareKeyParam: 'report.sharekey'
    };

    //
    return angular.module('app.report', ['ngResource'])
        //
        .factory('reportResource', ['$window', '$resource', function($window, $resource){
            var apiUrl = $window._APP_CONFIG.apiUrl;

            var Report = $resource(apiUrl + '/report/:id', {
                    id: '@id'
                }, {
                    'create': {
                        method: 'POST'
                    },
                    'read': {
                        method: 'GET'
                    },
                    'readShared': {
                        url: apiUrl + '/report/shared/:sharekey',
                        method: 'GET',
                        _source: 'report.shared'
                    },
                    'update': {
                        url: apiUrl + '/report',
                        method: 'PUT'
                    },
                    'delete': {
                        method: 'DELETE'
                    },
                    'list': {
                        url: apiUrl + '/reports',
                        method: 'GET',
                        isArray: true
                    }
                });

            Report['partialUpdate'] = function(report, data, callback){
                var d = _.extend(data, {
                    id: report.id
                });

                Report.update({}, d, function(result){
                    _.extend(report, _.pick(result, _.keys(data)));
                    if (_.isFunction(callback)) {
                        callback(report);
                    }
                });
            };

            return {
                Report: Report
            };
        }])
        //
        .factory('reportHelper', ['$log', '$q', '$rootScope', '$window', 'metaHelper', 'reportResource', 'messageHelper', 'graphHelper', 'l10nMessages', function($log, $q, $rootScope, $window, metaHelper, reportResource, messageHelper, graphHelper, l10nMessages){
            var scope = $rootScope;

            //
            var reportChanged = false;

            scope.$on('graph-object-drag-start', onReportChange);
            scope.$on('graph-history', onReportChange);
            scope.$on('object-property', onReportChange);
            scope.$on('object-theme', onReportChange);
            scope.$on('object-toggle-expand', onReportChange);
            scope.$on('object-toggle-hold-zoom', onReportChange);
            scope.$on('line-style', onReportChange);
            scope.$on('link-nodes', onReportChange);
            scope.$on('create-user-object', onReportChange);
            scope.$on('update-user-object', onReportChange);
            scope.$on('create-user-relation', onReportChange);
            scope.$on('update-user-relation', onReportChange);
            scope.$on('delete-user-relation', onReportChange);
            scope.$on('add-relations', onReportChange);
            scope.$on('delete-nodes', onReportChange);
            scope.$on('graph-zoom', onReportChange);

            //
            scope.$on('object-open-on-new-report', function(e, node){
                var nodeType        = node._type,
                    nodeTypeMeta    = metaHelper.getNodeType(nodeType),
                    idField         = nodeTypeMeta.idField,
                    idValue         = node[idField];

                var params = {
                    'node.type': nodeType
                };
                params[idField + '.equals'] = idValue;

                reportHelper.openNewReport(params);
            });

            //
            function buildReportCopyName(report) {
                return report.name + l10nMessages.report['copy.name.suffix'];
            }

            function onReportChange() {
                scope.safeApply(function(){
                    reportChanged = true;
                });
            }

            function openReport(report, callback) {
                scope.report = report;
                scope.tmp.report.copyName = buildReportCopyName(report);
                scope.reportUpdated = {
                    name: report.name,
                    comment: report.comment
                };

                graphHelper.doReport(report, function(report){
                    if (_.isFunction(callback)) {
                        callback(report);
                    }
                    scope.$emit('open-report');
                });
            }

            //
            var reportHelper = {
                ReportSettings: ReportSettings,

                createNewReport: function(){
                    scope.safeApply(function(){
                        reportChanged = false;
                        graphHelper.clear();

                        var report = new reportResource.Report({
                            name: l10nMessages.report['new.name'],
                            nodes: []
                        });

                        //
                        scope.report = report;
                        scope.tmp.report.copyName = null;
                        scope.reportUpdated = {};

                        // TODO Отрефакторить
                        var reportExportSettings = {
                            formats: [
                                {text: l10nMessages.report['export.image'], 'name': 'png' },
                                {text: l10nMessages.report['export.pdf'],   'name': 'pdf' },
                                {text: l10nMessages.report['export.word'],  'name': 'docx'}
                            ],
                            pageSize:  {
                                'PDF':[
                                    {text: 'A4', 'name': 'A4' },
                                    {text: 'A3', 'name': 'A3' },
                                    {text: 'A2', 'name': 'A2' },
                                    {text: 'A1', 'name': 'A1' }
                                ],
                                'Word':[
                                    {text: 'A4', 'name': 'A4' },
                                    {text: 'A3', 'name': 'A3' }
                                ]
                            },
                            current: {
                                format:    'png',
                                scale:     100,
                                pageSize:  'A4',
                                cutDown:   false
                            },
                            exportDataKeys: {
                                'png': ['format', 'scale'],
                                'pdf': ['format', 'pageSize', 'cutDown'],
                                'docx': ['format', 'pageSize', 'cutDown']
                            },
                            getExportData: function(){
                                var current = _.extend({}, reportExportSettings.current, {
                                    scale: reportExportSettings.current.scale / 100
                                });
                                return _.pick(current, reportExportSettings.exportDataKeys[reportExportSettings.current.format]);
                            }
                        };
                        scope.reportExportSettings = reportExportSettings;

                        //
                        scope.$emit('new-report');
                    });
                },

                openNewReport: function(params) {
                    var url     = purl(),
                        openUrl = url.attr('path') + (_.isEmpty(params) ? '' : '?' + $.param(params));

                    $window.open(openUrl, '_blank');
                },

                openReport: function(reportId, callback){
                    scope.longOperation(
                        function(){
                            reportChanged = false;
                            graphHelper.clear();
                        },
                        function(done){
                            var report = reportResource.Report.read({
                                id: reportId
                            });

                            report.$promise.then(function(){
                                openReport(report, function(){
                                    if (_.isFunction(callback)) {
                                        callback(report);
                                    }
                                    done();
                                });
                            });
                        }
                    );
                },

                openSharedReport: function(){
                    var deferred        = $q.defer(),
                        locationSearch  = purl().param(),
                        sharekey        = locationSearch['report.sharekey'];

                    if (sharekey) {
                        var report = reportResource.Report.readShared({
                            sharekey: sharekey
                        });

                        report.$promise.then(
                            function(){
                                if (report.userId !== scope.user.userId) {
                                    report.id = null;
                                }
                                openReport(report, function(){
                                    deferred.resolve();
                                });
                            },
                            function(){
                                deferred.resolve();
                            }
                        );
                    } else {
                        deferred.resolve();
                    }

                    return deferred.promise;
                },

                saveReport: function(callback){
                    var report = scope.report;

                    if (!reportHelper.isNewReport() && !reportHelper.isReportChanged()) {
                        callback(report);
                        return;
                    }

                    scope.longOperation(null,
                        function(done){
                            graphHelper.fillReport(report);

                            //
                            report['style'] = {
                                zoomIndex: graphHelper.getZoom().index
                            };

                            scope.safeApply(function(){
                                if (reportHelper.isNewReport()) {
                                    if (scope.tmp.report.name) {
                                        report.name = scope.tmp.report.name;

                                        report.$create().then(function(){
                                            scope.tmp.report.name = null;
                                            scope.tmp.report.copyName = buildReportCopyName(report);
                                            scope.reportUpdated = {
                                                name: report.name,
                                                comment: report.comment
                                            };
                                            complete();
                                        });
                                    }
                                } else {
                                    report.$update().then(function(){
                                        complete();
                                    });
                                }
                            });

                            function complete() {
                                reportChanged = false;
                                callback(report);
                                done();
                            }
                        }
                    );
                },

                deleteReport: function(report, callback){
                    scope.safeApply(function(){
                        report.$delete().then(function(){
                            if (_.isFunction(callback)) {
                                callback(report);
                            }
                        });
                    });
                },

                checkPartialUpdateReportByKey: function(key, report, updated, form){
                    if (form[key].$invalid) {
                        return false;
                    }

                    if (updated[key] === report[key]) {
                        return false;
                    }

                    return true;
                },

                partialUpdateReportByKey: function(key, report, updated, form){
                    if (!reportHelper.checkPartialUpdateReportByKey(key, report, updated, form)) {
                        return;
                    }

                    var data = _.pick(updated, key);

                    scope.safeApply(function(){
                        reportResource.Report.partialUpdate(report, data, function(){
                            _.extend(updated, _.pick(report, key));
                        });
                    });
                },

                partialUpdateReportByData: function(data, report){
                    scope.safeApply(function(){
                        reportResource.Report.partialUpdate(report, data);
                    });
                },


                isReportUpdated: function(){
                    var res = false;
                    $.each(scope.reportUpdated, function(k, v){
                        if (v && v !== scope.report[k]) {
                            res = true;
                            return false;
                        }
                    });
                    return res;
                },

                isReportChanged: function(){
                    return reportChanged;
                },

                isNewReport: function(){
                    var report = scope.report;

                    if (!report) {
                        return null;
                    }

                    return !report.id;
                },

                buildReportShareUrl: function(shareKey) {
                    var shareUrl = Commons.HTTPUtils.getPageBaseUrl() + '?' + ReportSettings.reportShareKeyParam + '=' + shareKey;
                    return npl10n.urlWithLang(shareUrl, npl10n.getLang());
                },

                findReportById: function(reports, id){
                    return _.find(reports, function(report){
                        return report.id === id;
                    });
                },

                rejectReports: function(reports, rejectedReport){
                    return _.reject(reports, function(report){
                        return report.id === rejectedReport.id;
                    });
                },

                checkReportModified: function(key, callback){
                    if (reportHelper.isReportChanged()) {
                        messageHelper.confirm(key, callback);
                    } else {
                        callback(true);
                    }
                },

                exportReport: function(){
                    var exportData = scope.reportExportSettings.getExportData();

                    scope.longOperation(null, function(done){
                        reportHelper.saveReport(function(){
                            $.fileDownload($window._APP_CONFIG.apiUrl + '/export/' + exportData.format + '/' + exportReportName(scope.report.name) + '.' + exportData.format, {
                                httpMethod : 'POST',
                                data: _.extend({
                                    renderer: 'external',
                                    reportId: scope.report.id,
                                    width: 1,
                                    height: 1,
                                    reportHTML: '<html></html>',
                                    lang: npl10n.getLang(),
                                    ui: '3.0'
                                }, exportData),
                                encodeHTMLEntities: false,
                                failCallback: function(responseText){
                                    done();
                                    messageHelper.error('file.download.fail', true);
                                },
                                successCallback: function(){
                                    done();
                                }
                            });
                        });
                    });

                    function exportReportName(reportName) {
                        return reportName.replace(/[/\\:#]/gim, '-');
                    }
                },

                copyReport: function(callback){
                    var copyName = scope.tmp.report.copyName;

                    if (_.isBlank(copyName)) {
                        callback(true);
                        return;
                    }

                    scope.longOperation(null, function(done){
                        reportHelper.saveReport(function(report){
                            scope.tmp.report.name = copyName;

                            scope.report = new reportResource.Report(_.pick(report, [
                                'comment'
                            ]));

                            reportHelper.saveReport(function(){
                                done();
                                callback(false);
                            });
                        });
                    });
                },

                ReportResource: reportResource.Report
            };

            return reportHelper;
        }]);
    //
});
