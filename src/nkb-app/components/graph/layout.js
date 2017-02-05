//
// @author ankostyuk
//
define(function(require, exports, module) {'use strict';

                          require('less!./styles/layout');
    var template        = require('text!./views/layout.html');

                          require('lodash');
    var Commons         = require('commons-utils');
    var i18n            = require('i18n');
    var raphael         = require('raphael');
    var angular         = require('angular');
    //

    var directiveName = 'app-graph-layout';

    //
    var GraphLayoutSettings = {
        maxWidth: 100000,
        maxHeight: 100000
    };

    //
    var graphLayout,
        graphObjectLayout,
        graphObjectContainer,
        graphObjectDragElement,
        graphPaperContainer,
        graphPaperElement,
        graphPaper;


    //
    function getGraphObjectContainerPosition() {
        return Commons.DOMUtils.getCssPosition(graphObjectContainer);
    }

    function setGraphObjectContainerPosition(pos) {
        graphObjectContainer.css({
            'left': pos.left ? pos.left + 'px' : pos.left,
            'top': pos.top ? pos.top + 'px' : pos.top
        });

        syncPositions();
    }

    function syncPositions() {
        // SVG (VML) view box
        var pos = Commons.DOMUtils.getCssPosition(graphObjectContainer);
        graphPaper.setViewBox(-pos.left, -pos.top, GraphLayoutSettings.maxWidth, GraphLayoutSettings.maxHeight, false);
    }

    function syncScroll() {
        // Size graphPaperContainer.
        // Увеличение размеров только если есть прокрутка
        var scrollLeft  = graphObjectLayout.scrollLeft(),
            scrollTop   = graphObjectLayout.scrollTop(),
            css         = {};

        if (scrollLeft) {
            css['right'] = -scrollLeft + 'px';
        }
        if (scrollTop) {
            css['bottom'] = -scrollTop + 'px';
        }

        graphPaperContainer.css(css);
    }

    function resetScroll() {
        graphObjectLayout.scrollLeft(0);
        graphObjectLayout.scrollTop(0);

        graphPaperContainer.css({
            'right': '0',
            'bottom': '0'
        });
    }

    //
    return angular.module('app.graph.layout', [])
        //
        .run([function(){
            template = i18n.translateTemplate(template);
        }])
        //
        .directive(_.camelize(directiveName), ['$log', '$timeout', 'desktopHelper', function($log, $timeout, desktopHelper){
            return {
                restrict: 'A',
                replace: false,
                template: template,
                scope: false,
                link: function(scope, element, attrs){
                    graphLayout             = element;
                    graphObjectLayout       = element.find('.graph-object-layout');
                    graphObjectContainer    = element.find('.graph-object-container');
                    graphObjectDragElement  = element.find('.graph-object-drag');
                    graphPaperContainer     = element.find('.graph-paper-container');
                    graphPaper              = raphael(0, 0, GraphLayoutSettings.maxWidth, GraphLayoutSettings.maxHeight);

                    graphPaperElement = $(graphPaper.canvas);
                    graphPaperElement.appendTo(graphPaperContainer);

                    //
                    var graphLayoutPosition = graphLayout.position();

                    //
                    initGraphSelectArea();

                    //
                    scope.$on('graph-zoom', function(e, level){
                        Commons.DOMUtils.attrAsClass(graphObjectContainer, {
                            'zoom-level': level.name
                        });
                    });

                    scope.$on('graph-object-container-position', function(e){
                        syncPositions();
                    });

                    graphObjectLayout.scroll(function(){
                        syncScroll();
                    });

                    //
                    syncPositions();
                    syncScroll();

                    //
                    function pageToLayoutPosition(pageX, pageY) {
                        return {
                            x: pageX - graphLayoutPosition.left + graphObjectLayout.scrollLeft(),
                            y: pageY - graphLayoutPosition.top + graphObjectLayout.scrollTop()
                        };
                    }

                    //
                    // Graph select area
                    //
                    function initGraphSelectArea() {
                        var graphSelectArea         = element.find('.graph-select-area').hide(),
                            graphSelectAreaHelper   = element.find('.graph-select-area-helper').hide(),
                            select                  = false,
                            paperCSS, mousePos;


                        graphSelectAreaHelper.draggable({
                            cursorAt: {
                                left: 1,
                                top: 1
                            },

                            revert: true,
                            revertDuration: 0,

                            start: function(e, ui) {
                                paperCSS = graphPaperContainer.css(['right', 'bottom']);

                                desktopHelper.showTransparentMask();

                                mousePos = pageToLayoutPosition(e.pageX, e.pageY);
                                setGraphSelectAreaCSS({
                                    left: mousePos.x,
                                    top: mousePos.y,
                                    width: 0,
                                    height: 0
                                });
                                graphSelectArea.show();

                                scope.$emit('graph-select-area-start', e);
                            },

                            drag: function(e, ui) {
                                var pos = pageToLayoutPosition(e.pageX, e.pageY);

                                var dx = pos.x - mousePos.x;
                                var dy = pos.y - mousePos.y;

                                var selectArea = {
                                    left: (dx >= 0 ? mousePos.x : pos.x),
                                    top: (dy >= 0 ? mousePos.y : pos.y),
                                    width: Math.abs(dx),
                                    height: Math.abs(dy)
                                };

                                setGraphSelectAreaCSS(selectArea);

                                scope.$emit('graph-select-area', selectArea, e);
                            },

                            stop: function(e, ui) {
                                graphPaperContainer.css(paperCSS);
                                graphSelectArea.hide();
                                desktopHelper.hideTransparentMask();
                            }
                        });

                        Commons.DOMUtils.document()
                            .mousedown(function(e){
                                if (select || !(graphPaperElement.is(e.target) || graphObjectContainer.is(e.target))) {
                                    return;
                                }

                                select = true;
                                graphSelectAreaHelper.show().trigger(e);
                            })
                            .mouseup(function(e){
                                if (!select) {
                                    return;
                                }

                                select = false;
                                graphSelectAreaHelper.hide();
                            });

                        function setGraphSelectAreaCSS(selectArea) {
                            graphSelectArea.css({
                                left: selectArea.left + 'px',
                                top: selectArea.top + 'px',
                                width: selectArea.width + 'px',
                                height: selectArea.height + 'px'
                            });
                        }
                    }
                }
            };
        }])
        //
        .factory('graphLayoutHelper', ['$log', function($log){

            var graphLayoutHelper = {

                getGraphLayout: function() {
                    return graphLayout;
                },

                getGraphObjectLayout: function() {
                    return graphObjectLayout;
                },

                getGraphObjectContainer: function() {
                    return graphObjectContainer;
                },

                getGraphObjectDragElement: function() {
                    return graphObjectDragElement;
                },

                getGraphPaperContainer: function() {
                    return graphPaperContainer;
                },

                getGraphPaper: function() {
                    return graphPaper;
                },

                getGraphObjectLayoutBounds: function() {
                    return {
                        left:   0,
                        top:    0,
                        right:  graphObjectLayout.innerWidth(),
                        bottom: graphObjectLayout.innerHeight()
                    };
                },

                getGraphObjectLayoutScroll: function() {
                    return {
                        left: graphObjectLayout.scrollLeft(),
                        top: graphObjectLayout.scrollTop()
                    };
                },

                resetScroll: resetScroll,

                getGraphObjectContainerPosition: getGraphObjectContainerPosition,
                setGraphObjectContainerPosition: setGraphObjectContainerPosition
            };

            return graphLayoutHelper;
        }]);
    //
});
