var root = this;

/*
 * config
 *
 */
// i18n
var i18nBundles = [
    // external
    'text!external_components/nullpointer-rsearch/l10n/ui/bundle.json',
    'text!external_components/nullpointer-rsearch/l10n/ui_keys/bundle.json',
    'text!external_components/nullpointer-rsearch/l10n/okato_region/bundle.json',
    'text!external_components/nullpointer-autokad/l10n/ui/bundle.json',
    'text!external_components/nullpointer-autokad/l10n/ui_keys/bundle.json',
    'text!external_components/nullpointer-connections-ui/l10n/ui/bundle.json',
    'text!external_components/nullpointer-connections-ui/l10n/ui_keys/bundle.json',
    // internal
    'text!src/l10n/ui/bundle.json'
];

root._APP_CONFIG = {
    buildType: 'development',
    lang: {
        defaultLang: 'ru',
        langs: ['ru', 'en']
    },

    // @Deprecated TODO общая конфигурация для приложений НКБ
    meta: {
        // Параметр: Объём продаж за последний год
        lastSalesVolumeField: 'p20103_2015',
        defaultCurrency: 'RUB',
        currencyOrder: 1000
    },
    'apiUrl':                       '/nkbrelation/api',
    'nkb.file.download.template':   '/reports/file.php?id=FILE_ID_VALUE',
    'egrul.list.url':               '/search/ajax/egrul.php'
};

//
root._RESOURCES_CONFIG = {
    baseUrl: '/relation-ui',

    paths: {
        'angular':                      'external_components/angular/angular',
        'angular-resource':             'external_components/angular-resource/angular-resource',
        'angular-locale_ru':            'external_components/angular-i18n/angular-locale_ru',
        'angular-locale_en':            'external_components/angular-i18n/angular-locale_en',

        'angular-ui-utils-keypress':    'external_components/angular-ui-utils-keypress/keypress',
        'angular-ui-utils-scroll':      'external_components/angular-ui-utils-scroll/scroll',

        'moment':                       'external_components/moment/moment',
        'moment-timezone':              'external_components/moment-timezone/moment-timezone-with-data',
        'angular-moment':               'external_components/angular-moment/angular-moment',

        'raphael':                      'external_components/raphael/raphael',

        'jquery':                       'external_components/jquery/jquery',
        'jquery.fileDownload':          'external_components/jquery.fileDownload/jquery.fileDownload',
        'jquery.cookie':                'external_components/jquery.cookie/jquery.cookie',

        'download':                     'external_components/downloadjs/download',

        'purl':                         'external_components/purl/purl',
        'session':                      'external_components/session.js/session',
        'atmosphere':                   'external_components/atmosphere/atmosphere',

        'uuid':                         'external_components/node-uuid/uuid',

        // rsearch
        'ng-infinite-scroll':           'external_components/ngInfiniteScroll/ng-infinite-scroll',

        // nkbcomment
        'backbone':                     'external_components/backbone/backbone',
        'iso8601':                      'external_components/iso8601/iso8601',
        'jquery.ui.widget':             'external_components/jquery-file-upload/jquery.ui.widget',
        'jquery.iframe-transport':      'external_components/jquery-file-upload/jquery.iframe-transport',
        'jquery.fileupload':            'external_components/jquery-file-upload/jquery.fileupload',
        // 'jquery.fileDownload':          'external_components/jquery.fileDownload/jquery.fileDownload',
        'dateformat':                   'external_components/nkbcomment/nkbcomment-lib/dateformat',
        'nkbcomment-defaults':          'external_components/nkbcomment/nkbcomment-defaults/defaults',
        'nkbcomment-message-widget':    'external_components/nkbcomment/nkbcomment-message-widget/js/message-widget',
        'nkbcomment-comment-utils':     'external_components/nkbcomment/nkbcomment-comment-widget/js/comment-utils',
        'nkbcomment-comment-widget':    'external_components/nkbcomment/nkbcomment-comment-widget/js/comment-widget'
    },

    packages: [{
        name: 'app',
        location: 'src/nkb-app',
        main: 'app'
    }, {
        name: 'app.export',
        location: 'src/nkb-app/components/export',
        main: 'export'
    }, {
        name: 'app.l10n',
        location: 'src/nkb-app/components/l10n',
        main: 'l10n'
    }, {
        name: 'app.data-update',
        location: 'src/nkb-app/components/data-update',
        main: 'data-update'
    }, {
        name: 'app.notification',
        location: 'src/nkb-app/components/notification',
        main: 'notification'
    }, {
        name: 'app.message',
        location: 'src/nkb-app/components/message',
        main: 'message'
    }, {
        name: 'app.hint',
        location: 'src/nkb-app/components/hint',
        main: 'hint'
    }, {
        name: 'app.browser',
        location: 'src/nkb-app/components/browser',
        main: 'browser'
    }, {
        name: 'app.report',
        location: 'src/nkb-app/components/report',
        main: 'report'
    }, {
        name: 'app.search',
        location: 'src/nkb-app/components/search',
        main: 'search'
    }, {
        name: 'app.relations',
        location: 'src/nkb-app/components/relations',
        main: 'relations'
    }, {
        name: 'app.user',
        location: 'src/nkb-app/components/user',
        main: 'user'
    }, {
        name: 'app.meta',
        location: 'src/nkb-app/components/meta',
        main: 'meta'
    }, {
        name: 'app.graph',
        location: 'src/nkb-app/components/graph',
        main: 'graph'
    }, {
        name: 'app.node',
        location: 'src/nkb-app/components/node',
        main: 'node'
    }, {
        name: 'app.desktop',
        location: 'src/nkb-app/components/desktop',
        main: 'desktop'
    }, {
        name: 'app.report-toolbar',
        location: 'src/nkb-app/components/report-toolbar',
        main: 'report-toolbar'
    }, {
        name: 'app.graph-toolbar',
        location: 'src/nkb-app/components/graph-toolbar',
        main: 'graph-toolbar'
    }, {
        name: 'app.rsearch',
        location: 'src/nkb-app/components/rsearch',
        main: 'rsearch'
    },
    // external packages
    {
        name: 'jquery-ui',
        location: 'external_components/jquery-ui'
    }, {
        name: 'lodash',
        location: 'external_components/nullpointer-commons/lodash'
    }, {
        name: 'commons-utils',
        location: 'external_components/nullpointer-commons/utils',
        main: 'utils'
    }, {
        name: 'np.directives',
        location: 'external_components/nullpointer-commons/angular/directives',
        main: 'directives'
    }, {
        name: 'np.filters',
        location: 'external_components/nullpointer-commons/angular/filters',
        main: 'filters'
    }, {
        name: 'np.utils',
        location: 'external_components/nullpointer-commons/angular/utils',
        main: 'utils'
    }, {
        name: 'template-utils',
        location: 'external_components/nullpointer-commons/utils/template-utils',
        main: 'template-utils'
    }, {
        name: 'nkb.icons',
        location: 'external_components/nullpointer-commons/nkb/icons',
        main: 'icons'
    }, {
        name: 'nkb.filters',
        location: 'external_components/nullpointer-commons/nkb/filters',
        main: 'filters'
    }, {
        name: 'np.l10n',
        location: 'external_components/nullpointer-commons/angular/l10n',
        main: 'l10n'
    }, {
        name: 'i18n',
        location: 'external_components/nullpointer-i18n',
        main: 'i18n'
    }, {
        name: 'connections',
        location: 'external_components/nullpointer-connections-ui/connections'
    },
    // rsearch
    {
        name: 'nkb.comment',
        location: 'external_components/nullpointer-rsearch/comment',
        main: 'comment'
    }, {
        name: 'nkb.reference',
        location: 'external_components/nullpointer-rsearch/reference',
        main: 'reference'
    }, {
        name: 'nkb.selfemployed',
        location: 'external_components/nullpointer-rsearch/selfemployed',
        main: 'selfemployed'
    }, {
        name: 'nkb.extraneous',
        location: 'external_components/nullpointer-rsearch/extraneous'
    }, {
        name: 'nkb.user',
        location: 'external_components/nullpointer-commons/nkb/user',
        main: 'user'
    }, {
        name: 'np.resource',
        location: 'external_components/nullpointer-commons/angular/resource',
        main: 'resource'
    }, {
        name: 'autokad',
        location: 'external_components/nullpointer-autokad/autokad',
        main: 'autokad'
    }, {
        name: 'nullpointer-rsearch',
        location: 'external_components/nullpointer-rsearch'
        // location: '/rsearch/src'
    }],

    shim: {
        'angular': {
            exports: 'angular'
        },
        'angular-resource': {
            deps: ['angular']
        },
        'angular-ui-utils-keypress': {
            deps: ['angular']
        },
        'angular-ui-utils-scroll': {
            deps: ['angular']
        },

        'jquery.fileDownload': {
            deps: ['jquery']
        },
        'jquery.cookie': {
            deps: ['jquery']
        },

        // nkbcomment
        'backbone': {
            deps: ['lodash']
        },
        'dateformat': {
            deps: ['iso8601']
        },
        'nkbcomment-defaults': {
            deps: ['backbone', 'lodash', 'jquery' /* + остальные зависимости для nkbcomment-comment */, 'jquery.cookie', 'jquery.fileupload', 'jquery.fileDownload', 'dateformat']
        },
        'nkbcomment-comment-utils': {
            deps: ['nkbcomment-defaults']
        },
        'nkbcomment-message-widget': {
            deps: ['nkbcomment-defaults']
        },
        'nkbcomment-comment-widget': {
            deps: ['nkbcomment-defaults', 'nkbcomment-comment-utils', 'nkbcomment-message-widget']
        }
    },

    config: {
        'np.l10n/l10n': {
            lang: root._APP_CONFIG.lang,
            'i18n-component': {
                // Должны отличаться от общих настроек шаблонизатора,
                // т.к. смысл шаблонизации i18n:
                //   только перевести текст шаблона,
                //   а далее использовать переведённый шаблон с шаблонизатором по умолчанию
                templateSettings: {
                    evaluate:       '',
                    interpolate:    /\$\{([\s\S]+?)\}/g,
                    escape:         ''
                },
                escape: false
            },
            bundles: i18nBundles
        }
    },

    modules: [{
        name: 'app/main',
        include: [
            // locales
            'text!angular-locale_ru.js',
            'text!angular-locale_en.js'
        ].concat(i18nBundles)
    }],

    map: {
        '*': {
            'css': 'external_components/require-css/css',
            'less': 'external_components/require-less/less',
            'text': 'external_components/requirejs-text/text'
        }
    },

    less: {
        relativeUrls: true
    },

    urlArgs: new Date().getTime()
};


/*
 * init
 *
 */
if (typeof define === 'function' && define.amd) {
    requirejs.config(root._RESOURCES_CONFIG);

    require(['app'], function(app){
        // init app
        app.init(document);
    });
}
