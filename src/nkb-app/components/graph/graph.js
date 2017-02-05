//
// @author ankostyuk
//
define(function(require, exports, module) {'use strict';

                          require('lodash');
    var Commons         = require('commons-utils');
    var purl            = require('purl');
    var raphael         = require('raphael');
    var angular         = require('angular');

    var subModules = {
        zoom:             require('./zoom'),
        layout:           require('./layout'),
        history:          require('./history'),
        objectState:      require('./object-state'),
        objectDrag:       require('./object-drag')
    };
    //

    var GraphSettings = {
        vertex: {
            boundsMargin: 3
        },
        edge: {
            //arrowLength: 8,
            arrowLength: 10,
            //arrowLift: 3,
            arrowLift: 5,
            //arrowFoldback: 3,
            arrowFoldback: 7,
            viewLocation: 0.35,
            types: {
                // Стандартная связь.
                // От объекта A к объекту B
                common: {
                    name: 'common'
                },
                // Двунаправленная связь.
                // От объекта A к объекту B при наличии связи от объекта B к объекту A
                bidirectional: {
                    name: 'bidirectional',
                    offset: 5
                },
                // Замкнутая связь.
                // От объекта A к объекту A
                closed: {
                    name: 'closed',
                    width: 10,
                    height: 20,
                    zoomIndexToHide: 3
                }
            }
        },
        position: {
            cascadeLayout: {
                indent: {
                    left: 18,
                    top: 18
                }
            },
            snowballLayout: {
                indent: {
                    left: 20,
                    top: 20
                },
                margin: {
                    left: 200,
                    top: 200
                }
            },
            gridLayout: {
                indent: {
                    left: 20,
                    top: 20
                },
                margin: {
                    left: 150,
                    top: 100
                },
                alternateOffset: {
                    left: 0,
                    top: 200
                }
            }
        },
        history: {
            size: 10
        }
    };

    //
    return angular.module('app.graph', _.pluck(subModules, 'name'))
        //
        .factory('graphHelper', ['$log', '$q', '$timeout', '$rootScope', '$window', 'searchHelper', 'relationsHelper', 'nodeHelper', 'metaHelper', 'desktopHelper', 'graphZoomHelper', 'graphLayoutHelper', 'objectStateHelper', 'objectDragHelper', 'graphHistoryHelper', 'npRsearchMetaHelper', function($log, $q, $timeout, $rootScope, $window, searchHelper, relationsHelper, nodeHelper, metaHelper, desktopHelper, graphZoomHelper, graphLayoutHelper, objectStateHelper, objectDragHelper, graphHistoryHelper, npRsearchMetaHelper){
            var scope = $rootScope,
                // см. initGraph():
                graphObjectContainer, graphPaper,
                dragAndDropNodeView;

            //
            var __nodes = {};

            //
            var graphObjectSelectInfo = objectStateHelper.getGraphObjectSelectInfo();

            //
            scope.$on('object-toggle-hold-zoom', function(){
                objectStateHelper.toggleNodePopup(null, false);
                repaint();
            });

            scope.$on('node-view-content-change', function(e, nodeView){
                updateNodeView(nodeView);
            });
            scope.$on('show-node-relations-on-report', function(e, node, mergedType){
                showNodeRelations(node, mergedType);
            });
            scope.$on('add-node-relations-on-report', function(e, node, mergedType){
                addNodeRelations(node, [mergedType], true);
            });
            scope.$on('do-graph-node-select', function(e, node){
                if (__nodes[node.__uid]) {
                    scope.$emit('do-graph-node-view-select', __nodes[node.__uid].nodeView);
                }
            });

            scope.$on('graph-select-area', function(e, selectArea, domEvent){
                scope.$emit('do-graph-node-view-select-by-area', getSelectedByArea(selectArea), domEvent);
            });

            scope.$on('data-update', function(e, data){
                scope.safeApply(function(){
                    merge(data);
                });
            });

            // <<< remove when resolved https://github.com/newpointer/relations/issues/17
            function nodesLists(nodeType, nodesCollection) {
                nodeType = nodeType || 'COMPANY';
                npRsearchMetaHelper.nodesLists(nodeType, nodesCollection);
            }
            // >>>

            //
            function showNodeRelations(node, mergedType) {
                var nodeViews = {};

                _.each(node.__relationsOnReportInfo.byMergedTypes[mergedType].relations, function(relation){
                    var relationType    = metaHelper.getRelationType(relation._type),
                        srcNodeUID      = nodeHelper.buildNodeUIDByType(relation._srcId, relationType.sourceNodeType),
                        dstNodeUID      = nodeHelper.buildNodeUIDByType(relation._dstId, relationType.destinationNodeType);

                    nodeViews[srcNodeUID] = __nodes[srcNodeUID].nodeView;
                    nodeViews[dstNodeUID] = __nodes[dstNodeUID].nodeView;
                });

                nodeViews[node.__uid] = __nodes[node.__uid].nodeView;

                scope.$emit('do-graph-node-views-select', nodeViews);
            }

            function nodeViewsToNodes(nodeViews) {
                var nodes   = new Array(_.size(nodeViews)),
                    i       = 0;

                _.each(nodeViews, function(nodeView){
                    nodes[i++] = nodeView.nodeScope.node;
                });

                return nodes;
            }

            function getNodeVerticesBounds(nodeViews) {
                return buildBounds(nodeViews, function(k, v){
                    return v.nodeScope.vertex.bounds;
                });
            }

            function getGraphDOMBounds() {
                var elements = graphObjectContainer.find('[node-graph-view], [node-graph-view] .comment, [relation-graph-view], [relation-graph-view] .comment');

                return buildBounds(elements, function(k, v){
                    var element = $(v);

                    if (!element.is(':visible')) {
                        return;
                    }

                    var offset = element.offset();

                    return {
                        minX: offset.left,
                        minY: offset.top,
                        maxX: offset.left + element.outerWidth(),
                        maxY: offset.top + element.outerHeight()
                    };
                });
            }

            function buildBounds(collection, eachBounds) {
                var bounds = {
                    minX: Number.MAX_VALUE,
                    minY: Number.MAX_VALUE,
                    maxX: -Number.MAX_VALUE,
                    maxY: -Number.MAX_VALUE
                };

                $.each(collection, function(k, v){
                    var b = eachBounds(k, v);

                    if (!b) {
                        return;
                    }

                    if (bounds.minX > b.minX) {
                        bounds.minX = b.minX;
                    }
                    if (bounds.minY > b.minY) {
                        bounds.minY = b.minY;
                    }
                    if (bounds.maxX < b.maxX) {
                        bounds.maxX = b.maxX;
                    }
                    if (bounds.maxY < b.maxY) {
                        bounds.maxY = b.maxY;
                    }
                });

                bounds.left    = bounds.minX;
                bounds.top     = bounds.minY;
                bounds.right   = bounds.maxX;
                bounds.bottom  = bounds.maxY;

                return bounds;
            }

            function getGraphBounds() {
                return getNodeVerticesBounds(_.pluck(__nodes, 'nodeView'));
            }

            /*
             * nodeViews - набор view нод, которые надо позиционировать.
             *
             * bounds   - область, относительно которой будут позиционированы ноды.
             *          Если bounds:
             *          node view list  - будет вычислена область по данному набору view нод
             *          'report'        - будет вычислена область отчёта
             *
             * align    - 'center'
             *          - 'left-top'
             *          - {left, top}
             *
             * layout   - 'cascade'
             *          - 'snowball'
             *          - 'grid'
             *
             * offset   - {left, top}
             *
             */
            function positionNodeViews(nodeViews, bounds, align, layout, offset, data) {
                var b, start, indent, margin, alternateOffset, layoutInfo,
                    position, width, height, lefts,
                    nodeViewMap, nodes;

                // bounds
                if (_.isArray(bounds)) {
                    b = getNodeVerticesBounds(bounds);
                } else
                if (bounds === 'report') {
                    b = graphLayoutHelper.getGraphObjectLayoutBounds();
                }

                // align
                if (align === 'center') {
                    start = {
                        left: (b.left + b.right) / 2,
                        top: (b.top + b.bottom) / 2
                    };
                } else
                if (align === 'left-top') {
                    start = {
                        left: b.left,
                        top: b.top
                    };
                    // TODO в настройку
                    offset = {
                        left: 20,
                        top: 20
                    };
                } else
                if (_.isObject(align)) {
                    start = _.clone(align);
                }

                // offset
                if (offset) {
                    start.left += offset.left;
                    start.top += offset.top;
                }

                // layout
                if (layout === 'cascade') {
                    indent = GraphSettings.position.cascadeLayout.indent;

                    _.each(nodeViews, function(nodeView, i){
                        nodeView.setPosition({
                            left: start.left + i * indent.left,
                            top: start.top + i * indent.top
                        }, true);
                    });
                } else
                if (layout === 'snowball') {
                    indent      = GraphSettings.position.snowballLayout.indent;
                    margin      = GraphSettings.position.snowballLayout.margin;
                    layoutInfo  = getSnowballLayoutInfo(nodeViews, align);

                    if (align === 'left') {
                        position = {
                            left: b.left,
                            top: (b.top + b.bottom) / 2
                        };

                        position.left -= layoutInfo.width + margin.left;
                        position.top -= layoutInfo.height / 2;

                        _.each(nodeViews, function(nodeView){
                            height = nodeView.nodeElement.outerHeight();
                            nodeView.setPosition(position, true);
                            position.top += height + indent.top;
                        });
                    } else
                    if (align === 'right') {
                        position = {
                            left: b.right,
                            top: (b.top + b.bottom) / 2
                        };

                        position.left += margin.left;
                        position.top -= layoutInfo.height / 2;

                        _.each(nodeViews, function(nodeView){
                            height = nodeView.nodeElement.outerHeight();
                            nodeView.setPosition(position, true);
                            position.top += height + indent.top;
                        });
                    } else
                    if (align === 'top') {
                        position = {
                            left: (b.left + b.right) / 2,
                            top: b.top
                        };

                        position.left -= layoutInfo.width / 2;
                        position.top -= layoutInfo.height + margin.top;

                        _.each(nodeViews, function(nodeView){
                            width = nodeView.nodeElement.outerWidth();
                            nodeView.setPosition(position, true);
                            position.left += width + indent.left;
                        });
                    } else
                    if (align === 'bottom') {
                        position = {
                            left: (b.left + b.right) / 2,
                            top: b.bottom
                        };

                        position.left -= layoutInfo.width / 2;
                        position.top += margin.top;

                        _.each(nodeViews, function(nodeView){
                            width = nodeView.nodeElement.outerWidth();
                            nodeView.setPosition(position, true);
                            position.left += width + indent.left;
                        });
                    }
                } else
                if (layout === 'grid') {
                    nodeViewMap = buildNodeViewMap();

                    nodes = {};
                    lefts = [];

                    margin = GraphSettings.position.gridLayout.margin;
                    alternateOffset = GraphSettings.position.gridLayout.alternateOffset;

                    position = {
                        top: offset.top
                    };

                    _.each(data.nodesGrid.grid, function(nodesRow){
                        var maxHeight = 0,
                            nodeCount = _.size(nodesRow);

                        position.left = offset.left;

                        _.each(nodesRow, function(nodeIndex, j){
                            var node    = data.nodesGrid.nodes[nodeIndex],
                                nodeUID = nodeHelper.buildNodeUIDByType(node.id, node.type);

                            if (nodes[nodeUID]) {
                                position.left = lefts[j + 1] || position.left;
                                return;
                            }

                            lefts[j] = position.left;

                            var nodeView = nodeViewMap[nodeUID];

                            nodeView.setPosition({
                                left: position.left,
                                top: position.top + (j % 2) * alternateOffset.top
                            }, true);

                            if (j === 0 || j === nodeCount - 1) {
                                objectStateHelper.setVertexInsistent(nodeView);
                            }

                            maxHeight = Math.max(maxHeight, nodeView.nodeElement.outerHeight());
                            position.left += (nodeView.nodeElement.outerWidth() + margin.left);

                            nodes[nodeUID] = true;
                        });

                        position.top += (maxHeight ? (maxHeight + margin.top + alternateOffset.top) : 0);
                    });
                }

                function getSnowballLayoutInfo(nodeViews, align) {
                    var indent = GraphSettings.position.snowballLayout.indent;

                    var info = {};

                    if (align === 'left' || align === 'right') {
                        info = {
                            width: 0,
                            height: -indent.top
                        };

                        _.each(nodeViews, function(nodeView, i){
                            var w = nodeView.nodeElement.outerWidth();
                            info.width = info.width < w ? w : info.width;

                            info.height += nodeView.nodeElement.outerHeight() + indent.top;
                        });
                    } else
                    if (align === 'top' || align === 'bottom') {
                        info = {
                            width: -indent.left,
                            height: 0
                        };

                        _.each(nodeViews, function(nodeView, i){
                            var h = nodeView.nodeElement.outerHeight();
                            info.height = info.height < h ? h : info.height;

                            info.width += nodeView.nodeElement.outerWidth() + indent.left;
                        });
                    }

                    return info;
                }
            }

            function addVertices(nodeViews) {
                _.each(nodeViews, function(nodeView, i){
                    var nodeScope       = nodeView.nodeScope,
                        nodeElement     = nodeView.nodeElement;

                    nodeScope.vertexOffset = nodeView.getCentralPointOffset();
                    nodeScope.edges = {
                        children: {},
                        parents: {}
                    };
                    nodeScope.relationsOnReport = {};

                    buildNodeBox(nodeView);

                    //
                    objectStateHelper.initVertexState(nodeView);
                    objectDragHelper.initVertexDrag(nodeView, function(nodeView, nodeViewPosition, selectedVertices){
                        nodeView.setPosition(nodeViewPosition);
                        updateNodeView(nodeView, true);

                        _.each(selectedVertices, function(vertex){
                            vertex.nodeView.setPosition({
                                'left': nodeViewPosition.left + vertex.offset.x,
                                'top': nodeViewPosition.top + vertex.offset.y
                            });
                            updateNodeView(vertex.nodeView, true);
                        });
                    }, {
                        stop: function(){
                            scope.$emit('vertex-drag-stop');
                        }
                    });
                });
            }

            function buildNodeBox(nodeView, positionOnly) {
                nodeView.correctDimensions();

                var nodeScope       = nodeView.nodeScope,
                    nodeElement     = nodeView.nodeElement,
                    nodeWidth       = positionOnly ? nodeScope.vertex.bounds.ex : nodeElement.outerWidth(),
                    nodeHeight      = positionOnly ? nodeScope.vertex.bounds.ey : nodeElement.outerHeight(),
                    boundsMargin    = GraphSettings.vertex.boundsMargin;

                var nodePosition    = nodeView.getPosition(),
                    nodeX           = nodePosition.left,
                    nodeY           = nodePosition.top;

                var x0  = nodeX + nodeScope.vertexOffset,
                    y0  = nodeY + nodeScope.vertexOffset;

                nodeScope.vertex = _.extend(nodeScope.vertex || {}, {
                    x0: x0,
                    y0: y0,
                    x: x0,
                    y: y0,
                    bounds: {
                        minX: nodeX - boundsMargin,
                        minY: nodeY - boundsMargin,
                        maxX: nodeX + nodeWidth + boundsMargin,
                        maxY: nodeY + nodeHeight + boundsMargin,
                        ex: nodeWidth,
                        ey: nodeHeight
                    }
                });
            }

            function paintEdge(edgeInfo) {
                var srcNodeVertex = edgeInfo.srcNodeVertex,
                    dstNodeVertex = edgeInfo.dstNodeVertex,
                    guide         = {},
                    Ax, Ay, Bx, By, iA, iB, Ex, Ey, E, Px, Py,
                    edgePaintPath, arrowPaintPath;

                // Стандартная связь
                if (edgeInfo.type === GraphSettings.edge.types.common) {
                    iA = lineBoundsIntersection(srcNodeVertex, dstNodeVertex, srcNodeVertex.bounds) || [];
                    iB = lineBoundsIntersection(srcNodeVertex, dstNodeVertex, dstNodeVertex.bounds) || [];

                    Ax = iA[0] || srcNodeVertex.x;
                    Ay = iA[1] || srcNodeVertex.y;
                    Bx = iB[0] || dstNodeVertex.x;
                    By = iB[1] || dstNodeVertex.y;

                    edgePaintPath = [['M', Ax, Ay], ['L', Bx, By]];

                    //
                    guide.Ax = srcNodeVertex.x;
                    guide.Ay = srcNodeVertex.y;
                    guide.Bx = dstNodeVertex.x;
                    guide.By = dstNodeVertex.y;
                } else
                // Двунаправленная связь
                if (edgeInfo.type === GraphSettings.edge.types.bidirectional) {
                    Ex  = dstNodeVertex.x - srcNodeVertex.x;
                    Ey  = dstNodeVertex.y - srcNodeVertex.y;
                    E   = Math.sqrt(Ex*Ex + Ey*Ey) || 1;
                    Px  = -Ey;
                    Py  = Ex;

                    var srcV = {
                        x: srcNodeVertex.x - (Px / E) * edgeInfo.type.offset,
                        y: srcNodeVertex.y - (Py / E) * edgeInfo.type.offset
                    };
                    var dstV = {
                        x: dstNodeVertex.x - (Px / E) * edgeInfo.type.offset,
                        y: dstNodeVertex.y - (Py / E) * edgeInfo.type.offset
                    };

                    iA = lineBoundsIntersection(srcV, dstV, srcNodeVertex.bounds) || [];
                    iB = lineBoundsIntersection(srcV, dstV, dstNodeVertex.bounds) || [];

                    Ax = iA[0] || srcV.x;
                    Ay = iA[1] || srcV.y;
                    Bx = iB[0] || dstV.x;
                    By = iB[1] || dstV.y;

                    edgePaintPath = [['M', Ax, Ay], ['L', Bx, By]];

                    //
                    guide.Ax = srcV.x;
                    guide.Ay = srcV.y;
                    guide.Bx = dstV.x;
                    guide.By = dstV.y;
                } else
                // Замкнутая связь
                if (edgeInfo.type === GraphSettings.edge.types.closed) {
                    Bx = srcNodeVertex.bounds.maxX - edgeInfo.type.width;
                    By = srcNodeVertex.bounds.minY;
                    Ax = Bx;
                    Ay = By - edgeInfo.type.height;

                    var A1x = srcNodeVertex.bounds.maxX,
                        A1y = By,
                        B1x = A1x,
                        B1y = Ay;

                    edgePaintPath = [['M', A1x, A1y], ['L', B1x, B1y], ['L', Ax, Ay], ['L', Bx, By]];

                    // !!!
                    guide.Ax = Ax;
                    guide.Ay = Ay;
                    guide.Bx = Bx;
                    guide.By = By;
                }

                //
                Ex  = Bx - Ax;
                Ey  = By - Ay;
                E   = Math.sqrt(Ex*Ex + Ey*Ey) || 1;

                var cosE    = Ex / E,
                    sinE    = Ey / E;

                // arrow:
                // Вектор перпендикуляра к вектору направления ребра
                Px = -Ey;
                Py = Ex;
                // Точки на перпендикуляре:
                // H|W = M +- NP * l, где:
                //  M                   - координаты "длины" arrow,
                //  NP  = [Px/E, Py/E]  - нормальный (единичный) вектор перпендикуляра,
                //  l                   - "подъём" arrow от линии.
                var Hx = Bx - cosE * GraphSettings.edge.arrowLength - (Px / E) * GraphSettings.edge.arrowLift,
                    Hy = By - sinE * GraphSettings.edge.arrowLength - (Py / E) * GraphSettings.edge.arrowLift,
                    Wx = Bx - cosE * GraphSettings.edge.arrowLength + (Px / E) * GraphSettings.edge.arrowLift,
                    Wy = By - sinE * GraphSettings.edge.arrowLength + (Py / E) * GraphSettings.edge.arrowLift,
                    // Излом arrow
                    Fx = Bx - cosE * GraphSettings.edge.arrowFoldback,
                    Fy = By - sinE * GraphSettings.edge.arrowFoldback;

                arrowPaintPath  = [['M', Bx, By], ['L', Hx, Hy], ['L', Fx, Fy], ['L', Wx, Wy], ['Z']];

                //
                if (edgeInfo.edgePaintElement) {
                    edgeInfo.edgePaintElement.attr({
                        'path': edgePaintPath
                    });
                    edgeInfo.arrowPaintElement.attr({
                        'path': arrowPaintPath
                    });
                } else {
                    edgeInfo.edgePaintElement = graphPaper.path(edgePaintPath);
                    edgeInfo.arrowPaintElement = graphPaper.path(arrowPaintPath);
                }

                if (edgeInfo.type.zoomIndexToHide) {
                    if (edgeInfo.type.zoomIndexToHide > graphZoomHelper.getZoom().index) {
                        edgeInfo.edgePaintElement.show();
                        edgeInfo.arrowPaintElement.show();
                    } else {
                        edgeInfo.edgePaintElement.hide();
                        edgeInfo.arrowPaintElement.hide();
                    }
                }

                // вектор направляющей ребра
                guide.Lx = guide.Bx - guide.Ax;
                guide.Ly = guide.By - guide.Ay;
                guide.L = Math.sqrt(guide.Lx * guide.Lx + guide.Ly * guide.Ly) || 1;
                edgeInfo.guide = guide;

                //
                function lineBoundsIntersection(A, B, bounds) {
                    var p;

                    p = linesIntersection(A.x, A.y, B.x, B.y, bounds.minX, bounds.minY, bounds.maxX, bounds.minY);
                    if (p) {
                        return p;
                    }

                    p = linesIntersection(A.x, A.y, B.x, B.y, bounds.maxX, bounds.minY, bounds.maxX, bounds.maxY);
                    if (p) {
                        return p;
                    }

                    p = linesIntersection(A.x, A.y, B.x, B.y, bounds.maxX, bounds.maxY, bounds.minX, bounds.maxY);
                    if (p) {
                        return p;
                    }

                    return linesIntersection(A.x, A.y, B.x, B.y, bounds.minX, bounds.maxY, bounds.minX, bounds.minY);
                }

                function linesIntersection(a1x, a1y, a2x, a2y, b1x, b1y, b2x, b2y) {
                    var u  = (b2y - b1y) * (a2x - a1x) - (b2x - b1x) * (a2y - a1y);

                    if (u !== 0) {
                        var uA = ( (b2x - b1x) * (a1y - b1y) - (b2y - b1y) * (a1x - b1x) ) / u,
                            uB = ( (a2x - a1x) * (a1y - b1y) - (a2y - a1y) * (a1x - b1x) ) / u;

                        if (0 <= uA && uA <= 1 && 0 <= uB && uB <= 1) {
                            return [
                                a1x + uA * (a2x - a1x),
                                a1y + uA * (a2y - a1y)
                            ];
                        }
                    }
                }
            }

            function getRelationViewPosition(edgeInfo) {
                if (edgeInfo.viewLocation <= 0) {
                    return {
                        x: edgeInfo.guide.Ax,
                        y: edgeInfo.guide.Ay
                    };
                }

                if (edgeInfo.viewLocation >= 1) {
                    return {
                        x: edgeInfo.guide.Bx,
                        y: edgeInfo.guide.By
                    };
                }

                var k = edgeInfo.viewLocation / (1 - edgeInfo.viewLocation);

                return {
                    x: (edgeInfo.guide.Ax + k * edgeInfo.guide.Bx) / (1 + k),
                    y: (edgeInfo.guide.Ay + k * edgeInfo.guide.By) / (1 + k)
                };
            }

            //
            var dragAndDropHelper = {
                options: null,
                nodeViews: null,

                initDrag: function(e, options) {
                    dragAndDropHelper.options = options;

                    dragAndDropNodeView.nodeElement.draggable('option', {
                        cursor: 'default',
                        cursorAt: {
                            left: 0,
                            top: 0
                        }
                    });

                    dragAndDropNodeView.nodeElement.trigger(e);
                },

                start: function(e, ui) {
                    if (dragAndDropHelper.options.getDragView) {
                        dragAndDropHelper.nodeViews = null;

                        var dragView = dragAndDropHelper.options.getDragView();

                        if (_.isFunction(dragAndDropHelper.options.start)) {
                            dragAndDropHelper.options.start(e, ui);
                        }

                        dragAndDropNodeView.nodeElement.append(dragView);
                    } else {
                        dragAndDropHelper.nodeViews = dragAndDropHelper.options.getNodeViews();

                        if (_.isEmpty(dragAndDropHelper.nodeViews)) {
                            return false;
                        }

                        if (_.isFunction(dragAndDropHelper.options.start)) {
                            dragAndDropHelper.options.start(e, ui);
                        }

                        _.each(dragAndDropHelper.nodeViews, function(view){
                            dragAndDropNodeView.nodeElement.append(view.nodeElement.clone());
                        });
                    }

                    dragAndDropNodeView.nodeElement.show();
                },

                stop: function(e, ui) {
                    var nodes;

                    if (dragAndDropHelper.options.getNodes) {
                        nodes = dragAndDropHelper.options.getNodes();
                    } else {
                        nodes = nodeViewsToNodes(dragAndDropHelper.nodeViews);
                    }

                    graphHelper.addNodes(
                        nodes,
                        null, null,
                        function(nodeViews){
                            positionNodeViews(nodeViews, 'report', ui.position, 'cascade');
                        },
                        function(nodeViews){
                            // TODO пометить как новые?
                        }
                    );

                    dragAndDropHelper.nodeViews = null;
                    dragAndDropNodeView.nodeElement.hide().empty();

                    if (_.isFunction(dragAndDropHelper.options.stop)) {
                        dragAndDropHelper.options.stop(e, ui);
                    }
                }
            };

            //
            var graphHelper = {

                dragAndDropHelper: dragAndDropHelper,

                addLinkNodes: function(nodes, buildPositions, callback, silent){
                    graphHelper.addNodes(nodes, null, 'LINK', buildPositions, callback, silent);
                },

                addUserObjects: function(nodes, buildPositions, callback, silent){
                    graphHelper.addNodes(nodes, null, 'USER_OBJECT', buildPositions, callback, silent);
                },

                addNodesFromURL: function(){
                    var deferred            = $q.defer(),
                        locationSearch      = purl().param(),
                        nodeType            = locationSearch['node.type'],
                        relationType        = locationSearch['relation.type'],
                        relationDirection   = locationSearch['relation.direction'];

                    if (nodeType) {
                        searchHelper.search({
                            nodeType: nodeType,
                            filter: _.omit(locationSearch, 'node.type', 'relation.type', 'relation.direction'),
                            callback: function(result) {
                                nodesLists(null, result.list);
                                graphHelper.addNodes(
                                    result.list, null, null,
                                    function(nodeViews){
                                        var nodeElement = nodeViews[0].nodeElement,
                                            offset      = {
                                                left: -nodeElement.outerWidth() / 2,
                                                top: -nodeElement.outerHeight() / 2
                                            };

                                        positionNodeViews(nodeViews, 'report', 'center', 'cascade', offset);
                                    },
                                    function(nodeViews){
                                        if (_.isEmpty(nodeViews)) {
                                            return;
                                        }

                                        var nodeView = nodeViews[0];

                                        scope.$emit('do-graph-node-view-select', nodeView);

                                        if (_.size(nodeViews) === 1) {
                                            var node        = nodeView.nodeScope.node,
                                                simpleType  = nodeHelper.getNodeRelationSimpleType(node, relationType, relationDirection),
                                                mergedType  = nodeHelper.__getMergedRelationType(node, relationType, relationDirection);

                                            if (simpleType) {
                                                addNodeRelations(node, [simpleType], false, true);
                                            } else if (mergedType) {
                                                addNodeRelations(node, [mergedType], false, false);
                                            } else {
                                                var mergedTypes = nodeHelper.getNodeAloneRelationsAddMergedTypes(node);
                                                addNodeRelations(node, mergedTypes, false, false);
                                            }
                                        }

                                        scope.$emit('graph-nodes-from-url');
                                        scope.$emit('show-hint', 'ADD_NODES_FROM_URL');
                                    },
                                    true
                                );

                                deferred.resolve();
                            }
                        });
                    } else {
                        deferred.resolve();
                    }

                    return deferred.promise;
                },

                addNodesFromGrid: function() {
                    var deferred            = $q.defer(),
                        locationSearch      = purl().param(),
                        nodesGridName       = locationSearch['nodes-grid'],
                        nodesGrid           = nodesGridName && angular.fromJson($window.localStorage.getItem(nodesGridName));

                    if (nodesGrid) {
                        searchHelper.nodesByIds({
                            data: nodesGrid.nodes,
                            success: function(data) {
                                nodesLists(null, data);
                                graphHelper.addNodes(
                                    data, null, null,
                                    function(nodeViews){
                                        positionNodeViews(nodeViews, 'report', 'left-top', 'grid', null, {
                                            nodesGrid: nodesGrid
                                        });
                                    },
                                    function(nodeViews){
                                        if (_.isEmpty(nodeViews)) {
                                            return;
                                        }

                                        scope.$emit('graph-nodes-from-grid');
                                        scope.$emit('show-hint', 'ADD_NODES_FROM_GRID');
                                    },
                                    true
                                );

                                deferred.resolve();
                            },
                            error: function() {
                                deferred.resolve();
                            }
                        });
                    } else {
                        deferred.resolve();
                    }

                    return deferred.promise;
                },

                //
                isGraphObjectSelected: objectStateHelper.isGraphObjectSelected,

                linkNodes: function(nodes, linkText, noSelect){
                    var link            = nodeHelper.createLink(nodes, linkText),
                        linkedNodeViews = nodesToNodeViews(nodes);

                    graphHelper.addLinkNodes(
                        [link],
                        function(nodeViews){
                            positionNodeViews(nodeViews, linkedNodeViews, 'center', 'cascade');
                        },
                        function(nodeViews){
                            if (!noSelect) {
                                scope.$emit('do-graph-node-view-select', nodeViews[0]);
                                scope.$emit('link-nodes');
                            }
                        }
                    );
                },

                createUserObject: function(userObject, noSelect){
                    graphHelper.addUserObjects(
                        [userObject],
                        function(nodeViews){
                            positionNodeViews(nodeViews, 'report', {
                                left: 10,
                                top: 10
                            }, 'cascade');
                        },
                        function(nodeViews){
                            if (!noSelect) {
                                scope.$emit('do-graph-node-view-select', nodeViews[0]);
                                scope.$emit('create-user-object');
                            }
                        }
                    );
                },

                updateUserObject: function(userObject, updated){
                    _.extend(userObject, updated);
                    scope.$emit('update-user-object');
                },

                createUserRelation: function(userObject, dstNode, relationText) {
                    userObject._relations = userObject._relations || [];

                    userObject._relations.push({
                        text: relationText,
                        _dstId: dstNode._id,
                        __destinationNodeType: dstNode._type
                    });

                    nodeHelper.buildUserObjectRelations(userObject);
                    addEdges(__nodes[userObject.__uid].nodeView);

                    scope.$emit('create-user-relation');
                },

                updateUserRelation: function(userObject, dstNode, relation, relationText) {
                    eachChildrenEdgesInfo(__nodes[userObject.__uid].nodeView, function(edgeInfo){
                        if (edgeInfo.edgeUID === buildEdgeUID(userObject.__uid, dstNode.__uid)) {
                            relation.text = relationText;
                            edgeInfo.relationView.__update();
                            return false;
                        }
                    });

                    scope.$emit('update-user-relation');
                },

                deleteUserRelation: function(userObject, dstNode, relation) {
                    eachChildrenEdgesInfo(__nodes[userObject.__uid].nodeView, function(edgeInfo){
                        if (edgeInfo.edgeUID === buildEdgeUID(userObject.__uid, dstNode.__uid)) {
                            // TODO объединить код с deleteNodes
                            objectStateHelper.unselectAll();

                            var srcNodeScope    = edgeInfo.srcNodeView.nodeScope,
                                dstNodeScope    = edgeInfo.dstNodeView.nodeScope;

                            _.each(edgeInfo.relationView.getRelationLabelGraphViews(), function(labelView){
                                var relation = labelView.relationLabelScope.relation;

                                delete srcNodeScope.relationsOnReport[relation.__uid];
                                delete dstNodeScope.relationsOnReport[relation.__uid];
                            });

                            edgeInfo.arrowPaintElement.remove();
                            edgeInfo.edgePaintElement.remove();
                            edgeInfo.relationView.remove();

                            delete srcNodeScope.edges.children[edgeInfo.edgeUID];
                            delete dstNodeScope.edges.parents[edgeInfo.edgeUID];

                            nodeHelper.buildNodeRelationsOnReportInfo(srcNodeScope);
                            nodeHelper.buildNodeRelationsOnReportInfo(dstNodeScope);

                            _.remove(edgeInfo.srcNodeView.nodeScope.node._relations, function(r){
                                return relation.__uid === r.__uid;
                            });

                            return false;
                        }
                    });

                    scope.$emit('delete-user-relation');
                },

                deleteNodes: function(nodes, silent){
                    if (!silent && _.size(__nodes)) {
                        scope.$emit('delete-nodes');
                    }

                    var linksToDelete = {};

                    objectStateHelper.unselectAll();

                    if (_.isArray(nodes)) {
                        _.each(nodes, function(node){
                            deleteNode(node, checkLink);
                        });

                        _.each(linksToDelete, function(node){
                            deleteNode(node, $.noop);
                        });

                        emitChangeNodeSet();
                        scope.$emit('after-delete-nodes');
                    } else
                    if (nodes === 'all') {
                        _.each(__nodes, function(nodeInfo){
                            deleteNode(nodeInfo.nodeView.nodeScope.node, $.noop);
                        });
                    }

                    function deleteNode(node, checkLinkCallback) {
                        var nodeUID = node.__uid;

                        if (__nodes[nodeUID]) {
                            var nodeView = __nodes[nodeUID].nodeView;

                            eachEdgesInfo(nodeView, function(edgeInfo){
                                var srcNodeScope = edgeInfo.srcNodeView.nodeScope,
                                    dstNodeScope = edgeInfo.dstNodeView.nodeScope;

                                checkLinkCallback(nodeUID, edgeInfo);

                                _.each(edgeInfo.relationView.getRelationLabelGraphViews(), function(labelView){
                                    var relation = labelView.relationLabelScope.relation;

                                    delete srcNodeScope.relationsOnReport[relation.__uid];
                                    delete dstNodeScope.relationsOnReport[relation.__uid];
                                });

                                edgeInfo.arrowPaintElement.remove();
                                edgeInfo.edgePaintElement.remove();
                                edgeInfo.relationView.remove();

                                delete srcNodeScope.edges.children[edgeInfo.edgeUID];
                                delete dstNodeScope.edges.parents[edgeInfo.edgeUID];

                                nodeHelper.buildNodeRelationsOnReportInfo(srcNodeScope);
                                nodeHelper.buildNodeRelationsOnReportInfo(dstNodeScope);
                            });

                            nodeView.remove();

                            delete __nodes[nodeUID];
                        }
                    }

                    // Если у связи-заметки осталась одна связанная нода,
                    // то связь-заметку надо удалить
                    function checkLink(nodeUID, edgeInfo) {
                        var srcNodeView = edgeInfo.srcNodeView,
                            srcNode     = srcNodeView.nodeScope.node,
                            srcNodeUID  = srcNode.__uid;

                        if (srcNodeUID !== nodeUID && srcNode._type === 'LINK') {
                            var dstNodeCount = 0;

                            eachEdgesInfo(srcNodeView, function(edgeInfo){
                                var dstNodeUID = edgeInfo.dstNodeView.nodeScope.node.__uid;
                                if (nodeUID !== dstNodeUID && __nodes[dstNodeUID]) {
                                    dstNodeCount++;
                                }
                            });

                            if (dstNodeCount <= 1) {
                                linksToDelete[srcNodeUID] = srcNode;
                            }
                        }
                    }
                },

                getGraphBounds: getGraphBounds,
                getGraphDOMBounds: getGraphDOMBounds,

                //
                initGraph: function(){
                    graphObjectContainer = graphLayoutHelper.getGraphObjectContainer();
                    graphPaper = graphLayoutHelper.getGraphPaper();

                    objectStateHelper.init();

                    graphZoomHelper.setDefaultZoom();

                    //
                    dragAndDropNodeView = nodeHelper.createDragAndDropNodeView(graphObjectContainer);
                    dragAndDropNodeView.nodeElement.hide();
                    objectDragHelper.initVertexDrag(dragAndDropNodeView, function(nodeView){}, {
                        start: dragAndDropHelper.start,
                        stop: dragAndDropHelper.stop
                    });
                }
            };

            return graphHelper;
        }]);
    //
});
