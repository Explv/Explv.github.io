'use strict';

import { Position } from './Position.js';
import { getPath } from '../dax_walker/dax_walker.js';

export class DaxPath {

    constructor(map) {
        this.map = map;
        this.featureGroup = new L.FeatureGroup();
        this.positions = [];
        this.lines = [];
        this.rectangles = [];
    }

    add(position, successCallback) {
        if (this.positions.length > 0) {
            let self = this;
            getPath({
                start: this.positions[this.positions.length - 1],
                end: position,
                onSuccess: function (path) {
                    let spacingStr = $("#dax-spacing").val();

                    let spacing = spacingStr ? Math.max(0, parseInt(spacingStr, 10)) : 0;

                    for (let i = 0; i < path.length; i++) {
                        self._addPosition(path[i]);

                        if (i + spacing < path.length) {
                            i += spacing;
                        } else if (i !== path.length - 1) {
                            self._addPosition(path[path.length - 1]);
                            break;
                        }
                    }
                    successCallback();
                },
                onError: function (start, end, errorMsg) {
                    Swal({
                        position: 'top',
                        type: 'error',
                        title: `Failed to get path between ${start} and ${end} from Dax.\nReason: '${errorMsg}'`,
                        showConfirmButton: false,
                        timer: 6000,
                        toast: true,
                    });
                }
            });
        } else {
            this._addPosition(position);
            successCallback();
        }
    }

    _addPosition(position) {
        this.positions.push(position);
        var rectangle = position.toLeaflet(this.map);
        this.featureGroup.addLayer(rectangle);
        this.rectangles.push(rectangle);

        if (this.positions.length > 1) {
            this.lines.push(this.createPolyline(this.positions[this.positions.length - 2], this.positions[this.positions.length - 1]));
            this.featureGroup.addLayer(this.lines[this.lines.length - 1]);
        }
    }

    removeLast() {
        if (this.positions.length > 0) this.featureGroup.removeLayer(this.positions.pop());
        if (this.lines.length > 0) this.featureGroup.removeLayer(this.lines.pop());
        if (this.rectangles.length > 0) this.featureGroup.removeLayer(this.rectangles.pop());
    }

    removeAll() {
        while (this.positions.length > 0) this.featureGroup.removeLayer(this.positions.pop());
        while (this.rectangles.length > 0) this.featureGroup.removeLayer(this.rectangles.pop());
        while (this.lines.length > 0) this.featureGroup.removeLayer(this.lines.pop());
    }

    createPolyline(startPosition, endPosition) {
        return L.polyline([startPosition.toCentreLatLng(this.map), endPosition.toCentreLatLng(this.map)], { clickable: false });
    }
}