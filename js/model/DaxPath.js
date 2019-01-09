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
                    for (let i = 0; i < path.length; i++) {
                        self.positions.push(path[i]);
                        var rectangle = path[i].toLeaflet(self.map);
                        self.featureGroup.addLayer(rectangle);
                        self.rectangles.push(rectangle);
                        self.lines.push(self.createPolyline(self.positions[self.positions.length - 2], self.positions[self.positions.length - 1]));
                        self.featureGroup.addLayer(self.lines[self.lines.length - 1]);
                    }
                    successCallback();
                },
                onError: function (start, end, errorMsg) {
                    Swal({
                        position: 'top-end',
                        type: 'error',
                        title: `Failed to get path between ${start} and ${end} from Dax.\nReason: '${errorMsg}'`,
                        showConfirmButton: false,
                        timer: 6000,
                        toast: true,
                        backdrop: false
                    });
                }
            });
        } else {
            this.positions.push(position);
            var rectangle = position.toLeaflet(this.map);
            this.featureGroup.addLayer(rectangle);
            this.rectangles.push(rectangle);
            successCallback();
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