//
// @author ankostyuk
//
define(function(require, exports, module) {'use strict';

                          require('lodash');
    var angular         = require('angular');
    //

    var DefaultZoomLevelIndex = 0;

    var ZoomLevels = [{
        name: 'normal',
        scale: 1
    }, {
        name: 'base-info',
        scale: 1
    }, {
        name: 'min-info',
        scale: 1
    }, {
        name: 'icons',
        scale: 0.75
    }/*, {
        css: 'icons',
        scale: 0.5
    }, {
        css: 'icons',
        scale: 0.25
    }*/];

    //
    return angular.module('app.graph.zoom', [])
        //
        .factory('graphZoomHelper', ['$log', '$rootScope', function($log, $rootScope){
            var scope = $rootScope;

            //
            var zoom = {
                index: null,
                level: null
            };

            //
            function isZoomMin() {
                return zoom.index === ZoomLevels.length - 1;
            }

            function isZoomMax() {
                return zoom.index === 0;
            }

            function zoomOut(callback) {
                doZoom(zoom.index + 1, callback);
            }

            function zoomIn(callback) {
                doZoom(zoom.index - 1, callback);
            }

            function doZoom(index, callback) {
                var oldIndex = zoom.index;

                index = index < 0 ? 0 : (index >= ZoomLevels.length ? ZoomLevels.length - 1 : index);

                if (oldIndex == index) {
                    return;
                }

                zoom.index = index;
                zoom.level = ZoomLevels[index];

                //
                scope.$emit('graph-zoom', zoom.level);

                if (_.isFunction(callback)) {
                    callback(zoom.level);
                }
            }

            function setDefaultZoom(callback) {
                doZoom(DefaultZoomLevelIndex, callback);
            }

            function setZoom(index, callback) {
                doZoom(index, callback);
            }

            // module API
            var graphZoomHelper = {
                isZoomMin: isZoomMin,
                isZoomMax: isZoomMax,
                zoomOut: zoomOut,
                zoomIn: zoomIn,
                setDefaultZoom: setDefaultZoom,

                setZoom: setZoom,
                getZoom: function(){
                    return zoom;
                }
            };

            return graphZoomHelper;
        }]);
    //
});
