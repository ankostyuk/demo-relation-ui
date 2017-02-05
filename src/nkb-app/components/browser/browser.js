//
// @author ankostyuk
//
define(function(require, exports, module) {'use strict';

                          require('lodash');
    var angular         = require('angular');
                          require('session');
    //

    var SUPPORTED_CONFIG = {
        device: {
            // Поддержка мобильных платформ
            mobile: false
        },
        // Перечень поддерживаемых браузеров и минимальные поддерживаемые версии
        browser: {
            'Chrome': {
                version: 32
            },
            'Safari': {
                version: 6
            },
            'Firefox': {
                version: 26
            },
            'Opera': {
                version: 12
            },
            'Explorer': {
                version: 10
            },
            // MS IE11 http://ru.wikipedia.org/wiki/Internet_Explorer_11
            'Mozilla': {
                version: 11
            }
        }
    };

    //
    var session = window.session;

    //
    return angular.module('app.browser', [])
        //
        .factory('browserHelper', ['$log', 'messageHelper', function($log, messageHelper){

            function reject() {
                // mobile
                if (session.device.is_mobile && !SUPPORTED_CONFIG.device['mobile']) {
                    return 'mobile';
                }

                // browser
                var browser = session.browser.browser,
                    version = parseInt(session.browser.version),
                    supportedVersion = (SUPPORTED_CONFIG.browser[browser] || {}).version;

                if (!supportedVersion || supportedVersion > version) {
                    return 'browser';
                }
            }

            //
            var browserHelper = {

                checkBrowser: function(callback){
                    var r = reject();

                    if (r) {
                        var data = {
                            reject: r
                        };
                        messageHelper.message('browser.unsupported', callback, data);
                    } else {
                        if (_.isFunction(callback)) {
                            callback();
                        }
                    }
                }
            };

            return browserHelper;
        }]);
    //
});
