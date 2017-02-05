//
// @author ankostyuk
//
define(function(require, exports, module) {'use strict';

                          require('jquery');
                          require('lodash');
    var Commons         = require('commons-utils'),
        angular         = require('angular');
    //

    //
    return angular.module('app.directives', ['ng'])
        //
        .factory('directiveHelper', ['$compile', '$rootScope', function($compile, $rootScope){
            return {
                createDirectiveView: function(directiveName, parent, tag, scopeData){
                    var scope = $rootScope;

                    if (!_.isEmpty(scopeData)) {
                        scope.$apply(function(s){
                            _.extend(s, scopeData);
                        });
                    }

                    var element = $(tag || '<div>').attr(directiveName, '');
                    //$compile(element)(scope);

                    element.appendTo(parent);

                    return {
                        element: element,
                        scope: scope
                    };
                }
            };
        }])
        //
        .directive('npTextarea', function() {
            return {
                restrict: 'A',
                require: '?ngModel',
                link: function(scope, element, attrs, ngModel) {
                    var oldValue = null;

                    element.bind('focus input keyup change', function(){
                        autosize();
                    });

                    function autosize() {
                        var value = element.val();
                        if (oldValue !== value) {
                            element.height(0);
                            element.height(element.prop('scrollHeight'));
                            oldValue = value;
                        }
                    }
                }
            };
        })
        //
        .directive('npExpandContent', ['$log', '$interval', '$document', 'keyboardHelper', function($log, $interval, $document, keyboardHelper){
            return {
                restrict: 'A',
                link: function(scope, element, attrs){
                    var excludeClose                    = '[app-message] *, [app-message]', // !!!
                        unigSelector                    = '.' + attrs['npExpandContentUniqClass'],
                        adjustedBottom                  = attrs['npExpandContentAdjustedBottom'],
                        isAdjustedBottomByContent       = (adjustedBottom === 'content'),
                        adjustedBottomCheckInterval     = 1000,
                        adjustedBottomTargetOffset      = parseInt(attrs['npExpandContentAdjustedBottomOffset']) || 0,
                        adjustedBottomTargetSelector    = attrs['npExpandContentAdjustedBottomTarget'],
                        windowElement                   = Commons.DOMUtils.window(),
                        documentElement                 = Commons.DOMUtils.document(),
                        adjustedBottomTargetElement, adjustedBottomElements;

                    if (adjustedBottomTargetSelector) {
                        if (adjustedBottomTargetSelector === 'window') {
                            adjustedBottomTargetElement = windowElement;
                        } else if (adjustedBottomTargetSelector === 'document') {
                            adjustedBottomTargetElement = documentElement;
                        } else {
                            adjustedBottomTargetElement = $(adjustedBottomTargetSelector);
                        }

                        adjustedBottomElements = element.find('.adjusted-bottom');
                    }

                    var contents        = element.find(unigSelector + '.content').hide(),
                        content         = null,
                        openToggle      = null;

                    if (_.has(attrs, 'npExpandContentDropdown')) {
                        documentElement
                            .mousedown(function(e){
                                var target = $(e.target);
                                if (!Commons.DOMUtils.isSubElement(element, target) && !target.is($(excludeClose))) {
                                    if (openToggle) {
                                        closeContent();
                                    }
                                }
                            });

                        keyboardHelper.shortcut({
                            element: documentElement,
                            key: 'esc',
                            callback: function(){
                                closeContent();
                            }
                        });
                    }

                    element//
                      .delegate(unigSelector + '.expand-toggle', 'click', function(e){
                          e.preventDefault();

                          var toggle = $(e.currentTarget);

                          if (toggle.is('.disabled')) {
                              return;
                          }

                          if (isContentOpen(toggle)) {
                              closeContent();
                          } else {
                              closeContent(function(){
                                  openContent(toggle);
                              });
                          }
                      });

                    function isContentOpen(toggle) {
                        return openToggle && openToggle.is(toggle);
                    }

                    function getContent(contentId) {
                        return element.find(unigSelector + '[content-id="' + contentId + '"]');
                    }

                    function getToggle(contentId) {
                        return element.find(unigSelector + '.expand-toggle[content="' + contentId + '"]');
                    }

                    //
                    function openContent(toggle) {
                        if (isContentOpen(toggle)) {
                            completeOpenContent();
                        }

                        openToggle = toggle;
                        content = getContent(toggle.attr('content'));

                        if (_.has(attrs, 'npExpandContentSlide')) {
                            element.addClass('content-open');
                            content.slideDown(parseInt(attrs['npExpandContentSlideDuration']), function(){
                                completeOpenContent();
                            });
                        } else {
                            content.show();
                            completeOpenContent();
                        }
                    }

                    function completeOpenContent() {
                        element.addClass('content-open');
                        openToggle.addClass('active').parent().addClass('active');

                        adjust();

                        content.trigger('content-open');
                        element.trigger('expand-content-open', [content]);
                    }

                    //
                    function closeContent(callback) {
                        if (!content) {
                            completeCloseContent(callback);
                            return;
                        }

                        element.trigger('expand-content-before-close', [content]);

                        if (_.has(attrs, 'npExpandContentSlide')) {
                            content.slideUp(parseInt(attrs['npExpandContentSlideDuration']), function(){
                                completeCloseContent(callback);
                            });
                        } else {
                            content.hide();
                            completeCloseContent(callback);
                        }
                    }

                    function completeCloseContent(callback){
                        element.removeClass('content-open');
                        if (openToggle) {
                            openToggle.removeClass('active').parent().removeClass('active');
                        }

                        if (content) {
                            content.trigger('content-close');
                            element.trigger('expand-content-close', [content]);
                        }

                        openToggle = null;
                        content = null;

                        if (callback) {
                            callback();
                        }
                    }

                    //
                    windowElement.resize(function(){
                        adjust();
                    });

                    if (isAdjustedBottomByContent) {
                        $interval(function(){
                            adjust();
                        }, adjustedBottomCheckInterval);
                    }

                    function adjust() {
                        if (content && _.size(adjustedBottomTargetElement)) {
                            var targetHeight = adjustedBottomTargetElement.height(),
                                adjustedElement, adjustedHeight,
                                scrollHeight, childrenHeight, adjustedBottomHeight;

                            adjustedBottomElements.each(function(){
                                adjustedElement = $(this);

                                adjustedBottomHeight = targetHeight - adjustedElement.offset().top + adjustedBottomTargetOffset;
                                childrenHeight = isAdjustedBottomByContent ? getChildrenHeight(adjustedElement) : adjustedBottomHeight;

                                adjustedHeight = Math.min(childrenHeight, adjustedBottomHeight);
                                adjustedHeight = Math.max(adjustedHeight, 0);

                                adjustedElement.height(adjustedHeight);
                            });
                        }
                    }

                    function getChildrenHeight(el) {
                        var height = 0;

                        el.children().each(function(){
                            height += $(this).outerHeight();
                        });

                        return height;
                    }

                    //
                    var npExpandContent = {
                        openContent: function(contentId){
                            npExpandContent.closeContent();

                            openToggle = getToggle(contentId);
                            content = getContent(contentId).show();

                            completeOpenContent();
                        },
                        closeContent: function(){
                            if (content) {
                                content.hide();
                            }

                            completeCloseContent();
                        },
                        adjust: adjust
                    };

                    element.data('npExpandContent', npExpandContent);
                }
            };
        }])
        //
        .factory('npExpandContentHelper', [function(){
            var npExpandContentHelper = {
                openContent: function(element, contentId) {
                    npExpandContentHelper.closeAll();

                    var expandContents = element.parents('[np-expand-content]');
                    expandContents.push(element);

                    var c       = expandContents.length - 1,
                        expands = [];

                    for (var i = c; i >= 0; i--) {
                        expands.unshift({
                            expandContent: $(expandContents[i]),
                            contentId: i === c ? contentId : $(expandContents[i + 1]).attr('content-id')
                        });
                    }

                    _.each(expands, function(expand){
                        expand.expandContent.data('npExpandContent').openContent(expand.contentId);
                    });
                },
                closeContent: function(element) {
                    element.data('npExpandContent').closeContent();
                },
                closeAll: function() {
                    Commons.DOMUtils.body().find('[np-expand-content]').each(function(){
                        $(this).data('npExpandContent').closeContent();
                    });
                },
                adjust: function(element) {
                    element.data('npExpandContent').adjust();
                }
            };

            return npExpandContentHelper;
        }])
        //
        .directive('npInlineInput', ['$log', 'keyboardHelper', function($log, keyboardHelper){
            return {
                restrict: 'A',
                link: function(scope, element, attrs){
                    var inputShow       = element.find('[np-inline-input-show]'),
                        inputHide       = element.find('[np-inline-input-hide]'),
                        inputBoxElement = element.find('[np-inline-input-box-element]').hide(),
                        inputElement    = element.find('[np-inline-input-element]');

                    inputShow.click(function(){
                        open();
                        return false;
                    });

                    inputHide.click(function(){
                        close();
                        return false;
                    });

                    keyboardHelper.shortcut({
                        element: inputElement,
                        key: 'esc',
                        stopPropagation: true,
                        callback: function(){
                            close();
                        }
                    });

                    function open() {
                        inputShow.hide();

                        inputBoxElement.show();

                        inputElement
                            .stop(true, true)
                            .focus()
                            .select()
                            .animate({
                                width: attrs['npInlineInputElementMaxWidth']
                            }, {
                                queue: false,
                                duration: parseInt(attrs['npInlineInputElementAnimateDuration']),
                                done: function(){
                                    if (!element.hasClass('open')) {
                                        element.addClass('open');
                                        element.triggerHandler('np-inline-input-status', [{
                                            show: true
                                        }]);
                                    }
                                }
                            });
                    }

                    function close() {
                        if (element.hasClass('open')) {
                            element.removeClass('open');
                            element.triggerHandler('np-inline-input-status', [{
                                show: false
                            }]);
                        }

                        inputElement
                            .stop(true, true)
                            .animate({
                                width: attrs['npInlineInputElementMinWidth']
                            }, {
                                queue: false,
                                duration: parseInt(attrs['npInlineInputElementAnimateDuration']),
                                done: function(){
                                    inputElement.blur();
                                    inputBoxElement.hide();
                                    inputShow.show();
                                }
                            });
                    }
                }
            };
        }])
        //
        .directive('npActiveContent', ['$log', function($log){
            return {
                restrict: 'A',
                link: function(scope, element, attrs) {
                    var unigSelector    = '.' + attrs['npActiveContent'],
                        activeClass     = 'active',
                        contents        = {},
                        active          = {};

                    element.find(unigSelector + '[content-id]').each(function(){
                        var content         = $(this),
                            contentId       = content.attr('content-id'),
                            toggle          = element.find(unigSelector + '[content="' + contentId + '"]'),
                            toggleWrapper   = toggle.parent();

                        contents[contentId] = {
                            content: content,
                            toggle: toggle,
                            toggleWrapper: toggleWrapper,
                            contentId: contentId
                        };

                        toggle.click(function(e){
                            if (toggle.is('.disabled')) {
                                return;
                            }
                            activateContent(contentId);
                        });
                    });

                    function activateContent(contentId) {
                        var data = contents[contentId];

                        if (active.contentId === data.contentId) {
                            return;
                        }

                        if (active.contentId) {
                            active.content.removeClass(activeClass);
                            active.toggleWrapper.removeClass(activeClass);
                        }

                        data.content.addClass(activeClass);
                        data.toggleWrapper.addClass(activeClass);

                        active = data;

                        //
                        element.trigger('content-activated', [data]);
                    }

                    // API
                    element.data('npActiveContent', {
                        activateContent: activateContent,
                        getActiveContent: function(){
                            return active;
                        }
                    });
                }
            };
        }])
        .factory('npActiveContentHelper', [function(){
            return {
                activateContent: function(element, contentId) {
                    element.data('npActiveContent').activateContent(contentId);
                },
                getActiveContent: function(element) {
                    return element.data('npActiveContent').getActiveContent();
                }
            };
        }])
        //
        .directive('npContextPopup', ['$document', function($document){
            return function(scope, element, attrs){
                var parentElement   = element.parent(),
                    showCheck       = attrs['npContextPopupShowCheck'];

                parentElement
                    .bind('contextmenu', function(e){
                        if (e.ctrlKey) {
                            return;
                        }

                        if ((showCheck && scope.$eval(showCheck)) || !showCheck) {
                            show(e);
                        }

                        return false;
                    });

                Commons.DOMUtils.document()
                    .mousedown(function(e){
                        if (!Commons.DOMUtils.isSubElement(element, $(e.target))) {
                            hide();
                        }
                    });

                keyboardHelper.shortcut({
                    element: $document,
                    key: 'esc',
                    callback: function(){
                        hide();
                    }
                });

                //
                function show(e) {
                    var cursorPosition = {
                        left: e.pageX,
                        top: e.pageY
                    };

                    element.show();

                    var popupPosition   = Commons.DOMUtils.getPopupPosition(cursorPosition, element),
                        position        = Commons.DOMUtils.positionDocumentToElement(popupPosition, parentElement);

                    //
                    element.css({
                        'left': position.left + 'px',
                        'top': position.top + 'px'
                    });
                }

                function hide() {
                    element.hide();
                }
            };
        }]);
    //
});
