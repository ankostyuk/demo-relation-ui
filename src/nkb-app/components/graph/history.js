//
// @author ankostyuk
//
define(function(require, exports, module) {'use strict';

                          require('lodash');

    var angular         = require('angular');
    //

    var HistorySettings = {
        size: 10
    };

    //
    return angular.module('app.graph.history', [])
        //
        .factory('graphHistoryHelper', ['$log', '$injector', '$rootScope', 'npExpandContentHelper', function($log, $injector, $rootScope, npExpandContentHelper){
            var scope = $rootScope;

            //
            var history, historyIndex;

            resetHistory();

            scope.$on('new-report', function(){
                resetHistory();
            });

            scope.$on('graph-nodes-from-url', function(){
                resetHistory();
                onHistory();
            });
            scope.$on('graph-nodes-from-grid', function(){
                resetHistory();
                onHistory();
            });
            scope.$on('open-report', function(){
                resetHistory();
                onHistory();
            });

            scope.$on('after-add-nodes', onHistory);
            scope.$on('after-delete-nodes', onHistory);
            scope.$on('vertex-drag-stop', onHistory);
            scope.$on('edge-view-drag-stop', onHistory);
            scope.$on('object-theme', onHistory);
            scope.$on('line-style', onHistory);
            scope.$on('update-user-object', onHistory);
            scope.$on('create-user-relation', onHistory);
            scope.$on('update-user-relation', onHistory);
            scope.$on('delete-user-relation', onHistory);

            //
            function resetHistory() {
                history         = [];
                historyIndex    = -1;
            }

            function getHistorySize() {
                return _.size(history);
            }

            function canUndo() {
                return historyIndex > 0;
            }

            function canRedo() {
                return historyIndex < getHistorySize() - 1;
            }

            function onHistory() {
                var report      = {},
                    graphHelper = $injector.get('graphHelper');

                if (historyIndex < getHistorySize() - 1) {
                    history = history.slice(0, historyIndex + 1);
                }
                if (getHistorySize() === HistorySettings.size) {
                    history = history.slice(1);
                }

                graphHelper.fillReport(report, true);
                history.push(report);

                historyIndex = getHistorySize() - 1;
            }

            function doHistory() {
                var report      = copyReport(history[historyIndex]),
                    graphHelper = $injector.get('graphHelper');

                npExpandContentHelper.closeAll();

                scope.longOperation(
                    function(){
                        graphHelper.clear();
                    },
                    function(done){
                        graphHelper.doReport(report, function(report){
                            scope.$emit('graph-history');
                            done();
                        });
                    }
                );
            }

            function undo() {
                if (canUndo()) {
                    historyIndex--;
                    if (historyIndex < 0) {
                        historyIndex = 0;
                    }
                    doHistory();
                }
            }

            function redo() {
                if (canRedo()) {
                    historyIndex++;
                    if (historyIndex > getHistorySize() - 1) {
                        historyIndex = getHistorySize() - 1;
                    }
                    doHistory();
                }
            }

            function copyReport(srcReport) {
                // TODO deep copy -> optimize
                return _.cloneDeep(srcReport);
            }

            // module API
            var graphHistoryHelper = {
                canUndo: canUndo,
                canRedo: canRedo,
                undo: undo,
                redo: redo
            };

            return graphHistoryHelper;
        }]);
    //
});
