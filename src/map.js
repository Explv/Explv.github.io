
import 'leaflet/dist/leaflet.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'font-awesome/css/font-awesome.min.css';
import 'jquery-ui/themes/base/all.css';
import 'sweetalert2/dist/sweetalert2.css';
import '../css/main.css';

import $ from 'jquery';
import * as L from 'leaflet';

import Position from './model/Position';

// Import controls
import CollectionControl from './controls/collection_control';
import CoordinatesControl from './controls/coordinates_control';
import LocalCoordinatesControl from './controls/local_coordinates_control';
import RegionBaseCoordinatesControl from './controls/region_base_coordinates_control';
import GridControl from './controls/grid_control';
import LocationLookupControl from './controls/location_lookup_control';
import MapLabelControl from './controls/map_label_control';
import PlaneControl from './controls/plane_control';
import RegionLabelsControl from './controls/region_labels_control';
import RegionLookupControl from './controls/region_lookup_control';
import TitleLabel from './controls/title_label';

$(document).ready(() => {
  const map = L.map('map', {
    // maxBounds: L.latLngBounds(L.latLng(-40, -180), L.latLng(85, 153))
    zoomControl: false,
    renderer: L.canvas(),
  }).setView([-79, -137], 7);

  map.plane = 0;

  map.updateMapPath = () => {
    if (map.tile_layer !== undefined) {
      map.removeLayer(map.tile_layer);
    }
    map.tile_layer = L.tileLayer(
      `https://raw.githubusercontent.com/Explv/osrs_map_full_2019_05_29/master/${map.plane}/{z}/{x}/{y}.png`,
      {
        minZoom: 4,
        maxZoom: 11,
        attribution: 'Map data',
        noWrap: true,
        tms: true,
      },
    );
    map.tile_layer.addTo(map);
    map.invalidateSize();
  };

  map.updateMapPath();
  map.getContainer().focus();

  map.addControl(new TitleLabel());
  map.addControl(new CoordinatesControl());
  map.addControl(new RegionBaseCoordinatesControl());
  map.addControl(new LocalCoordinatesControl());
  map.addControl(L.control.zoom());
  map.addControl(new PlaneControl());
  map.addControl(new LocationLookupControl());
  map.addControl(new MapLabelControl());
  map.addControl(new CollectionControl({ position: 'topright' }));
  map.addControl(new RegionLookupControl());
  map.addControl(new GridControl());
  map.addControl(new RegionLabelsControl());

  let prevMouseRect;
  let prevMousePos;

  map.on('mousemove', (e) => {
    const mousePos = Position.fromLatLng(map, e.latlng, map.plane);

    if (prevMousePos !== mousePos) {
      prevMousePos = mousePos;

      if (prevMouseRect !== undefined) {
        map.removeLayer(prevMouseRect);
      }

      prevMouseRect = mousePos.toLeaflet(map);
      prevMouseRect.addTo(map);
    }
  });
});
