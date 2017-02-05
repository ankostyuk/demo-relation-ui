//
// TODO Объединить и унифициовать с rsearch
//
// @author ankostyuk
//
define(function(require, exports, module) {'use strict';

                          require('less!./styles/node');
    var template        = require('text!./views/node.html');

                          require('lodash');
    var templateUtils   = require('template-utils');
    var Commons         = require('commons-utils');
    var angular         = require('angular');
    var uuid            = require('uuid');
    //

    var submodules = {
        rsearch:          require('nullpointer-rsearch/rsearch/rsearch')
    };

    //
    var NodeSettings = {
        extraType: {
            linkNodeType: 'LINK',
            userObjectNodeType: 'USER_OBJECT',
            userObjectRelationType: 'USER_RELATION'
        },
        popup: {
            showDelay: 0
        },
        relation: {
            addCount: 5
        }
    };

    var NODE_DEFAULT_PROPERTIES = {
        _relations: null
    };

    // TODO Объединить с rsearch
    var NODE_META = {
        'COMPANY': {
            titleField: 'nameshortsort'
        },

        'INDIVIDUAL': {
            titleField: 'name'
        },

        'ADDRESS': {
            titleField: 'value'
        },

        'PHONE': {
            titleField: 'value'
        },

        'PURCHASE': {
            titleField: 'form'
        }
    };

    // TODO Объединить с rsearch
    var MERGED_NODES_RELATION_TYPES = {
        'COMPANY': {
            'COMPANY_FOUNDER':                      ['FOUNDER_INDIVIDUAL-parents', 'FOUNDER_COMPANY-parents'],
            'COMPANY_SUBSIDIARY_COMPANY':           ['FOUNDER_COMPANY-children'],
            'COMPANY_EXECUTIVE':                    ['EXECUTIVE_INDIVIDUAL-parents', 'EXECUTIVE_COMPANY-parents'],
            'COMPANY_AFFILIATED_PARENTS':           ['AFFILIATED_INDIVIDUAL-parents', 'AFFILIATED_COMPANY-parents'],
            'COMPANY_AFFILIATED_CHILDREN':          ['AFFILIATED_COMPANY-children'],
            'COMPANY_HEAD_COMPANY':                 ['HEAD_COMPANY-parents'],
            'COMPANY_BRANCH_COMPANY':               ['HEAD_COMPANY-children'],
            'COMPANY_LEAD_COMPANY':                 ['EXECUTIVE_COMPANY-children'],
            'COMPANY_PREDECESSOR_COMPANY':          ['PREDECESSOR_COMPANY-parents'],
            'COMPANY_SUCCESSOR_COMPANY':            ['PREDECESSOR_COMPANY-children'],
            'COMPANY_REGISTER_HOLDER_COMPANY':      ['REGISTER_HOLDER-parents'],
            'COMPANY_REGISTERED_HOLDER_COMPANY':    ['REGISTER_HOLDER-children'],
            'COMPANY_CONTACTS_ADDRESS':             ['ADDRESS-parents'],
            'COMPANY_CONTACTS_PHONE':               ['PHONE-parents'],
            'COMPANY_CUSTOMER_CHILDREN':            ['CUSTOMER_COMPANY-children'],
            'COMPANY_PARTICIPANT_CHILDREN':         ['PARTICIPANT_COMPANY-children'],
            'COMPANY_EMPLOYEE_PARENTS':             ['EMPLOYEE-parents']
        },
        'INDIVIDUAL': {
            'INDIVIDUAL_SUBSIDIARY_COMPANY':        ['FOUNDER_INDIVIDUAL-children'],
            'INDIVIDUAL_LEAD_COMPANY':              ['EXECUTIVE_INDIVIDUAL-children'],
            'INDIVIDUAL_AFFILIATED_CHILDREN':       ['AFFILIATED_INDIVIDUAL-children'],
            'INDIVIDUAL_PARTICIPANT_CHILDREN':      ['PARTICIPANT_INDIVIDUAL-children'],
            'INDIVIDUAL_COMMISSION_MEMBER_CHILDREN':['COMMISSION_MEMBER-children'],
            'INDIVIDUAL_EMPLOYEE_CHILDREN':         ['EMPLOYEE-children']
        },
        'ADDRESS': {
            'ADDRESS_COMPANY':                      ['ADDRESS-children']
        },
        'PHONE': {
            'PHONE_COMPANY':                        ['PHONE-children']
        },
        'PURCHASE': {
            'PURCHASE_PARTICIPANT_PARENTS':         ['PARTICIPANT_INDIVIDUAL-parents', 'PARTICIPANT_COMPANY-parents'],
            'PURCHASE_COMMISSION_MEMBER_PARENTS':   ['COMMISSION_MEMBER-parents'],
            'PURCHASE_CUSTOMER_PARENTS':            ['CUSTOMER_COMPANY-parents']
        }
    };

    // TODO привести к единому формату: COMPANY_BENEFICIARIES <-> beneficiary-parents
    var FAKE_NODES_RELATION_TYPES = {
        'COMPANY': {
            'COMPANY_BENEFICIARIES':                ['beneficiary-parents']
        },
        'INDIVIDUAL': {
            'INDIVIDUAL_KINSHIP':                   ['kinsmen-sibling']
        }
    };

    var MERGED_NODES_RELATION_META = {
        'COMPANY': {
            'COMPANY_FOUNDER': {
                align: 'top'
            },
            'COMPANY_SUBSIDIARY_COMPANY': {
                align: 'bottom'
            },
            'COMPANY_EXECUTIVE': {
                align: 'right'
            },
            'COMPANY_AFFILIATED_PARENTS': {
                align: 'right'
            },
            'COMPANY_AFFILIATED_CHILDREN': {
                align: 'bottom'
            },
            'COMPANY_HEAD_COMPANY': {
                align: 'top'
            },
            'COMPANY_BRANCH_COMPANY': {
                align: 'bottom'
            },
            'COMPANY_LEAD_COMPANY': {
                align: 'bottom'
            },
            'COMPANY_PREDECESSOR_COMPANY': {
                align: 'top'
            },
            'COMPANY_SUCCESSOR_COMPANY': {
                align: 'bottom'
            },
            'COMPANY_REGISTER_HOLDER_COMPANY': {
                align: 'top'
            },
            'COMPANY_REGISTERED_HOLDER_COMPANY': {
                align: 'bottom'
            },
            'COMPANY_CONTACTS_ADDRESS': {
                align: 'left'
            },
            'COMPANY_CONTACTS_PHONE': {
                align: 'left'
            },
            'COMPANY_CUSTOMER_CHILDREN': {
                align: 'bottom'
            },
            'COMPANY_PARTICIPANT_CHILDREN': {
                align: 'top'
            },
            'COMPANY_EMPLOYEE_PARENTS': {
                align: 'bottom'
            }
        },
        'INDIVIDUAL': {
            'INDIVIDUAL_SUBSIDIARY_COMPANY': {
                align: 'top'
            },
            'INDIVIDUAL_LEAD_COMPANY': {
                align: 'bottom'
            },
            'INDIVIDUAL_AFFILIATED_CHILDREN': {
                align: 'bottom'
            },
            'INDIVIDUAL_PARTICIPANT_CHILDREN': {
                align: 'top'
            },
            'INDIVIDUAL_COMMISSION_MEMBER_CHILDREN': {
                align: 'left'
            },
            'INDIVIDUAL_EMPLOYEE_CHILDREN': {
                align: 'top'
            }
        },
        'ADDRESS': {
            'ADDRESS_COMPANY': {
                align: 'right'
            }
        },
        'PHONE': {
            'PHONE_COMPANY': {
                align: 'right'
            }
        },
        'PURCHASE': {
            'PURCHASE_PARTICIPANT_PARENTS': {
                align: 'bottom'
            },
            'PURCHASE_COMMISSION_MEMBER_PARENTS': {
                align: 'right'
            },
            'PURCHASE_CUSTOMER_PARENTS': {
                align: 'top'
            }
        }
    };

    var NODES_ALONE_RELATIONS_ADD = {
        'COMPANY':      ['COMPANY_FOUNDER', 'COMPANY_SUBSIDIARY_COMPANY', 'COMPANY_EXECUTIVE', 'COMPANY_CONTACTS_ADDRESS', 'COMPANY_CONTACTS_PHONE'],
        'INDIVIDUAL':   ['INDIVIDUAL_SUBSIDIARY_COMPANY', 'INDIVIDUAL_LEAD_COMPANY'],
        'ADDRESS':      ['ADDRESS_COMPANY'],
        'PHONE':        ['PHONE_COMPANY'],
        'PURCHASE':     ['PURCHASE_PARTICIPANT_PARENTS', 'PURCHASE_COMMISSION_MEMBER_PARENTS', 'PURCHASE_CUSTOMER_PARENTS']
    };

    //
    var templateData, viewTemplates;

    //
    function nodeLink(scope, element) {
        var eventSelect     = element.attr('node-event-select'),
            eventSelectData = element.attr('node-event-select-data');

        if (eventSelect) {
            element
                .addClass('selectable')
                .click(function(){
                    scope.toggleElementState(element, scope, 'selected', scope, function(on){
                        scope.$emit(eventSelect, scope, on, element, eventSelectData ? angular.fromJson(eventSelectData) : null);
                    });
                });
        }
    }

    //
    return angular.module('app.node', _.pluck(submodules, 'name'))
        //
        .run([function(){
            templateData    = templateUtils.processTemplate(template);
            viewTemplates   = templateData.templates;
        }])
        //
        .directive('nodeSimpleView', ['nodeHelper', function(nodeHelper) {
            return {
                restrict: 'A',
                replace: false,
                scope: {
                    node: '=nodeSimpleView'
                },
                template: viewTemplates['node-simple-view'].html,
                link: function(scope, element, attrs) {
                }
            };
        }])
        //
        .directive('relationSimpleView', [function() {
            return {
                restrict: 'A',
                replace: false,
                scope: {
                    relation: '=relationSimpleView'
                },
                template: viewTemplates['relation-simple-view'].html
            };
        }])
        //
        .factory('nodeHelper', ['$log', '$injector', '$rootScope', '$compile', '$timeout', 'metaHelper', 'l10nMessages', 'npRsearchMetaHelper', 'npRsearchRelationHelper', 'appConfig', function($log, $injector, $rootScope, $compile, $timeout, metaHelper, l10nMessages, npRsearchMetaHelper, npRsearchRelationHelper, appConfig){

            //
            var nodeHelper = {
                NodeSettings: NodeSettings,

                doAction: function(node, action){
                    $rootScope.$emit('do-graph-node-select', node);
                    $rootScope.$emit(action, node);
                },

                doRelationViewAction: function(relationView, action){
                    $rootScope.$emit('do-graph-relation-view-select', relationView);
                    $rootScope.$emit(action, relationView);
                },

                showRelations: function(node, data, target){
                    if (target === 'ON_REPORT') {
                        var mergedType = nodeHelper.__getMergedRelationType(node, data.relationType, data.direction);
                        $rootScope.$emit('show-node-relations-on-report', node, mergedType);
                    } else {
                        $rootScope.$emit('do-graph-node-select', node);
                        $rootScope.$emit('show-node-relations', node, data);
                    }
                },

                addRelations: function(node, data){
                    var mergedType = nodeHelper.__getMergedRelationType(node, data.relationType, data.direction);
                    $rootScope.$emit('add-node-relations-on-report', node, mergedType);
                },

                __getMergedRelationType: function(node, relationType, direction) {
                    var mergedRelationTypes = npRsearchMetaHelper.getRelationTypesByMergedType(relationType, direction),
                        relationTypes       = mergedRelationTypes ? mergedRelationTypes : [relationType],
                        keys, t, result;

                    keys = _.map(relationTypes, function(relationType){
                        return relationType + '-' + direction;
                    });

                    _.each(MERGED_NODES_RELATION_TYPES[node._type], function(types, mergedType){
                        t = _.intersection(keys, types);

                        if (!_.isEmpty(t)) {
                            result = mergedType;
                            return false;
                        }
                    });

                    return result;
                },

                createDragAndDropNodeView: function(container){
                    var nodeElement = $('<div>', {
                        attr: {
                            'drag-and-drop-node-view': ''
                        },
                        html: viewTemplates['drag-and-drop-node-view'].html
                    });

                    nodeElement.appendTo(container);

                    return {
                        nodeElement: nodeElement
                    };
                },

                createNodePopupView: function(container){
                    var nodePopupScope = $rootScope.$new();

                    nodePopupScope.node = {};

                    var nodePopupElement = $('<div>', {
                        attr: {
                            'node-popup-view': ''
                        },
                        html: viewTemplates['node-popup-view'].html
                    });

                    $compile(nodePopupElement)(nodePopupScope);

                    //
                    nodePopupScope.nodeView = null;

                    //
                    var togglePromise = null;

                    function toggle(show, func) {
                        if (togglePromise) {
                            $timeout.cancel(togglePromise);
                        }

                        if (show) {
                            if (NodeSettings.popup.showDelay) {
                                togglePromise = $timeout(func, NodeSettings.popup.showDelay);
                            } else {
                                func();
                            }
                        } else {
                            func();
                        }
                    }

                    // API
                    return {
                        show: function(nodeView){
                            nodePopupScope.nodeView = nodeView;

                            var nodeElement = nodeView.nodeElement,
                                nodeScope   = nodeView.nodeScope;

                            nodePopupScope.safeApply(function(){
                                nodePopupScope.node = nodeScope.node;

                                nodePopupElement.appendTo(nodeView.nodeElement);
                            });

                            toggle(true, function(){
                                // определить позицию и показать
                                nodePopupElement
                                    .css('visibility', 'hidden')
                                    .show();

                                Commons.DOMUtils.attrAsClass(nodeElement, {
                                    'node-popup-width': null,
                                    'node-popup-pos': 'top-right'
                                });

                                var popupWidth      = nodePopupElement.outerWidth(),
                                    popupHeight     = nodePopupElement.outerHeight(),
                                    nodeOffset      = nodeElement.offset(),
                                    nodeWidth       = nodeElement.outerWidth(),
                                    nodeHeight      = nodeElement.outerHeight(),
                                    window          = Commons.DOMUtils.window(),
                                    windowWidth     = window.outerWidth(),
                                    windowHeight    = window.outerHeight();

                                var v = (nodeOffset.top + nodeHeight + popupHeight) < windowHeight ? 'bottom' : 'top',
                                    h = (nodeOffset.left + popupWidth) < windowWidth ? 'right' : 'left';

                                Commons.DOMUtils.attrAsClass(nodeElement, {
                                    'node-popup-width': popupWidth < nodeWidth ? 'justify' : null,
                                    'node-popup-pos': (v + '-' + h)
                                });

                                nodePopupElement.css('visibility', 'visible');
                                nodeElement.addClass('node-popup');
                            });
                        },

                        hide: function(){
                            if (!nodePopupScope.nodeView) {
                                return;
                            }

                            toggle(false, function(){
                                nodePopupScope.nodeView.nodeElement.removeClass('node-popup');
                                nodePopupElement.hide();
                                nodePopupElement.appendTo(container);
                            });
                        }
                    };
                },

                createNodeGraphView: function(node, container){
                    nodeHelper.buildNodeExtraMeta(node);

                    var nodeScope               = $rootScope.$new(),
                        noToggleStateSelector   = '.relations *, .relation, .relation *',
                        nodeType                = node._type;

                    nodeScope.node = node;

                    var viewTemplate = viewTemplates['node-graph-view-' + node._type];

                    var nodeElement = $('<div>', {
                        'class': viewTemplate['class'],
                        attr: {
                            'node-graph-view': ''
                        },
                        css: {
                            'left': (node._x ? node._x : 0) + 'px',
                            'top': (node._y ? node._y : 0) + 'px'
                        },
                        html: viewTemplate.html
                    });

                    $compile(nodeElement)(nodeScope);

                    nodeElement.appendTo(container);

                    var nodeBodyElement = nodeElement.find('.body').dblclick(function(){
                        nodeScope.$emit('do-graph-node-select', node);
                        nodeScope.$emit('object-info', node);
                    });

                    var nodeHeaderElement   = nodeBodyElement.find('.header'),
                        headerMaxWidth      = parseInt(nodeHeaderElement.css('background-position') || nodeHeaderElement.css('background-position-x'));

                    var nodeGraphView = {
                        nodeElement: nodeElement,
                        nodeBodyElement: nodeBodyElement,
                        nodeScope: nodeScope,
                        nodeType: nodeType,

                        // @Deprecated
                        correctDimensions: function() {
                            return;
                            // if (nodeHeaderElement.innerWidth() > headerMaxWidth) {
                            //     nodeElement.addClass('fixed-header');
                            // }
                        },

                        canToggleState: function(e) {
                            return !$(e.target).is(noToggleStateSelector);
                        },

                        getCentralPointOffset: function(){
                            return parseInt(nodeElement.css('background-position') || nodeElement.css('background-position-x'));
                        },

                        getPosition: function(){
                            return {
                                left: node._x,
                                top: node._y
                            };
                        },

                        setPosition: function(position, css){
                            node._x = position.left;
                            node._y = position.top;

                            if (css) {
                                nodeElement.css({
                                    'left': position.left + 'px',
                                    'top': position.top + 'px'
                                });
                            }
                        },

                        toggleHoldZoom: function(){
                            nodeGraphView.setHoldZoom(!nodeGraphView.isHoldZoom());
                        },
                        isHoldZoom: function(){
                            var style = node._style || {};
                            return style.holdZoom;
                        },
                        setHoldZoom: function(hold){
                            node._style = node._style || {};
                            node._style.holdZoom = hold;
                            nodeElement.toggleClass('hold-zoom', !!hold);
                        },

                        eachChildrenRelations: function(iterator){
                            return nodeHelper.eachNodeChildrenRelations(node, iterator);
                        },

                        remove: function(){
                            nodeBodyElement.remove();
                            nodeElement.remove();
                            nodeScope.$destroy();
                        }
                    };

                    nodeGraphView.setHoldZoom(nodeGraphView.isHoldZoom());

                    return nodeGraphView;
                },

                // TODO обобщить код с createNodeGraphView
                createLinkNodeGraphView: function(linkNode, container){
                    nodeHelper.buildLinkNodeExtraMeta(linkNode);

                    var node        = linkNode,
                        nodeType    = node._type;

                    var nodeScope = $rootScope.$new();

                    nodeScope.node = node;

                    var viewTemplate = viewTemplates['node-graph-view-' + node._type];

                    var nodeElement = $('<div>', {
                        'class': viewTemplate['class'],
                        attr: {
                            'node-graph-view': ''
                        },
                        css: {
                            'left': (node._x ? node._x : 0) + 'px',
                            'top': (node._y ? node._y : 0) + 'px'
                        },
                        html: viewTemplate.html
                    });

                    $compile(nodeElement)(nodeScope);

                    nodeElement.appendTo(container);
                    var nodeBodyElement = nodeElement.find('.body');

                    var nodeGraphView = {
                        nodeElement: nodeElement,
                        nodeBodyElement: nodeBodyElement,
                        nodeScope: nodeScope,
                        nodeType: nodeType,

                        correctDimensions: angular.noop,

                        canToggleState: function(e) {
                            return true;
                        },

                        getCentralPointOffset: function(){
                            return parseInt(nodeElement.css('background-position') || nodeElement.css('background-position-x'));
                        },

                        getPosition: function(){
                            return {
                                left: node._x,
                                top: node._y
                            };
                        },

                        setPosition: function(position, css){
                            node._x = position.left;
                            node._y = position.top;

                            if (css) {
                                nodeElement.css({
                                    'left': position.left + 'px',
                                    'top': position.top + 'px'
                                });
                            }
                        },

                        toggleHoldZoom: function(){
                            nodeGraphView.setHoldZoom(!nodeGraphView.isHoldZoom());
                        },
                        isHoldZoom: function(){
                            var style = node._style || {};
                            return style.holdZoom;
                        },
                        setHoldZoom: function(hold){
                            node._style = node._style || {};
                            node._style.holdZoom = hold;
                            nodeElement.toggleClass('hold-zoom', !!hold);
                        },

                        eachChildrenRelations: function(iterator){
                            _.each(node._relations, function(relation){
                                var srcNodeUID = node.__uid,
                                    dstNodeUID = nodeHelper.buildNodeUIDByType(relation._dstId, relation.__destinationNodeType);

                                return iterator(relation, srcNodeUID, dstNodeUID);
                            });
                        },

                        remove: function(){
                            nodeBodyElement.remove();
                            nodeElement.remove();
                            nodeScope.$destroy();
                        }
                    };

                    //
                    nodeScope.$watch('node._comment', function(newValue, oldValue) {
                        if (newValue !== oldValue) {
                            nodeScope.$emit('node-view-content-change', nodeGraphView);
                        }
                    });

                    return nodeGraphView;
                },


                // TODO обобщить код с createNodeGraphView
                createUserObjectNodeGraphView: function(userObject, container){
                    nodeHelper.buildUserObjectNodeExtraMeta(userObject);

                    var node        = userObject,
                        nodeType    = node._type;

                    var nodeScope = $rootScope.$new();

                    nodeScope.node = node;

                    var viewTemplate = viewTemplates['node-graph-view-' + node._type];

                    var nodeElement = $('<div>', {
                        'class': viewTemplate['class'],
                        attr: {
                            'node-graph-view': ''
                        },
                        css: {
                            'left': (node._x ? node._x : 0) + 'px',
                            'top': (node._y ? node._y : 0) + 'px'
                        },
                        html: viewTemplate.html
                    });

                    $compile(nodeElement)(nodeScope);

                    nodeElement.appendTo(container);

                    var nodeBodyElement     = nodeElement.find('.body'),
                        imageWrapperElement = nodeBodyElement.find('.image-wrapper');

                    var nodeGraphView = {
                        nodeElement: nodeElement,
                        nodeBodyElement: nodeBodyElement,
                        nodeScope: nodeScope,
                        nodeType: nodeType,

                        correctDimensions: angular.noop,

                        canToggleState: function(e) {
                            return true;
                        },

                        getCentralPointOffset: function(){
                            return parseInt(nodeElement.css('background-position') || nodeElement.css('background-position-x'));
                        },

                        getPosition: function(){
                            return {
                                left: node._x,
                                top: node._y
                            };
                        },

                        setPosition: function(position, css){
                            node._x = position.left;
                            node._y = position.top;

                            if (css) {
                                nodeElement.css({
                                    'left': position.left + 'px',
                                    'top': position.top + 'px'
                                });
                            }
                        },

                        toggleHoldZoom: function(){
                            nodeGraphView.setHoldZoom(!nodeGraphView.isHoldZoom());
                        },
                        isHoldZoom: function(){
                            var style = node._style || {};
                            return style.holdZoom;
                        },
                        setHoldZoom: function(hold){
                            node._style = node._style || {};
                            node._style.holdZoom = hold;
                            nodeElement.toggleClass('hold-zoom', !!hold);
                        },

                        eachChildrenRelations: function(iterator){
                            _.each(node._relations, function(relation){
                                var srcNodeUID = node.__uid,
                                    dstNodeUID = nodeHelper.buildNodeUIDByType(relation._dstId, relation.__destinationNodeType);

                                return iterator(relation, srcNodeUID, dstNodeUID);
                            });
                        },

                        remove: function(){
                            nodeBodyElement.remove();
                            nodeElement.remove();
                            nodeScope.$destroy();
                        }
                    };

                    //
                    nodeScope.$watchGroup(['node.text', 'node.imageWidth', 'node.imagePosition', 'node.image'], function(newValues, oldValues) {
                        if (!_.isEqual(newValues, oldValues)) {
                            // TODO разобраться, почему через $timeout
                            $timeout(function(){
                                nodeScope.$emit('node-view-content-change', nodeGraphView);
                            });
                        }
                    });

                    return nodeGraphView;
                },

                createLink: function(nodes, comment){
                    var link = {
                        comment: comment
                    };

                    link.nodes = [];

                    _.each(nodes, function(node){
                        if (node._type === 'LINK') {
                            return;
                        }

                        link.nodes.push({
                            id: node._id,
                            type: node._type
                        });
                    });

                    return link;
                },

                // TODO объеденить код с nodeRelationPopupView
                createRelationPopupView: function(container){
                    var relationPopupScope = $rootScope.$new();

                    var relationPopupElement = $('<div>', {
                        attr: {
                            'relation-popup-view': ''
                        },
                        html: viewTemplates['relation-popup-view'].html
                    });

                    $compile(relationPopupElement)(relationPopupScope);

                    //
                    relationPopupScope.relationView = null;

                    //
                    var togglePromise = null;

                    function toggle(show, func) {
                        if (togglePromise) {
                            $timeout.cancel(togglePromise);
                        }

                        if (show) {
                            if (NodeSettings.popup.showDelay) {
                                togglePromise = $timeout(func, NodeSettings.popup.showDelay);
                            } else {
                                func();
                            }
                        } else {
                            func();
                        }
                    }

                    // API
                    return {
                        show: function(relationView){
                            relationPopupScope.safeApply(function(){
                                var relationElement = relationView.relationElement;

                                relationPopupScope.relationView = relationView;

                                relationPopupElement.appendTo(relationElement);

                                toggle(true, function(){
                                    // определить позицию и показать
                                    relationPopupElement
                                        .css('visibility', 'hidden')
                                        .show();

                                    Commons.DOMUtils.attrAsClass(relationElement, {
                                        'relation-popup-width': null,
                                        'relation-popup-pos': 'top-right'
                                    });

                                    /* Пока всегда одна позиция
                                    var popupWidth      = relationPopupElement.outerWidth(),
                                        popupHeight     = relationPopupElement.outerHeight(),
                                        relationOffset      = relationElement.offset(),
                                        relationWidth       = relationElement.outerWidth(),
                                        relationHeight      = relationElement.outerHeight(),
                                        window          = Commons.DOMUtils.window(),
                                        windowWidth     = window.outerWidth(),
                                        windowHeight    = window.outerHeight();

                                    var v = (relationOffset.top + relationHeight + popupHeight) < windowHeight ? 'bottom' : 'top',
                                        h = (relationOffset.left + popupWidth) < windowWidth ? 'right' : 'left';

                                    Commons.DOMUtils.attrAsClass(relationElement, {
                                        'relation-popup-width': popupWidth < relationWidth ? 'justify' : null,
                                        'relation-popup-pos': (v + '-' + h)
                                    });
                                    */

                                    relationPopupElement.css('visibility', 'visible');
                                    relationElement.addClass('relation-popup');
                                });
                            });
                        },

                        hide: function(){
                            if (!relationPopupScope.relationView) {
                                return;
                            }

                            toggle(false, function(){
                                relationPopupScope.relationView.relationElement.removeClass('relation-popup');
                                relationPopupElement.hide();
                                relationPopupElement.appendTo(container);
                            });
                        }
                    };
                },

                createRelationGraphView: function(srcNodeView, dstNodeView, container, relation){
                    var relationScope   = $rootScope.$new(),
                        relationType    = relation._type === 'LINK' || relation._type === 'USER_RELATION' ? relation._type : 'RELATION',
                        targetRelation  = relationType ? relation : null;

                    // relationScope.relation = {};

                    _.extend(relationScope, {
                        relation: {}
                    });
                    // relationScope.relation._style = relationScope.relation._style || {};

                    buildRelationsInfo();

                    var relationElement = $('<div>', {
                        'class': relationType,
                        attr: {
                            'relation-graph-view': ''
                        },
                        html: viewTemplates['relation-graph-view'].html
                    });

                    $compile(relationElement)(relationScope);

                    relationElement.appendTo(container);
                    var relationBodyElement = relationElement.find('.body');

                    //
                    var relationLabelGraphViews = {};

                    function buildRelationsInfo() {
                        var relationsInfo;

                        if (relationType === 'LINK') {
                            relationsInfo = null;
                        } else
                        if (relationType === 'USER_RELATION') {
                            relationsInfo = {
                                list: [{
                                    texts: [{
                                        text: relation.text
                                    }]
                                }]
                            };
                        } else {
                            relationsInfo = npRsearchRelationHelper.buildRelationsInfoBetweenNodes(
                                srcNodeView.nodeScope.node, dstNodeView.nodeScope.node, {
                                wrapRelationTexts: true
                            });
                        }

                        relationScope.relationsInfo = relationsInfo;
                    }

                    function buildData() {
                        if (_.size(relationLabelGraphViews) > 1) {
                            return;
                        }

                        $.each(relationLabelGraphViews, function(k, view){
                            relationScope.relation._comment = view.relationLabelScope.relation._comment;
                            relationScope.relation._style = view.relationLabelScope.relation._style || {};
                            return false;
                        });
                    }

                    var relationGraphView = {
                        relationElement: relationElement,
                        relationBodyElement: relationBodyElement,
                        relationScope: relationScope,
                        relationType: relationType,
                        targetRelation: targetRelation,

                        srcNode: srcNodeView.nodeScope.node,
                        dstNode: dstNodeView.nodeScope.node,

                        relationLabelGraphViews: relationLabelGraphViews,

                        __update: function(){
                            buildRelationsInfo();
                        },

                        addRelationLabelGraphView: function(relation, relationLabelGraphView){
                            relationLabelGraphViews[relation.__uid] = relationLabelGraphView;
                            buildData();
                        },

                        getRelationLabelGraphView: function(relation){
                            return relationLabelGraphViews[relation.__uid];
                        },

                        getRelationLabelGraphViews: function(){
                            return relationLabelGraphViews;
                        },

                        getStyle: function(){
                            // return _.get(relationScope.relation, '_style');
                            return relationScope.relation._style;
                        },

                        getViewLocation: function(){
                            // return _.get(relationScope.relation, '_style.labelState.location');
                            var labelState = relationScope.relation._style.labelState;
                            return labelState ? labelState.location : undefined;
                        },

                        isExpanded: function(){
                            // return _.get(relationScope.relation, '_style.labelState.expanded');
                            var labelState = relationScope.relation._style.labelState;
                            return labelState ? labelState.expanded : undefined;
                        },

                        setExpanded: function(expanded){
                            relationScope.relation._style.labelState = relationScope.relation._style.labelState || {};
                            relationScope.relation._style.labelState.expanded = expanded;

                            relationElement.toggleClass('expanded', !!expanded);
                        },

                        toggleExpand: function(){
                            relationGraphView.setExpanded(!relationGraphView.isExpanded());
                        },

                        removeRelation: function(relationUID){
                            var view = relationLabelGraphViews[relationUID];

                            if (!view) {
                                return;
                            }

                            view.remove();
                            delete relationLabelGraphViews[relationUID];
                        },

                        remove: function(){
                            _.each(relationLabelGraphViews, function(view){
                                view.remove();
                            });

                            relationBodyElement.remove();
                            relationElement.remove();
                            relationScope.$destroy();
                        }
                    };

                    return relationGraphView;
                },

                // @Deprecated
                addRelationLabelGraphView: function(relationView, relation){
                    nodeHelper.buildRelationExtraMeta(relation, relationView.srcNode, relationView.dstNode);

                    // var relationLabelScope = relationView.relationScope.$new();
                    var relationLabelScope = {};

                    relationLabelScope.relation = relation;

                    // var viewTemplate = viewTemplates['relation-label-graph-view-' + relation._type];
                    //
                    // var relationLabelElement = $('<div>', {
                    //     'class': viewTemplate['class'],
                    //     attr: {
                    //         'relation-label-graph-view': ''
                    //     },
                    //     html: viewTemplate.html
                    // });
                    //
                    // relationView.relationElement.addClass(viewTemplate['parent-class']);
                    //
                    // $compile(relationLabelElement)(relationLabelScope);
                    //
                    // relationLabelElement.appendTo(relationView.relationBodyElement);

                    //
                    var relationLabelGraphView = {
                        // relationLabelElement: relationLabelElement,
                        relationLabelScope: relationLabelScope,

                        remove: function(){
                            // relationLabelElement.remove();
                            // relationLabelScope.$destroy();
                        }
                    };

                    relationView.addRelationLabelGraphView(relation, relationLabelGraphView);

                    relationView.setExpanded(relationView.isExpanded());

                    return relationLabelGraphView;
                },

                __addRelationLabelGraphView: function(relationView, relation){
                    nodeHelper.buildRelationExtraMeta(relation, relationView.srcNode, relationView.dstNode);

                    var relationLabelScope = relationView.relationScope.$new();

                    relationLabelScope.relation = relation;

                    var viewTemplate = viewTemplates['relation-label-graph-view-' + relation._type];

                    var relationLabelElement = $('<div>', {
                        'class': viewTemplate['class'],
                        attr: {
                            'relation-label-graph-view': ''
                        },
                        html: viewTemplate.html
                    });

                    relationView.relationElement.addClass(viewTemplate['parent-class']);

                    $compile(relationLabelElement)(relationLabelScope);

                    relationLabelElement.appendTo(relationView.relationBodyElement);

                    //
                    var relationLabelGraphView = {
                        relationLabelElement: relationLabelElement,
                        relationLabelScope: relationLabelScope,

                        remove: function(){
                            relationLabelElement.remove();
                            relationLabelScope.$destroy();
                        }
                    };

                    relationView.addRelationLabelGraphView(relation, relationLabelGraphView);

                    relationView.setExpanded(relationView.isExpanded());

                    return relationLabelGraphView;
                },

                // @Deprecated: use rsearch
                // rsearch-meta.js
                buildNodeUID: function(node){
                    node.__uid = node.$$hashKey = node.__uid || nodeHelper.buildNodeUIDByType(node._id, node._type);
                    return node.__uid;
                },

                // @Deprecated: use rsearch
                // rsearch-meta.js
                buildNodeUIDByType: function(id, type){
                    return ('node-' + type + '-' + id);
                },

                buildNodesUID: function(nodes){
                    _.each(nodes, function(node){
                        nodeHelper.buildNodeUID(node);
                    });
                },

                buildLinkNodeUID: function(linkNode){
                    linkNode.__uid = linkNode.$$hashKey = linkNode.__uid || _.uniqueId((linkNode._type || NodeSettings.extraType.linkNodeType) + '.');
                    return linkNode.__uid;
                },

                buildUserObjectNodeUID: function(userObject){
                    userObject._id = userObject._id || uuid.v4();
                    userObject.__uid = userObject.$$hashKey = userObject.__uid || nodeHelper.buildNodeUIDByType(userObject._id, NodeSettings.extraType.userObjectNodeType);
                    return userObject.__uid;
                },

                buildRelationUID: function(relation) {
                    relation.__uid = relation.$$hashKey = relation.__uid || nodeHelper.buildRelationUIDByTypes(relation._srcId, relation._dstId, relation._type, relation.__destinationNodeType);
                    return relation.__uid;
                },

                // Используется destinationNodeType в ключе,
                // т.к. возможна пользовательская связь с любым объектом
                buildRelationUIDByTypes: function(srcId, dstId, relationType, destinationNodeType) {
                    return (srcId + '-' + relationType + '-' + (destinationNodeType ? destinationNodeType + '-' : '') + dstId);
                },

                buildNodeExtraMeta: function(node){
                    if (!node) {
                        return;
                    }

                    npRsearchMetaHelper.buildNodeExtraMeta(node);

                    // @Deprecated
                    // информация о связях
                    nodeHelper.buildNodeRelationsInfo(node);
                },

                buildLinkNodeExtraMeta: function(node){
                    if (!node) {
                        return;
                    }

                    // type
                    node._type = NodeSettings.extraType.linkNodeType;

                    // uid
                    nodeHelper.buildLinkNodeUID(node);

                    // pos
                    node._comment = node.comment;

                    // pos
                    node._x = node.x;
                    node._y = node.y;

                    // relations
                    node._relations = new Array(node.nodes.length);

                    _.each(node.nodes, function(n, i){
                        node._relations[i] = {
                            _srcId: node.__uid,
                            _dstId: n.id,
                            __destinationNodeType: n.type,
                            _type: NodeSettings.extraType.linkNodeType
                        };
                    });

                    // информация о связях
                    nodeHelper.buildNodeRelationsInfo(node);
                },

                buildUserObjectNodeExtraMeta: function(node){
                    if (!node) {
                        return;
                    }

                    // type
                    node._type = NodeSettings.extraType.userObjectNodeType;

                    // uid
                    nodeHelper.buildUserObjectNodeUID(node);

                    // pos
                    node._x = node.x;
                    node._y = node.y;

                    // relations
                    nodeHelper.buildUserObjectRelations(node);

                    // информация о связях
                    nodeHelper.buildNodeRelationsInfo(node);
                },

                buildRelationExtraMeta: function(relation, srcNode, dstNode){
                    if (!relation) {
                        return;
                    }

                    // uid
                    nodeHelper.buildRelationUID(relation);

                    // src & dst
                    relation.__srcNode = srcNode;
                    relation.__dstNode = dstNode;
                },

                mergeNodes: function(targetNode, node){
                    _.extend(targetNode, NODE_DEFAULT_PROPERTIES, node);
                },

                buildUserObjectRelations: function(node){
                    _.each(node._relations, function(relation){
                        _.extend(relation, {
                            _srcId: node._id,
                            _type: NodeSettings.extraType.userObjectRelationType
                        });
                    });
                },

                buildNodeRelationsInfo: function(node){
                    node.__relationData = npRsearchMetaHelper.buildRelationDataByNodeInfo(node);

                    // @Deprecated
                    nodeHelper.__buildRelationsInfo(node, node._relations, node, '__relationsInfo');
                },

                buildNodeRelationsOnReportInfo: function(nodeScope){
                    // $log.warn('* buildNodeRelationsOnReportInfo...', nodeScope.node.__uid);

                    if (nodeScope.node) {
                        // $log.info('> nodeScope.relationsOnReport', nodeScope.relationsOnReport);
                        nodeScope.node.__relationOnReportData = npRsearchMetaHelper.buildRelationDataByNodeRelations(nodeScope.node, nodeScope.relationsOnReport);

                        // Сколько добавить...
                        var relationData            = nodeScope.node.__relationData,
                            relationOnReportData    = nodeScope.node.__relationOnReportData;

                        _.each(relationOnReportData.relationCountMap, function(onReportCountData){
                            var countData = relationData.relationCountMap[onReportCountData.key];

                            if (!countData) {
                                return;
                            }

                            onReportCountData.relationAddCount = countData.relationCount - onReportCountData.relationCount;
                        });

                        // @Deprecated
                        nodeHelper.__buildRelationsInfo(nodeScope.node, nodeScope.relationsOnReport, nodeScope.node, '__relationsOnReportInfo');
                    }
                },

                getNodeAloneRelationsAddMergedTypes: function(node){
                    return NODES_ALONE_RELATIONS_ADD[node._type];
                },

                getNodeRelationSimpleType: function(node, relationType, relationDirection) {
                    var simpleType  = relationType + '-' + relationDirection,
                        mergedType  = nodeHelper.getNodeRelationMergedTypeBySimpleType(node, simpleType);

                    return mergedType ? simpleType : null;
                },

                getNodeRelationMergedTypeBySimpleType: function(node, simpleType) {
                    var mergedTypes = MERGED_NODES_RELATION_TYPES[node._type];
                    return _.find(_.keys(mergedTypes), function(mergedType){
                        return _.contains(mergedTypes[mergedType], simpleType);
                    });
                },

                getRelationBySimpleType: function(simpleType) {
                    var sep = simpleType.split('-');
                    return {
                        type: sep[0],
                        direction: sep[1]
                    };
                },

                // @Deprecated
                getFirstNodeRelationByMergedType: function(node, mergedType) {
                    var fakeRelations   = FAKE_NODES_RELATION_TYPES[node._type] && FAKE_NODES_RELATION_TYPES[node._type][mergedType];

                    if (fakeRelations) {
                        return nodeHelper.getRelationBySimpleType(fakeRelations[0]);
                    }

                    var simpleTypes     = MERGED_NODES_RELATION_TYPES[node._type][mergedType],
                        byMergedType    = node.__relationsInfo.byMergedTypes[mergedType],
                        byTypes         = byMergedType ? byMergedType.byTypes : null;

                    if (!simpleTypes || !byTypes) {
                        return null;
                    }

                    var simpleType = _.find(simpleTypes, function(type){
                        return _.has(byTypes, type);
                    });

                    return simpleType ? nodeHelper.getRelationBySimpleType(simpleType) : null;
                },

                // TODO объеденить код с подсчетом связей
                getNodeAddRelationInfo: function(node, mergedType, isSimpleType){
                    var simpleType = isSimpleType ? mergedType : null;

                    mergedType = simpleType ? nodeHelper.getNodeRelationMergedTypeBySimpleType(node, mergedType) : mergedType;

                    var meta    = MERGED_NODES_RELATION_META[node._type][mergedType],
                        types   = simpleType ? [simpleType] : MERGED_NODES_RELATION_TYPES[node._type][mergedType];

                    var info = {
                        byTypes: [],
                        align: meta.align
                    };

                    if (!node || !node.__relationsInfo || !node.__relationsOnReportInfo) {
                        return info;
                    }

                    //
                    var addCount = NodeSettings.relation.addCount;

                    _.each(types, function(type){
                        // TODO заполнять "нулевые данные" в другом месте
                        var relationsOnReportInfo = node.__relationsOnReportInfo.byTypes[type] || {
                            count: 0,
                            relations: []
                        };

                        var relation        = nodeHelper.getRelationBySimpleType(type),
                            relationKey     = npRsearchMetaHelper.buildNodeRelationKey(relation.direction, relation.type),
                            relationCount   = _.get(node, ['__relationData', 'relationCountMap', relationKey, 'relationCount']) || 0,
                            onReportCount   = _.get(node, ['__relationOnReportData', 'relationCountMap', relationKey, 'relationCount']) || 0,
                            d               = relationCount - onReportCount;

                        if (addCount > 0 && d > 0) {
                            var add = d > addCount ? addCount : d;

                            addCount -= add;

                            info.byTypes.push({
                                addCount: add,
                                relationType: relation.type,
                                direction: relation.direction,
                                onReportRelations: relationsOnReportInfo.relations
                            });
                        }
                    });

                    return info;
                },

                // @Deprecated
                __buildRelationsInfo: function(node, relations, scopeObject, propertyName){
                    var relationsInfo = {
                        byTypes: {},
                        byMergedTypes: {}
                    };

                    _.each(relations, function(relation){
                        var type    = relation._type + (relation._srcId === node._id ? '-children' : '-parents'),
                            byType  = relationsInfo.byTypes[type];

                        if (byType) {
                            byType.count++;
                            byType.relations.push(relation);
                        } else {
                            relationsInfo.byTypes[type] = {
                                count: 1,
                                relations: [relation]
                            };
                        }
                    });

                    _.each(MERGED_NODES_RELATION_TYPES[node._type], function(types, mergedType){
                        _.each(types, function(type){
                            var byType = relationsInfo.byTypes[type];

                            if (byType) {
                                var byMergedType = relationsInfo.byMergedTypes[mergedType];

                                if (byMergedType) {
                                    byMergedType.count += byType.count;
                                    byMergedType.relations = byMergedType.relations.concat(byType.relations);
                                    byMergedType.byTypes[type] = byType;
                                } else {
                                    relationsInfo.byMergedTypes[mergedType] = {
                                        count: byType.count,
                                        relations: byType.relations,
                                        byTypes: {}
                                    };

                                    relationsInfo.byMergedTypes[mergedType].byTypes[type] = byType;
                                }
                            }
                        });
                    });

                    scopeObject[propertyName] = relationsInfo;
                },

                getRelationCount: function(node, type) {
                    var byType = node.__relationsInfo.byTypes[type];

                    if (!byType) {
                        return null;
                    }

                    return byType.count;
                },

                getMergedRelationCountCollapse: function(node, mergedType) {
                    var byMergedType = node.__relationsInfo.byMergedTypes[mergedType];

                    if (!byMergedType) {
                        return null;
                    }

                    return _.size(byMergedType.byTypes) <= 1;
                },

                getMergedRelationCount: function(node, mergedType) {
                    var byMergedType = node.__relationsInfo.byMergedTypes[mergedType];

                    if (!byMergedType) {
                        return null;
                    }

                    return byMergedType.count;
                },

                getMergedRelationInfo: function(node) {
                    return node.__relationsInfo.byMergedTypes;
                },

                getRelationInfo: function(node) {
                    return node.__relationsInfo.byTypes;
                },

                eachNodeChildrenRelations: function(node, iterator){
                    _.each(node.__relationMap.relations, function(relationData){
                        var relation        = relationData.relation,
                            relationType    = metaHelper.getRelationType(relation._type),
                            srcNodeUID      = nodeHelper.buildNodeUIDByType(relation._srcId, relationType.sourceNodeType),
                            dstNodeUID      = nodeHelper.buildNodeUIDByType(relation._dstId, relationType.destinationNodeType);

                        if (srcNodeUID === node.__uid) {
                            return iterator(relation, srcNodeUID, dstNodeUID);
                        }
                    });

                    // _.each(node._relations, function(relation){
                    //     var relationType    = metaHelper.getRelationType(relation._type),
                    //         srcNodeUID      = nodeHelper.buildNodeUIDByType(relation._srcId, relationType.sourceNodeType),
                    //         dstNodeUID      = nodeHelper.buildNodeUIDByType(relation._dstId, relationType.destinationNodeType);
                    //
                    //     if (srcNodeUID === node.__uid) {
                    //         return iterator(relation, srcNodeUID, dstNodeUID);
                    //     }
                    // });
                },

                getNodeTitle: function(node) {
                    return node[NODE_META[node._type].titleField];
                },

                deletedRelationsToLinkText: function(nodes, relations) {
                    var lines = [l10nMessages.relation['NOT_RELEVANT']];

                    lines.push(nodeHelper.getNodeTitle(nodes[0]));

                    _.each(relations, function(relation){
                        lines.push(l10nMessages.relation[relation._type].label);
                    });

                    lines.push(nodeHelper.getNodeTitle(nodes[1]));

                    return lines.join('\n');
                },

                getInnInfoList: function(node) {
                    if (!node) {
                        return;
                    }

                    var graphHelper = $injector.get('graphHelper'),
                        innMap      = {};

                    nodeHelper.eachNodeChildrenRelations(node, function(relation, srcNodeUID, dstNodeUID){
                        var inn = relation.inn;

                        if (inn && !_.has(innMap, inn)) {
                            innMap[inn] = {
                                inn: inn,
                                onReport: graphHelper.isNodeOnReportByUID(dstNodeUID)
                            };
                        }
                    });

                    return _.sortBy(_.values(innMap), 'inn');
                }
            };

            return nodeHelper;
        }])
        //
        // TODO Использовать rsearch
        // Код из rsearch:
        // https://github.com/newpointer/rsearch/blob/c142740042ae137019bda709b01151cfcd7c651b/src/rsearch/rsearch-meta.js#L489
        .filter('relationPurchaseParticipant', ['$filter', function($filter){
            return function(relation){

                var nbsp        = ' ',
                    separator   = ', ';

                var purchaseNode = relation.__dstNode;

                var statusOrder = {
                    'WIN': 0,
                    'PARTICIPANT': 1,
                    'NOT_ADMITTED': 2
                };

                var ts = [],
                    byStatusMap = {},
                    alternateData, t,
                    byStatus, status, byStatusList,
                    // lotNumber,
                    price;

                _.each(relation.lots, function(lot){
                    alternateData = (
                        purchaseNode.__lotMap[lot.lot] &&
                        purchaseNode.__lotMap[lot.lot].applications &&
                        purchaseNode.__lotMap[lot.lot].applications[lot.application]
                    ) || {};

                    status      = lot['status'] || alternateData['status'] || 'PARTICIPANT';
                    price       = lot['price'] || alternateData['price'] || 0;
                    // lotNumber   = lot['lot'];

                    byStatus = byStatusMap[status];

                    if (byStatus) {
                        byStatus.totalPrice += price;
                        // byStatus.lots.push(lotNumber);
                    } else {
                        byStatusMap[status] = {
                            status: status,
                            totalPrice: price
                            // lots: [lotNumber]
                        };
                    }
                });

                byStatusList = _.sortBy(byStatusMap, function(s, k){
                    return statusOrder[k];
                });

                _.each(byStatusList, function(s){
                    // t = [_tr(s.status)];
                    t = [_.capitalize(_tr(s.status))];

                    if (s.totalPrice) {
                        t.push($filter('number')(s.totalPrice, 0) + nbsp + _tr(purchaseNode.currency));
                    }

                    // t.push(
                    //     (_.size(s.lots) === 1 ? _trc("лот", "лот в закупке") : _trc("лоты", "лот в закупке")) +
                    //     nbsp + s.lots.join(separator)
                    // );

                    ts.push(t.join(nbsp));
                });

                return ts.join('\n');
            };
        }])
        //
        .filter('relationOnReportCountWithMessage', ['$log', '$filter', 'l10nMessages', function($log, $filter, l10nMessages){
            return function(node, countData) {
                var onReportCountData = _.get(node, ['__relationOnReportData', 'relationCountMap', countData.key]);

                if (!onReportCountData) {
                    return null;
                }

                var message = l10nMessages.relation['X_ON_REPORT'];

                return onReportCountData.relationAddCount ?
                    $filter('number')(onReportCountData.relationCount) + ' ' + message :
                    message;
            };
        }])
        //
        .filter('relationOnReportAddCountWithMessage', ['$log', '$filter', 'l10nMessages', function($log, $filter, l10nMessages){
            return function(node, countData) {
                var onReportCountData = _.get(node, ['__relationOnReportData', 'relationCountMap', countData.key]) || {};

                var defaultAddCount = NodeSettings.relation.addCount,
                    onReportCount   = onReportCountData.relationCount || 0,
                    d               = countData.relationCount - onReportCount;

                if (d === 0) {
                    return null;
                }

                if (onReportCount === 0) {
                    if (defaultAddCount < countData.relationCount) {
                        return l10nMessages.relation['ADD'] + ' ' + defaultAddCount + ' ' + l10nMessages.relation['ON_REPORT'];
                    }

                    return l10nMessages.relation['ADD_ON_REPORT'];
                }

                return l10nMessages.relation['X_MORE'] + ' ' + (defaultAddCount < d ? defaultAddCount : d);
            };
        }]);
    //
});
