//
// @author ankostyuk
//
define(function(require, exports, module) {'use strict';

                          require('lodash');
                          require('session');
    var Commons         = require('commons-utils');
    var purl            = require('purl');
    var angular         = require('angular');
                          require('angular-ui-utils-keypress');
                          require('angular-ui-utils-scroll');
    //

    //
    return angular.module('app.utils', ['ui.keypress', 'ui.scroll'])
        //
        .factory('appUtils', ['$log', '$rootScope', '$timeout', '$window', 'appConfig', function($log, $rootScope, $timeout, $window, appConfig){
            var scope = $rootScope;

            scope.errorUtils = {
                isFatalError: function(errorKey) {
                    return _.contains(appConfig.FATAL_ERROR_KEYS, errorKey);
                },

                isHttpResponseErrorIgnoreUrl: function(url) {
                    return !!_.find(appConfig.HTTP_RESPONSE_ERROR_IGNORE_URL, function(ignoreUrl){
                        return _.contains(url, ignoreUrl);
                    });
                }
            };

            // scope utils
            _.extend(scope, {
                safeApply: function(fn){
                    var phase = this.$root.$$phase;

                    if (phase == '$apply' || phase == '$digest') {
                        this.$eval(fn);
                    } else {
                        this.$apply(fn);
                    }
                },
                setElementState: function(element, object, propName, value, targetScope, callback) {
                    if (value) {
                        element.addClass(propName);
                    } else {
                        element.removeClass(propName);
                    }

                    if (targetScope) {
                        targetScope.safeApply(function(){
                            apply();
                        });
                    } else {
                        apply();
                    }

                    function apply(){
                        object[propName] = value;
                        if (_.isFunction(callback)) {
                            callback(object[propName]);
                        }
                    }
                },
                toggleElementState: function(element, object, propName, targetScope, callback) {
                    if (object[propName]) {
                        element.removeClass(propName);
                    } else {
                        element.addClass(propName);
                    }

                    if (targetScope) {
                        targetScope.safeApply(function(){
                            apply();
                        });
                    } else {
                        apply();
                    }

                    function apply(){
                        object[propName] = !object[propName];
                        if (_.isFunction(callback)) {
                            callback(object[propName]);
                        }
                    }
                }
            });

            // app
            scope.setAppBusy = function(busy){
                scope.safeApply(function(){
                    _.extend(scope.app, {
                        isBusy: busy
                    });
                });
            };

            // Длительная операция
            var longOperationPromise    = null,
                longOperationDelay      = 500;

            scope.longOperation = function(before, operation){
                scope.setAppBusy(true);

                if (longOperationPromise) {
                    $timeout.cancel(longOperationPromise);
                }

                if (_.isFunction(before)) {
                    scope.safeApply(function(){
                        before();
                    });
                }

                longOperationPromise = $timeout(function(){
                    scope.safeApply(function(){
                        operation(done);
                    });
                }, longOperationDelay);

                function done() {
                    scope.setAppBusy(false);
                }
            };

            scope.$on('exception', function(){
                scope.setAppBusy(false);
            });

            // Переход в старую версию
            scope.$on('do-open-old-version', function(){
                var url         = purl(),
                    search      = url.data.attr.query,
                    urlSegment  = url.segment(),
                    openUrl     = '/' + urlSegment.join('/') + '/2.0' + (search ? '?' + search : '');

                $window.open(openUrl, '_blank');
            });

            // module API
            return {
                errorUtils: scope.errorUtils,
                setAppBusy: scope.setAppBusy
            };
        }])
        //
        // keypressHelper: http://angular-ui.github.io/ui-utils/#/keypress
        .factory('keyboardHelper', ['$log', '$rootScope', '$window', 'keypressHelper', function($log, $rootScope, $window, keypressHelper){
            var scope       = $rootScope,
                keyboard    = {};

            scope.keyboard = keyboard;

            var shortcutDefault = {
                element: null,
                key: '',
                preventDefault: true,
                stopPropagation: false,
                //mode: 'keydown',  // TODO
                //priority: 0,      // TODO последовательность shortcut с использованием приоритетов вызова и отменой последующих
                metaAsCtrl: true,
                callback: null
            };

            var shortcuts = {};

            keyboard.shortcut = function($event, id) {
                var data = shortcuts[id];

                if (data.preventDefault) {
                    $event.preventDefault();
                }

                if (data.stopPropagation) {
                    $event.stopPropagation();
                }

                data.callback();
            };

            function keyToKeypressHelperKey(key, data) {
                var keys    = key.split('+'),
                    resKeys = [],
                    r;

                _.each(keys, function(k){
                    if (k.length === 1) {
                        r = k.toUpperCase().charCodeAt(0);
                    } else if (k === 'ctrl' && data.metaAsCtrl && $window.session.browser.os === 'Mac') {
                        r = 'meta';
                    } else {
                        r = k;
                    }

                    resKeys.push(r);
                });

                return resKeys.join('-');
            }

            return {
                shortcut: function(options) {
                    var data                = _.extend({}, shortcutDefault, options),
                        id                  = data.key + ':' + _.uniqueId('shortcut_'),
                        keypressHelperKey   = keyToKeypressHelperKey(data.key, data);

                    shortcuts[id] = data;

                    keypressHelper('keydown', scope, data.element, {
                        uiKeydown: _.sprintf("{'%s': 'keyboard.shortcut($event, \"%s\")'}", keypressHelperKey, id)
                    });
                }
            };
        }])
        //
        // https://github.com/angular-ui/ui-utils/blob/master/modules/scroll/README.md
        .factory('PagingScrollDataSource', ['$log', function($log){
            return function PagingScrollDataSource(options) {
                var total, first, last, size;

                reset();

                function reset() {
                    total = null;
                }

                function getPageConfig(index, count) {
                    first   = index;
                    last    = index + count - 1;

                    first   = first < 1 ? 1 : first;
                    last    = (total !== null && last > total) ? total : last;

                    size    = last - first + 1;

                    var pageSize = size - 1,
                        page;

                    do {
                        pageSize++;
                        page = Math.ceil(first / pageSize);
                    } while (page * pageSize < last);

                    var pageConfig = {
                        page: pageSize > 0 ? page : null,
                        pageSize: pageSize
                    };

                    return pageConfig;
                }

                function pagingDone(pageConfig, pagingResult, success) {
                    total = pagingResult.total;

                    var i = first % pageConfig.pageSize - 1,
                        b = i < 0 ? 0 : i,
                        e = b + size,
                        r = pagingResult.list.slice(b, e);

                    success(r);
                }

                return {
                    reset: function() {
                        reset();
                    },

                    get: function(index, count, success) {
                        var pageConfig = getPageConfig(index, count);

                        processBy(pageConfig.page, function(){
                            options.paging(pageConfig, function(pagingResult){
                                processBy(pagingResult, function(){
                                    pagingDone(pageConfig, pagingResult, success);
                                });
                            });
                        });

                        function processBy(value, process){
                            if (value === null) {
                                success([]);
                            } else {
                                process();
                            }
                        }
                    },

                    loading: function(value) {
                        if (_.isFunction(options.loading)) {
                            options.loading();
                        }
                    },

                    revision: function() {
                        return options.watch();
                    }
                };
            };
        }]);
    //
});
