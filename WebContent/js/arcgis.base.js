/*
 * @content:地图初始化脚本
 * @date:2014/11/17
 * @nameSpace:map
 * */

/*
 * @content:全局变量定义
 * */
var global_map;

/*
 * @content:地图初始化
 * @spacename:map
 */
var map={};
map.init = function(){
	require([
     "esri/urlUtils",
     "esri/map", 
     "esri/tasks/GeometryService",
     "esri/toolbars/edit",

     "esri/layers/ArcGISTiledMapServiceLayer",
     "esri/layers/FeatureLayer",
     //交通最优线路分析
     "esri/graphic",            
     "esri/tasks/RouteTask",            
     "esri/tasks/RouteParameters",
     "esri/tasks/FeatureSet", 
     "dojo/on",
     "dijit/registry",
     "esri/geometry/Extent",
     "esri/layers/ArcGISDynamicMapServiceLayer",
     "esri/symbols/PictureMarkerSymbol",
     "dojo/_base/array",
     "dojo/dom",
 
     "esri/Color",
     "esri/symbols/SimpleMarkerSymbol",
     "esri/symbols/SimpleLineSymbol",

     "esri/dijit/editing/Editor",
     "esri/dijit/HomeButton",
     "esri/dijit/Measurement",
     "esri/dijit/Directions",
     "esri/dijit/editing/TemplatePicker",

     "esri/config",
     "dojo/i18n!esri/nls/jsapi",

     "dojo/_base/array", "dojo/parser", "dojo/keys",

     "dijit/layout/BorderContainer", "dijit/layout/ContentPane", 
     "dijit/TitlePane",
     "dijit/form/CheckBox",
     "dijit/form/HorizontalSlider",
     "dijit/form/HorizontalRuleLabels",
     "dojo/domReady!"
       ], function(
         urlUtils,
         Map, GeometryService, Edit, 
         ArcGISTiledMapServiceLayer, FeatureLayer,
   
         Graphic,RouteTask, RouteParameters,FeatureSet,on, registry,Extent,ArcGISDynamicMapServiceLayer,
         PictureMarkerSymbol,array,dom,

         Color, SimpleMarkerSymbol, SimpleLineSymbol, 
         Editor, HomeButton,Measurement,Directions,TemplatePicker,
         esriConfig, jsapiBundle,
         arrayUtils, parser, keys
       ) {
        parser.parse();
        //代理设置
        /*
        //use a proxy to access the routing service,which requires credits
        urlUtils.addProxyRule({
          urlPrefix : "route.arcgis.com",
          proxyUrl : "/sproxy/"
        });       
         */
        var basemapGallery;
        var map, routeTask, routeParams, routes = [];
        var stopSymbol, barrierSymbol, routeSymbols, polylineBarrierSymbol;
        var mapOnClick_addStops_connect, mapOnClick_addBarriers_connect,
            mapOnClick_addpolylineBarriers_connect;
        // snapping is enabled for this sample - change the tooltip to reflect this
        jsapiBundle.toolbars.draw.start = jsapiBundle.toolbars.draw.start +  "<br>Press <b>ALT</b> to enable snapping";
       
        // refer to "Using the Proxy Page" for more information:  https://developers.arcgis.com/javascript/jshelp/ags_proxy.html
        esriConfig.defaults.io.proxyUrl = "/proxy";    

        //This service is for development and testing purposes only. We recommend that you create your own geometry service for use within your applications. 
        esriConfig.defaults.geometryService = new GeometryService("http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");
        
        map = new Map("map", { 
          //basemap: "streets",
          center: [120.179787 , 30.263478],
          zoom: 16,
          slider: "small",
          logo: false,
          navigationMode: 'classic',
          //extent: new Extent({xmin:-20098296,ymin:-2804413,xmax:5920428,ymax:15813776,spatialReference:{wkid:54032}})
        });

        var basemap = new esri.layers.ArcGISTiledMapServiceLayer("http://cache1.arcgisonline.cn/ArcGIS/rest/services/ChinaOnlineCommunity/MapServer");
        map.addLayer(basemap);
        
        map.on("layers-add-result", initEditor);
        //map.on("dbl-click", addStop);

        
        //add boundaries and place names 
        var labels = new ArcGISTiledMapServiceLayer("http://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer");
        map.addLayer(labels);
        //杭州市区道路要素
        var main_streets = new FeatureLayer("http://localhost:6080/arcgis/rest/services/hangzhou/%E4%BA%A4%E9%80%9A%E6%8B%A5%E5%A0%B5/FeatureServer/0",{
          mode: FeatureLayer.MODE_ONDEMAND, 
          showLabels: true,
          opacity :1,
          outFields: ['*']
        });
        //杭州市区杂路要素
        var other_streets = new FeatureLayer("http://localhost:6080/arcgis/rest/services/hangzhou/%E4%BA%A4%E9%80%9A%E6%8B%A5%E5%A0%B5/FeatureServer/1",{
          mode: FeatureLayer.MODE_ONDEMAND, 
          showLabels: true,
          opacity :1,
          outFields: ['*']
        });
        var streetmap = new ArcGISDynamicMapServiceLayer("http://localhost:6080/arcgis/rest/services/hangzhou/HZStreets/MapServer");

        map.addLayers([main_streets, other_streets]);

        //输入地名搜索路径
        var directions = new Directions({
            map: map,
            routeTaskUrl: "http://localhost:6080/arcgis/rest/services/hangzhou/HZStreets/NAServer/Route",
            //routeSymbol : SimpleLineSymbol().setColor(new dojo.Color([0, 0, 255, 1])).setWidth(5)
            routeParams: {},
          },"directionDiv");
        directions.startup();

        //两点之间最优路径选择
        routeTask = new RouteTask("http://localhost:6080/arcgis/rest/services/hangzhou/HZStreets/NAServer/Route");
        //setup the toute parameters
        routeParams = new RouteParameters();
        routeParams.stops = new FeatureSet();
        routeParams.barriers = new FeatureSet();
        routeParams.outSpatialReference = {
          "wkid" : 102100
        };
        routeTask.on("solve-complete", showRoute);
        routeTask.on("error", errorHandler);
        //define the symbology used to display the route
        stopSymbol = new SimpleMarkerSymbol().setStyle(SimpleMarkerSymbol.STYLE_CROSS).setSize(20);
        stopSymbol.outline.setWidth(5);

        barrierSymbol = new SimpleMarkerSymbol().setStyle(SimpleMarkerSymbol.STYLE_X).setSize(20);
        barrierSymbol.outline.setWidth(5).setColor(new Color([255,0,0]));

        routeSymbols = {
          "Route 1": new SimpleLineSymbol().setColor(new Color([0,0,255,1])).setWidth(5),
          "Route 2": new SimpleLineSymbol().setColor(new Color([0,0,0,1])).setWidth(5),
          "Route 3": new SimpleLineSymbol().setColor(new Color([255,0,255,1])).setWidth(5)
        };
        //停靠点点要素渲染
        var Symbol = new PictureMarkerSymbol({
          "angle":0,
          "xoffset":0,
          "yoffset":10,
          "type":"esriPMS",
          "url":"http://static.arcgis.com/images/Symbols/Shapes/RedPin1LargeB.png",
          "contentType":"image/png",
          "width":30,
          "height":30
        });
        //按键事件侦听
        //button click event listeners can't be added directly in HTML when the code is wrapped in an AMD callback
        on(dom.byId("addStopsBtn"), "click", addStops);
        on(dom.byId("clearStopsBtn"), "click", clearStops);
        on(dom.byId("addBarriersBtn"), "click", addBarriers);
        on(dom.byId("clearBarriersBtn"), "click", clearBarriers);
        on(dom.byId("solveRoutesBtn"), "click", solveRoute);
        on(dom.byId("clearRoutesBtn"), "click", clearRoutes);

        //添加路径选择坐标点        
         //Begins listening for click events to add stops
        function addStops() {
          alert("1");
          removeEventHandlers();
          mapOnClick_addStops_connect = map.on("dbl-click", addStop);
        }

        //Clears all stops
        function clearStops() {
          removeEventHandlers();
          for (var i=routeParams.stops.features.length-1; i>=0; i--) {
            map.graphics.remove(routeParams.stops.features.splice(i, 1)[0]);
          }
        }

        //Adds a stop. The stop is associated with the route currently displayed in the dropdown
        function addStop(evt) {
          routeParams.stops.features.push(
            map.graphics.add(
              new esri.Graphic(
                evt.mapPoint,
                stopSymbol,
                { RouteName:dom.byId("routeName").value }
              )
            )
          );
        }

        //Begins listening for dbl-click events to add barriers
        function addBarriers() {
          removeEventHandlers();
          mapOnClick_addBarriers_connect = on(map, "dbl-click", addBarrier);
        }

        //Clears all barriers
        function clearBarriers() {
          removeEventHandlers();
          for (var i=routeParams.barriers.features.length-1; i>=0; i--) {
            map.graphics.remove(routeParams.barriers.features.splice(i, 1)[0]);
          }
        }

        //Adds a barrier
        function addBarrier(evt) {
          routeParams.barriers.features.push(
            map.graphics.add(
              new esri.Graphic(
                evt.mapPoint,
                barrierSymbol
              )
            )
          );
        }
        //Begins listening for dbl-click events to add polylinebarriers
        function addpolylineBarriers() {
          removeEventHandlers();
          drawToolbar.activate(Draw.POLYLINE);
          var drawEnd_connect = connect.connect(drawToolbar, "onDrawEnd", function(geometry){
            routeParams.polylineBarriers.features.push(
              map.graphics.add(new Graphic(geometry, polylineBarrierSymbol))
              );
          })
          //mapOnClick_addpolylineBarriers_connect = on(map, "click", addpolylineBarrier);
        }

        //Clears all polylinebarriers
        function clearpolylineBarriers() {
          removeEventHandlers();
          for (var i=routeParams.polylineBarriers.features.length-1; i>=0; i--) {
            map.graphics.remove(routeParams.polylineBarriers.features.splice(i, 1)[0]);
          }
        }

        //Adds a polylinebarrier
        function addpolylineBarrier(evt) {
          routeParams.polylineBarriers.features.push(
            map.graphics.add(
              new esri.Graphic(
                evt.geometry,
                polylineBarrierSymbol
              )
            )
          );
        }

        //Stops listening for click events to add barriers and stops (if they've already been wired)
        function removeEventHandlers() {        
          if (mapOnClick_addStops_connect) {
            mapOnClick_addStops_connect.remove();
          }
          if (mapOnClick_addBarriers_connect) {
            mapOnClick_addBarriers_connect.remove();
          }
          if (mapOnClick_addpolylineBarriers_connect) {
            mapOnClick_addpolylineBarriers_connect.remove();
          }
        }

        //Solves the routes. Any errors will trigger the errorHandler function.
        function solveRoute() {
          removeEventHandlers();
          routeTask.solve(routeParams);
        }

        //Clears all routes
        function clearRoutes() {
          for (var i=routes.length-1; i>=0; i--) {
            map.graphics.remove(routes.splice(i, 1)[0]);
          }
          routes = [];
        }

        //Draws the resulting routes on the map
        function showRoute(evt) {
          clearRoutes();

          array.forEach(evt.result.routeResults, function(routeResult, i) {
            routes.push(
              map.graphics.add(
                routeResult.route.setSymbol(routeSymbols[routeResult.routeName])
              )
            );
          });

          var msgs = ["Server messages:"];
          array.forEach(evt.result.messages, function(message) {
            msgs.push(message.type + " : " + message.description);
          });
          if (msgs.length > 1) {
            alert(msgs.join("\n - "));
          }
        }

        //Reports any errors that occurred during the solve
        function errorHandler(err) {
          alert("An error occured\n" + err.message + "\n" + err.details.join("\n"));
        }

        //地图初始化
        function initEditor(evt) {
          map.disableDoubleClickZoom();
          //模版选择器
          var templateLayers = arrayUtils.map(evt.layers, function(result){
            return result.layer;
          });
          var templatePicker = new TemplatePicker({
            featureLayers: templateLayers,
            grouping: true,
            rows: "auto",
            columns: 2
          }, "templateDiv");
          templatePicker.startup();

          var layers = arrayUtils.map(evt.layers, function(result) {
            return { featureLayer: result.layer };
          });
          var settings = {
            map: map,
            templatePicker: templatePicker,
            layerInfos: layers,
            toolbarVisible: true,
            enableUndoRedo: true,
            createOptions: {
              polylineDrawTools:[ Editor.CREATE_TOOL_FREEHAND_POLYLINE ],
              polygonDrawTools: [ 
                Editor.CREATE_TOOL_FREEHAND_POLYGON,
                Editor.CREATE_TOOL_CIRCLE,
                Editor.CREATE_TOOL_TRIANGLE,
                Editor.CREATE_TOOL_RECTANGLE
              ]
            },
            toolbarOptions: {
              cutVisible: true,
              mergeVisible: true,
              reshapeVisible: true
            },
            layerInfo: {
               showGlobalID: true,
               showObjectID: true,
            }      
          };

          var params = {settings: settings};    
          var myEditor = new Editor(params,'editorDiv');
          //define snapping options
          var symbol = new SimpleMarkerSymbol(
            SimpleMarkerSymbol.STYLE_CROSS, 
            15, 
            new SimpleLineSymbol(
              SimpleLineSymbol.STYLE_SOLID, 
              new Color([255, 0, 0, 0.5]), 
              5
            ), 
            null
          );
          map.enableSnapping({
            snapPointSymbol: symbol,
            tolerance: 20,
            snapKey: keys.ALT
          });
    
          myEditor.startup();
          
          var home = new HomeButton({
            map: map
          },"HomeButtonDiv");
          home.startup();
          //测量模块
          var measurement = new Measurement({
            map: map
          },"measurementDiv");
          measurement.startup();

        }
      });
}
