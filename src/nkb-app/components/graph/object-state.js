//
// @author ankostyuk
//
define(function(require, exports, module) {'use strict';

                          require('lodash');
    var Commons         = require('commons-utils');
    var raphael         = require('raphael');
    var angular         = require('angular');
    //

    var State = {
        onDelay: 250
    };

    var Color = {
        //normal:     '#d0d0d0',
        normal:     '#999999',
        hover:      '#3a87ad',
        selected:   '#004466'
    };

    var Size = {
        edgeStrokeWidth:    2,
        arrowStrokeWidth:   1,

        edgeStrokeWidthStrong:  4,
        arrowStrokeWidthStrong: 2
    };

    var DefaultThemeStateColor = {
        'normal':           Color.normal,
        'hover':            Color.hover,
        'selected':         Color.selected,
        'selected-hover':   Color.hover,
        'vertex-selected':  Color.selected
    };

    var ThemeStateColor = {
        'default':  DefaultThemeStateColor,

        'yellow-0':     _.extend({}, DefaultThemeStateColor, {
            'normal':   '#fcf9df'
        }),
        'green-0':      _.extend({}, DefaultThemeStateColor, {
            'normal':   '#f2f8df'
        }),
        'blue-0':       _.extend({}, DefaultThemeStateColor, {
            'normal':   '#e5eff8'
        }),
        'purple-0':     _.extend({}, DefaultThemeStateColor, {
            'normal':   '#f1e8f4'
        }),

        'red':          _.extend({}, DefaultThemeStateColor, {
            'normal':   '#f2776e'
        }),
        'orange':       _.extend({}, DefaultThemeStateColor, {
            'normal':   '#f7b759'
        }),
        'yellow':       _.extend({}, DefaultThemeStateColor, {
            'normal':   '#f1e060'
        }),
        'green':        _.extend({}, DefaultThemeStateColor, {
            'normal':   '#bedc60'
        }),
        'blue':         _.extend({}, DefaultThemeStateColor, {
            'normal':   '#7cafdd'
        }),
        'purple':       _.extend({}, DefaultThemeStateColor, {
            'normal':   '#cda1de'
        }),
        'gray':         _.extend({}, DefaultThemeStateColor, {
            'normal':   '#dddddd'
        }),

        'black':        _.extend({}, DefaultThemeStateColor, {
            'normal':   '#000000'
        })
    };

    function getTheme(theme) {
        return ThemeStateColor[theme] ? theme : 'default';
    }

    var ElementStateSize = {
        'edgePaintElement': {
            'normal':           Size.edgeStrokeWidth,
            'hover':            Size.edgeStrokeWidth,
            'selected':         Size.edgeStrokeWidthStrong,
            'selected-hover':   Size.edgeStrokeWidthStrong,
            'vertex-selected':  Size.edgeStrokeWidth
        },
        'arrowPaintElement': {
            'normal':           Size.arrowStrokeWidth,
            'hover':            Size.arrowStrokeWidth,
            'selected':         Size.arrowStrokeWidthStrong,
            'selected-hover':   Size.arrowStrokeWidthStrong,
            'vertex-selected':  Size.arrowStrokeWidth
        }
    };

    var LineStyle = {
        'solid': '',
        'dashed': '-',
        'dotted': '.'
    };

    var LineWidth = {
        'edgePaintElement': {
            'default':  Size.edgeStrokeWidth,
            'strong':   Size.edgeStrokeWidthStrong
        },
        'arrowPaintElement': {
            'default':  Size.arrowStrokeWidth,
            'strong':   Size.arrowStrokeWidthStrong
        }
    };

    var Opacity = {
        'default': 1,
        'muted': 0.2
    };

    //
    return angular.module('app.graph.object-state', [])
        //
        .factory('objectStateHelper', ['$log', '$rootScope', '$timeout', '$document', 'desktopHelper', 'graphLayoutHelper', 'nodeHelper', 'keyboardHelper', function($log, $rootScope, $timeout, $document, desktopHelper, graphLayoutHelper, nodeHelper, keyboardHelper){
            var scope           = $rootScope,
                holdState       = false,
                statePromise    = null,
                // см. init():
                graphObjectContainer, nodePopupView, relationPopupView;

            //
            function init() {
                graphObjectContainer = graphLayoutHelper.getGraphObjectContainer();

                nodePopupView = nodeHelper.createNodePopupView(graphObjectContainer);
                relationPopupView = nodeHelper.createRelationPopupView(graphObjectContainer);

                //
                keyboardHelper.shortcut({
                    element: $document,
                    key: 'esc',
                    callback: function(){
                        objectStateHelper.toggleNodePopup(null, false);
                        objectStateHelper.toggleRelationPopup(null, false);
                    }
                });
            }

            //
            scope.$on('graph-object-drag-start', function(){
                holdState = true;
                desktopHelper.showTransparentMask();
            });

            scope.$on('graph-object-drag-stop', function(e, object, element, isMouseEnter){
                desktopHelper.hideTransparentMask();
                if (isMouseEnter === false) {
                    element.trigger('mouseleave');
                }
                holdState = false;
            });

            //
            scope.$on('do-graph-node-view-select', function(e, nodeView){
                objectStateHelper.selectVertex([nodeView]);
            });
            scope.$on('do-graph-node-views-select', function(e, nodeViews){
                objectStateHelper.selectVertex(nodeViews);
            });
            scope.$on('do-graph-relation-view-select', function(e, relationView){
                objectStateHelper.selectEdge(relationView);
            });

            //
            scope.$on('graph-select-area-start', function(e, domEvent){
                if (!isMultipleSelect(domEvent)) {
                    objectStateHelper.unselectAll();
                }
                selectedByArea = {};
            });
            scope.$on('do-graph-node-view-select-by-area', function(e, selectedNodeInfoMap, domEvent){
                // unselect
                _.each(selectedByArea, function(nodeInfo, key){
                    if (selectedNodeInfoMap[key]) {
                        return;
                    }

                    var nodeView = nodeInfo.nodeView,
                        selected = objectStateHelper.toggleVertexState(nodeInfo.nodeView, 'selected', false);
                    if (selected !== null ) {
                        onVertexSelect(nodeView, selected, 'MULTIPLE');
                        delete selectedByArea[key];
                    }
                });

                // select
                _.each(selectedNodeInfoMap, function(nodeInfo, key){
                    if (selectedByArea[key]) {
                        return;
                    }

                    var nodeView = nodeInfo.nodeView,
                        selected = objectStateHelper.toggleVertexState(nodeInfo.nodeView, 'selected', true);
                    if (selected !== null ) {
                        onVertexSelect(nodeView, selected, 'MULTIPLE');
                        selectedByArea[key] = nodeInfo;
                    }
                });
            });

            //
            function toggleState(on, func) {
                if (statePromise) {
                    $timeout.cancel(statePromise);
                }

                if (on) {
                    statePromise = $timeout(func, State.onDelay);
                } else {
                    func();
                }
            }

            // select
            var selectedObjects = {},
                selectedByArea = {},
                graphObjectSelectInfo = {};

            resetGraphObjectSelectInfo();
            scope.graphObjectSelectInfo = graphObjectSelectInfo;

            function resetGraphObjectSelectInfo() {
                selectedObjects = {};
                _.extend(graphObjectSelectInfo, {
                    nodes: 0,
                    relations: 0,
                    links: 0,
                    userObjects: 0,
                    byTypes: {
                        vertices: {},
                        edges: {}
                    },
                    total: 0
                });
            }

            function isMultipleSelect(e) {
                return e === 'MULTIPLE' || (e && e.shiftKey);
            }

            function onVertexSelect(nodeView, selected, e) {
                if (!isMultipleSelect(e)) {
                    unselectAll();
                }

                var nodeScope   = nodeView.nodeScope,
                    inc         = selected ? 1 : -1,
                    objectUID   = nodeScope.node.__uid,
                    type        = nodeScope.node._type,
                    byType      = graphObjectSelectInfo.byTypes.vertices[type];

                if (nodeScope.node._type === 'LINK') {
                    graphObjectSelectInfo.links += inc;
                    graphObjectSelectInfo.links = Math.max(graphObjectSelectInfo.links, 0);
                } else
                if (nodeScope.node._type === 'USER_OBJECT') {
                    graphObjectSelectInfo.userObjects += inc;
                    graphObjectSelectInfo.userObjects = Math.max(graphObjectSelectInfo.userObjects, 0);
                } else {
                    graphObjectSelectInfo.nodes += inc;
                    graphObjectSelectInfo.nodes = Math.max(graphObjectSelectInfo.nodes, 0);
                }

                graphObjectSelectInfo.byTypes.vertices[type] = Math.max((_.isUndefined(byType) ? 0 : byType) + inc, 0);

                onObjectSelect(selected, nodeView, objectUID);
            }

            function onEdgeSelect(edgeInfo, selected, e) {
                if (!isMultipleSelect(e)) {
                    unselectAll();
                }

                var inc     = selected ? 1 : -1,
                    type    = edgeInfo.relationView.relationType,
                    byType  = graphObjectSelectInfo.byTypes.edges[type];

                graphObjectSelectInfo.relations += inc;
                graphObjectSelectInfo.relations = Math.max(graphObjectSelectInfo.relations, 0);

                graphObjectSelectInfo.byTypes.edges[type] = Math.max((_.isUndefined(byType) ? 0 : byType) + inc, 0);

                onObjectSelect(selected, edgeInfo, edgeInfo.edgeUID);
            }

            function onObjectSelect(selected, object, objectUID) {
                if (selected) {
                    selectedObjects[objectUID] = object;
                } else {
                    delete selectedObjects[objectUID];
                }

                scope.safeApply(function(){
                    graphObjectSelectInfo.total = _.size(selectedObjects);
                });

                scope.$emit('graph-object-select', selectedObjects, graphObjectSelectInfo);
            }

            function unselectAll() {
                scope.safeApply(function(){
                    _.each(objectStateHelper.getSelectedObjects(), function(object){
                        if (object.objectType === 'vertex') {
                            objectStateHelper.toggleVertexState(object, 'selected', false);
                        } else
                        if (object.objectType === 'edge') {
                            objectStateHelper.toggleEdgeState(object, 'selected', false);
                        }
                    });

                    resetGraphObjectSelectInfo();
                });
            }

            // state
            var StateKeyUtils = {

                calcOutputStateCount: function(outputStateCounter, inputStates){
                    _.each(inputStates, function(v, inputState){
                        _.each(outputStateCounter, function(c, outputState){
                            if (inputState.indexOf(outputState) >= 0) {
                                outputStateCounter[outputState]++;
                            }
                        });
                    });
                },

                vertex: {
                    getOutputStateKey: function(inputStates){
                        var outputStateCounter = {
                            'hover': 0,
                            'self-selected': 0,
                            'edge-selected': 0
                        };

                        StateKeyUtils.calcOutputStateCount(outputStateCounter, inputStates);

                        if (outputStateCounter['hover'] && !outputStateCounter['self-selected']) {
                            return 'hover';
                        } else
                        if (outputStateCounter['self-selected'] && !outputStateCounter['hover']) {
                            return 'selected';
                        } else
                        if (outputStateCounter['self-selected'] && outputStateCounter['hover']) {
                            return 'selected-hover';
                        } else
                        if (outputStateCounter['edge-selected'] && !outputStateCounter['hover'] && !outputStateCounter['self-selected']) {
                            return 'edge-selected';
                        }
                    }
                },

                edge: {
                    getOutputStateKey: function(inputStates){
                        var outputStateCounter = {
                            'hover': 0,
                            'self-selected': 0,
                            'vertex-selected': 0
                        };

                        StateKeyUtils.calcOutputStateCount(outputStateCounter, inputStates);

                        if (outputStateCounter['hover'] && !outputStateCounter['self-selected']) {
                            return 'hover';
                        } else
                        if (outputStateCounter['self-selected'] && !outputStateCounter['hover']) {
                            return 'selected';
                        } else
                        if (outputStateCounter['self-selected'] && outputStateCounter['hover']) {
                            return 'selected-hover';
                        } else
                        if (outputStateCounter['vertex-selected'] && !outputStateCounter['hover'] && !outputStateCounter['self-selected']) {
                            return 'vertex-selected';
                        }
                    }
                }
            };

            function toggleObjectState(object, toggledState, stateValue) {
                var objectState = object['object-state'],
                    states      = objectState.states,
                    on          = stateValue === undefined ?
                                    states[toggledState] = !states[toggledState] :
                                    states[toggledState] = stateValue;

                if (!on) {
                    delete states[toggledState];
                }

                return _.isEmpty(states) ? 'normal' : StateKeyUtils[object.objectType].getOutputStateKey(states);
            }

            function drawVertex(nodeView, stateKey) {
                    stateKey    = stateKey || nodeView['object-state'].stateKey;
                var theme       = nodeView.nodeScope.node._style.theme;

                nodeView['object-state'].stateKey = stateKey;
                // TODO draw key [stateKey-theme]? Для кеширования перерисовки

                Commons.DOMUtils.attrAsClass(nodeView.nodeElement, {
                    'state':    stateKey,
                    'theme':    theme
                });
            }

            function drawEdge(edgeInfo, stateKey) {
                    stateKey    = stateKey || edgeInfo['object-state'].stateKey;

                var theme       = getTheme(edgeInfo.relationView._style.theme),
                    color       = ThemeStateColor[theme][stateKey],
                    lineStyle   = LineStyle[edgeInfo.relationView._style.lineStyle],
                    lineWidth   = edgeInfo.relationView._style.lineWidth,
                    opacityName = edgeInfo.relationView._style.opacity,
                    opacity     = Opacity[opacityName];

                edgeInfo['object-state'].stateKey = stateKey;
                // TODO draw key [stateKey-theme]? Для кеширования перерисовки

                edgeInfo.edgePaintElement.attr({
                    'opacity':          opacity,
                    'stroke':           color,
                    'stroke-width':     Math.max(LineWidth['edgePaintElement'][lineWidth], ElementStateSize['edgePaintElement'][stateKey]),
                    'stroke-dasharray': lineStyle
                });
                edgeInfo.arrowPaintElement.attr({
                    'opacity':          opacity,
                    'fill':             color,
                    'stroke':           color,
                    'stroke-width':     Math.max(LineWidth['arrowPaintElement'][lineWidth], ElementStateSize['arrowPaintElement'][stateKey])
                });
                Commons.DOMUtils.attrAsClass(edgeInfo.relationView.relationElement, {
                    'opacity':          opacityName,
                    'state':            stateKey,
                    'theme':            theme
                });
            }

            //
            function initVertexHover(nodeView) {
                /*
                nodeView.nodeElement
                    .hover(
                        function(e){
                            toggle(true);
                        },
                        function(){
                            toggle(false);
                        }
                    );
                */

                nodeView.nodeBodyElement
                    .mouseenter(function(e){
                        toggle(true, e);
                    });

                nodeView.nodeElement
                    .mouseleave(function(e){
                        toggle(false, e);
                    });

                function toggle(on, e) {
                    toggleState(on, function(){
                        objectStateHelper.toggleVertexState(nodeView, 'hover', on);
                        objectStateHelper.toggleNodePopup(nodeView, on, e);
                    });
                }
            }

            function initVertexSelect(nodeView) {
                var toggledState = 'selected';

                nodeView.nodeBodyElement
                    .click(function(e){
                        toggle(e);
                    });

                function toggle(e) {
                    if (!nodeView.canToggleState(e)) {
                        return;
                    }

                    var selected = objectStateHelper.toggleVertexState(nodeView, toggledState);
                    if (selected !== null ) {
                        onVertexSelect(nodeView, selected, e);
                    }
                }
            }

            function initEdgeHover(edgeInfo) {
                /*
                edgeInfo.relationView.relationElement
                    .hover(
                        function(){
                            toggle(true);
                        },
                        function(){
                            toggle(false);
                        }
                    );
                */

                edgeInfo.relationView.relationBodyElement
                    .mouseenter(function(e){
                        toggle(true, e, true);
                    });

                edgeInfo.relationView.relationElement
                    .mouseleave(function(e){
                        toggle(false, e, true);
                    });

                edgeInfo.edgePaintElement
                    .hover(
                        function(){
                            toggle(true);
                        },
                        function(){
                            toggle(false);
                        }
                    );

                function toggle(on, e, popup) {
                    toggleState(on, function(){
                        objectStateHelper.toggleEdgeState(edgeInfo, 'hover', on);
                        if (popup) {
                            objectStateHelper.toggleRelationPopup(edgeInfo, on, e);
                        }
                    });
                }
            }

            function initEdgeSelect(edgeInfo) {
                var toggledState = 'selected';

                edgeInfo.relationView.relationBodyElement
                    .click(function(e){
                        toggle(e);
                    });

                edgeInfo.edgePaintElement
                    .click(function(e){
                        toggle(e);
                    });

                function toggle(e) {
                    var selected = objectStateHelper.toggleEdgeState(edgeInfo, toggledState);
                    if (selected !== null ) {
                        onEdgeSelect(edgeInfo, selected, e);
                    }
                }
            }

            //
            var objectStateHelper = {

                getGraphObjectSelectInfo: function(){
                    return graphObjectSelectInfo;
                },

                isGraphObjectSelected: function(){
                    return graphObjectSelectInfo.total > 0;
                },

                getSelectedObjects: function(){
                    return selectedObjects;
                },

                unselectAll: function(){
                    nodePopupView.hide();
                    relationPopupView.hide();
                    unselectAll();
                    scope.$emit('graph-object-unselect-all');
                },

                selectVertex: function(nodeViews){
                    unselectAll();
                    _.each(nodeViews, function(nodeView){
                        var selected = objectStateHelper.toggleVertexState(nodeView, 'selected', true);
                        if (selected !== null ) {
                            onVertexSelect(nodeView, selected, 'MULTIPLE');
                        }
                    });
                },

                selectEdge: function(relationView){
                    var edgeInfo = relationView.edgeInfo;
                    unselectAll();
                    var selected = objectStateHelper.toggleEdgeState(edgeInfo, 'selected', true);
                    if (selected !== null ) {
                        onEdgeSelect(edgeInfo, selected, 'MULTIPLE');
                    }
                },

                toggleVertexState: function(nodeView, toggledState, stateValue){
                    var objectState             = nodeView['object-state'],
                        selfToggledState        = 'self-' + toggledState,
                        edgesToggledState       = 'vertex-' + toggledState,
                        dstVertexToggledState   = 'vertex-edge-' + toggledState;

                    if (holdState) {
                        return null;
                    }

                    // "Активная" вершина
                    var selfStateKey = toggleObjectState(nodeView, selfToggledState, stateValue);
                    drawVertex(nodeView, selfStateKey);

                    // Дочерние связи
                    _.each(nodeView.nodeScope.edges.children, function(edgeInfo){
                        var edgeStateKey = toggleObjectState(edgeInfo, edgesToggledState, stateValue);
                        drawEdge(edgeInfo, edgeStateKey);

                        // Конечная вершина каждой дочерней связи за исключением замкнутой связи
                        if (edgeInfo.type.name !== 'closed') {
                            var dstVertexStateKey = toggleObjectState(edgeInfo.dstNodeView, dstVertexToggledState, stateValue);
                            drawVertex(edgeInfo.dstNodeView, dstVertexStateKey);
                        }
                    });

                    return objectState.states[selfToggledState];
                },

                toggleEdgeState: function(edgeInfo, toggledState, stateValue){
                    var objectState             = edgeInfo['object-state'],
                        selfToggledState        = 'self-' + toggledState,
                        verticesToggledState    = 'edge-' + toggledState;

                    if (holdState) {
                        return null;
                    }

                    // "Активная" связь
                    var selfStateKey = toggleObjectState(edgeInfo, selfToggledState, stateValue);
                    drawEdge(edgeInfo, selfStateKey);

                    // Начальная и конечная вершины связи
                    var srcVertexStateKey, dstVertexStateKey;

                    if (edgeInfo.type.name === 'closed') { // Замкнутая связь
                        srcVertexStateKey = toggleObjectState(edgeInfo.srcNodeView, verticesToggledState, stateValue);

                        drawVertex(edgeInfo.srcNodeView, srcVertexStateKey);
                    } else {
                        srcVertexStateKey = toggleObjectState(edgeInfo.srcNodeView, verticesToggledState, stateValue);
                        dstVertexStateKey = toggleObjectState(edgeInfo.dstNodeView, verticesToggledState, stateValue);

                        drawVertex(edgeInfo.srcNodeView, srcVertexStateKey);
                        drawVertex(edgeInfo.dstNodeView, dstVertexStateKey);
                    }

                    return objectState.states[selfToggledState];
                },

                setVertexInsistent: function(nodeView) {
                    objectStateHelper.setVertexTheme(nodeView, 'orange', true);
                },

                setVertexTheme: function(nodeView, theme, noDrawVertex){
                    nodeView.nodeScope.node._style.theme = theme;

                    if (!noDrawVertex) {
                        drawVertex(nodeView);
                    }
                },

                setEdgeTheme: function(edgeInfo, theme){
                    edgeInfo.relationView._style.theme = theme;
                    drawEdge(edgeInfo);
                },

                setEdgeLineStyle: function(edgeInfo, lineStyle){
                    edgeInfo.relationView._style.lineStyle = lineStyle;
                    drawEdge(edgeInfo);
                },

                setEdgeLineWidth: function(edgeInfo, lineWidth){
                    edgeInfo.relationView._style.lineWidth = lineWidth;
                    drawEdge(edgeInfo);
                },

                setEdgeOpacity: function(edgeInfo, opacity){
                    edgeInfo.relationView._style.opacity = opacity;
                    drawEdge(edgeInfo);
                },

                initVertexState: function(nodeView){
                    // node style
                    var _style = nodeView.nodeScope.node._style = nodeView.nodeScope.node._style || {};
                    _style.theme = _style.theme || 'default';

                    //
                    nodeView['object-state'] = {
                        states: {}
                    };

                    //
                    initVertexHover(nodeView);
                    initVertexSelect(nodeView);

                    //
                    drawVertex(nodeView, 'normal');
                },

                initEdgeState: function(edgeInfo){
                    // relation style
                    var _style = edgeInfo.relationView._style = edgeInfo.relationView.getStyle();
                    _style.theme        = _style.theme      || 'default';
                    _style.lineStyle    = _style.lineStyle  || 'default';
                    _style.lineWidth    = _style.lineWidth  || 'default';
                    _style.opacity      = _style.opacity    || 'default';

                    //
                    edgeInfo['object-state'] = {
                        states: {}
                    };

                    //
                    initEdgeHover(edgeInfo);
                    initEdgeSelect(edgeInfo);

                    //
                    drawEdge(edgeInfo, 'normal');
                },

                // @Deprectaed
                holdObjectState: function(object, hold){
                    object['object-state'].holdState = hold;
                },

                toggleNodePopup: function(nodeView, on, e){
                    if (on) {
                        if (!isMultipleSelect(e)) {
                            nodePopupView.show(nodeView);
                        }
                    } else {
                        nodePopupView.hide();
                    }
                },

                toggleRelationPopup: function(edgeInfo, on, e){
                    if (on) {
                        if (!isMultipleSelect(e)) {
                            relationPopupView.show(edgeInfo.relationView);
                        }
                    } else {
                        relationPopupView.hide();
                    }
                },

                init: function(){
                    init();
                }
            };

            return objectStateHelper;
        }]);
    //
});
