
import $ from 'jquery';
import 'jquery-ui/ui/effects/effect-slide';
import swal from 'sweetalert2';
import L from 'leaflet';

import Position from '../model/Position';
import Area from '../model/Area';
import Path from '../model/Path';
import DaxPath from '../model/DaxPath';
import Areas from '../model/Areas';
import PolyArea from '../model/PolyArea';


// Import converters
import OSBotAreasConverter from '../bot_api_converters/osbot/osbot_areas_converter';
import OSBotPathConverter from '../bot_api_converters/osbot/osbot_path_converter';
import OSBotPolyAreaConverter from '../bot_api_converters/osbot/osbot_polyarea_converter';

import TRiBotAreasConverter from '../bot_api_converters/tribot/tribot_areas_converter';
import TRiBotPathConverter from '../bot_api_converters/tribot/tribot_path_converter';
import TRiBotPolyAreaConverter from '../bot_api_converters/tribot/tribot_polyarea_converter';

import DreamBotAreasConverter from '../bot_api_converters/dreambot/dreambot_areas_converter';
import DreamBotPathConverter from '../bot_api_converters/dreambot/dreambot_path_converter';
import DreamBotPolyAreaConverter from '../bot_api_converters/dreambot/dreambot_polyarea_converter';

import RSPeerAreasConverter from '../bot_api_converters/rspeer/rspeer_areas_converter';
import RSPeerPathConverter from '../bot_api_converters/rspeer/rspeer_path_converter';
import RSPeerPolyAreaConverter from '../bot_api_converters/rspeer/rspeer_polyarea_converter';

import QuantumBotAreasConverter from '../bot_api_converters/quantumbot/quantumbot_areas_converter';
import QuantumBotPathConverter from '../bot_api_converters/quantumbot/quantumbot_path_converter';
import QuantumBotPolyAreaConverter from '../bot_api_converters/quantumbot/quantumbot_polyarea_converter';

import RuneMateAreasConverter from '../bot_api_converters/runemate/runemate_areas_converter';
import RuneMatePathConverter from '../bot_api_converters/runemate/runemate_path_converter';
import RuneMatePolyAreaConverter from '../bot_api_converters/runemate/runemate_polyarea_converter';

const converters = {
  OSBot: {
    areas_converter: new OSBotAreasConverter(),
    path_converter: new OSBotPathConverter(),
    polyarea_converter: new OSBotPolyAreaConverter(),
  },
  TRiBot: {
    areas_converter: new TRiBotAreasConverter(),
    path_converter: new TRiBotPathConverter(),
    polyarea_converter: new TRiBotPolyAreaConverter(),
  },
  DreamBot: {
    areas_converter: new DreamBotAreasConverter(),
    path_converter: new DreamBotPathConverter(),
    polyarea_converter: new DreamBotPolyAreaConverter(),
  },
  RSPeer: {
    areas_converter: new RSPeerAreasConverter(),
    path_converter: new RSPeerPathConverter(),
    polyarea_converter: new RSPeerPolyAreaConverter(),
  },
  QuantumBot: {
    areas_converter: new QuantumBotAreasConverter(),
    path_converter: new QuantumBotPathConverter(),
    polyarea_converter: new QuantumBotPolyAreaConverter(),
  },
  RuneMate: {
    areas_converter: new RuneMateAreasConverter(),
    path_converter: new RuneMatePathConverter(),
    polyarea_converter: new RuneMatePolyAreaConverter(),
  },
};

const CollectionControl = L.Control.extend({
  options: {
    position: 'topleft',
  },

  onAdd() {
    this._path = new Path(this._map);
    this._daxPath = new DaxPath(this._map);
    this._areas = new Areas(this._map);
    this._polyArea = new PolyArea(this._map);

    this._currentDrawable = undefined;
    this._currentConverter = undefined;

    this._prevMouseRect = undefined;
    this._prevMousePos = undefined;

    this._firstSelectedAreaPosition = undefined;
    this._drawnMouseArea = undefined;
    this._editing = false;

    const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control noselect');
    container.style.background = 'none';
    container.style.width = '70px';
    container.style.height = 'auto';

    // Copy to clipboard control
    this._createControl('<i class="fa fa-copy"></i>', container, this._copyCodeToClipboard);

    // Settings control
    this._createControl('<i class="fa fa-cog"></i>', container, () => {
      if ($('#settings-panel').is(':visible')) {
        $('#settings-panel').hide('slide', { direction: 'right' }, 300);
      } else {
        if (this._currentDrawable !== undefined) {
          this._toggleCollectionMode();
        }

        $('#settings-panel').css('display', 'flex').hide();
        $('#settings-panel').show('slide', { direction: 'right' }, 300);
      }
    }, this);

    // Area control
    this._createControl(
      '<img src="/css/images/area-icon.png" alt="Area" title="Area" height="30" width="30">',
      container,
      (e) => {
        this._toggleCollectionMode(this._areas, 'areas_converter', e.target);
      },
      this,
    );

    // Poly Area control
    this._createControl(
      '<img src="/css/images/polyarea-icon.png" alt="Poly Area" title="Poly Area" height="30" width="30">',
      container,
      (e) => {
        this._toggleCollectionMode(this._polyArea, 'polyarea_converter', e.target);
      },
      this,
    );

    // Path control
    this._createControl(
      '<img src="/css/images/path-icon.png" alt="Path" title="Path" height="30" width="30">',
      container,
      (e) => {
        this._toggleCollectionMode(this._path, 'path_converter', e.target);
      },
      this,
    );

    // Dax Path control
    this._createControl(
      '<img src="/css/images/dax-path-icon.png" alt="Dax Path" title="Dax Path" height="25" width="30">',
      container,
      (e) => {
        this._toggleCollectionMode(this._daxPath, 'path_converter', e.target);
      },
      this,
    );

    // Undo control
    this._createControl('<i class="fa fa-undo" aria-hidden="true"></i>', container, () => {
      if (this._currentDrawable !== undefined) {
        this._currentDrawable.removeLast();
        this._outputCode();
      }
    }, this);

    // Clear control
    this._createControl('<i class="fa fa-trash" aria-hidden="true"></i>', container, () => {
      if (this._currentDrawable !== undefined) {
        this._currentDrawable.removeAll();
        this._outputCode();
      }
    }, this);

    L.DomEvent.disableClickPropagation(container);

    L.DomEvent.on(this._map, 'click', this._addPosition, this);

    L.DomEvent.on(this._map, 'mousemove', this._drawMouseArea, this);

    const context = this;
    $('#output-type').on('change', () => context._outputCode());
    $('#code-output').on('input propertychange paste', () => context._loadFromText());
    $('#bot-api').on('change', () => context._outputCode());

    return container;
  },

  _createControl(html, container, onClick, context) {
    const control = L.DomUtil.create('a', 'leaflet-bar leaflet-control leaflet-control-custom', container);
    control.innerHTML = html;
    L.DomEvent.on(control, 'click', onClick, context);
  },

  _addPosition(e) {
    if (!this._editing) {
      return;
    }

    const position = Position.fromLatLng(this._map, e.latlng, this._map.plane);

    if (this._currentDrawable instanceof DaxPath) {
      const self = this;
      this._currentDrawable.add(position, () => {
        self._outputCode();
      });
    } else if (this._currentDrawable instanceof Areas) {
      if (this._firstSelectedAreaPosition === undefined) {
        this._firstSelectedAreaPosition = position;
      } else {
        this._map.removeLayer(this._drawnMouseArea);
        this._areas.add(new Area(this._firstSelectedAreaPosition, position));
        this._firstSelectedAreaPosition = undefined;
        this._outputCode();
      }
    } else {
      this._currentDrawable.add(position);
      this._outputCode();
    }
  },

  _drawMouseArea(e) {
    if (!this._editing) {
      return;
    }

    const mousePos = Position.fromLatLng(this._map, e.latlng, this._map.plane);

    if (this._currentDrawable instanceof Areas) {
      if (this._firstSelectedAreaPosition !== undefined) {
        if (this._drawnMouseArea !== undefined) {
          this._map.removeLayer(this._drawnMouseArea);
        }

        this._drawnMouseArea = new Area(this._firstSelectedAreaPosition, mousePos).toLeaflet(this._map);
        this._drawnMouseArea.addTo(this._map, true);
      }
    } else if (this._currentDrawable instanceof PolyArea) {
      if (this._drawnMouseArea !== undefined) {
        this._map.removeLayer(this._drawnMouseArea);
      }

      this._drawnMouseArea = new PolyArea(this._map);
      this._drawnMouseArea.addAll(this._currentDrawable.positions);
      this._drawnMouseArea.add(mousePos);
      this._drawnMouseArea = this._drawnMouseArea.toLeaflet(this._map);
      this._drawnMouseArea.addTo(this._map, true);
    }
  },

  _toggleCollectionMode(drawable, converter, element) {
    $('a.leaflet-control-custom.active').removeClass('active');

    if (this._currentDrawable === drawable || drawable === undefined) {
      this._editing = false;

      $('#code-output-panel').hide('slide', { direction: 'right' }, 300);

      this._firstSelectedAreaPosition = undefined;
      this._map.removeLayer(this._currentDrawable.featureGroup);

      if (this._drawnMouseArea !== undefined) {
        this._map.removeLayer(this._drawnMouseArea);
      }

      this._currentDrawable = undefined;
      this._currentConverter = undefined;

      this._outputCode();
      return;
    }

    if ($('#settings-panel').is(':visible')) {
      $('#settings-panel').hide('slide', { direction: 'right' }, 300);
    }

    this._editing = true;
    $(element).closest('a.leaflet-control-custom').addClass('active');

    this._currentConverter = converter;

    $('#code-output-panel').show('slide', { direction: 'right' }, 300);

    if (this._currentDrawable !== undefined) {
      this._map.removeLayer(this._currentDrawable.featureGroup);
    }

    this._firstSelectedAreaPosition = undefined;

    if (this._drawnMouseArea !== undefined) {
      this._map.removeLayer(this._drawnMouseArea);
    }

    this._currentDrawable = drawable;

    if (this._currentDrawable !== undefined) {
      this._map.addLayer(this._currentDrawable.featureGroup);
    }

    this._outputCode();
  },

  _outputCode() {
    let output = '';

    if (this._currentDrawable !== undefined) {
      const botAPI = $('#bot-api option:selected').text();
      output = converters[botAPI][this._currentConverter].toJava(this._currentDrawable);
    }

    $('#code-output').html(output);
  },

  _loadFromText() {
    if (this._currentDrawable !== undefined) {
      const botAPI = $('#bot-api option:selected').text();
      converters[botAPI][this._currentConverter].fromJava($('#code-output').text(), this._currentDrawable);
    }
  },

  _copyCodeToClipboard() {
    const $temp = $('<textarea>');
    $('body').append($temp);
    $temp.val($('#code-output').text()).select();
    document.execCommand('copy');
    $temp.remove();

    swal({
      position: 'top',
      type: 'success',
      title: 'Copied to clipboard',
      showConfirmButton: false,
      timer: 6000,
      toast: true,
    });
  },
});

export default CollectionControl;
