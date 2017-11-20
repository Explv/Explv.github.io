'use strict';

define("Path", ["Position"], function (Position) {

    return class Path {

        constructor(map, featureGroup) {
            this.map = map;
            this.featureGroup = featureGroup;
            this.positions = [];
            this.lines = [];
            this.rectangles = [];
        }

        show() {
            this.map.addLayer(this.featureGroup);
        }

        hide() {
            this.map.removeLayer(this.featureGroup);
        }

        add(position) {
            if (this.positions.length > 0) {

                if (position.getDistance(this.positions[this.positions.length - 1]) > 10) {

                    var localWalkerPositions = this.getLocalWalkerPositions(this.positions[this.positions.length - 1], position);

                    for (var i = 0; i < localWalkerPositions.length; i++) {
                        this.positions.push(localWalkerPositions[i]);
                        var rectangle = localWalkerPositions[i].toLeaflet(this.map);
                        this.featureGroup.addLayer(rectangle);
                        this.rectangles.push(rectangle);
                        this.lines.push(this.createPolyline(this.positions[this.positions.length - 2], this.positions[this.positions.length - 1]));
                        this.featureGroup.addLayer(this.lines[this.lines.length - 1]);
                    }
                } else {
                    this.positions.push(position);
                    var rectangle = position.toLeaflet(this.map);
                    this.featureGroup.addLayer(rectangle);
                    this.rectangles.push(rectangle);
                    this.lines.push(this.createPolyline(this.positions[this.positions.length - 2], this.positions[this.positions.length - 1]));
                    this.featureGroup.addLayer(this.lines[this.lines.length - 1]);
                }
            } else {
                this.positions.push(position);
                var rectangle = position.toLeaflet(this.map);
                this.featureGroup.addLayer(rectangle);
                this.rectangles.push(rectangle);
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
            return L.polyline([startPosition.toCentreLatLng(this.map), endPosition.toCentreLatLng(this.map)], {clickable: false});
        }

        getLocalWalkerPositions(startPosition, endPosition) {

            var outputPositions = [];

            var distance = startPosition.getDistance(endPosition);

            var dX = Math.abs(endPosition.x - startPosition.x);
            var dY = Math.abs(endPosition.y - startPosition.y);

            var sX = dX / distance;
            var sY = dY / distance;

            while (startPosition.getDistance(endPosition) > 10) {

                startPosition = new Position(
                    endPosition.x > startPosition.x ? startPosition.x + (sX * 10) : startPosition.x - (sX * 10),
                    endPosition.y > startPosition.y ? startPosition.y + (sY * 10) : startPosition.y - (sY * 10),
                    startPosition.z
                );
                outputPositions.push(startPosition);
            }

            outputPositions.push(endPosition);
            return outputPositions;
        }

        fromString(text) {
          this.removeAll();
          text = text.replace(/\s/g, '');
          var posPattern = /newPosition\((\d+,\d+,\d)\)/mg;
          var match;
          while((match = posPattern.exec(text))) {
              var values = match[1].split(",");
              this.add(new Position(values[0], values[1], values[2]));
          }
        }

        toArrayString() {
            if (this.positions.length == 1) {
                return this.positions[0].toJavaCode();
            } else if (this.positions.length > 1) {
                var output = "Position[] path = {\n";
                for (var i = 0; i < this.positions.length; i++) {
                    output += `    new Position(${this.positions[i].x}, ${this.positions[i].y}, ${this.positions[i].z})`;
                    if (i != this.positions.length - 1) output += ",";
                    output += "\n";
                }
                output += "};";
                return output;
            }
            return "";
        }

        toListString() {
            if (this.positions.length == 1) {
                return this.positions[0].toJavaCode();
            } else if (this.positions.length > 1) {
                var output = "List&lt;Position&gt; path = new ArrayList<>();\n";
                for (var i = 0; i < this.positions.length; i++) {
                    output += `path.add(new Position(${this.positions[i].x}, ${this.positions[i].y}, ${this.positions[i].z}));\n`;
                }
                return output;
            }
            return "";
        }

        toArraysAsListString() {
            if (this.positions.length == 1) {
                return this.positions[0].toJavaCode();
            } else if (this.positions.length > 1) {
                var output = "List&lt;Position&gt; path = Arrays.asList(\n    new Position[]{\n";
                for (var i = 0; i < this.positions.length; i++) {
                    output += `        new Position(${this.positions[i].x}, ${this.positions[i].y}, ${this.positions[i].z})`;
                    if (i != this.positions.length - 1) output += ",";
                    output += "\n";
                }
                output += "    }\n);";
                return output;
            }
            return "";
        }
		
		toRawString() {
			var output = "";
			for (var i = 0; i < this.positions.length; i ++) {
				output += `${this.positions[i].x},${this.positions[i].y},${this.positions[i].z}\n`;
			}
			return output;
		}
    }
});
