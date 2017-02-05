//
// @Deprecated: use rsearch
// TODO объеденить relation/.../meta.js и rsearch-meta.js
// @author ankostyuk
//
define(function(require, exports, module) {'use strict';

                          require('lodash');
    var angular         = require('angular');

    var submodules = {
        'rsearch-meta':   require('nullpointer-rsearch/rsearch/rsearch-meta')
    };

    //
    return angular.module('app.meta', _.pluck(submodules, 'name'))
        //
        .factory('metaHelper', ['$log', '$q', '$rootScope', 'npRsearchMetaHelper', function($log, $q, $rootScope, npRsearchMetaHelper){

            var scope       = $rootScope,
                initDefer   = $q.defer();

            //
            scope.meta = {
                nodeTypes: {},
                relationTypes: {}
            };

            npRsearchMetaHelper.initPromise().then(function(){
                scope.meta = {
                    nodeTypes: npRsearchMetaHelper.getNodeTypes(),
                    relationTypes: npRsearchMetaHelper.getRelationTypes()
                };

                initDefer.resolve();
            });

            //
            var metaHelper = {

                initMetaInternal: function(nodeTypes, relationTypes) {
                    scope.meta = {
                        nodeTypes: {},
                        relationTypes: {}
                    };

                    _.each(nodeTypes, function(nodeType){
                        scope.meta.nodeTypes[nodeType.name] = nodeType;
                    });

                    _.each(relationTypes, function(relationType){
                        scope.meta.relationTypes[relationType.name] = relationType;
                    });
                },

                initMeta: function() {
                    return initDefer.promise;
                },

                getNodeType: function(name) {
                    return scope.meta.nodeTypes[name];
                },

                getRelationType: function(name) {
                    return scope.meta.relationTypes[name];
                }
            };

            return metaHelper;
        }])
        //
        .filter('source', ['l10nMessages', function(l10nMessages){
            return function(sourceCode){
                return l10nMessages.source[sourceCode];
            };
        }])
        //
        .filter('phoneType', ['l10nMessages', function(l10nMessages){
            return function(node){
                if (!node) {
                    return null;
                }

                return l10nMessages.phoneType[node.phoneType];
            };
        }]);
    //
});
