//
// @author ankostyuk
//
define(function(require, exports, module) {'use strict';

                          require('less!./styles/export');

    var Commons         = require('commons-utils');
    var angular         = require('angular');
    //

    //
    return angular.module('app.export', [])
        //
        .factory('exportHelper', ['$log', '$timeout', '$window', 'metaHelper', 'graphHelper', 'reportHelper', 'graphLayoutHelper', function($log, $timeout, $window, metaHelper, graphHelper, reportHelper, graphLayoutHelper){

            //
            return {
                checkInternalExport: function(noexportCallback){
                    var exportData = $window._EXPORT_DATA_;

                    if (!exportData || !exportData.isInternalExport) {
                        noexportCallback();
                        return;
                    }

                    $log.info('internal export...', exportData);

                    Commons.DOMUtils.body().addClass('internal-export');

                    var report          = exportData.report,
                        nodeTypes       = exportData.nodeTypes,
                        relationTypes   = exportData.relationTypes,
                        exportCallback  = exportData.internalExportReportReady;

                    metaHelper.initMetaInternal(nodeTypes, relationTypes);

                    $timeout(function(){
                        graphHelper.initGraph();

                        var style = report.style;
                        if (style) {
                            graphHelper.setZoom(style.zoomIndex);
                        }

                        reportHelper.createNewReport();

                        graphHelper.doReport(report, function(report){
                            afterReportRender();
                        });
                    });

                    function afterReportRender() {
                        var graphLayout = graphLayoutHelper.getGraphLayout(),
                            graphBounds = graphHelper.getGraphDOMBounds();

                        graphLayout.css({
                            'left': -graphBounds.minX + 'px',
                            'top': -graphBounds.minY + 'px',
                            'width': graphBounds.maxX + 'px',
                            'height': graphBounds.maxY + 'px'
                        });

                        exportCallback();
                    }
                }
            };
        }]);
    //
});
