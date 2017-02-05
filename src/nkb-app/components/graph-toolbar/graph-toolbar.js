//
// @author ankostyuk
//
define(function(require, exports, module) {'use strict';

                          require('less!./styles/graph-toolbar');
    var template        = require('text!./views/graph-toolbar.html');

    var Commons         = require('commons-utils');
    var i18n            = require('i18n');
    var angular         = require('angular');
    //

    var directiveName               = 'app-graph-toolbar',
        objectActionsDirectiveName  = 'object-actions';

    //
    return angular.module('app.graph-toolbar', [])
        //
        .run([function(){
            template = i18n.translateTemplate(template);
        }])
        //
        .directive(_.camelize(directiveName), [function(){
            return {
                restrict: 'A',
                replace: false,
                template: template,
                scope: false
            };
        }])
        //
        .directive(_.camelize(objectActionsDirectiveName), ['$log', '$timeout', 'graphHelper', 'nodeHelper', 'npExpandContentHelper', function($log, $timeout, graphHelper, nodeHelper, npExpandContentHelper){
            return {
                restrict: 'C',
                link: function(scope, element, attrs){
                    var relationView = null;
                    //
                    scope.actions = {
                        object: null,
                        objectUpdated: null,

                        objects: null,

                        nodes: null,
                        linkText: null,

                        saveObjectProperty: function(property){
                            if (!scope.actions.object) {
                                return;
                            }

                            scope.actions.object[property] = scope.actions.objectUpdated[property];

                            scope.$emit('object-property');
                        },

                        linkNodes: function(){
                            graphHelper.linkNodes(scope.actions.objects, scope.actions.linkText);
                        },

                        deleteObjects: function(){
                            graphHelper.deleteNodes(scope.actions.objects || [scope.actions.object]);
                        }
                    };

                    // TODO Переписать распределение выделенных (objects, nodes, ...) - хуйня какая-то.
                    // Использовать graphObjectSelectInfo.byTypes
                    scope.$on('graph-object-select', function(e, selectedObjects, graphObjectSelectInfo){
                        $log.info('* graph-object-select', selectedObjects, graphObjectSelectInfo);
                        scope.safeApply(function(){
                            var nodeView, objects, nodes;

                            relationView = null;

                            npExpandContentHelper.closeContent(element);

                            if (graphObjectSelectInfo.total === 1 && (graphObjectSelectInfo.nodes === 1 || graphObjectSelectInfo.links === 1)) {
                                nodeView = _.toArray(selectedObjects)[0];
                                initObject(nodeView.nodeScope.node);
                            } else
                            if (graphObjectSelectInfo.total === 1 && graphObjectSelectInfo.relations === 1) {
                                relationView = _.toArray(selectedObjects)[0].relationView;
                                initObject(relationView.relationScope.relation);
                            }  else {
                                initObject(null);
                            }

                            if (graphObjectSelectInfo.total === 1 && graphObjectSelectInfo.userObjects === 1) {
                                userObject.mode = 'EDIT';
                                nodeView = _.toArray(selectedObjects)[0];
                                userObject.reset(nodeView.nodeScope.node);
                                initObject(nodeView.nodeScope.node);
                            } else {
                                userObject.mode = 'CREATE';
                                userObject.reset();
                            }

                            if (graphObjectSelectInfo.total > 1) {
                                objects = [];
                                nodes   = [];

                                _.each(selectedObjects, function(view){
                                    if (view.objectType === 'vertex') {
                                        objects.push(view.nodeScope.node);
                                        if (view.nodeScope.node._type !== 'LINK') {
                                            nodes.push(view.nodeScope.node);
                                        }
                                    }
                                });

                                initObjects(objects);
                                initNodes(nodes);
                            }  else {
                                initObjects(null);
                                initNodes(null);
                            }

                            userRelation.reset();
                        });
                    });

                    scope.$on('graph-object-unselect-all', function(){
                        scope.safeApply(function(){
                            relationView = null;

                            npExpandContentHelper.closeContent(element);
                            initObject(null);
                            initObjects(null);
                            initNodes(null);

                            userObject.mode = 'CREATE';
                            userObject.reset();

                            userRelation.reset();
                        });
                    });

                    function initObject(object) {
                        if (object) {
                            scope.actions.object = object;
                            scope.actions.objectUpdated = _.pick(object, '_comment');
                        } else {
                            scope.actions.object = null;
                            scope.actions.objectUpdated = null;
                        }
                    }

                    function initObjects(objects) {
                        if (objects) {
                            scope.actions.objects = objects;
                        } else {
                            scope.actions.objects = null;
                        }
                    }

                    function initNodes(nodes) {
                        if (nodes) {
                            scope.actions.nodes = nodes;
                        } else {
                            scope.actions.nodes = null;
                        }

                        scope.actions.linkText = null;
                    }

                    // theme/style
                    element.find('.object-theme-label').click(function(){
                        graphHelper.setObjectTheme($(this).attr('object-theme'));
                    });
                    element.find('.line-style-label').click(function(){
                        graphHelper.setLineStyle($(this).attr('line-style'));
                    });
                    element.find('.line-width-label').click(function(){
                        graphHelper.setLineWidth($(this).attr('line-width'));
                    });
                    element.find('.opacity-label').click(function(){
                        graphHelper.setOpacity($(this).attr('opacity-name'));
                    });

                    //
                    scope.$on('object-note', function(e, object){
                        doAction('object-note');
                    });

                    scope.$on('objects-link-edit', function(e, object){
                        doAction('objects-link-edit');
                    });

                    scope.$on('objects-user-object-edit', function(e, object){
                        doAction('user-object');
                    });

                    scope.$on('object-delete', function(e, object){
                        doAction('object-delete');
                    });

                    scope.$on('user-relation', function(e, object){
                        doAction('user-relation');
                    });

                    scope.$on('user-relation-delete', function(e, object){
                        doAction('user-relation-delete');
                    });

                    function doAction(action) {
                        $timeout(function(){
                            npExpandContentHelper.openContent(element, action);
                        });
                    }

                    //
                    element
                        .bind('content-open', function(e, content){
                            if (element.is(e.target)) {
                                scope.$emit('show-hint', 'OBJECT_ACTIONS_START');
                            }
                        })
                        .bind('content-close', function(){
                            scope.$emit('hide-hint', 'OBJECT_ACTIONS_START');
                        });

                    // user-object
                    var userObjectDefault = {
                        node: {
                            text: null,
                            image: null,
                            imageWidth: 50,
                            imagePosition: 'left',
                            userRelations: []
                        },
                        buildNode: function(node) {
                            return _.pick(node, ['text', 'image', 'imageWidth', 'imagePosition', 'userRelations']);
                        }
                    };

                    var userObject = {
                        mode: 'CREATE',
                        node: userObjectDefault.buildNode(userObjectDefault.node),
                        targetNode: null,
                        imageFormElement: element.find('.user-object .image-tools form'),
                        imageFileElement: element.find('.user-object .add-image input'),
                        // nodeGraphViewElement: element.find('.user-object .object-preview [node-graph-view]'),
                        imageWrapperElement: element.find('.user-object .object-preview .image-wrapper'),
                        imageElement: element.find('.user-object .object-preview .image-wrapper img'),
                        imageFileReader: new FileReader(),
                        confirmDeleteImage: true,
                        previewImage: function(image) {
                            userObject.confirmDeleteImage = true;
                            userObject.resetImage(image);
                        },
                        deleteImage: function() {
                            if (userObject.confirmDeleteImage) {
                                userObject.confirmDeleteImage = false;
                                return;
                            }

                            userObject.resetImage();
                            userObject.resetUI();
                        },
                        create: function() {
                            var node = _.extend(userObjectDefault.buildNode(userObject.node), {
                                imageWidth: userObject.imageWrapperElement.width()
                            });

                            graphHelper.createUserObject(node);
                        },
                        update: function() {
                            var updated = _.extend({}, userObjectDefault.buildNode(userObject.node), {
                                imageWidth: userObject.imageWrapperElement.width()
                            });

                            graphHelper.updateUserObject(userObject.targetNode, updated);
                        },
                        resetImage: function(image, width) {
                            _.extend(userObject.node, {
                                image: image || userObjectDefault.node.image,
                                imageWidth: width || userObjectDefault.node.imageWidth
                            });
                            userObject.imageWrapperElement.css({
                                'width': userObject.node.imageWidth + 'px',
                                'height': 'auto'
                            });
                            userObject.imageElement.attr('src', image);
                        },
                        resetTheme: function() {
                            // Commons.DOMUtils.attrAsClass(userObject.nodeGraphViewElement, {
                            //     'theme': _.get(userObject.node, '_style.theme')
                            // });
                        },
                        resetUI: function() {
                            userObject.confirmDeleteImage = true;
                            userObject.imageFormElement.get(0).reset();
                        },
                        reset: function(node) {
                            userObject.targetNode = node;
                            userObject.node = _.extend({}, node || userObjectDefault.buildNode(userObjectDefault.node));
                            userObject.resetImage(userObject.node.image, userObject.node.imageWidth);
                            userObject.resetTheme();
                            userObject.resetUI();
                        }
                    };

                    scope.actions.userObject = userObject;

                    userObject.imageFileReader.onload = function(e) {
                        userObject.previewImage(e.target.result);
                    };

                    userObject.imageFileElement.change(function(e){
                        var file = _.get(userObject.imageFileElement.get(0), 'files[0]');

                        if (file) {
                            userObject.imageFileReader.readAsDataURL(file);
                        }
                    });

                    userObject.imageWrapperElement.resizable({
                        minWidth: 20,
                        maxWidth: 200,
                        aspectRatio: true,
                        handles: "se"
                    });

                    // user-relation
                    var userRelation = {
                        mode: 'CREATE',
                        relation: {
                            text: null
                        },
                        srcNode: null,
                        dstNode: null,
                        existRelation: null,
                        create: function() {
                            graphHelper.createUserRelation(userRelation.srcNode, userRelation.dstNode, userRelation.relation.text);
                            userRelation.reset();
                        },
                        update: function() {
                            graphHelper.updateUserRelation(userRelation.srcNode, userRelation.dstNode, userRelation.existRelation, userRelation.relation.text);
                        },
                        delete: function() {
                            graphHelper.deleteUserRelation(userRelation.srcNode, userRelation.dstNode, userRelation.existRelation);
                        },
                        reset: function() {
                            userRelation.srcNode = null;
                            userRelation.dstNode = null;
                            userRelation.existRelation = null;

                            if (_.size(scope.actions.nodes) === 2) {
                                // Только связь от пользовательского объекта к любому объекту
                                userRelation.srcNode = scope.actions.nodes[0]._type === 'USER_OBJECT' ? scope.actions.nodes[0] : scope.actions.nodes[1];
                                userRelation.dstNode = scope.actions.nodes[0]._type === 'USER_OBJECT' ? scope.actions.nodes[1] : scope.actions.nodes[0];

                                userRelation.existRelation = _.find(userRelation.srcNode._relations, function(relation){
                                    return relation.__uid === nodeHelper.buildRelationUIDByTypes(
                                        userRelation.srcNode._id, userRelation.dstNode._id, relation._type, relation.__destinationNodeType
                                    );
                                });
                            } else if (_.get(relationView, 'relationType') === 'USER_RELATION') {
                                userRelation.existRelation = relationView.targetRelation;
                                userRelation.srcNode = userRelation.existRelation.__srcNode;
                                userRelation.dstNode = userRelation.existRelation.__dstNode;
                            }

                            userRelation.mode = userRelation.existRelation ? 'EDIT' : 'CREATE';
                            userRelation.relation.text = userRelation.existRelation ? userRelation.existRelation.text : null;
                        }
                    };

                    scope.actions.userRelation = userRelation;

                    // auto focus
                    element
                        .find('.content[content-id="object-note"], .content[content-id="objects-link"], .content[content-id="objects-link-edit"], .content[content-id="user-object"], .content[content-id="user-relation"]')
                        .bind('content-open', function(){
                            $(this).find('textarea').focus();
                        });
                }
            };
        }]);
    //
});
