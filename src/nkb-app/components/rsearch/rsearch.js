//
// @author ankostyuk
//
define(function(require, exports, module) {'use strict';
                          require('less!./styles/rsearch');
    var templates = {
        'rsearch':              require('text!./views/rsearch.html'),
        'nodes-traces-export':  require('text!./views/nodes-traces-export.html')
    };

    var extraTemplatesSettings = {
        evaluate:       /<%([\s\S]+?)%>/g,
        interpolate:    /<%=([\s\S]+?)%>/g,
        escape:         /<%-([\s\S]+?)%>/g
    };

                          require('lodash');

    var Commons         = require('commons-utils'),
        i18n            = require('i18n'),
        angular         = require('angular'),
        download        = require('download'),
        templateUtils   = require('template-utils');
    //

    var submodules = [
        require('nkb.comment'),
        require('nkb.reference'),
        require('nkb.selfemployed'),
        require('nullpointer-rsearch/rsearch/rsearch')
    ];

    var directiveName                       = 'app-rsearch',
        rsearchRelationsBarDirectiveName    = 'rsearch-relations-bar';

    //
    return angular.module('app.rsearch', _.pluck(submodules, 'name'))
        //
        .run([function(){
            _.each(templates, function(template, name){
                templates[name] = templateUtils.processTemplate(template).templates;
            });
        }])
        //
        .directive(_.camelize(directiveName), [function(){
            return {
                restrict: 'A',
                replace: false,
                template: templates['rsearch']['rsearch-view'].html,
                scope: false
            };
        }])
        //
        .directive(_.camelize(rsearchRelationsBarDirectiveName), ['$log', '$timeout', '$rootScope', '$document', 'keyboardHelper', 'npExpandContentHelper', 'npRsearchNavigationHelper', 'npRsearchMetaHelper', 'npRsearchViews', 'npRsearchResource', 'graphHelper', 'nodeHelper', 'dataUpdateHelper', function($log, $timeout, $rootScope, $document, keyboardHelper, npExpandContentHelper, npRsearchNavigationHelper, npRsearchMetaHelper, npRsearchViews, npRsearchResource, graphHelper, nodeHelper, dataUpdateHelper){
            return {
                restrict: 'C',
                controller: ['$scope', '$element', '$attrs', function($scope, $element, $attrs) {
                    //
                    var scope   = $scope,
                        element = $element,
                        attrs   = $attrs;

                    var rsearchResultElement    = element.find('.rsearch-result'),
                        rsearchInputElement     = element.find('[np-rsearch-input] input'),
                        nodeTracesElement       = element.find('.nodes-traces .node-traces-view'),
                        selectedNodes           = {};

                    //
                    function RsearchRelations() {
                        var _target         = null,
                            _prevTarget     = null,
                            _contentOpen    = null;

                        var _byTargets = {
                            'RELATIONS': {
                                mode: 'DEFAULT',
                                toggleElement: element.find('.rsearch-relations-toggle.relations'),
                                byModes: {
                                    'DEFAULT': {
                                        content: 'nodes-relations-empty'
                                    },
                                    'TRACES': {
                                        content: 'nodes-traces',
                                        nodes: null,
                                        reset: function(byMode) {
                                            byMode.nodes = null;
                                        },
                                        open: function(byTarget, byMode) {
                                            if (!npRsearchMetaHelper.isNodesEquals(byMode.nodes, byTarget.data.nodes)) {
                                                byMode.nodes = byTarget.data.nodes;
                                                nodesTraces.setNodes(byMode.nodes);
                                            }
                                        }
                                    },
                                    'RSEARCH_NODE': {
                                        content: 'rsearch-panel',
                                        node: null,
                                        relation: null,
                                        reset: function(byMode) {
                                            byMode.node = null;
                                            byMode.relation = null;
                                        },
                                        open: function(byTarget, byMode) {
                                            var node            = byTarget.data.nodes[0],
                                                prevNode        = byMode.node,
                                                relation        = byTarget.data.relation,
                                                prevRelation    = byMode.relation;

                                            if (_prevTarget !== _target || !prevNode || prevNode.__uid !== node.__uid || !_.isEqual(relation, prevRelation)) {
                                                byMode.node     = node;
                                                byMode.relation = relation;

                                                npRsearchMetaHelper.buildNodeExtraMeta(node);

                                                scope.$emit('np-rsearch-navigation-set-node', node, relation);
                                            }
                                        }
                                    }
                                }
                            },
                            'RSEARCH': {
                                mode: 'DEFAULT',
                                toggleElement: element.find('.rsearch-relations-toggle.rsearch'),
                                byModes: {
                                    'DEFAULT': {
                                        content: 'rsearch-result-empty'
                                    },
                                    'RSEARCH_SEARCH': {
                                        content: 'rsearch-panel'
                                    }
                                }
                            }
                        };

                        scope.$on('graph-object-select', function(e, selectedObjects, graphObjectSelectInfo){
                            scope.safeApply(function(){
                                npExpandContentHelper.closeContent(element);

                                var mode    = 'DEFAULT',
                                    data    = null;

                                if (graphObjectSelectInfo.total === graphObjectSelectInfo.nodes && graphObjectSelectInfo.nodes > 1) {
                                    mode = 'TRACES';

                                    var nodes = _.reduce(_.values(selectedObjects), function(list, o){
                                        list.push(o.nodeScope.node);
                                        return list;
                                    }, []);

                                    data = {
                                        nodes: nodes
                                    };
                                } else
                                if (graphObjectSelectInfo.total === graphObjectSelectInfo.nodes && graphObjectSelectInfo.nodes === 1) {
                                    mode = 'RSEARCH_NODE';
                                    data = {
                                        nodes: [_.values(selectedObjects)[0].nodeScope.node]
                                    };
                                }

                                setMode('RELATIONS', mode, data);
                            });
                        });

                        scope.$on('graph-object-unselect-all', function(){
                            scope.safeApply(function(){
                                npExpandContentHelper.closeContent(element);
                                reset('RELATIONS');
                            });
                        });

                        scope.$on('after-delete-nodes', function(){
                            scope.safeApply(function(){
                                npExpandContentHelper.closeContent(element);
                                toggleContent('RELATIONS', false);
                                reset('RELATIONS');
                                reset('RSEARCH');
                            });
                        });

                        element
                            .bind('expand-content-open', function(e, content){
                                _contentOpen = content.attr('content-id');
                                activateToggle(true);
                            })
                            .bind('expand-content-close', function(e, content){
                                _contentOpen = null;
                                activateToggle(false);
                            });

                        scope.$on('np-rsearch-navigation-do-search', function(e, query){
                            setMode('RSEARCH', 'RSEARCH_SEARCH');
                            toggleContent('RSEARCH', true);
                        });

                        scope.$on('np-rsearch-navigation-clear-search', function(){
                            if (getMode('RSEARCH') !== 'DEFAULT') {
                                toggleContent('RSEARCH', false);
                            }
                            reset('RSEARCH');
                        });

                        scope.$on('object-info', function(e, node){
                            setMode('RELATIONS', 'RSEARCH_NODE', {
                                nodes: [node],
                                relation: null
                            });
                            toggleContent('RELATIONS', true);
                        });

                        scope.$on('show-node-relations', function(e, node, data){
                            // <<< Костыль
                            var relation1 = data ? nodeHelper.getFirstNodeRelationByMergedType(node, data) : null;

                            var relation2 = _.isObject(data) ? {
                                type: data.relationType,
                                direction: data.direction
                            } : null;

                            var relation = relation1 ? relation1 : relation2;
                            // >>>

                            setMode('RELATIONS', 'RSEARCH_NODE', {
                                nodes: [node],
                                relation: relation
                            });

                            toggleContent('RELATIONS', true);
                        });

                        function reset(target) {
                            var byTarget = _byTargets[target];

                            byTarget.mode = 'DEFAULT';

                            _.each(byTarget.byModes, function(byMode){
                                if (_.isFunction(byMode.reset)) {
                                    byMode.reset(byMode);
                                }
                            });
                        }

                        function setMode(target, mode, data) {
                            data = data || {};

                            _byTargets[target].mode = mode;
                            _byTargets[target].data = data;
                        }

                        function getMode(target) {
                            return _byTargets[target].mode;
                        }

                        function activateToggle(activate) {
                            _.each(_byTargets, function(byTarget, target){
                                if (target === _target) {
                                    return;
                                }
                                activateToggleByTarget(target, false);
                            });

                            activateToggleByTarget(_target, activate);
                        }

                        function activateToggleByTarget(target, activate) {
                            if (!target) {
                                return;
                            }

                            _byTargets[target].toggleElement.toggleClass('active', activate).parent().toggleClass('active', activate);
                        }

                        function toggleContent(target, state) {
                            var byTarget    = _byTargets[target],
                                byMode      = byTarget.byModes[byTarget.mode];

                            _prevTarget = _target;
                            _target     = target;

                            if (_.isBoolean(state)) {
                                if (state) {
                                    if (_contentOpen !== byMode.content) {
                                        toggle(true);
                                    }
                                    if (_prevTarget !== _target) {
                                        activateToggle(true);
                                    }
                                } else {
                                    toggle(false);
                                }
                            } else {
                                toggle(!(_contentOpen && _prevTarget === _target));
                            }

                            function toggle(open) {
                                if (open) {
                                    npExpandContentHelper.openContent(element, byMode.content);
                                    if (_.isFunction(byMode.open)) {
                                        byMode.open(byTarget, byMode);
                                    }
                                } else {
                                    npExpandContentHelper.closeContent(element);
                                }
                            }

                            return _prevTarget !== _target;
                        }

                        return {
                            toggleContent: toggleContent
                        };
                    }

                    var rsearchRelations = new RsearchRelations();

                    scope.rsearchRelations = rsearchRelations;

                    //
                    var navigationProxy = _.extend(npRsearchNavigationHelper.getNavigationProxy(), {
                        getScrollContainer: function() {
                            return rsearchResultElement;
                        },

                        getDataUpdateHelper: function() {
                            return dataUpdateHelper;
                        },

                        rsearchInputRefresh: function(text, ui) {
                            if (ui === 'SEARCH_BUTTON') {
                                return rsearchRelations.toggleContent('RSEARCH');
                            }
                        },

                        isLightForm: function(node) {
                            return true;
                        },

                        hasShowRelations: function(node, active) {
                            return !!node;
                        },

                        hasCheckAccentedResult: function(target, mode) {
                            if (mode === 'SEARCH' && target === 'byRelations') {
                                return false;
                            }

                            if (mode === 'NODE' && (target === 'byNodeForm' || target === 'byRelations')) {
                                return false;
                            }

                            return true;
                        },

                        resetNodeList: function(nodeListView) {
                            resetSelect();
                        },

                        showNodeList: function(nodeList, addNodeList, nodeListView, listProperties) {
                            adjust();

                            if (_.get(listProperties, 'isJoint')) {
                                _.each(addNodeList, function(list){
                                    _.each(list.data.list, function(node){
                                        checkDragOnReport(node, nodeListView);
                                    });
                                });
                            } else {
                                _.each(addNodeList, function(node){
                                    checkDragOnReport(node, nodeListView);
                                });
                            }
                        },

                        showTrace: function(trace, nodeTracesView) {
                            adjust();

                            var tracesElement   = nodeTracesView.getTracesElement(),
                                onReportCount   = 0,
                                nodeViews       = [];

                            _.each(trace, function(tracePart){
                                var node        = tracePart.node,
                                    nodeElement = nodeTracesView.getNodeElement(node),
                                    info        = {};

                                var onReport = checkOnReport(node, nodeElement, info);

                                info.nodeParentElement.parent().toggleClass('on-report', onReport);

                                if (onReport) {
                                    onReportCount++;
                                }

                                nodeViews.push({
                                    nodeScope: {
                                        node: node
                                    },
                                    nodeElement: nodeElement
                                });
                            });

                            doCheckDragOnReport(onReportCount === _.size(trace));

                            function doCheckDragOnReport(onReport) {
                                tracesElement.toggleClass('on-report', onReport);

                                checkDragOnReport(null, nodeTracesView, function(){
                                    doCheckDragOnReport(true);
                                }, {
                                    onReport: onReport,
                                    noCheckOnReport: true,
                                    noCheckSelect: true,
                                    nodeElement: tracesElement,
                                    getNodeViews: function(node, nodeElement) {
                                        return nodeViews;
                                    }
                                });
                            }
                        },

                        showNodeForm: function(node, formType, nodeFormView) {
                            adjust();
                            resetSelect();

                            if (formType !== 'MINIREPORT') {
                                return;
                            }

                            checkDragOnReport(node, nodeFormView);
                        },

                        // @Deprecated
                        nodeHeaderClick: function(info) {
                            return false;
                        },

                        nodeClick: function(info) {
                            // Выделить несколько объектов при удержании [shift],
                            // а не открывать миниотчет объекта
                            if (info.event.shiftKey) {
                                toggleSelect(info.node, info.element);
                                return false;
                            }

                            return true;
                        }
                    });

                    //
                    var nodeTracesView = npRsearchViews.createNodeTracesView(nodeTracesElement, scope, navigationProxy);

                    function NodesTraces() {
                        var me              = this,
                            _requestTimeout = 500,
                            _pairs          = [],
                            _defaultDepth   = 2,
                            _defaultHistory = null,
                            _noResult       = true,
                            _emptyResult    = false,
                            _tracesInfo     = {},
                            _request, _currentPair;

                        var _filters = {
                            depth: _defaultDepth,
                            history: _defaultHistory,
                            depths: _.range(1, 7),
                            relations: []
                        };

                        var _relationGroups = {
                            'contacts': {
                                search: false,
                                relations: [
                                    'ADDRESS'
                                ]
                            },
                            'purchases': {
                                search: false,
                                relations: [
                                    'CUSTOMER_COMPANY',
                                    'PARTICIPANT_COMPANY',
                                    'PARTICIPANT_INDIVIDUAL',
                                    'COMMISSION_MEMBER'
                                ]
                            },
                            'other': {
                                search: true,
                                relations: [
                                    'FOUNDER_COMPANY',
                                    'FOUNDER_INDIVIDUAL',
                                    'HEAD_COMPANY',
                                    'EXECUTIVE_COMPANY',
                                    'EXECUTIVE_INDIVIDUAL',
                                    'AFFILIATED_COMPANY',
                                    'AFFILIATED_INDIVIDUAL',
                                    'PREDECESSOR_COMPANY',
                                    'REGISTER_HOLDER',
                                    'PHONE',
                                    'EMPLOYEE'
                                ]
                            }
                        };

                        var _tracesDataSource = {
                            reverse: true,
                            srcInTrace: false,
                            depths: null,
                            tracesRequest: _.noop,
                            nodeClick: _.noop,
                            applyResult: _.noop,
                            doTrace: function(traceIndex) {
                                _currentPair.traceIndex = traceIndex;
                            }
                        };

                        nodeTracesView.setDataSource(_tracesDataSource);

                        function _buildRelationFilter() {
                            var relations = [];

                            _.each(_relationGroups, function(relationGroup){
                                if (relationGroup.search) {
                                    relations = relations.concat(relationGroup.relations);
                                }
                            });

                            _filters.relations = relations;
                        }

                        function _pairsRequest(callback) {
                            var pairCount   = _.size(_pairs),
                                pairIndex   = 0,
                                pair, firstEnabledPair;

                            _currentPair = null;

                            _buildRelationFilter();

                            doRequest();

                            function doRequest() {
                                pair = _pairs[pairIndex];

                                _tracesRequest(pair, function(result){
                                    result = result || {};

                                    pair.result = result;
                                    pair.disabled = !_.size(result.traces);
                                    pair.active = false;
                                    pair.traceIndex = null;

                                    if (!firstEnabledPair && !pair.disabled) {
                                        firstEnabledPair = pair;
                                    }

                                    pairIndex++;

                                    if (pairIndex < pairCount) {
                                        doRequest();
                                    } else {
                                        _noResult = false;
                                        _emptyResult = !firstEnabledPair;
                                        nodeTracesView.toggle(!_emptyResult);
                                        _showPairTracesResult(firstEnabledPair);
                                        callback();
                                    }
                                });
                            }
                        }

                        function _tracesRequest(pair, callback) {
                            // таймаут для снижения нагрузки на сервер при потоковых запросах
                            // - пауза между запросами
                            // TODO надо ли?
                            $timeout(function(){
                                _request = npRsearchResource.traces({
                                    node1: pair.node1,
                                    node2: pair.node2,
                                    filter: {
                                        maxDepth: _filters.depth,
                                        history: _filters.history,
                                        relType: _filters.relations
                                    },
                                    previousRequest: _request,
                                    success: function(data, status){
                                        callback(data);
                                    },
                                    error: function(data, status){
                                        callback(null);
                                    }
                                });
                            }, _requestTimeout);
                        }

                        function _showPairTracesResult(pair) {
                            if (!pair || pair.disabled || (_currentPair && _currentPair.index === pair.index)) {
                                return;
                            }

                            if (_currentPair) {
                                _currentPair.active = false;
                            }

                            _currentPair = pair;
                            _currentPair.active = true;


                            var traceIndex = _currentPair.traceIndex || 0;

                            nodeTracesView.setResult([pair.node1, pair.node2], _filters, pair.result, traceIndex, false);
                        }

                        function _abortRequest() {
                            if (_request) {
                                _request.abort();
                            }
                        }

                        //
                        function resetTraces() {
                            _tracesInfo = {};
                        }

                        function getCurrentTraceInfo() {
                            if (!_currentPair) {
                                return {};
                            }

                            var info = _.get(_tracesInfo, [_currentPair.index, _currentPair.traceIndex]);

                            if (info) {
                                return info;
                            }

                            info = {
                                checked: false
                            };

                            _.set(_tracesInfo, [_currentPair.index, _currentPair.traceIndex], info);

                            return info;
                        }

                        function isCurrentTraceChecked() {
                            return _currentPair ? isTraceChecked(_currentPair.index, _currentPair.traceIndex) : null;
                        }

                        function isTraceChecked(pairIndex, traceIndex) {
                            return _.get(_tracesInfo, [pairIndex, traceIndex, 'checked']);
                        }

                        function isTracesChecked() {
                            var checked = false;

                            _.each(_tracesInfo, function(p){
                                _.each(p, function(t){
                                    checked = t ? t.checked : false;
                                    return !checked;
                                });
                                return !checked;
                            });

                            return checked;
                        }

                        function isPairTracesChecked(pair) {
                            var checked = false;

                            _.each(_tracesInfo[pair.index], function(t){
                                checked = t ? t.checked : false;
                                return !checked;
                            });

                            return checked;
                        }

                        function getPairCheckedTraces(pair) {
                            var traces = _.filter(pair.result.traces, function(trace, traceIndex){
                                return isTraceChecked(pair.index, traceIndex);
                            });

                            return traces;
                        }

                        function doExportResult() {
                            scope.longOperation(null, function(done){
                                $timeout(function(){
                                    // download(buildResultHTML(), 'relations-result.html', 'text/html');
                                    download(buildResultHTML(), 'relations-result.doc', 'application/msword');
                                    done();
                                }, 1000);
                            });
                        }

                        function buildResultHTML() {
                            var htmlView        = templates['nodes-traces-export']['nodes-traces-export-view'].html,
                                htmlTemplate    = _.template(htmlView, extraTemplatesSettings);

                            var html = htmlTemplate({
                                me: me
                            });

                            return html;
                        }

                        //
                        me.nodeTracesView = nodeTracesView;

                        me.filters = _filters;
                        me.relationGroups = _relationGroups;
                        me.showPairTracesResult = _showPairTracesResult;

                        me.getCurrentTraceInfo = getCurrentTraceInfo;
                        me.isCurrentTraceChecked = isCurrentTraceChecked;
                        me.isTracesChecked = isTracesChecked;
                        me.isPairTracesChecked = isPairTracesChecked;
                        me.getPairCheckedTraces = getPairCheckedTraces;
                        me.doExportResult = doExportResult;

                        me.isNoResult = function() {
                            return _noResult;
                        };

                        me.isEmptyResult = function() {
                            return _emptyResult;
                        };

                        me.search = function() {
                            scope.longOperation(
                                function(){
                                    resetTraces();
                                    _abortRequest();
                                },
                                function(done){
                                    _pairsRequest(function(){
                                        done();
                                    });
                                }
                            );
                        };

                        me.reset = function(pairs) {
                            nodeTracesView.reset();
                            resetTraces();
                            _abortRequest();

                            _pairs = pairs;
                            _currentPair = null;
                            _noResult = true;
                            _emptyResult = false;

                            _filters.depth = _defaultDepth;
                            _filters.history = _defaultHistory;

                            _relationGroups['contacts'].search = false;
                            _relationGroups['purchases'].search = false;
                        };

                        me.getPairs = function() {
                            return _pairs;
                        };

                        me.setNodes = function(nodes) {
                            var pairs       = [],
                                pairIndex   = 0;

                            var size = _.size(nodes),
                                i, j;

                            for (i = 0; i < size; i++) {
                                for (j = i + 1; j < size; j++) {
                                    pairs.push({
                                        index: pairIndex,
                                        node1: nodes[i],
                                        node2: nodes[j],
                                        disabled: true
                                    });

                                    pairIndex++;
                                }
                            }

                            this.reset(pairs);
                        };
                    }

                    var nodesTraces = new NodesTraces();

                    scope.nodesTraces = nodesTraces;

                    //
                    function adjust() {
                        npExpandContentHelper.adjust(element);
                    }

                    //
                    keyboardHelper.shortcut({
                        element: $document,
                        key: 'ctrl+f',
                        callback: function(){
                            $timeout(function(){
                                rsearchInputElement.focus().select();
                            });
                        }
                    });

                    // TODO ипользовать в других местах, где нужно "расстояние срыва" при дреге
                    function NodeDragAndDrop() {
                        var minDragDistance     = 20,
                            options            = {},
                            currentNodeElement  = null;

                        $document
                            .mousemove(function(e){
                                if (currentNodeElement) {
                                    checkDrag(e);
                                }
                            })
                            .mouseup(function(){
                                if (currentNodeElement) {
                                    _.extend(currentNodeElement.data('nodeDragAndDrop'), {
                                        mousedown: false
                                    });
                                }
                            });

                        var mousedown = function(e) {
                            currentNodeElement = $(e.currentTarget);

                            var nodeElement = currentNodeElement;

                            _.extend(nodeElement.data('nodeDragAndDrop'), {
                                startPageX: e.pageX,
                                startPageY: e.pageY,
                                mousedown: true,
                                event: e
                            });
                        };

                        function checkDrag(e) {
                            var nodeElement         = currentNodeElement,
                                nodeDragAndDropData = nodeElement.data('nodeDragAndDrop');

                            if (!nodeDragAndDropData || !nodeDragAndDropData.mousedown) {
                                return;
                            }

                            var distance = Math.sqrt(
                                Math.pow(e.pageX - nodeDragAndDropData.startPageX, 2) +
                                Math.pow(e.pageY - nodeDragAndDropData.startPageY, 2)
                            );

                            if (distance < minDragDistance) {
                                return;
                            }

                            nodeDragAndDropData.mousedown = false;

                            // initDrag
                            graphHelper.dragAndDropHelper.initDrag(nodeDragAndDropData.event, {
                                getNodeViews: function() {
                                    if (_.isFunction(options.getNodeViews)) {
                                        return options.getNodeViews(nodeDragAndDropData.node, nodeElement);
                                    }

                                    return null;
                                },
                                start: function(e, ui) {
                                    if (_.isFunction(options.start)) {
                                        options.start(e, ui);
                                    }
                                },
                                stop: function(e, ui) {
                                    nodeElement.unbind('mousedown', mousedown);

                                    if (_.isFunction(options.stop)) {
                                        options.stop(e, ui);
                                    }
                                }
                            });
                        }

                        return {
                            bind: function(node, nodeElement, opts) {
                                options = opts || {};
                                nodeElement.data('nodeDragAndDrop', {
                                    node: node
                                });
                                nodeElement.bind('mousedown', mousedown);
                            },
                            unbind: function(nodeElement) {
                                currentNodeElement = null;
                                nodeElement.unbind('mousedown', mousedown);
                            }
                        };
                    }

                    var nodeDragAndDrop = new NodeDragAndDrop();

                    //
                    function checkOnReport(node, nodeElement, info) {
                        var onReport = graphHelper.isNodeOnReport(node);

                        nodeElement.toggleClass('on-report', onReport);
                        var nodeParentElement = nodeElement.parent().toggleClass('on-report', onReport);

                        if (info) {
                            info.nodeParentElement = nodeParentElement;
                        }

                        return onReport;
                    }

                    function checkDragOnReport(node, view, onReportCallbak, options) {
                        options = options || {};

                        var nodeElement = options.nodeElement || view.getNodeElement(node);

                        if (!nodeElement) {
                            return;
                        }

                        var onReport = _.isBoolean(options.onReport) ? options.onReport :
                            (options.noCheckOnReport ? null : checkOnReport(node, nodeElement));

                        nodeDragAndDrop.unbind(nodeElement);

                        nodeElement
                            .unbind('mouseenter')
                            .unbind('mouseleave');

                        if (onReport || !canDragOnReport(node, view, onReportCallbak, options)) {
                            return true;
                        }

                        // hints
                        var mouseenter = function() {
                            scope.$emit('show-hint', 'RSEARCH_' + view.type);
                        };

                        var mouseleave = function() {
                            scope.$emit('hide-hint', 'RSEARCH_' + view.type);
                        };

                        nodeElement
                            .bind('mouseenter', mouseenter)
                            .bind('mouseleave', mouseleave);

                        nodeDragAndDrop.bind(node, nodeElement, {
                            getNodeViews: function(node, nodeElement) {
                                if (_.isFunction(options.getNodeViews)) {
                                    return options.getNodeViews(node, nodeElement);
                                }

                                if (!isNodeSelected(node)) {
                                    selectNode(true, node, nodeElement);
                                }

                                return selectedNodes;
                            },
                            start: function(e, ui) {
                                Commons.DOMUtils.attrAsClass(element, {
                                    'result-drag': 'start'
                                });
                            },
                            stop: function(e, ui) {
                                if (!options.noCheckOnReport) {
                                    _.each(selectedNodes, function(data){
                                        checkDragOnReport(data.node, view);
                                    });
                                }

                                if (!options.noCheckSelect) {
                                    resetSelect();
                                }

                                Commons.DOMUtils.attrAsClass(element, {
                                    'result-drag': 'stop'
                                });

                                if (_.isFunction(onReportCallbak)) {
                                    onReportCallbak();
                                }
                            }
                        });

                        return onReport;
                    }

                    function toggleSelect(node, nodeElement) {
                        if (graphHelper.isNodeOnReport(node)) {
                            return;
                        }

                        var selected = !isNodeSelected(node);

                        selectNode(selected, node, nodeElement);
                    }

                    function selectNode(selected, node, nodeElement) {
                        var nodeUID = node.__uid;

                        if (selected) {
                            selectedNodes[nodeUID] = {
                                node: node,
                                nodeScope: {
                                    node: node
                                },
                                nodeElement: nodeElement
                            };
                        } else {
                            delete selectedNodes[nodeUID];
                        }

                        nodeElement.toggleClass('selected', selected);
                    }

                    function isNodeSelected(node) {
                        return _.has(selectedNodes, node.__uid);
                    }

                    function resetSelect() {
                        _.each(selectedNodes, function(data){
                            data.nodeElement.toggleClass('selected', false);
                        });

                        selectedNodes = {};

                        scope.$emit('hide-hint', 'RSEARCH_NODE_LIST');
                        scope.$emit('hide-hint', 'RSEARCH_NODE_FORM');
                    }

                    //
                    function canDragOnReport(node, view, onReportCallbak, options) {
                        return _.get(node, '_type') !== 'INDIVIDUAL_IDENTITY';
                    }
                }]
            };
        }]);
    //
});
