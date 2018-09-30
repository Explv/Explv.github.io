(function () {
'use strict';

const MAP_HEIGHT_PX = 270080; // Total height of the map in px at max zoom level
const RS_TILE_WIDTH_PX = 32;
const RS_TILE_HEIGHT_PX = 32; // Width and height in px of an rs tile at max zoom level
const RS_OFFSET_X = 1152; // Amount to offset x coordinate to get correct value
const RS_OFFSET_Y = 9928; // Amount to offset y coordinate to get correct value

class Position {

    constructor(x, y, z) {
        this.x = Math.round(x);
        this.y = Math.round(y);
        this.z = z;
    }

    static fromLatLng(map, latLng, z) {
        var point = map.project(latLng, map.getMaxZoom());
        var y = MAP_HEIGHT_PX - point.y;
        y = Math.round((y - RS_TILE_HEIGHT_PX) / RS_TILE_HEIGHT_PX) + RS_OFFSET_Y;
        var x = Math.round((point.x - RS_TILE_WIDTH_PX) / RS_TILE_WIDTH_PX) + RS_OFFSET_X;
        return new Position(x, y, z);
    }

    toLatLng(map) {
        var x = ((this.x - RS_OFFSET_X) * RS_TILE_WIDTH_PX) + (RS_TILE_WIDTH_PX / 4);
        var y = (MAP_HEIGHT_PX - ((this.y - RS_OFFSET_Y) * RS_TILE_HEIGHT_PX)) - (RS_TILE_HEIGHT_PX / 4);
        return map.unproject(L.point(x, y), map.getMaxZoom());
    }

    toCentreLatLng(map) {
        var x = ((this.x + 0.5 - RS_OFFSET_X) * RS_TILE_WIDTH_PX) + (RS_TILE_WIDTH_PX / 4);
        var y = (MAP_HEIGHT_PX - ((this.y + 0.5 - RS_OFFSET_Y) * RS_TILE_HEIGHT_PX)) - (RS_TILE_HEIGHT_PX / 4);
        return map.unproject(L.point(x, y), map.getMaxZoom());
    }

    getDistance(position) {
        var diffX = Math.abs(this.x - position.x);
        var diffY = Math.abs(this.y - position.y);
        return Math.sqrt((diffX * diffX) + (diffY * diffY));
    }

    toLeaflet(map) {
        var point = map.project(this.toLatLng(map), map.getMaxZoom());
        var startX = (Math.floor(point.x / RS_TILE_WIDTH_PX) * RS_TILE_WIDTH_PX) + (RS_TILE_WIDTH_PX / 4);
        var startY = (Math.floor(point.y / RS_TILE_HEIGHT_PX) * RS_TILE_HEIGHT_PX) - (RS_TILE_HEIGHT_PX / 4);
        var endX = startX + RS_TILE_WIDTH_PX;
        var endY = startY + RS_TILE_HEIGHT_PX;
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

    getName() {
        return "Position";
    }

    equals(position) {
        return this.x === position.x && this.y === position.y && this.z === position.z;
    }
}

class Path {

    constructor(map) {
        this.map = map;
        this.featureGroup = new L.FeatureGroup();
        this.positions = [];
        this.lines = [];
        this.rectangles = [];
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
}

class Area {

    constructor(startPosition, endPosition) {
        this.startPosition = startPosition;
        this.endPosition = endPosition;
    }

    static fromBounds(map, bounds) {
        return new Area(
            map,
            Position.fromLatLng(map, bounds.getSouthWest()),
            Position.fromLatLng(map, bounds.getNorthEast())
        );
    }

    toLeaflet(map) {
        var newStartPosition = new Position(this.startPosition.x, this.startPosition.y, this.startPosition.z);
        var newEndPosition = new Position(this.endPosition.x, this.endPosition.y, this.startPosition.z);

        if (this.endPosition.x >= this.startPosition.x) {
            newEndPosition.x += 1;
        } else {
            newStartPosition.x += 1;
        }

        if (this.endPosition.y >= this.startPosition.y) {
            newEndPosition.y += 1;
        } else {
            newStartPosition.y += 1;
        }

        return L.rectangle(
            L.latLngBounds(
                newStartPosition.toLatLng(map),
                newEndPosition.toLatLng(map)
            ), {
                color: "#33b5e5",
                weight: 1,
                interactive: false
            }
        );
    }

    getName() {
        return "Area";
    }
}

class Areas {

    constructor(map) {
        this.map = map;
        this.featureGroup = new L.FeatureGroup();
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
}

class PolyArea {

    constructor(map) {
        this.map = map;
        this.positions = [];
        this.polygon = undefined;
        this.featureGroup = new L.FeatureGroup();
    }

    add(position) {
        this.positions.push(position);
        this.featureGroup.removeLayer(this.polygon);
        this.polygon = this.toLeaflet();
        this.featureGroup.addLayer(this.polygon);
    }
    
    addAll(positions) {
        for (var i = 0; i < positions.length; i ++) {
            this.positions.push(positions[i]);
        }
        this.featureGroup.removeLayer(this.polygon);
        this.polygon = this.toLeaflet();
        this.featureGroup.addLayer(this.polygon);
    }

    removeLast() {
        if (this.positions.length > 0) {
            this.positions.pop();
            this.featureGroup.removeLayer(this.polygon);
        }

        if (this.positions.length == 0) {
            this.polygon = undefined;
        } else {
            this.polygon = this.toLeaflet();
            this.featureGroup.addLayer(this.polygon);
        }
    }

    removeAll() {
        this.positions = [];
        this.featureGroup.removeLayer(this.polygon);
        this.polygon = undefined;
    }
    
    isEmpty() {
        return this.positions.length === 0;
    }

    toLeaflet() {
        var latLngs = [];

        for (var i = 0; i < this.positions.length; i++) {
            latLngs.push(this.positions[i].toCentreLatLng(this.map));
        }

        for (var i = 0; i < latLngs.length; i++) {
            var point = this.map.project(latLngs[i], this.map.getMaxZoom());
            point.x -= RS_TILE_WIDTH_PX / 2;
            point.y += RS_TILE_HEIGHT_PX / 2;
            latLngs[i] = this.map.unproject(point, this.map.getMaxZoom());
        }

        return L.polygon(
            latLngs, {
                color: "#33b5e5",
                weight: 1,
                interactive: false
            }
        );
    }
    
    getName() {
        return "Area";
    }
}

class Converter {
    
    fromJava(text, drawable) {}
    
    toJava(drawable) {
        switch ($("#output-type").val()) {
            case "Array":
                return this.toJavaArray(drawable);
            case "List":
                return this.toJavaList(drawable);
            case "Arrays.asList":
                return this.toJavaArraysAsList(drawable);
            case "Raw":
                return this.toRaw(drawable);
        }
    }
    
    toRaw(drawable) {}
    
    toJavaSingle(drawable) {}
    
    toJavaArray(drawable) {}
    
    toJavaList(drawable) {}
    
    toJavaArraysAsList(drawable) {}
}

class OSBotConverter extends Converter {
    
    constructor() {
        super();
        this.javaArea = "Area";
        this.javaPosition = "Position";
    }
}

class OSBotAreasConverter extends OSBotConverter {
    
    constructor() {
        super();
    }
    
    /*
    API Doc:
        https://osbot.org/api/org/osbot/rs07/api/map/Position.html
        https://osbot.org/api/org/osbot/rs07/api/map/Area.html
        
        Area(int x1, int y1, int x2, int y2)
        Area(Position southWest, Position northEast)
        
        Position(int x, int y, int z)
    */
    fromJava(text, areas) {        
        areas.removeAll();
        text = text.replace(/\s/g, '');
        var areasPattern = `(?:new${this.javaArea}\\((\\d+,\\d+,\\d+,\\d+)\\)|\\(new${this.javaPosition}\\((\\d+,\\d+,\\d)\\),new${this.javaPosition}\\((\\d+,\\d+,\\d)\\)\\))(?:.setPlane\\((\\d)\\))?`;
        var re = new RegExp(areasPattern,"mg");
        var match;
        while ((match = re.exec(text))) {
            if (match[1] !== undefined) {
                var z = match[4] !== undefined ? match[4] : 0;
                var values = match[1].split(",");
                areas.add(new Area(new Position(values[0], values[1], z), new Position(values[2], values[3], z)));
            } else {
                var pos1Values = match[2].split(",");
                var pos1Z = match[4] !== undefined ? match[4] : pos1Values[2];

                var pos2Values = match[3].split(",");
                var pos2Z = match[4] !== undefined ? match[4] : pos2Values[2];
                areas.add(new Area(new Position(pos1Values[0], pos1Values[1], pos1Z), new Position(pos2Values[0], pos2Values[1], pos2Z)));
            }
        }
    }
    
    toRaw(areas) {
        var output = "";
        for (var i = 0; i < areas.areas.length; i++) {
            output += `${areas.areas[i].startPosition.x},${areas.areas[i].startPosition.y},${areas.areas[i].endPosition.x},${areas.areas[i].endPosition.y}\n`;
        }
        return output;
    }
    
    toJavaSingle(area) {
        var areaDef = `new ${this.javaArea}(${area.startPosition.x}, ${area.startPosition.y}, ${area.endPosition.x}, ${area.endPosition.y})`;
        if (area.startPosition.z > 0) {
            areaDef += `.setPlane(${area.startPosition.z})`;
        }
        return areaDef;
    }
    
    toJavaArray(areas) {
        if (areas.areas.length === 1) {
            return `${this.javaArea} area = ` + this.toJavaSingle(areas.areas[0]) + `;`;
        } else if (areas.areas.length > 1) {
            var output = `${this.javaArea}[] area = {\n`;
            for (var i = 0; i < areas.areas.length; i++) {
                output += "    " + this.toJavaSingle(areas.areas[i]);
                if (i !== areas.areas.length - 1) {
                    output += ",";
                }
                output += "\n";
            }
            output += "};";
            return output;
        }
        return "";
    }
    
    toJavaList(areas) {
        if (areas.areas.length === 1) {
            return this.toJavaSingle(areas.areas[0]) + ";";
        } else if (areas.areas.length > 1) {
            var output = `List&lt;${this.javaArea}&gt; area = new ArrayList<>();\n`;
            for (var i = 0; i < areas.areas.length; i++) {
                output += "area.add(" + this.toJavaSingle(areas.areas[i]) + ");\n";
            }
            return output;
        }
        return "";
    }
    
    toJavaArraysAsList(areas) {
        if (areas.areas.length === 1) {
            return this.toJavaSingle(areas.areas[0]) + ";";
        } else if (areas.areas.length > 1) {
            var output = `List&lt;${this.javaArea}&gt; area = Arrays.asList(\n` +
                `    new ${this.javaArea}[]{\n`;
            
            for (var i = 0; i < areas.areas.length; i++) {
                output += "        " + this.toJavaSingle(areas.areas[i]);
                if (i !== areas.areas.length - 1) {
                    output += ",";
                }
                output += "\n";
            }
            
            output += "    }\n";
            output += ");";
            return output;
        }
        return "";
    }
}

class OSBotPathConverter extends OSBotConverter {

    
    /*
    API Doc:
        https://osbot.org/api/org/osbot/rs07/api/map/Position.html
        
        Position(int x, int y, int z)
    */
    fromJava(text, path) {
        path.removeAll();
        text = text.replace(/\s/g, '');
        var posPattern = `new${this.javaPosition}\\((\\d+,\\d+,\\d)\\)`;
        var re = new RegExp(posPattern, "mg");
        var match;
        while ((match = re.exec(text))) {
            var values = match[1].split(",");
            path.add(new Position(values[0], values[1], values[2]));
        }
    }
    
    toRaw(path) {
        var output = "";
        for (var i = 0; i < path.positions.length; i++) {
            output += `${path.positions[i].x},${path.positions[i].y},${path.positions[i].z}\n`;
        }
        return output;
    }
    
    toJavaSingle(position) {
        return `${this.javaPosition} position = new ${this.javaPosition}(${position.x}, ${position.y}, ${position.z});`;
    }
    
    toJavaArray(path) {
        if (path.positions.length == 1) {
            return this.toJavaSingle(path.positions[0]);
        } else if (path.positions.length > 1) {
            var output = `${this.javaPosition}[] path = {\n`;
            for (var i = 0; i < path.positions.length; i++) {
                output += `    new ${this.javaPosition}(${path.positions[i].x}, ${path.positions[i].y}, ${path.positions[i].z})`;
                if (i != path.positions.length - 1) output += ",";
                output += "\n";
            }
            output += "};";
            return output;
        }
        return "";
    }
    
    toJavaList(path) {
        if (path.positions.length == 1) {
            return this.toJavaSingle(path.positions[0]);
        } else if (path.positions.length > 1) {
            var output = `List&lt;${this.javaPosition}&gt; path = new ArrayList<>();\n`;
            for (var i = 0; i < path.positions.length; i++) {
                output += `path.add(new ${this.javaPosition}(${path.positions[i].x}, ${path.positions[i].y}, ${path.positions[i].z}));\n`;
            }
            return output;
        }
        return "";
    }
    
    toJavaArraysAsList(path) {
        if (path.positions.length == 1) {
            return this.toJavaSingle(path.positions[0]);
        } else if (path.positions.length > 1) {
            var output = `List&lt;${this.javaPosition}&gt; path = Arrays.asList(\n    new ${this.javaPosition}[]{\n`;
            for (var i = 0; i < path.positions.length; i++) {
                output += `        new ${this.javaPosition}(${path.positions[i].x}, ${path.positions[i].y}, ${path.positions[i].z})`;
                if (i != path.positions.length - 1) output += ",";
                output += "\n";
            }
            output += "    }\n);";
            return output;
        }
        return "";
    }
}

class OSBotPolyAreaConverter extends OSBotConverter {

    /*
    API Doc:
        https://osbot.org/api/org/osbot/rs07/api/map/Area.html
        
        Area(int[][] positions)
        Area(Position[] positions)
    */
    fromJava(text, polyarea) {
        polyarea.removeAll();
        text = text.replace(/\s/g, '');
        
        var zPattern = /.setPlane\(\d\)/mg;
        var zMatch = zPattern.exec(text);
        var z = zMatch ? zMatch[1] : 0;

        var positionsPattern = /\{(\d+),(\d+)\}/mg;
        var match;
        while ((match = positionsPattern.exec(text))) {
            polyarea.add(new Position(match[1], match[2], z));
        }
    }
    
    toRaw(polyarea) {
        var output = "";
        for (var i = 0; i < polyarea.positions.length; i++) {
            output += `${polyarea.positions[i].x},${polyarea.positions[i].y}\n`;
        }
        return output;
    }
    
    toJava(polyarea) {
        if (polyarea.positions.length == 0) {
            return "";
        }
        var output = `${this.javaArea} area = new ${this.javaArea}(\n    new int[][]{`;
        for (var i = 0; i < polyarea.positions.length; i++) {
            output += `\n        { ${polyarea.positions[i].x}, ${polyarea.positions[i].y} }`;
            if (i !== polyarea.positions.length - 1) {
                output += ",";
            }
        }
        output += "\n    }\n)";
        if (polyarea.positions.length > 0 && polyarea.positions[0].z > 0) {
            output += `.setPlane(${polyarea.positions[0].z})`;
        }
        output += ";";
        return output;
    }
}

class TRiBotAreasConverter extends OSBotAreasConverter {
    
    constructor() {
        super();
        this.javaArea = "RSArea";
        this.javaPosition = "RSTile";
    }
    
    /*
    API Doc:
        https://tribot.org/doc/org/tribot/api2007/types/RSTile.html
        https://tribot.org/doc/org/tribot/api2007/types/RSArea.html
      
        RSArea(Positionable tile1, Positionable tile2)
      
        RSTile(int x, int y)
        RSTile(int x, int y, int plane) 
    */
    fromJava(text, areas) {        
        areas.removeAll();
        text = text.replace(/\s/g, '');
        var areasPattern = `(?:new${this.javaArea}\\(new${this.javaPosition}\\((\\d+,\\d+,\\d)\\),new${this.javaPosition}\\((\\d+,\\d+,\\d)\\)\\))`;
        var re = new RegExp(areasPattern,"mg");
        var match;
        while ((match = re.exec(text))) {
            var pos1Values = match[1].split(",");
            var pos2Values = match[2].split(",");
            areas.add(new Area(new Position(pos1Values[0], pos1Values[1], pos1Values[2]), new Position(pos2Values[0], pos2Values[1], pos2Values[2])));
        }
    }
    
    toJavaSingle(area) {
        return `new ${this.javaArea}(new ${this.javaPosition}(${area.startPosition.x}, ${area.startPosition.y}, ${area.startPosition.z}), new ${this.javaPosition}(${area.endPosition.x}, ${area.endPosition.y}, ${area.endPosition.z}))`;
    }
}

class TRiBotPathConverter extends OSBotPathConverter {

    constructor() {
        super();
        this.javaArea = "RSArea";
        this.javaPosition = "RSTile";
    }
}

class TRiBotPolyAreaConverter extends OSBotPolyAreaConverter {

    constructor() {
        super();
        this.javaArea = "RSArea";
        this.javaPosition = "RSTile";
    }
    
    /*
    API Doc:
        https://tribot.org/doc/org/tribot/api2007/types/RSTile.html
        https://tribot.org/doc/org/tribot/api2007/types/RSArea.html
      
        RSArea(Positionable[] tiles)
    */
    fromJava(text, polyarea) {
        polyarea.removeAll();
        text = text.replace(/\s/g, '');

        var positionsPattern = `new${this.javaPosition}\\((\\d+),(\\d+),(\\d)\\)`;
        var re = new RegExp(positionsPattern, "mg");
        var match;
        while ((match = re.exec(text))) {
            polyarea.add(new Position(match[1], match[2], match[3]));
        }
    }
    
    toJava(polyarea) {
        if (polyarea.positions.length == 0) {
            return "";
        }
        var output = `${this.javaArea} area = new ${this.javaArea}(\n    new ${this.javaPosition}[] {`;
        for (var i = 0; i < polyarea.positions.length; i++) {
            var position = polyarea.positions[i];
            output += `\n        new ${this.javaPosition}(${position.x}, ${position.y}, ${position.z})`;
            if (i !== polyarea.positions.length - 1) {
                output += ",";
            }
        }
        output += "\n    }\n);";
        return output;
    }
}

class DreamBotAreasConverter extends OSBotAreasConverter {
    
    constructor() {
        super();
        this.javaArea = "Area";
        this.javaPosition = "Tile";
    }
    
    /*
    API Doc:
        https://dreambot.org/javadocs/org/dreambot/api/methods/map/Area.html
        https://dreambot.org/javadocs/org/dreambot/api/methods/map/Tile.html

    Area(int x1, int y1, int x2, int y2)
    Area(int x1, int y1, int x2, int y2, int z)
    Area(Tile ne, Tile sw)
    
    Tile(int x, int y) 
    Tile(int x, int y, int z)
    */
    fromJava(text, areas) {        
        areas.removeAll();
        text = text.replace(/\s/g, '');
        
        var areasPattern = ``;
        
        var areasPattern = `(?:new${this.javaArea}\\((\\d+,\\d+,\\d+,\\d+(?:,\\d+)?)\\)|\\(new${this.javaPosition}\\((\\d+,\\d+(?:,\\d)?)\\),new${this.javaPosition}\\((\\d+,\\d+(?:,\\d)?)\\)\\))`;
        var re = new RegExp(areasPattern,"mg");
        var match;
        while ((match = re.exec(text))) {
            if (match[1] !== undefined) {
                var values = match[1].split(",");
                var z = values.length == 4 ? 0 : values[4];
                areas.add(new Area(new Position(values[0], values[1], z), new Position(values[2], values[3], z)));
            } else {
                var pos1Values = match[2].split(",");
                var pos1Z = pos1Values.length == 2 ? 0 : pos1Values[2];

                var pos2Values = match[3].split(",");
                var pos2Z = pos2Values.length == 2 ? 0 : pos2Values[2];
                
                areas.add(new Area(new Position(pos1Values[0], pos1Values[1], pos1Z), new Position(pos2Values[0], pos2Values[1], pos2Z)));
            }
        }
    }
    
    toJavaSingle(area) {
        return `new ${this.javaArea}(${area.startPosition.x}, ${area.startPosition.y}, ${area.endPosition.x}, ${area.endPosition.y}, ${area.endPosition.z})`;
    }
}

class DreamBotPathConverter extends OSBotPathConverter {

    constructor() {
        super();
        this.javaArea = "Area";
        this.javaPosition = "Tile";
    }
    
    /*
    API Doc:
        https://dreambot.org/javadocs/org/dreambot/api/methods/map/Tile.html

    Tile(int x, int y) 
    Tile(int x, int y, int z)
    */
    fromJava(text, path) {
        path.removeAll();
        text = text.replace(/\s/g, '');
        var posPattern = `new${this.javaPosition}\\((\\d+,\\d+(?:,\\d)?)\\)`;
        var re = new RegExp(posPattern, "mg");
        var match;
        while ((match = re.exec(text))) {
            var values = match[1].split(",");
            var z = values.length == 2 ? 0 : values[2];
            path.add(new Position(values[0], values[1], z));
        }
    }
}

class DreamBotPolyAreaConverter extends OSBotPolyAreaConverter {

    constructor() {
        super();
        this.javaArea = "Area";
        this.javaPosition = "Tile";
    }
    
    /*
    API Doc:
        https://dreambot.org/javadocs/org/dreambot/api/methods/map/Area.html
        https://dreambot.org/javadocs/org/dreambot/api/methods/map/Tile.html

    Area(Tile... tiles)
    
    Tile(int x, int y) 
    Tile(int x, int y, int z)
    */
    fromJava(text, polyarea) {
        polyarea.removeAll();
        text = text.replace(/\s/g, '');

        var positionsPattern = `new${this.javaPosition}\\((\\d+,\\d+(?:,\\d)?)\\)`;
        var re = new RegExp(positionsPattern, "mg");
        var match;
        while ((match = re.exec(text))) {
            var values = match[1].split(",");
            var z = values.length == 2 ? 0 : values[2];
            polyarea.add(new Position(values[0], values[1], z));
        }
    }
    
    toJava(polyarea) {
        if (polyarea.positions.length == 0) {
            return "";
        }
        var output = `${this.javaArea} area = new ${this.javaArea}(\n    new ${this.javaPosition}[] {`;
        for (var i = 0; i < polyarea.positions.length; i++) {
            var position = polyarea.positions[i];
            output += `\n        new ${this.javaPosition}(${position.x}, ${position.y}, ${position.z})`;
            if (i !== polyarea.positions.length - 1) {
                output += ",";
            }
        }
        output += "\n    }\n);";
        return output;
    }
}

// Import converters
var converters = {
    "OSBot": {
        "areas_converter": new OSBotAreasConverter(),
        "path_converter": new OSBotPathConverter(),
        "polyarea_converter": new OSBotPolyAreaConverter()
    },
    "TRiBot": {
        "areas_converter": new TRiBotAreasConverter(),
        "path_converter": new TRiBotPathConverter(),
        "polyarea_converter": new TRiBotPolyAreaConverter()
    },
    "DreamBot": {
        "areas_converter": new DreamBotAreasConverter(),
        "path_converter": new DreamBotPathConverter(),
        "polyarea_converter": new DreamBotPolyAreaConverter()
    }
};

var CollectionControl = L.Control.extend({    
    options: {
        position: 'topleft'
    },

    onAdd: function (map) {
        this._path = new Path(this._map);
        this._areas = new Areas(this._map);
        this._polyArea = new PolyArea(this._map);

        this._currentDrawable = undefined;
        this._currentConverter = undefined;

        this._prevMouseRect = undefined;
        this._prevMousePos = undefined;

        this._firstSelectedAreaPosition = undefined;
        this._drawnMouseArea = undefined;    
        this._editing = false;

        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        container.style.background = 'none';
        container.style.width = '70px';
        container.style.height = 'auto';

        // Area control
        this._createControl('Area', container, function(e) {
            this._toggleCollectionMode(this._areas, "areas_converter");
        });        

        // Poly Area control
        this._createControl('Poly Area', container, function(e) {
            this._toggleCollectionMode(this._polyArea, "polyarea_converter");
        });

        // Path control
        this._createControl('Path', container, function(e) {
            this._toggleCollectionMode(this._path, "path_converter");
        });

        // Undo control
        this._createControl('<i class="fa fa-undo" aria-hidden="true"></i>', container, function(e) {
            if (this._currentDrawable !== undefined) {
                this._currentDrawable.removeLast();
                this._outputCode();
            }
        });

        // Clear control
        this._createControl('<i class="fa fa-trash" aria-hidden="true"></i>', container, function(e) {
            if (this._currentDrawable !== undefined) {
                this._currentDrawable.removeAll();
                this._outputCode();
            }
        });

        L.DomEvent.disableClickPropagation(container);

        L.DomEvent.on(this._map, 'click', this._addPosition, this);

        L.DomEvent.on(this._map, 'mousemove', this._drawMouseArea, this);

        var context = this;
        $("#output-type").on('change', () => context._outputCode());
        $("#code-output").on('input propertychange paste', () => context._loadFromText());
        $("#bot-api").on('change', () => context._outputCode());

        return container;
    },
    
    _createControl: function(html, container, onClick) {
        var control = L.DomUtil.create('a', 'leaflet-bar leaflet-control leaflet-control-custom', container);
        control.innerHTML = html;
        L.DomEvent.on(control, 'click', onClick, this);
    },

    _addPosition: function(e) {
        if (!this._editing) {
            return;
        }

        var position = Position.fromLatLng(this._map, e.latlng, this._map.plane);

        if (this._currentDrawable instanceof Areas) {
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

    _drawMouseArea: function(e) {
        if (!this._editing) {
            return;
        }

        var mousePos = Position.fromLatLng(this._map, e.latlng, this._map.plane);

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

    _toggleCollectionMode: function(drawable, converter) {
        if (this._currentDrawable === drawable) {
            this._currentDrawable = undefined;
            this._currentConverter = undefined;
            
            this._editing = false;

            this._toggleOutputContainer();

            this._firstSelectedAreaPosition = undefined;
            this._map.removeLayer(this._currentDrawable.featureGroup);

            if (this._drawnMouseArea !== undefined) {
                this._map.removeLayer(this._drawnMouseArea);
            }
            this._outputCode();
            return;
        }

        this._editing = true;
        
        this._currentConverter = converter;

        if ($("#output-container").css('display') == 'none') {
            this._toggleOutputContainer();
        }

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

    _toggleOutputContainer: function() {
        if ($("#output-container").css('display') == 'none') {
            $("#map-container").removeClass("col-lg-12 col-md-12 col-sm-12 col-xs-12");
            $("#map-container").addClass("col-lg-9 col-md-7 col-sm-8 col-xs-8");
            $("#output-container").show();
        } else {
            $("#output-container").hide();
            $("#map-container").removeClass("col-lg-9 col-md-7 col-sm-8 col-xs-8");
            $("#map-container").addClass("col-lg-12 col-md-12 col-sm-12 col-xs-12");
        }
        this._map.invalidateSize();
    },

    _outputCode: function() {        
        var output = "";

        if (this._currentDrawable !== undefined) {
            var botAPI = $("#bot-api option:selected").text();
            output = converters[botAPI][this._currentConverter].toJava(this._currentDrawable);
        }

        $("#code-output").html(output);
    },
    
    _loadFromText: function() {
        if (this._currentDrawable !== undefined) {
            var botAPI = $("#bot-api option:selected").text();
            converters[botAPI][this._currentConverter].fromJava($("#code-output").text(), this._currentDrawable);
        }
    }
});

var CoordinatesControl = L.Control.extend({
    options: {
        position: 'topleft'
    },

    onAdd: function (map) {

        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        container.id = 'coordinates-container';
        container.style.height = 'auto';
        L.DomEvent.disableClickPropagation(container);

        var coordinatesForm = L.DomUtil.create('form', 'leaflet-bar leaflet-control leaflet-control-custom form-inline', container);

        var formGroup = L.DomUtil.create('div', 'form-group', coordinatesForm);

        this._xCoordInput = this._createInput("xCoord", "x", formGroup);
        this._yCoordInput = this._createInput("yCoord", "y", formGroup);
        this._zCoordInput = this._createInput("zCoord", "z", formGroup);

        L.DomEvent.on(this._map, 'mousemove', this._setMousePositionCoordinates, this);

        return container;
    },

    _createInput: function(id, title, container) {
        var coordInput = L.DomUtil.create('input', 'form-control coord', container);
        coordInput.type = 'text';
        coordInput.id = id;

        L.DomEvent.disableClickPropagation(coordInput);
        L.DomEvent.on(coordInput, 'keyup', this._goToCoordinates, this);

        return coordInput;
    },

    _goToCoordinates: function() {
        var x = this._xCoordInput.value;
        var y = this._yCoordInput.value;
        var z = this._zCoordInput.value;

        if (!$.isNumeric(x) || !$.isNumeric(y) || !$.isNumeric(z)) {
            return;
        }

        if (this._searchMarker !== undefined) {
            this._map.removeLayer(this._searchMarker);
        }

        this._searchMarker = new L.marker(new Position(x, y, z).toCentreLatLng(this._map));
	
		this._searchMarker.once('click', (e) => this._map.removeLayer(this._searchMarker));
		
        this._searchMarker.addTo(this._map);

        this._map.panTo(this._searchMarker.getLatLng());
		
		if (this._map.plane != z) {
			this._map.plane = z;
			this._map.updateMapPath();
		}
    },

    _setMousePositionCoordinates: function(e) {
		if (this._map.getContainer() !== document.activeElement) {
			return;
		}
		
        var mousePos = Position.fromLatLng(this._map, e.latlng, this._map.plane);

        this._xCoordInput.value = mousePos.x;
        this._yCoordInput.value = mousePos.y;
        this._zCoordInput.value = mousePos.z;
    }
});

const MIN_X = 1152;
const MAX_X = 3904;
const MIN_Y = 2496;
const MAX_Y = 10432;
const REGION_WIDTH = 64;
const REGION_HEIGHT = 64;

class Region {

    constructor(id) {
        this.id = id;
    }

	static fromPosition(position) {
	    return Region.fromCoordinates(position.x, position.y);
	}
	
    static fromCoordinates(x, y) {
	    var regionID = (x >> 6) * 256 + (y >> 6);
	    return new Region(regionID);
	}
	
	toPosition() {
	    var x = (this.id >> 8) << 6;
		var y = (this.id & 0xFF) << 6;
		return new Position(x, y, 0);
	}
}

var GridControl = L.Control.extend({
    options: {
        position: 'topleft'
    },

    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        container.style.background = 'none';
        container.style.width = '130px';
        container.style.height = 'auto';

        var labelsButton = L.DomUtil.create('a', 'leaflet-bar leaflet-control leaflet-control-custom', container);
        labelsButton.id = 'toggle-region-grid';
        labelsButton.innerHTML = 'Toggle Region Grid';

        this._gridFeatureGroup = this._createGridFeature();
        this._enabled = false;

        L.DomEvent.on(labelsButton, 'click', this._toggleGrid, this);

        L.DomEvent.disableClickPropagation(container);
        return container;
    },

    _toggleGrid: function() {
        if (this._enabled) {
            this._map.removeLayer(this._gridFeatureGroup);
            this._enabled = false;
        } else {
            this._map.addLayer(this._gridFeatureGroup);
            this._enabled = true;
        }
    },

    _createGridFeature: function() {
        var gridFeatureGroup = new L.FeatureGroup();

        for (var x = MIN_X; x <= MAX_X; x += REGION_WIDTH) {
            var startPos = new Position(x, MIN_Y, 0);
            var endPos = new Position(x, MAX_Y, 0);

            var line = L.polyline([startPos.toLatLng(this._map), endPos.toLatLng(this._map)], {clickable: false});
            gridFeatureGroup.addLayer(line);
        }

        for (var y = MIN_Y; y <= MAX_Y; y += REGION_HEIGHT) {
            var startPos = new Position(MIN_X, y, 0);
            var endPos = new Position(MAX_X, y, 0);

            var line = L.polyline([startPos.toLatLng(this._map), endPos.toLatLng(this._map)], {clickable: false});
            gridFeatureGroup.addLayer(line);
        }

        return gridFeatureGroup;
    }
});

class Locations {

    constructor() {
        this.locations = [];    
    }
    
    getLocations(callback) {
        if (this.locations.length > 0) {
            callback(this.locations);
            return;
        }
        
        $.ajax({
            url: "resources/locations.json",
            dataType: "json",
            context: this,
            success: function( data ) {
                var locations = data["locations"];
                
                for (var i in locations) {
                    this.locations.push({
                        "name": locations[i].name,
                        "position": new Position(locations[i].coords[0], locations[i].coords[1], locations[i].coords[2])
                    });
                }
                
                callback(this.locations);
            }
        });
    }
}

var Locations$1 = (new Locations);

var LocationLookupControl = L.Control.extend({
    options: {
        position: 'topleft',
    },

    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        container.style.background = 'none';
        container.style.width = '200px';
        container.style.height = 'auto';

        var locationInput = L.DomUtil.create('input', 'leaflet-bar leaflet-control leaflet-control-custom', container);
        locationInput.id = 'location-lookup';
        locationInput.type = 'text';
        locationInput.placeholder = "Go to location";

        var self = this;
        Locations$1.getLocations(function(locations) {
            var locationsArray = $.map(locations, function (value, key) {
                return {
                    label: value.name,
                    value: value.position
                }
            });
            self.locations = locationsArray;
        });

        $(locationInput).autocomplete({
            minLength: 2,
            source: function (request, response) {
                response($.ui.autocomplete.filter(self.locations, request.term));
            },
            focus: function (event, ui) {
                $("#location-lookup").val(ui.item.label);
                return false;
            },
            select: function (event, ui) {
                $("#location-lookup").val(ui.item.label);
                self._goToCoordinates(ui.item.value.x, ui.item.value.y, ui.item.value.z);
                return false;
            }
        });

        L.DomEvent.disableClickPropagation(container);
        return container;
    },

    _goToCoordinates: function(x, y, z) {
        if (this._searchMarker !== undefined) {
            this._map.removeLayer(this._searchMarker);
        }

        this._searchMarker = new L.marker(new Position(x, y, z).toCentreLatLng(this._map));

        this._searchMarker.once('click', (e) => this._map.removeLayer(this._searchMarker));

        this._searchMarker.addTo(this._map);

        this._map.panTo(this._searchMarker.getLatLng());

        if (this._map.plane != z) {
            this._map.plane = z;
            this._map.updateMapPath();
        }
    }

});

var MapLabelControl = L.Control.extend({
    options: {
        position: 'topleft'
    },

    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        container.style.background = 'none';
        container.style.width = '100px';
        container.style.height = 'auto';

        var labelsButton = L.DomUtil.create('a', 'leaflet-bar leaflet-control leaflet-control-custom', container);
        labelsButton.id = 'toggle-map-labels';
        labelsButton.innerHTML = 'Toggle Labels';

        L.DomEvent.on(labelsButton, 'click', this._toggleMapLabels, this);

        this._enabled = true;
        this._addMapLabels();

        L.DomEvent.disableClickPropagation(container);
        return container;
    },

    _toggleMapLabels: function() {
        if (this._enabled) {
            this._removeMapLabels();
            this._enabled = false;
        } else {
            this._addMapLabels();
            this._enabled = true;
        }
    },

    _addMapLabels: function() {
        if (!this.hasOwnProperty("_mapLabels") || this._mapLabels === undefined) {
            var self = this;
            
            Locations$1.getLocations(function(locations) {
                self._mapLabels = new L.layerGroup();

                for (var i in locations) {
                    //if (locations[location].z !== z) {
                    //    continue;
                    //}

                    var mapLabel = L.marker(locations[i].position.toCentreLatLng(self._map), {
                        icon: L.divIcon({
                            className: 'map-label',
                            html: `<p>${locations[i].name}</p>`
                        }),
                        zIndexOffset: 1000
                    });

                    self._mapLabels.addLayer(mapLabel);
                }
                
                self._map.addLayer(self._mapLabels);
            });

        } else {
            this._map.addLayer(this._mapLabels);
        }
    },

    _removeMapLabels: function() {
        this._map.removeLayer(this._mapLabels);
    }
});

var PlaneControl = L.Control.extend({
    options: {
        position: 'topleft'
    },

    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        container.style.background = 'none';
        container.style.width = '70px';
        container.style.height = 'auto';

        var incrementPlaneButton = L.DomUtil.create('a', 'leaflet-bar leaflet-control leaflet-control-custom', container);
        incrementPlaneButton.id = 'increase-level';
        incrementPlaneButton.innerHTML = 'Z +';

        L.DomEvent.on(incrementPlaneButton, 'click', this._increasePlane, this);

        var decrementPlaneButton = L.DomUtil.create('a', 'leaflet-bar leaflet-control leaflet-control-custom', container);
        decrementPlaneButton.id = 'decrease-level';
        decrementPlaneButton.innerHTML = 'Z -';

        L.DomEvent.on(decrementPlaneButton, 'click', this._decreasePlane, this);

        L.DomEvent.disableClickPropagation(container);
        return container;
    },

    _increasePlane: function() {
        if (this._map.plane == 3) {
            return;
        }
        this._map.plane++;
        this._map.updateMapPath();
        this._dispatchPlaneChangedEvent();
    },

    _decreasePlane: function() {
        if (this._map.plane == 0) {
            return;
        }
        this._map.plane--;
        this._map.updateMapPath();
        this._dispatchPlaneChangedEvent();
    },

    _dispatchPlaneChangedEvent: function() {
        this._map.fire('planeChanged', {
            plane: this._map.plane
        });
    }
});

/*
 Generic  Canvas Layer for leaflet 0.7 and 1.0-rc,
 copyright Stanislav Sumbera,  2016 , sumbera.com , license MIT
 originally created and motivated by L.CanvasOverlay  available here: https://gist.github.com/Sumbera/11114288

 */

// -- L.DomUtil.setTransform from leaflet 1.0.0 to work on 0.0.7
//------------------------------------------------------------------------------
L.DomUtil.setTransform = L.DomUtil.setTransform || function (el, offset, scale) {
        var pos = offset || new L.Point(0, 0);

        el.style[L.DomUtil.TRANSFORM] =
            (L.Browser.ie3d ?
            'translate(' + pos.x + 'px,' + pos.y + 'px)' :
            'translate3d(' + pos.x + 'px,' + pos.y + 'px,0)') +
            (scale ? ' scale(' + scale + ')' : '');
    };

// -- support for both  0.0.7 and 1.0.0 rc2 leaflet
L.CanvasLayer = (L.Layer ? L.Layer : L.Class).extend({
    // -- initialized is called on prototype
    initialize: function (options) {
        this._map = null;
        this._canvas = null;
        this._frame = null;
        this._delegate = null;
        L.setOptions(this, options);
    },

    delegate: function (del) {
        this._delegate = del;
        return this;
    },

    needRedraw: function () {
        if (!this._frame) {
            this._frame = L.Util.requestAnimFrame(this.drawLayer, this);
        }
        return this;
    },

    //-------------------------------------------------------------
    _onLayerDidResize: function (resizeEvent) {
        this._canvas.width = resizeEvent.newSize.x;
        this._canvas.height = resizeEvent.newSize.y;
    },
    //-------------------------------------------------------------
    _onLayerDidMove: function () {
        var topLeft = this._map.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(this._canvas, topLeft);
        this.drawLayer();
    },
    //-------------------------------------------------------------
    getEvents: function () {
        var events = {
            resize: this._onLayerDidResize,
            moveend: this._onLayerDidMove
        };
        if (this._map.options.zoomAnimation && L.Browser.any3d) {
            events.zoomanim = this._animateZoom;
        }

        return events;
    },
    //-------------------------------------------------------------
    onAdd: function (map) {
        this._map = map;
        this._canvas = L.DomUtil.create('canvas', 'leaflet-layer');
        this.tiles = {};

        var size = this._map.getSize();
        this._canvas.width = size.x;
        this._canvas.height = size.y;

        var animated = this._map.options.zoomAnimation && L.Browser.any3d;
        L.DomUtil.addClass(this._canvas, 'leaflet-zoom-' + (animated ? 'animated' : 'hide'));


        map._panes.overlayPane.appendChild(this._canvas);

        map.on(this.getEvents(), this);

        var del = this._delegate || this;
        del.onLayerDidMount && del.onLayerDidMount(); // -- callback
        this.needRedraw();
    },

    //-------------------------------------------------------------
    onRemove: function (map) {
        var del = this._delegate || this;
        del.onLayerWillUnmount && del.onLayerWillUnmount(); // -- callback


        map.getPanes().overlayPane.removeChild(this._canvas);

        map.off(this.getEvents(), this);

        this._canvas = null;

    },

    //------------------------------------------------------------
    addTo: function (map) {
        map.addLayer(this);
        return this;
    },
    // --------------------------------------------------------------------------------
    LatLonToMercator: function (latlon) {
        return {
            x: latlon.lng * 6378137 * Math.PI / 180,
            y: Math.log(Math.tan((90 + latlon.lat) * Math.PI / 360)) * 6378137
        };
    },

    //------------------------------------------------------------------------------
    drawLayer: function () {
        // -- todo make the viewInfo properties  flat objects.
        var size = this._map.getSize();
        var bounds = this._map.getBounds();
        var zoom = this._map.getZoom();

        var center = this.LatLonToMercator(this._map.getCenter());
        var corner = this.LatLonToMercator(this._map.containerPointToLatLng(this._map.getSize()));

        var del = this._delegate || this;
        del.onDrawLayer && del.onDrawLayer({
            layer: this,
            canvas: this._canvas,
            bounds: bounds,
            size: size,
            zoom: zoom,
            center: center,
            corner: corner
        });
        this._frame = null;
    },
    // -- L.DomUtil.setTransform from leaflet 1.0.0 to work on 0.0.7
    //------------------------------------------------------------------------------
    _setTransform: function (el, offset, scale) {
        var pos = offset || new L.Point(0, 0);

        el.style[L.DomUtil.TRANSFORM] =
            (L.Browser.ie3d ?
            'translate(' + pos.x + 'px,' + pos.y + 'px)' :
            'translate3d(' + pos.x + 'px,' + pos.y + 'px,0)') +
            (scale ? ' scale(' + scale + ')' : '');
    },

    //------------------------------------------------------------------------------
    _animateZoom: function (e) {
        var scale = this._map.getZoomScale(e.zoom);
        // -- different calc of animation zoom  in leaflet 1.0.3 thanks @peterkarabinovic, @jduggan1
        var offset = L.Layer ? this._map._latLngBoundsToNewLayerBounds(this._map.getBounds(), e.zoom, e.center).min :
            this._map._getCenterOffset(e.center)._multiplyBy(-scale).subtract(this._map._getMapPanePos());

        L.DomUtil.setTransform(this._canvas, offset, scale);
    }
});

var RegionLabelsCanvas = L.CanvasLayer.extend({

    setData: function (data) {
        this.needRedraw();
    },

    onDrawLayer: function (info) {
        var ctx = info.canvas.getContext('2d');
        ctx.clearRect(0, 0, info.canvas.width, info.canvas.height);

        ctx.font = '10pt Calibri';
        ctx.fillStyle = 'white';
        ctx.textAlign = "center";

        for (var x = MIN_X; x < MAX_X; x += REGION_WIDTH) {
            for (var y = MIN_Y; y < MAX_Y; y += REGION_HEIGHT) {
                var position = new Position(x + (REGION_WIDTH / 2), y + (REGION_HEIGHT / 2), 0);
                var latLng = position.toCentreLatLng(this._map);

                var region = Region.fromPosition(position);

                var canvasPoint = info.layer._map.latLngToContainerPoint(latLng);

                ctx.fillText(region.id.toString(), canvasPoint.x, canvasPoint.y);
            }
        }
    }
});

var RegionLabelsControl = L.Control.extend({
    options: {
        position: 'topleft'
    },

    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        container.style.background = 'none';
        container.style.width = '130px';
        container.style.height = 'auto';

        var labelsButton = L.DomUtil.create('a', 'leaflet-bar leaflet-control leaflet-control-custom', container);
        labelsButton.id = 'toggle-region-labels';
        labelsButton.innerHTML = 'Toggle Region Labels';

        var regionLabelsCanvas = new RegionLabelsCanvas();

        this.visible = false;

        L.DomEvent.on(labelsButton, 'click', () => {
            if (this.visible) {
                map.removeLayer(regionLabelsCanvas);
            } else {
                map.addLayer(regionLabelsCanvas);
            }

            this.visible = !this.visible;
        }, this);

        L.DomEvent.disableClickPropagation(container);
        return container;
    },

    _toggleRegionLabels: function() {

    }
});

var TitleLabel = L.Control.extend({
    options: {
        position: 'topleft'
    },

    onAdd: function (map) {
        var container = L.DomUtil.create('div');
        container.id = 'titleLabel';
        container.href = 'http://osbot.org/forum/user/192661-explv/';
        container.innerHTML = "<span id='explv'>Explv</span>'s Map";

        L.DomEvent.disableClickPropagation(container);
        return container;
    }
});

// Import controls
$(document).ready(function () {
    var map = L.map('map', {
        //maxBounds: L.latLngBounds(L.latLng(-40, -180), L.latLng(85, 153))
        zoomControl: false,
        renderer: L.canvas()
    }).setView([-82, -138], 7);

    map.plane = 0;

    map.updateMapPath = function() {
        if (map.tile_layer !== undefined) {
            map.removeLayer(map.tile_layer);
        }
        map.tile_layer = L.tileLayer('https://raw.githubusercontent.com/Explv/osrs_map_full_20180601/master/' + map.plane + '/{z}/{x}/{y}.png', {
            minZoom: 4,
            maxZoom: 11,
            attribution: 'Map data',
            noWrap: true,
            tms: true
        });
        map.tile_layer.addTo(map);
        map.invalidateSize();
    };

    map.updateMapPath();
    map.getContainer().focus();

    map.addControl(new TitleLabel());
    map.addControl(new CoordinatesControl());
    map.addControl(L.control.zoom());
    map.addControl(new PlaneControl());
    map.addControl(new LocationLookupControl());
    map.addControl(new MapLabelControl());
    map.addControl(new CollectionControl());
    map.addControl(new GridControl());
    map.addControl(new RegionLabelsControl());
    
    var prevMouseRect, prevMousePos;
    map.on('mousemove', function(e) {
        var mousePos = Position.fromLatLng(map, e.latlng, map.plane);

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

}());
