//
// @author ankostyuk
//
define(function(require, exports, module) {'use strict';

                          require('nkb.icons');

                          // Нужные CSS из jquery-ui/themes
                          require('css!jquery-ui/themes/base/resizable');

                          require('css!../external_components/bootstrap/css/bootstrap');
                          require('less!./styles/app');

                          require('jquery');

                          // Нужные модули из jquery-ui/ui
                          require('jquery-ui/ui/draggable');
                          require('jquery-ui/ui/resizable');

                          require('jquery.fileDownload');
                          require('jquery.cookie');

                          require('lodash');
    var Commons         = require('commons-utils');

    var angular         = require('angular');
                          require('angular-resource');

    var l10n            = require('np.l10n');

                          require('moment');
                          require('moment-timezone');

    var angularModules = [
        require('angular-moment'),

        require('np.directives'),
        require('np.filters'),
        require('np.resource'),

        require('nkb.filters'),

        require('app.l10n'),
        require('app.export'),
        require('app.data-update'),
        require('app.notification'),
        require('app.message'),
        require('app.hint'),
        require('app.browser'),
        require('app.report'),
        require('app.search'),
        require('app.relations'),
        require('app.user'),
        require('app.meta'),
        require('app.node'),
        require('app.graph'),
        require('app.desktop'),
        require('app.report-toolbar'),
        require('app.graph-toolbar'),
        require('app.rsearch'),
        require('./components/utils'),
        require('./components/directives')
    ];

    var appUIDirectives = ['app-message', 'app-desktop'];

    var isInternalExport = window._EXPORT_DATA_ && window._EXPORT_DATA_.isInternalExport;

    var app = angular.module('app', _.pluck(angularModules, 'name'))
        //
        .constant('appConfig', {
            name: 'relation',
            uuid: null,
            meta: root._APP_CONFIG.meta,
            yandexMetrikaCounterName: 'yaCounter23296318',
            resource: {
                noInitMeta: isInternalExport,
                'meta.url':                 '/nkbrelation/api/meta',
                'search.url':               '/nkbrelation/api/nodes',
                'relations.url':            '/nkbrelation/api/node',
                'algo.url':                 '/nkbrelation/api/algo',
                'egrul.history.url':        '/siteapp/api/egrul/history',
                'nkb.file.download.url':    '/reports/file.php',

                // connections
                'list.create.url':          '/connections/api/list',
                'lists.url':                '/connections/api/lists',

                'list.entry.create.url':    '/connections/api/list/{{listId}}/entry',

                'nodes.lists.url':          '/connections/api/nodes/lists'
            },
            product: {
                'market_profile_short': {
                    'info.url': '/examples/marketing_profile/',
                    'purchase.url': '/reports/?code=rep_market_profile_short&fromSearch=1&id={{node.bsn_id}}&lang={{lang}}'
                },
                'market_list': {
                    'info.url': '/examples/direct_mail/',
                    'purchase.url': '/reports/?code=rep_market_list&fromSearch=1&id={{node.bsn_id}}&lang={{lang}}'
                },
                'business_profile': {
                    'info.url': '/examples/business_profile/',
                    'purchase.url': '/reports/?code=rep_business_profile&fromSearch=1&id={{node.bsn_id}}&lang={{lang}}'
                },
                'market_profile_full': {
                    'info.url': '/examples/analitic_profile/',
                    'purchase.url': '/reports/?code=rep_market_profile_full&fromSearch=1&id={{node.bsn_id}}&lang={{lang}}'
                },
                'credit_profile': {
                    'info.url': '/examples/credit_profile/',
                    'purchase.url': '/reports/?code=rep_credit_profile&fromSearch=1&id={{node.bsn_id}}&lang={{lang}}'
                },
                'ext_history_profile': {
                    'info.url': '/examples/history_profile/',
                    'purchase.url': '/reports/?code=rep_history_profile&fromSearch=1&id={{node.bsn_id}}&lang={{lang}}'
                },
                'extended_research': {
                    'info.url': '/examples/extended/',
                    'purchase.url': '/search/offlinea/?form[comp_name]={{node.name}}&idcomp={{node.bsn_id}}'
                },
                'egrulCompanyReport': {
                    'info.url': '/egryl/',
                    'purchase.url': '/search/offlinee/?idcomp={{node.bsn_id}}'
                },
                'egrulChiefReport': {
                    'info.url': '/egryl/',
                    'purchase.url': '/search/offlinee/?form[chief_name]={{node.name}}&form[use_chief]=1'
                },
                'egrulFounderPersonReport': {
                    'info.url': '/egryl/',
                    'purchase.url': '/search/offlinee/?form[founder_person]={{node.name}}&form[use_founder_person]=1'
                },
                'egripReport': {
                    'info.url': '/egryl/',
                    'purchase.url': '/search/offlinep/?form[comp_name]={{node.name}}&form[regnum]={{node.selfemployedInfo.ogrnip}}'
                },
                'actualizeReport': {
                    'info.url': '/examples/quartal_profile/',
                    'purchase.url': '/search/offlinea/?form[comp_name]={{node.name}}&idcomp={{node.bsn_id}}'
                },
                'relations_find_related': {
                    'info.url': '/search/relations/',
                    'purchase.url': '/nkbrelation/report?node.type={{node._type}}&{{node.__idField}}.equals={{node[node.__idField]}}&relation.type={{relationType}}&relation.direction={{relationDirection}}'
                },
                'ForeignCompanyReport': {
                    'info.url': '/dnb/profile/',
                    'purchase.url': '/search/offlined/'
                }
            },
            FATAL_ERROR_KEYS: [],
            HTTP_RESPONSE_ERROR_IGNORE_URL: [
                '/siteapp/',
                '/api/users/me/',
                '/connections/api/nodes/lists',
                '/search/ajax/egrul.php',
                'kad.arbitr.ru',
                '/extraneous/fns/company/reg_docs',
                '/extraneous/fedresurs/company/bankruptcy',
                '/extraneous/fedresurs/individual/bankruptcy',
                '/extraneous/purchase/company/dishonest_supplier'
            ]
        })
        //
        .constant('nkbUserConfig', {
            resource: {
                'external.url': '/siteapp/url/external/',
                'users.url':    '/siteapp/api/users',
                'login.url':    '/siteapp/login',
                'logout.url':   '/siteapp/logout'
            }
        })
        .config(['nkbUserProvider', function(nkbUserProvider){
            nkbUserProvider.setPolling(!isInternalExport);
        }])
        //
        .constant('nkbCommentConfig', {
            resource: {
                'api.url': '/nkbcomment/api'
            }
        })
        //
        .constant('npRsearchAutokadConfig', {
            gettingCaseCount: false
        })
        //
        .constant('npRsearchFedresursBankruptcyConfig', {
            gettingMessageCount: false
        })
        //
        .constant('npRsearchFnsRegDocsConfig', {
            gettingDocCount: true
        })
        //
        .constant('npRsearchPurchaseDishonestSupplierConfig', {
            gettingRecCount: true
        })
        //
        .constant('angularMomentConfig', {
            timezone: 'Europe/Moscow'
        })
        //
        .factory('$exceptionHandler', ['$injector', function($injector){
            return function(exception, cause){
                var $log            = $injector.get('$log'),
                    $rootScope      = $injector.get('$rootScope'),
                    errorUtils      = $injector.get('appUtils').errorUtils,
                    messageHelper   = $injector.get('messageHelper');

                $rootScope.$emit('exception', exception, cause);

                if (_.has(exception, 'type')) {
                    var errorKey = exception.type + '.' + (exception.data || 'UNKNOWN') + (exception.source ? '@' + exception.source : '');
                    messageHelper.error(errorKey, !errorUtils.isFatalError(errorKey));
                    $log.info('error:', exception, cause);
                    return;
                }

                $log.error.apply($log, arguments);
            };
        }])
        //
        .config(['$httpProvider', function($httpProvider){
            $httpProvider.interceptors.push(['$q', 'appUtils', function($q, appUtils){

                function errorHandler(source, type, rejection) {
                    throw {
                        source: source,
                        type: type,
                        data: rejection.data,
                        rejection: rejection
                    };
                }

                return {
                    'request': function(config){
                        return config || $q.when(config);
                    },
                    'response': function(response){
                        return response || $q.when(response);
                    },
                    'requestError': function(rejection){
                        errorHandler(null, 'REQUEST_ERROR', rejection);
                        return $q.reject(rejection);
                    },
                    'responseError': function(rejection){
                        // rejection.status = -1 -- при принудительной отмене запросов
                        if (rejection.status !== -1 && !appUtils.errorUtils.isHttpResponseErrorIgnoreUrl(rejection.config.url)) {
                            errorHandler(rejection.config._source, 'RESPONSE_ERROR', rejection);
                        }
                        return $q.reject(rejection);
                    }
                };
            }]);
        }])
        //
        .config(['$logProvider', function($logProvider){
            $logProvider.debugEnabled(false);
        }])
        //
        .run(['$log', '$q', '$timeout', '$rootScope', '$window', '$templateCache', 'exportHelper', 'directiveHelper', 'browserHelper', 'reportHelper', 'userHelper', 'metaHelper', 'nodeHelper', 'graphHelper', 'dataUpdateHelper', 'l10nMessages', function($log, $q, $timeout, $rootScope, $window, $templateCache, exportHelper, directiveHelper, browserHelper, reportHelper, userHelper, metaHelper, nodeHelper, graphHelper, dataUpdateHelper, l10nMessages){
            // init scope...
            // inject config, Commons, ...
            _.extend($rootScope, {
                _APP_CONFIG: $window._APP_CONFIG,
                Commons: Commons,
                reportHelper: reportHelper,
                nodeHelper: nodeHelper,
                graphHelper: graphHelper,
                userHelper: userHelper,
                dataUpdateHelper: dataUpdateHelper
            });

            // application model
            $rootScope.app = {
                isInit: false
            };

            // create UI...
            _.each(appUIDirectives, function(directiveName){
                directiveHelper.createDirectiveView(directiveName, Commons.DOMUtils.body());
            });

            // check internal export
            exportHelper.checkInternalExport(checkBrowser);

            // check browser
            function checkBrowser() {
                $timeout(function(){
                    browserHelper.checkBrowser(startup);
                });
            }

            function startup() {
                var userPromise = userHelper.initUser(),
                    metaPromise = metaHelper.initMeta(),
                    initPromise = $q.all([userPromise, metaPromise]);

                initPromise.then(function(){
                    $log.debug('user...', $rootScope.user);

                    graphHelper.initGraph();

                    //
                    reportHelper.createNewReport();

                    //
                    var reportPromise = $q.all([graphHelper.addNodesFromURL(), graphHelper.addNodesFromGrid(), reportHelper.openSharedReport()]);

                    reportPromise.then(function(){
                        $log.debug('init app data...', $rootScope);

                        _.extend($rootScope.app, {
                            isInit: true,
                            isBusy: false
                        });

                        $rootScope.$emit('show-hint', 'START');

                        initUnload();
                    });

                    function initUnload() {
                        Commons.DOMUtils.window().bind('beforeunload', function() {
                            if ($window.APP_BUILD_TYPE === 'production') {
                                return l10nMessages.app['unload'];
                            }
                        });
                    }
                });
            }
        }]);
    //

    return {
        init: function(parent) {
            $(function() {
                l10n.initPromise.done(function(){
                    Commons.DOMUtils.body().addClass(Commons.DOMUtils.getBrowserIdClasses());
                    angular.bootstrap(parent, [app.name]);
                });
            });
        }
    };
});
