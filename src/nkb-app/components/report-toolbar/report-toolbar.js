//
// @author ankostyuk
//
define(function(require, exports, module) {'use strict';

                          require('less!./styles/report-toolbar');
    var template        = require('text!./views/report-toolbar.html');

                          require('jquery');
                          require('lodash');
    var templateUtils   = require('template-utils');
    var Commons         = require('commons-utils');
    var i18n            = require('i18n');
    var angular         = require('angular');
    //

    var directiveName               = 'app-report-toolbar',
        appInfoDirectiveName        = 'app-info',
        reportActionsDirectiveName  = 'report-actions',
        myReportsDirectiveName      = 'my-reports',
        reportListDirectiveName     = 'report-list';

    var templateData, viewTemplates;

    //
    return angular.module('app.report-toolbar', [])
        //
        .run([function(){
            templateData    = templateUtils.processTemplate(template);
            viewTemplates   = templateData.templates;
        }])
        //
        .directive(_.camelize(directiveName), ['$log', 'npL10n', function($log, npL10n){
            return {
                restrict: 'A',
                replace: false,
                template: viewTemplates['app-toolbar-view'].html,
                scope: false,
                link: function(scope, element, attrs) {
                    scope.l10n = npL10n.l10n();
                }
            };
        }])
        //
        .directive(_.camelize(appInfoDirectiveName), ['$log', 'npExpandContentHelper', function($log, npExpandContentHelper){
            return {
                restrict: 'A',
                replace: false,
                template: viewTemplates['app-info-view'].html,
                scope: false,
                link: function(scope, element, attrs){
                    //
                    var closeCountCookieName    = 'nkb_relation_3_0_app_info_close_count',
                        closeLimit              = 0, // 2,
                        settingsContent         = $('[np-expand-content-uniq-class="app-report-toolbar-expand-content"]');

                    settingsContent
                        .on('content-open', function(e, content){
                            hide();
                        });


                    scope.appInfo = {
                        close: function(byUser){
                            hide(byUser);
                        },
                        openSettings: function(){
                            // TODO объеденить с кодом hint.openSettings, вынести отдельно, через event.
                            npExpandContentHelper.openContent(settingsContent, 'nkb-actions');
                        }
                    };

                    if (hasShow()) {
                        element.show();
                    }

                    function hide(byUser) {
                        if (byUser) {
                            storeCloseCount();
                        }

                        element.hide();
                    }

                    function hasShow() {
                        return getCloseCount() < closeLimit;
                    }

                    function getCloseCount() {
                        return parseInt($.cookie(closeCountCookieName)) || 0;
                    }

                    function storeCloseCount() {
                        var count = getCloseCount();

                        count++;

                        $.cookie(closeCountCookieName, count, {
                            path: '/',
                            expires: 365 * 10
                        });
                    }
                }
            };
        }])
        //
        .directive(_.camelize(reportActionsDirectiveName), ['$log', '$document', '$timeout', 'reportHelper', 'npExpandContentHelper', 'keyboardHelper', function($log, $document, $timeout, reportHelper, npExpandContentHelper, keyboardHelper){
            return {
                restrict: 'C',
                link: function(scope, element, attrs){
                    element//
                        .delegate('.action.report-save', 'click', function(e){
                            saveReport();
                        })
                        .delegate('.content.new-report-name', 'content-open', function(){
                            $(this).find('input').focus();
                            return false;
                        })
                        .delegate('.content.report-rename', 'content-open', function(){
                            $(this).find('input').focus().select();
                            return false;
                        })
                        .delegate('.content.report-comment', 'content-open', function(){
                            $(this).find('textarea').focus();
                            return false;
                        })
                        .delegate('.content.report-share', 'content-open', function(){
                            $(this).find('.action.report-share').focus();
                            return false;
                        })
                        .delegate('.content.report-export', 'content-open', function(){
                            $(this).find('.action.report-export').focus();
                            return false;
                        })
                        .delegate('.content.report-delete', 'content-open', function(){
                            $(this).find('.action.report-delete').focus();
                            return false;
                        })
                        .delegate('.content.report-copy', 'content-open', function(){
                            $(this).find('input').focus().select();
                            return false;
                        })
                        .delegate('.action.report-rename', 'click', function(){
                            partialUpdateReportByKey('name');
                        })
                        .delegate('.action.report-comment', 'click', function(){
                            partialUpdateReportByKey('comment');
                        })
                        .delegate('.action.report-share', 'change', function(){
                            reportHelper.partialUpdateReportByData({
                                shared: $(this).is(':checked')
                            }, scope.report);
                        })
                        .delegate('.content.report-share textarea', 'focus click', function(){
                            Commons.DOMUtils.selectOnClick($(this));
                        })
                        .delegate('.action.report-delete', 'click', function(){
                            reportHelper.deleteReport(scope.report, function(){
                                createNewReport();
                            });
                        })
                        .delegate('.action.report-copy', 'click', function(){
                            copyReport();
                        })
                        .delegate('.action.create-new-report', 'click', function(){
                            createNewReport();
                        });

                    //
                    keyboardHelper.shortcut({
                        element: $document,
                        key: 'ctrl+s',
                        callback: function(){
                            $timeout(function(){
                                if (reportHelper.isNewReport()) {
                                    npExpandContentHelper.openContent(element, 'new-report-name');
                                } else {
                                    saveReport();
                                }
                            });
                        }
                    });

                    keyboardHelper.shortcut({
                        element: element.find('.new-report-name input'),
                        key: 'enter',
                        callback: function(){
                            saveReport();
                        }
                    });

                    keyboardHelper.shortcut({
                        element: element.find('.report-rename input'),
                        key: 'enter',
                        callback: function(){
                            partialUpdateReportByKey('name');
                        }
                    });

                    keyboardHelper.shortcut({
                        element: element.find('.report-copy input'),
                        key: 'enter',
                        callback: function(){
                            copyReport();
                        }
                    });

                    //
                    function saveReport() {
                        reportHelper.saveReport(reportHelper.isNewReport() ? function(report){
                            npExpandContentHelper.closeContent(element);
                        } : angular.noop);
                    }

                    function partialUpdateReportByKey(key) {
                        reportHelper.partialUpdateReportByKey(key, scope.report, scope.reportUpdated, scope.reportForm);
                    }

                    function copyReport() {
                        reportHelper.copyReport(function(hasError){
                            if (hasError) {
                                return;
                            }
                            npExpandContentHelper.closeAll();
                        });
                    }

                    function createNewReport() {
                        reportHelper.checkReportModified('report.modified.new-report', function(confirmed){
                            if (confirmed) {
                                npExpandContentHelper.closeAll();
                                reportHelper.createNewReport();
                            }
                        });
                    }
                }
            };
        }])
        //
        .directive(_.camelize(myReportsDirectiveName), ['$log', '$timeout', 'reportHelper', 'npExpandContentHelper', 'keyboardHelper', function($log, $timeout, reportHelper, npExpandContentHelper, keyboardHelper){
            return {
                restrict: 'C',
                controller: ['$scope', '$element', '$attrs', function($scope, $element, $attrs) {
                    var scope   = $scope,
                        element = $element,
                        attrs   = $attrs;

                    //
                    var reports         = [],
                        searchTimeout   = 25;

                    //
                    element
                        .on('content-open', function(e, content){
                            if (element.is(e.target)) {
                                updateReports();
                            }
                        });

                    // ? TODO ui.scroll при сворачивании/разворачивании эламента списка отчетов: scope.$broadcast('update.items', function(scope){});

                    element.find('[np-inline-input].search')
                        .on('np-inline-input-status', function(e, status){
                            scope.safeApply(function(){
                                scope.myReports.searchOn = status.show;
                                if (!_.isBlank(scope.myReports.searchText)) {
                                    refresh();
                                }
                            });
                        });

                    //
                    scope.myReports = {
                        reportsAvailable: true,
                        reportsBySearchAvailable: true,
                        watchTrigger: null,
                        searchText: '',
                        searchOn: false
                    };

                    scope.$watch('myReports.searchText', function(newValue, oldValue) {
                        $timeout(function(){
                            refresh();
                        }, searchTimeout);
                    });

                    scope.myReportDataSource = {
                        get: function(index, count, success) {
                            var reportsBySearch = getReportsBySearch(),
                                size            = reportsBySearch.length,
                                first           = index - 1,
                                last            = first + count,
                                res             = reportsBySearch.slice(first > 0 ? first : 0, last < size ? last : size);

                            scope.myReports.reportsBySearchAvailable = size > 0;

                            success(res);
                        },

                        revision: function() {
                            return scope.myReports.watchTrigger;
                        }
                    };

                    //
                    function refresh() {
                        scope.myReports.watchTrigger = !scope.myReports.watchTrigger;
                    }

                    function checkReportsAvailable() {
                        scope.myReports.reportsAvailable = reports.length > 0;
                        return scope.myReports.reportsAvailable;
                    }

                    function updateReports() {
                        scope.safeApply(function(){
                            reports = reportHelper.ReportResource.list();
                            reports.$promise.then(function(){
                                //_.each(reports, function(r, i){
                                //    r.name = '' + (i + 1);
                                //});

                                checkReportsAvailable();

                                refresh();
                            });
                        });
                    }

                    function getReportsBySearch() {
                        if (!scope.myReports.searchOn) {
                            return reports;
                        }

                        var query = scope.myReports.searchText;

                        if (_.isBlank(query)) {
                            return reports;
                        }

                        var queryWords = _.words(query.toLowerCase());

                        return _.filter(reports, function(report){
                            var words = _.words((report.name || '').toLowerCase());
                            return Commons.StringUtils.findByWords(words, queryWords);
                        });
                    }

                    function removeReport(report) {
                        reports = reportHelper.rejectReports(reports, report);

                        checkReportsAvailable();

                        scope.$broadcast('delete.items', function(s) {
                            return s.r && s.r.id === report.id;
                        });
                    }

                    //
                    // report actions
                    //
                    element//
                        .delegate('.content.report-rename', 'content-open', function(){
                            $(this).find('input').focus().select();
                            return false;
                        })
                        .delegate('.content.report-comment', 'content-open', function(){
                            $(this).find('textarea').focus();
                            return false;
                        })
                        .delegate('.content.report-share', 'content-open', function(){
                            $(this).find('.action.report-share').focus();
                            return false;
                        })
                        .delegate('.content.report-delete', 'content-open', function(){
                            $(this).find('.action.report-delete').focus();
                            return false;
                        })
                        .delegate('.report-rename input', 'keydown', function(e){
                            if (e.keyCode === 13) {
                                e.preventDefault();
                                partialUpdateReportByKey(reportItemScope(this), 'name');
                            }
                        })
                        .delegate('.action.report-rename', 'click', function(){
                            partialUpdateReportByKey(reportItemScope(this), 'name');
                        })
                        .delegate('.action.report-comment', 'click', function(){
                            partialUpdateReportByKey(reportItemScope(this), 'comment');
                        })
                        .delegate('.action.report-share', 'change', function(){
                            reportHelper.partialUpdateReportByData({
                                shared: $(this).is(':checked')
                            }, reportItemScope(this).r);
                        })
                        .delegate('.content.report-share textarea', 'focus click', function(){
                            Commons.DOMUtils.selectOnClick($(this));
                        })
                        .delegate('.action.report-delete', 'click', function(){
                            reportHelper.deleteReport(reportItemScope(this).r, function(r){
                                removeReport(r);
                            });
                        })
                        .delegate('.action.report-open', 'click', function(){
                            openReport(reportItemScope(this).r);
                        });

                    function reportItemScope(element) {
                        return angular.element(element).scope();
                    }

                    function partialUpdateReportByKey(reportItemScope, key) {
                        reportHelper.partialUpdateReportByKey(key, reportItemScope.r, reportItemScope.rUpdated, reportItemScope.rForm);
                    }

                    function openReport(r) {
                        reportHelper.checkReportModified('report.modified.open-report', function(confirmed){
                            if (confirmed) {
                                npExpandContentHelper.closeAll();
                                reportHelper.openReport(r.id);
                            }
                        });
                    }
                }]
            };
        }]);
    //
});
