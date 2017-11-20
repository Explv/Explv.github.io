'use strict';

define("Areas", ['jquery', 'Area', 'Position'], function ($, Area, Position) {

    return class Areas {

        constructor(map, featureGroup) {
            this.map = map;
            this.featureGroup = featureGroup;
            this.areas = [];
            this.rectangles = [];
        }

        add(area) {
            this.areas.push(area);
            var rectangle = area.toLeaflet(this.map);
            this.rectangles.push(rectangle);
            this.featureGroup.addLayer(rectangle);
        }

        removeLast() {
            if (this.areas.length > 0) {
                this.areas.pop();
                this.featureGroup.removeLayer(this.rectangles.pop());
            }
        }

        removeAll() {
            while (this.areas.length > 0) {
                this.areas.pop();
                this.featureGroup.removeLayer(this.rectangles.pop());
            }
        }

        show(map) {
            map.addLayer(this.featureGroup);
        }

        hide(map) {
            map.removeLayer(this.featureGroup);
        }

        fromString(text) {
          this.removeAll();
          text = text.replace(/\s/g, '');
          var areasPattern = /(?:newArea\((\d+,\d+,\d+,\d+)\)|\(newPosition\((\d+,\d+,\d)\),newPosition\((\d+,\d+,\d)\)\))(?:.setPlane\((\d)\))?/mg;
          var match;
          while((match = areasPattern.exec(text))) {
            if (match[1] !== undefined) {
              var z = match[4] !== undefined ? match[4] : 0;
              var values = match[1].split(",");
              this.add(new Area(new Position(values[0], values[1], z), new Position(values[2], values[3], z)));
            } else {
              var pos1Values = match[2].split(",");
              var pos1Z = match[4] !== undefined ? match[4] : pos1Values[2];

              var pos2Values = match[3].split(",");
              var pos2Z = match[4] !== undefined ? match[4] : pos2Values[2];
              this.add(new Area(new Position(pos1Values[0], pos1Values[1], pos1Z), new Position(pos2Values[0], pos2Values[1], pos2Z)));
            }
          }
        }

        toArrayString() {
            if (this.areas.length === 1) {
                return "Area area = " + this.areas[0].toJavaCode() + ";";
            } else if (this.areas.length > 1) {
                var output = "Area[] area = {\n";
                var numAreas = this.areas.length;
                $.each(this.areas, function (index, area) {
                    output += "    " + area.toJavaCode();
                    if (index !== numAreas - 1) {
                        output += ",";
                    }
                    output += "\n";
                });

                output += "};";
                return output;
            }
            return "";
        }

        toListString() {
            if (this.areas.length === 1) {
                return this.areas[0].toJavaCode()  + ";";
            } else if (this.areas.length > 1) {
                var output = "List&lt;Area&gt; area = new ArrayList<>();\n";
                $.each(this.areas, function (index, area) {
                    output += "area.add(" + area.toJavaCode() + ");\n";
                });
                return output;
            }
            return "";
        }

        toArraysAsListString() {

            if (this.areas.length === 1) {
                return this.areas[0].toJavaCode() + ";";
            } else if (this.areas.length > 1) {
                var output = "List&lt;Area&gt; area = Arrays.asList(\n" +
                    "    new Area[]{\n";
                var numAreas = this.areas.length;
                $.each(this.areas, function (index, area) {
                    output += "        " + area.toJavaCode();
                    if (index !== numAreas - 1) {
                        output += ",";
                    }
                    output += "\n";
                });
                output += "    }\n";
                output += ");";
                return output;
            }
            return "";
        }
		
		toRawString() {
			var output = "";
			for (var i = 0; i < this.areas.length; i ++) {
				output += `${this.areas[i].startPosition.x},${this.areas[i].startPosition.y},${this.areas[i].endPosition.x},${this.areas[i].endPosition.y}\n`;
			}
			return output;
		}
    };
});
