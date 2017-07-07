'use strict';

define("Position", ['leaflet', 'Drawable'], function(L, Drawable) {

    return class Position extends Drawable {

        constructor(x, y, z) {
            super();
            this.x = Math.round(x);
            this.y = Math.round(y);
            this.z = z;
        }

        static fromLatLng(map, latLng, z) {
            var point = map.project(latLng, map.getMaxZoom());
            var y = 53504 - point.y;
            y = Math.round((y - 32) / 32) + 14776;
            var x = Math.round((point.x - 32) / 32);
            return new Position(x, y, z);
        }

        toLatLng(map) {
            var x = (this.x * 32) + 8;
            var y = (53504 - ((this.y - 14776) * 32)) - 8;
            return map.unproject(L.point(x, y), map.getMaxZoom());
        }

        toCentreLatLng(map) {
            var x = ((this.x + 0.5) * 32);
            var y = ((53504 - ((this.y + 0.5 - 14776) * 32)));
            return map.unproject(L.point(x, y), map.getMaxZoom());
        }

        getDistance(position) {
            var diffX = Math.abs(this.x - position.x);
            var diffY = Math.abs(this.y - position.y);
            return Math.sqrt((diffX * diffX) + (diffY * diffY));
        }

        toLeaflet(map) {
            var point = map.project(this.toLatLng(map), map.getMaxZoom());
            var startX = (Math.floor(point.x / 32) * 32) + 8;
            var startY = (Math.floor(point.y / 32) * 32) - 8;
            var endX = startX + 32;
            var endY = startY + 32;
            var startLatLng = map.unproject(L.point(startX, startY), map.getMaxZoom());
            var endLatLng = map.unproject(L.point(endX, endY), map.getMaxZoom());

            return L.rectangle(L.latLngBounds(startLatLng, endLatLng), {
                color: "#33b5e5",
                fillColor: "#33b5e5",
                fillOpacity: 1.0,
                weight: 1,
                interactive: false
            });
        }

        toJavaCode() {
            return `Position position = new Position(${this.x}, ${this.y}, ${this.z});`;
        }

        getName() {
            return "Position";
        }

        equals(position) {
            return this.x === position.x && this.y === position.y && this.z === position.z;
        }
    };
});
