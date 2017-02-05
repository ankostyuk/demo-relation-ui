//
// @author ankostyuk
//
define(function(require, exports, module) {'use strict';

    var angular         = require('angular');

    //
    return angular.module('app.graph.object-grag', [])
        //
        .factory('objectDragHelper', ['$log', '$timeout', '$rootScope', 'graphLayoutHelper', 'objectStateHelper', function($log, $timeout, $rootScope, graphLayoutHelper, objectStateHelper){
            var scope = $rootScope;

            var MouseHover = {
                enter: null,

                reset: function(element){
                    MouseHover.enter = null;
                    element.bind('mouseenter', MouseHover.mouseenter);
                    element.bind('mouseleave', MouseHover.mouseleave);
                },

                pop: function(element){
                    element.unbind('mouseenter', MouseHover.mouseenter);
                    element.unbind('mouseleave', MouseHover.mouseleave);
                    return MouseHover.enter;
                },

                mouseenter: function(){
                    MouseHover.enter = true;
                },

                mouseleave: function(){
                    MouseHover.enter = false;
                }
            };

            //
            var objectDragHelper = {

                // @Deprecated
                getNodeViewPosition: function(nodeView){
                    var graphObjectDragElement = graphLayoutHelper.getGraphObjectDragElement();
                    return graphObjectDragElement.position();
                },

                initVertexDrag: function(nodeView, dragCallback, dragOptions){
                    var graphObjectDragElement  = graphLayoutHelper.getGraphObjectDragElement(),
                        graphObjectContainer    = graphLayoutHelper.getGraphObjectContainer(),
                        leftMin                 = 5, // TODO в настройку
                        topMin                  = 5, // TODO в настройку
                        startCntPos, dragElement, selectedVertices, cntNegativeOffset;

                    dragOptions = dragOptions || {};

                    nodeView.nodeElement.draggable({
                        // snap: '[node-graph-view]',
                        // snapTolerance: 10,
                        // grid: [10, 10],

                        // scroll: false,
                        // scrollSensitivity: 20,
                        // scrollSpeed: 20,

                        handle: nodeView.nodeBodyElement || false,

                        helper: function() {
                            return graphObjectDragElement;
                        },

                        start: function(e, ui) {
                            if (_.isFunction(dragOptions.start)) {
                                dragOptions.start(e, ui);
                            }

                            nodeView.drag = true;
                            pushDragView();
                            startCntPos = graphLayoutHelper.getGraphObjectContainerPosition();

                            //
                            scope.$emit('graph-object-drag-start');
                        },

                        drag: function(e, ui) {
                            drag(e, ui);

                            //
                            doDragCallback(ui);
                            // раскомментировать, если нужно событие
                            // scope.$emit('graph-object-drag', nodeView);
                        },

                        stop: function(e, ui) {
                            drag(e, ui);
                            nodeView.drag = false;
                            var dragViewState = popDragView();

                            //
                            $timeout(function(){
                                doDragCallback(ui);
                                scope.$emit('graph-object-drag-stop', nodeView, nodeView.nodeElement, dragViewState.isMouseEnter);
                                if (_.isFunction(dragOptions.stop)) {
                                    dragOptions.stop(e, ui);
                                }
                            });
                        }
                    });

                    function doDragCallback(ui) {
                        var nodeViewPosition = getObjectDragElementPosition(ui);
                        dragCallback(nodeView, nodeViewPosition, selectedVertices);
                    }

                    function getObjectDragElementPosition(ui) {
                        if (nodeView.drag) {
                            return ui.position;
                            // return graphObjectDragElement.position();
                        } else {
                            return nodeView.nodeElement.position();
                        }
                    }

                    function buildSelectedVerticesByNodeView(nodeView) {
                        var nodeViewPosition        = nodeView.nodeElement.position(),
                            inSelected              = false,
                            selectedVerticesTmp     = [],
                            cntNegativeOffsetTmp    = {
                                x: 0,
                                y: 0
                            },
                            position, offsetX, offsetY;

                        selectedVertices = [];
                        cntNegativeOffset = {
                            x: 0,
                            y: 0
                        };

                        if (nodeView.objectType !== 'vertex') {
                            return;
                        }

                        _.each(objectStateHelper.getSelectedObjects(), function(object){
                            if (object.objectType !== 'vertex') {
                                return;
                            }

                            if (nodeView.nodeScope.node.__uid === object.nodeScope.node.__uid) {
                                inSelected = true;
                            } else {
                                position = object.nodeElement.position();

                                offsetX = position.left - nodeViewPosition.left;
                                offsetY = position.top - nodeViewPosition.top;

                                cntNegativeOffsetTmp.x = Math.min(cntNegativeOffset.x, offsetX);
                                cntNegativeOffsetTmp.y = Math.min(cntNegativeOffset.y, offsetY);

                                selectedVerticesTmp.push({
                                    nodeView: object,
                                    offset: {
                                        x: offsetX,
                                        y: offsetY
                                    },
                                    // https://github.com/newpointer/relation-ui/issues/52
                                    // Сохраняем размер объекта и устанавливаем данный размер
                                    // при перемещении (см. pushDragView, popDragView).
                                    // TODO разобраться с данной ситуацией и не решать проблему "костылями"
                                    width: object.nodeElement.width()
                                });
                            }
                        });

                        if (inSelected) {
                            selectedVertices = selectedVerticesTmp;
                            cntNegativeOffset = cntNegativeOffsetTmp;
                        }
                    }

                    function pushDragView() {
                        //
                        buildSelectedVerticesByNodeView(nodeView);

                        // Перенос перемещаемых нод в helper
                        dragElement = nodeView.nodeElement
                            .appendTo(graphObjectDragElement)
                            .css({
                                'left': '0',
                                'top': '0'
                            });

                        MouseHover.reset(dragElement);

                        _.each(selectedVertices, function(vertex){
                            vertex.dragElement = vertex.nodeView.nodeElement
                                .appendTo(graphObjectDragElement)
                                .css({
                                    'left': vertex.offset.x + 'px',
                                    'top': vertex.offset.y + 'px',
                                    // https://github.com/newpointer/relation-ui/issues/52
                                    // Устанавливаем сохраненный до перемещения размер (см. buildSelectedVerticesByNodeView).
                                    // TODO разобраться с данной ситуацией и не решать проблему "костылями"
                                    'width': vertex.width + 'px'
                                });
                        });
                    }

                    function popDragView() {
                        // Возврат перемещаемых нод из helper
                        var pos = graphObjectDragElement.position();
                        nodeView.nodeElement
                            .hide()
                            .appendTo(graphObjectContainer)
                            .css({
                                'left': pos.left + 'px',
                                'top': pos.top + 'px'
                            })
                            .show();

                        var isMouseEnter = MouseHover.pop(dragElement);

                        _.each(selectedVertices, function(vertex){
                            vertex.nodeView.nodeElement
                                .hide()
                                .appendTo(graphObjectContainer)
                                .css({
                                    'left': pos.left + vertex.offset.x + 'px',
                                    'top': pos.top + vertex.offset.y + 'px',
                                    // https://github.com/newpointer/relation-ui/issues/52
                                    // Сбрасываем установленный при перемещении размер (см. pushDragView).
                                    // TODO разобраться с данной ситуацией и не решать проблему "костылями"
                                    'width': 'auto'
                                })
                                .show();
                        });

                        return {
                            isMouseEnter: isMouseEnter
                        };
                    }

                    function drag(e, ui) {
                        var cntPos  = {},
                            dragPos = ui.position;

                        checkCntPos('left', leftMin - dragPos.left - cntNegativeOffset.x, cntPos);
                        checkCntPos('top', topMin - dragPos.top - cntNegativeOffset.y, cntPos);

                        graphLayoutHelper.setGraphObjectContainerPosition(cntPos);
                    }

                    function checkCntPos(prop, value, pos) {
                        if (value > startCntPos[prop]) {
                            pos[prop] = (value > 0 ? value : 0);
                        }
                    }
                },

                initEdgeViewDrag: function(edgeInfo, dragCallback, dragOptions){
                    var relationElement     = edgeInfo.relationView.relationElement,
                        relationBodyElement = edgeInfo.relationView.relationBodyElement,
                        draggedEdgeInfo     = null,
                        startPageX, startPageY, startViewLocation;

                    dragOptions = dragOptions || {};

                    relationElement.draggable({
                        handle: relationBodyElement,

                        start: function(e, ui) {
                            if (e.which !== 1 || draggedEdgeInfo) {
                                draggedEdgeInfo = null;
                                return;
                            }

                            MouseHover.reset(relationElement);
                            scope.$emit('graph-object-drag-start');

                            draggedEdgeInfo = edgeInfo;

                            startPageX = e.pageX;
                            startPageY = e.pageY;

                            startViewLocation = draggedEdgeInfo.viewLocation;
                        },
                        drag: function(e, ui) {
                            if (!draggedEdgeInfo) {
                                return;
                            }

                            // вектор направляющей ребра
                            var guide = draggedEdgeInfo.guide;

                            if (guide.L > 1) {
                                // вектор перемещения указателя мыши
                                var Mx  = e.pageX - startPageX,
                                    My  = e.pageY - startPageY,
                                    M   = Math.sqrt(Mx*Mx + My*My);

                                // cos угла между вектором p и guide
                                var cos = (Mx * guide.Lx + My * guide.Ly) / (M * guide.L);

                                // относительное перемещение вдоль ребра: (проекция M на guide) / |guide|
                                var dL = M * cos / guide.L;

                                //
                                dragCallback(edgeInfo, startViewLocation + dL, ui.position);
                            }
                        },
                        stop: function(e, ui) {
                            $timeout(function(){
                                var isMouseEnter = MouseHover.pop(relationElement);
                                scope.$emit('graph-object-drag-stop', draggedEdgeInfo, relationElement, isMouseEnter);
                                draggedEdgeInfo = null;
                                if (_.isFunction(dragOptions.stop)) {
                                    dragOptions.stop(e, ui);
                                }
                            });
                        }
                    });
                }
            };

            return objectDragHelper;
        }]);
    //
});
