<%@ page language="java" contentType="text/html; charset=utf-8"
    pageEncoding="utf-8"%>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="initial-scale=1, maximum-scale=1, user-scalable=no">
	<title>交通GIS管理系统</title>  
	<link rel="stylesheet" href="/arcgisweb/style/claro.css">
	<link rel="stylesheet" href="/arcgisweb/style/style.css"> 
	<link rel="stylesheet" type="text/css" href="http://localhost/arcgis/arcgis_js_api/library/3.9/3.9/js/dojo/dijit/themes/claro/claro.css"/>
    <link rel="stylesheet" type="text/css" href="http://localhost/arcgis/arcgis_js_api/library/3.9/3.9/js/esri/css/esri.css" />
    <script>
		//var BASE_URL = window.location.host + "/arcgis";
		var BASE_URL = 'localhost/arcgis';
	</script>
    <script type="text/javascript" src="http://localhost/arcgis/arcgis_js_api/library/3.9/3.9/init.js"></script>
	<script src="/arcgisweb/js/arcgis.base.js"></script>
 
	<script>
		map.init();
	</script>
</head>
<body class="claro">
    <div id="main" data-dojo-type="dijit/layout/BorderContainer" data-dojo-props="design:'headline'" style="height:width:100%;height:100%;">
      <div data-dojo-type="dijit/layout/ContentPane" id="header" data-dojo-props="region:'top'">
        交通GIS系统
        <div id="editorDiv"></div>
      </div>
      <div data-dojo-type="dijit/layout/ContentPane" data-dojo-props="region:'left'" style="width: 200px;overflow:hidden;">
        <div id="templateDiv"></div>     
      </div>
      <div data-dojo-type="dijit/layout/ContentPane" data-dojo-props="region:'right'" style="width: 200px;overflow:hidden;">
        <div id="directionDiv"></div>     
      </div>
      <div data-dojo-type="dijit/layout/ContentPane" id="map" data-dojo-props="region:'center'">
         <div id="HomeButtonDiv"></div>
         <div style="position:absolute; right:20px; top:40px; z-Index:999;">
          <div id="titlePane" data-dojo-type="dijit/TitlePane" data-dojo-props="title:'Measurement', closable:'false', open:'true'">
            <div id="measurementDiv"></div>
            <span style="font-size:smaller;padding:5px 5px;">Press <b>CTRL</b> to enable snapping.</span>
          </div>
         </div>
         <div id="selectoption">
         选择道路: 
         <select id="routeName">
            <option value="Route 1">线路 1</option>
            <option value="Route 2">线路 2</option>
            <option value="Route 3">线路 3</option>
          </select> + 
              <button id="addStopsBtn">添加停靠点</button>
              <button id="clearStopsBtn">清除停靠点</button>
              <button id="addBarriersBtn">添加障碍点</button>
              <button id="clearBarriersBtn">清除障碍点</button>
              <button id="solveRoutesBtn">产生路径</button>
              <button id="clearRoutesBtn">清除线路</button>
          </div>
      </div>
    </div>
  </body>
</html>