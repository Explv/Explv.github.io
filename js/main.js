'use strict';

// TODO: Stop being lazy and clean up this damn file

define("main", ['domReady!', 'jquery', 'jqueryui', 'bootstrap', 'leaflet', 'Position', 'Path', 'Area', 'Areas', 'PolyArea', 'Grid', 'SyntaxHighlighter', 'locations','L.CanvasLayer'],

    function (doc, $, $ui, Bootstrap, L, Position, Path, Area, Areas, PolyArea, Grid, SyntaxHighlighter, locations, canvasLayer) {

        var OutputType = Object.freeze({ARRAY: 1, LIST: 2, ARRAYS_AS_LIST: 3, RAW: 4});
        var outputType = OutputType.ARRAY;

        var map = L.map('map', {
            //maxBounds: L.latLngBounds(L.latLng(-40, -180), L.latLng(85, 153))
            zoomControl:false,
			renderer: L.canvas()
        }).setView([-82, -138], 7);

        /*
          Init custom controls
        */
        var titleLabel = L.Control.extend({
          options: {
            position: 'topleft'
          },
          onAdd: function(map) {
            var container = L.DomUtil.create('div');
            container.id = 'titleLabel';
            container.href = 'http://osbot.org/forum/user/192661-explv/';
            container.innerHTML = "<span id='explv'>Explv</span>'s Map";

            L.DomEvent.disableClickPropagation(container);
            return container;
          }
        });
        map.addControl(new titleLabel());

        var coordinatesControl = L.Control.extend({
            options: {
              position: 'topleft'
            },
            onAdd: function(map) {
              var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
              container.id = 'coordinates-container';
              container.style.height = 'auto';

              var coordinatesForm = L.DomUtil.create('form', 'leaflet-bar leaflet-control leaflet-control-custom form-inline', container);
              var formGroup = L.DomUtil.create('div', 'form-group', coordinatesForm);
              var xCoordInput = L.DomUtil.create('input', 'form-control coord', formGroup);
              xCoordInput.type = 'text';
              xCoordInput.id = 'xCoord';
              var yCoordInput = L.DomUtil.create('input', 'form-control coord', formGroup);
              yCoordInput.type = 'text';
              yCoordInput.id = 'yCoord';
              var zCoordInput = L.DomUtil.create('input', 'form-control coord', formGroup);
              zCoordInput.type = 'text';
              zCoordInput.id = 'zCoord';

              L.DomEvent.disableClickPropagation(container);
              return container;
            }
        });
        map.addControl(new coordinatesControl());

        L.control.zoom({
            position:'topleft'
        }).addTo(map);

        var planeControl = L.Control.extend({
            options: {
              position: 'topleft'
            },
            onAdd: function(map) {
              var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
              container.style.background = 'none';
              container.style.width = '70px';
              container.style.height = 'auto';

              var incrementPlaneButton = L.DomUtil.create('a', 'leaflet-bar leaflet-control leaflet-control-custom', container);
              incrementPlaneButton.id = 'increase-level';
              incrementPlaneButton.innerHTML = 'Z +';

              var decrementPlaneButton = L.DomUtil.create('a', 'leaflet-bar leaflet-control leaflet-control-custom', container);
              decrementPlaneButton.id = 'decrease-level';
              decrementPlaneButton.innerHTML = 'Z -';

              L.DomEvent.disableClickPropagation(container);
              return container;
            }
        });
        map.addControl(new planeControl());

        var locationSearch = L.Control.extend({
            options: {
              position: 'topleft'
            },
            onAdd: function(map) {
              var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
              container.style.background = 'none';
              container.style.width = '200px';
              container.style.height = 'auto';

              var locationInput = L.DomUtil.create('input', 'leaflet-bar leaflet-control leaflet-control-custom', container);
              locationInput.id = 'location-lookup';
              locationInput.type = 'text';
              locationInput.placeholder = "Go to location";

              L.DomEvent.disableClickPropagation(container);
              return container;
            }
        });
        map.addControl(new locationSearch());

        var collectionControls = L.Control.extend({
            options: {
              position: 'topleft'
            },
            onAdd: function(map) {
              var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
              container.style.background = 'none';
              container.style.width = '70px';
              container.style.height = 'auto';

              var areaButton = L.DomUtil.create('a', 'leaflet-bar leaflet-control leaflet-control-custom toggle-collection', container);
              areaButton.id = 'toggle-area';
              areaButton.innerHTML = 'Area';

              var polyAreaButton = L.DomUtil.create('a', 'leaflet-bar leaflet-control leaflet-control-custom toggle-collection', container);
              polyAreaButton.id = 'toggle-poly-area';
              polyAreaButton.innerHTML = 'Poly Area';

              var pathButton = L.DomUtil.create('a', 'leaflet-bar leaflet-control leaflet-control-custom toggle-collection', container);
              pathButton.id = 'toggle-path';
              pathButton.innerHTML = 'Path';

              var undoButton = L.DomUtil.create('a', 'leaflet-bar leaflet-control leaflet-control-custom', container);
              undoButton.id = 'undo';
              undoButton.innerHTML = '<i class="fa fa-undo" aria-hidden="true"></i>';

              var clearButton = L.DomUtil.create('a', 'leaflet-bar leaflet-control leaflet-control-custom', container);
              clearButton.id = 'clear';
              clearButton.innerHTML = '<i class="fa fa-trash" aria-hidden="true"></i>';

              L.DomEvent.disableClickPropagation(container);
              return container;
            }
        });
        map.addControl(new collectionControls());

        var labelControl = L.Control.extend({
            options: {
              position: 'topleft'
            },
            onAdd: function(map) {
              var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
              container.style.background = 'none';
              container.style.width = '100px';
              container.style.height = 'auto';

              var labelsButton = L.DomUtil.create('a', 'leaflet-bar leaflet-control leaflet-control-custom', container);
              labelsButton.id = 'toggle-map-labels';
              labelsButton.innerHTML = 'Toggle Labels';

              L.DomEvent.disableClickPropagation(container);
              return container;
            }
        });
        map.addControl(new labelControl());
		
		var gridControl = L.Control.extend({
            options: {
              position: 'topleft'
            },
            onAdd: function(map) {
              var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
              container.style.background = 'none';
              container.style.width = '130px';
              container.style.height = 'auto';

              var labelsButton = L.DomUtil.create('a', 'leaflet-bar leaflet-control leaflet-control-custom', container);
              labelsButton.id = 'toggle-region-grid';
              labelsButton.innerHTML = 'Toggle Region Grid';

              L.DomEvent.disableClickPropagation(container);
              return container;
            }
        });
        map.addControl(new gridControl());
		
		var regionLabelsControl = L.Control.extend({
            options: {
              position: 'topleft'
            },
            onAdd: function(map) {
              var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
              container.style.background = 'none';
              container.style.width = '130px';
              container.style.height = 'auto';

              var labelsButton = L.DomUtil.create('a', 'leaflet-bar leaflet-control leaflet-control-custom', container);
              labelsButton.id = 'toggle-region-labels';
              labelsButton.innerHTML = 'Toggle Region Labels';

              L.DomEvent.disableClickPropagation(container);
              return container;
            }
        });
        map.addControl(new regionLabelsControl());

        var z = 0;

        var layer;

        function setMapLayer() {
          if (layer !== undefined) {
            map.removeLayer(layer);
          }
          layer = L.tileLayer('https://raw.githubusercontent.com/Explv/osrs_map_full_20171105/master/' + z + '/{z}/{x}/{y}.png', {
              minZoom: 4,
              maxZoom: 11,
              attribution: 'Map data',
              noWrap: true,
              tms: true
          });
          layer.addTo(map);
          map.invalidateSize();
        }

        setMapLayer();

        var mapLabels = new L.layerGroup();

        for (var location in locations) {

          if (locations.hasOwnProperty(location)) {
            if (locations[location].z !== z) {
              continue;
            }

            var mapLabel = L.marker(locations[location].toCentreLatLng(map), {
                icon: L.divIcon({
                    className: 'map-label',
                    html: `<p>${location}</p>`
                }),
                zIndexOffset: 1000
            });

            mapLabels.addLayer(mapLabel);
          }
        }

        mapLabels.addTo(map);

        $("#toggle-map-labels").click(function() {
            if (map.hasLayer(mapLabels)) {
              map.removeLayer(mapLabels);
            } else {
              mapLabels.addTo(map);
            }
        });
		
		var grid = new Grid(map, new L.FeatureGroup());
		
		$("#toggle-region-grid").click(function() {
            if (!grid.isVisible()) {
              grid.show();
            } else {
              grid.hide();
            }
        });
		
		var regionLabelsEnabled = false;
		
		var myCustomCanvasDraw= function(){
            this.onLayerDidMount = function (){};
			  
            this.onLayerWillUnmount  = function(){};
			  
            this.setData = function (data){
              this.needRedraw();
            };
			  
            this.onDrawLayer = function (info){
			    var ctx = info.canvas.getContext('2d');
				ctx.clearRect(0, 0, info.canvas.width, info.canvas.height);
				
				if (regionLabelsEnabled) {
				
					ctx.font = '10pt Calibri';
					ctx.fillStyle = 'white';
					ctx.textAlign="center"; 
			
					for (var x = 1152; x < 3904; x += 64) {
						for (var y = 2496; y < 10432; y += 64) {
							var position = new Position(x + 32, y + 32, 0);
							var latLng = position.toCentreLatLng(map);
					
							var regionId = String((x >> 6) * 256 + (y >> 6));
								
							var canvasPoint = info.layer._map.latLngToContainerPoint(latLng);
							ctx.fillText(regionId, canvasPoint.x, canvasPoint.y);
						}
					}
				}
            } 
        }
        myCustomCanvasDraw.prototype = new L.CanvasLayer();
        var regionLabelsLayer = new myCustomCanvasDraw();
		regionLabelsLayer.addTo(map);
		
		$("#toggle-region-labels").click(function() {
			regionLabelsEnabled = !regionLabelsEnabled;
			regionLabelsLayer.drawLayer();
        });

        var path = new Path(map, new L.FeatureGroup());
        var areas = new Areas(map, new L.FeatureGroup());
        var polyArea = new PolyArea(new L.FeatureGroup(), map);

        var currentDrawable;

        var prevMouseRect, prevMousePos;
        var cursorX, cursorY;

        var firstSelectedAreaPosition;
        var drawnMouseArea;

        var searchMarker;

        var editing = false;

        $("#output-type").change(function () {
            switch ($("#output-type").val()) {
                case "Array":
                    outputType = OutputType.ARRAY;
                    break;
                case "List":
                    outputType = OutputType.LIST;
                    break;
                case "Arrays.asList":
                    outputType = OutputType.ARRAYS_AS_LIST;
                    break;
				case "Raw":
					outputType = OutputType.RAW;
					break;
            }
            output();
        })

        $(".toggle-collection").click(function () {

            if ($(this).hasClass("active")) {

                editing = false;

                $(this).removeClass("active");
                $("#output-container").hide();
                $("#map-container").removeClass("col-lg-9 col-md-7 col-sm-8 col-xs-8");
                $("#map-container").addClass("col-lg-12 col-md-12 col-sm-12 col-xs-12");
                map.invalidateSize();

                firstSelectedAreaPosition = undefined;
                path.hide(map);
                areas.hide(map);
                polyArea.hide(map);

                if (drawnMouseArea !== undefined) {
                  map.removeLayer(drawnMouseArea);
                }
                output();
                return;
            }

            editing = true;

            $(".active").removeClass("active");
            $(this).addClass("active");

            if ($("#output-container").css('display') == 'none') {
                $("#map-container").removeClass("col-lg-12 col-md-12 col-sm-12 col-xs-12");
                $("#map-container").addClass("col-lg-9 col-md-7 col-sm-8 col-xs-8");
                $("#output-container").show();
                map.invalidateSize();
            }

            switch ($(this).attr("id")) {
                case "toggle-path":
                    firstSelectedAreaPosition = undefined;
                    areas.hide(map);
                    polyArea.hide(map);
                    path.show(map);
                    if (drawnMouseArea !== undefined) {
                        map.removeLayer(drawnMouseArea);
                    }
                    currentDrawable = path;
                    break;
                case "toggle-area":
                    path.hide(map);
                    polyArea.hide(map);
                    areas.show(map);
                    currentDrawable = areas;
                    break;
                case "toggle-poly-area":
                    firstSelectedAreaPosition = undefined;
                    path.hide(map);
                    areas.hide(map);
                    polyArea.show(map);
                    if (drawnMouseArea !== undefined) {
                        map.removeLayer(drawnMouseArea);
                    }
                    currentDrawable = polyArea;
                    break;
            }
            output();
        });

        $("#undo").click(function () {
            currentDrawable.removeLast();
            output();
        });

        $("#clear").click(function () {
            currentDrawable.removeAll();
            output();
        });

        map.on('click', function (e) {
            if (!editing) {
              return;
            }

            var position = Position.fromLatLng(map, e.latlng, z);

            if (currentDrawable instanceof Areas) {
                if (firstSelectedAreaPosition === undefined) {
                    firstSelectedAreaPosition = position;
                } else {
                    map.removeLayer(drawnMouseArea);
                    areas.add(new Area(firstSelectedAreaPosition, position));
                    firstSelectedAreaPosition = undefined;
                    output();
                }
            } else {
                currentDrawable.add(position);
                output();
            }
        });

        map.on('mousemove', function (e) {

            var mousePos = Position.fromLatLng(map, e.latlng, z);

            if (prevMousePos !== mousePos) {

                prevMousePos = mousePos;

                if (prevMouseRect !== undefined) map.removeLayer(prevMouseRect);

                prevMouseRect = mousePos.toLeaflet(map);
                prevMouseRect.addTo(map);

                $("#xCoord").val(mousePos.x);
                $("#yCoord").val(mousePos.y);
                $("#zCoord").val(mousePos.z);
            }

            if (editing) {

                if (firstSelectedAreaPosition !== undefined) {

                    if (drawnMouseArea !== undefined) map.removeLayer(drawnMouseArea);

                    drawnMouseArea = new Area(firstSelectedAreaPosition, mousePos).toLeaflet(map);
                    drawnMouseArea.addTo(map, true);
                }
            }
        });

        $(".coord").keyup(goToSearchCoordinates);

        function goToSearchCoordinates() {
            var x = $("#xCoord").val();
            var y = $("#yCoord").val();
            if ($.isNumeric(x) && $.isNumeric(y)) {
                goToCoordinates(x, y);
            }
        }

        function goToCoordinates(x, y) {
            if (searchMarker !== undefined) map.removeLayer(searchMarker);
            searchMarker = new L.marker(new Position(x, y, z).toCentreLatLng(map));
            searchMarker.addTo(map);
            map.panTo(searchMarker.getLatLng());
        }

        document.onmousemove = function (e) {
            cursorX = e.clientX;
            cursorY = e.clientY;
        };

        $("#code-output").on('input propertychange paste', function() {
            currentDrawable.fromString($("#code-output").text());
        });

        function output() {

            var output = "";

            if (currentDrawable instanceof PolyArea) {
                output += currentDrawable.toJavaCode();
            } else {
                switch (outputType) {
                    case OutputType.ARRAY:
                        output += currentDrawable.toArrayString();
                        break;
                    case OutputType.LIST:
                        output += currentDrawable.toListString();
                        break;
                    case OutputType.ARRAYS_AS_LIST:
                        output += currentDrawable.toArraysAsListString();
                        break;
					case OutputType.RAW:
					    output += currentDrawable.toRawString();
						break;
                }
            }

            $("#code-output").html(output);
            SyntaxHighlighter.highlight($("#code-output"));
        }

        $("#increase-level").click(function() {
          if (z == 3) {
            return;
          }
          z ++;
          $("#zCoord").val(z);
          setMapLayer();
        });

        $("#decrease-level").click(function() {
          if (z == 0) {
            return;
          }
          z --;
          $("#zCoord").val(z);
          setMapLayer();
        });

        $("#map, #location-lookup").autocomplete({
          minLength:2,
          source: function (request, response) {
           var locationsArray = $.map(locations, function (value, key) {
                return {
                    label: key,
                    value: value
                }
            });
            response($.ui.autocomplete.filter(locationsArray, request.term));
          },
          focus: function(event, ui) {
              $("#location-lookup").val(ui.item.label);
              return false;
          },
          select: function(event, ui) {
              $("#location-lookup").val(ui.item.label);
              goToCoordinates(ui.item.value.x, ui.item.value.y);
              return false;
          }
        });
});
