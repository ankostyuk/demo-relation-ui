//
// @author ankostyuk
//
define(function(require, exports, module) {'use strict';

                          require('less!./styles/notification');
    var template        = require('text!./views/notification.html');

                          require('lodash');
    var templateUtils   = require('template-utils');
    var angular         = require('angular');
    //

    var directiveName   = 'app-notification';

    var templateData, viewTemplates;

    //
    var NotificationSettings = {
        animateClasses: 'animate-pulsed-flash animate-pulsed-flash-1',
        animateDuration: 2500,

        byType: {
            'COMPANY_EGRUL_PENDING': {
                light: true,
                animateClass: 'animate-pulsed-flash-1'
            },
            'INDIVIDUAL_EGRUL_PENDING': {
                light: true,
                animateClass: 'animate-pulsed-flash-1'
            },
            'DATA_UPDATE_egrul': {
                light: false,
                animateClass: 'animate-pulsed-flash'
            },
            'DATA_UPDATE_egrul_individual_founder': {
                light: false,
                animateClass: 'animate-pulsed-flash'
            },
            'DATA_UPDATE_egrul_individual_executive': {
                light: false,
                animateClass: 'animate-pulsed-flash'
            }
        }
    };

    //
    return angular.module('app.notification', [])
        //
        .run([function(){
            templateData    = templateUtils.processTemplate(template);
            viewTemplates   = templateData.templates;
        }])
        //
        .directive(_.camelize(directiveName), ['$log', '$compile', '$timeout', function($log, $compile, $timeout){
            return {
                restrict: 'A',
                replace: false,
                template: viewTemplates['notification-view'].html,
                scope: false,
                controller: ['$scope', '$element', '$attrs', function($scope, $element, $attrs) {
                    var scope   = $scope,
                        element = $element,
                        attrs   = $attrs;

                    //
                    var toggleElement           = element.find('.expand-toggle[content="notifications"]'),
                        contentElement          = element.find('.content[content-id="notifications"]'),
                        notificationListElement = element.find('.notification-list'),
                        contentOpen             = false;

                    contentElement
                        .bind('content-open', function(){
                            toggleElement.removeClass(NotificationSettings.animateClasses);
                            contentOpen = true;
                        })
                        .bind('content-close', function(){
                            contentOpen = false;
                        });

                    scope.$on('notification', function(e, type, data){
                        createNotification(type, data);
                    });

                    function createNotification(type, data) {
                        var notificationScope       = scope.$new(),
                            notificationName        = type + '-notification',
                            notificationSettings    = NotificationSettings.byType[type];

                        _.extend(notificationScope, data, {
                            close: function(){
                                notificationElement.slideUp(100, function(){
                                    notificationElement.remove();
                                    notificationScope.$destroy();
                                });
                            }
                        });

                        var notificationElement = $('<div>', {
                            'class': 'notification ' + notificationName,
                            html: viewTemplates[notificationName].html
                        });

                        $compile(notificationElement)(notificationScope);
                        notificationElement.prependTo(notificationListElement);

                        if (!contentOpen) {
                            toggleElement.addClass(notificationSettings.animateClass);

                            if (notificationSettings.light) {
                                $timeout(function(){
                                    toggleElement.removeClass(notificationSettings.animateClass);
                                }, NotificationSettings.animateDuration);
                            }
                        }
                    }
                }]
            };
        }]);
    //
});
