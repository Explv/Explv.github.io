'use strict';

import {Position} from './Position.js';

export class Grid {

    constructor(map, featureGroup) {
        this.map = map;
        this.featureGroup = featureGroup;
        this.visible = false;

        var minX = 1152;
        var minY = 2496;

        var maxX = 3904;
        var maxY = 10432;

        for (var x = minX; x <= maxX; x += 64) {
            var startPos = new Position(x, minY, 0);
            var endPos = new Position(x, maxY, 0);

            var line = this.createPolyline(startPos, endPos);
            this.featureGroup.addLayer(line);
        }

        for (var y = minY; y <= maxY; y += 64) {
            var startPos = new Position(minX, y, 0);
            var endPos = new Position(maxX, y, 0);

            var line = this.createPolyline(startPos, endPos);
            this.featureGroup.addLayer(line);
        }
    }

    isVisible() {
        return this.visible;
    }

    show() {
        this.map.addLayer(this.featureGroup);
        this.visible = true;
    }

    hide() {
        this.map.removeLayer(this.featureGroup);
        this.visible = false;
    }

    createPolyline(startPosition, endPosition) {
        return L.polyline([startPosition.toLatLng(this.map), endPosition.toLatLng(this.map)], {clickable: false});
    }
}