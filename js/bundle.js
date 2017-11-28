(function () {
'use strict';

class Drawable {

    constructor(map) {
        this.map = map;
    }

    toLeaflet() {
        throw "toLeaflet is not implemented";
    }

    getName() {
        throw "getName is not implemented";
    }

    toJavaCode() {
        throw "toJavaCode is not implemented";
    }
}

const MAP_HEIGHT_PX = 270080; // Total height of the map in px at max zoom level
const RS_TILE_WIDTH_PX = 32;
const RS_TILE_HEIGHT_PX = 32; // Width and height in px of an rs tile at max zoom level
const RS_OFFSET_X = 1152; // Amount to offset x coordinate to get correct value
const RS_OFFSET_Y = 9928; // Amount to offset y coordinate to get correct value

class Position extends Drawable {

    constructor(x, y, z) {
        super();
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

    toJavaCode() {
        return `Position position = new Position(${this.x}, ${this.y}, ${this.z});`;
    }

    getName() {
        return "Position";
    }

    equals(position) {
        return this.x === position.x && this.y === position.y && this.z === position.z;
    }
}

class Path {

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
        while ((match = posPattern.exec(text))) {
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
        for (var i = 0; i < this.positions.length; i++) {
            output += `${this.positions[i].x},${this.positions[i].y},${this.positions[i].z}\n`;
        }
        return output;
    }
}

class Area extends Drawable {

    constructor(startPosition, endPosition) {
        super();
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

    toJavaCode() {
        var areaDef = `new Area(${this.startPosition.x}, ${this.startPosition.y}, ${this.endPosition.x}, ${this.endPosition.y})`;
        if (this.startPosition.z > 0) {
            areaDef += `.setPlane(${this.startPosition.z})`;
        }
        return areaDef;
    }

    getName() {
        return "Area";
    }
}

class Areas {

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
        while ((match = areasPattern.exec(text))) {
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
            return this.areas[0].toJavaCode() + ";";
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
        for (var i = 0; i < this.areas.length; i++) {
            output += `${this.areas[i].startPosition.x},${this.areas[i].startPosition.y},${this.areas[i].endPosition.x},${this.areas[i].endPosition.y}\n`;
        }
        return output;
    }
}

class PolyArea extends Drawable {

    constructor(featureGroup, map) {
        super(map);
        this.map = map;
        this.positions = [];
        this.polygon = undefined;
        this.featureGroup = featureGroup;
    }

    show(map) {
        map.addLayer(this.featureGroup);
    }

    hide(map) {
        map.removeLayer(this.featureGroup);
    }

    add(position) {
        this.positions.push(position);
        this.featureGroup.removeLayer(this.polygon);
        this.polygon = this.toLeaflet();
        this.featureGroup.addLayer(this.polygon);
    }

    removeLast() {

        if (this.positions.length > 0) {
            this.positions.pop();
            this.featureGroup.removeLayer(this.polygon);
        }

        if (this.positions.length > 0) {
            this.polygon = this.toLeaflet();
            this.featureGroup.addLayer(this.polygon);
        }
    }

    removeAll() {

        while (this.positions.length > 0) {
            this.positions.pop();
            this.featureGroup.removeLayer(this.polygon);
        }

        while (this.positions.length > 0) {
            this.polygon = this.toLeaflet();
            this.featureGroup.addLayer(this.polygon);
        }
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

    fromString(text) {
        this.removeAll();
        text = text.replace(/\s/g, '');
        var positionsPattern = /\{(\d+),(\d+)\}/mg;
        var zPattern = /.setPlane\(\d\)/mg;

        var zMatch = zPattern.exec(text);
        var z = zMatch ? zMatch[1] : 0;

        var match;
        while ((match = positionsPattern.exec(text))) {
            this.add(new Position(match[1], match[2], z));
        }
    }

    toJavaCode() {
        if (this.positions.length == 0) {
            return "";
        }
        var output = "Area area = new Area(\n    new int[][]{";
        for (var i = 0; i < this.positions.length; i++) {
            output += `\n        { ${this.positions[i].x}, ${this.positions[i].y} }`;
            if (i !== this.positions.length - 1) {
                output += ",";
            }
        }
        output += "\n    }\n)";
        if (this.positions.length > 0 && this.positions[0].z > 0) {
            output += `.setPlane(${this.positions[0].z})`;
        }
        output += ";";
        return output;
    }

    toRawString() {
        var output = "";
        for (var i = 0; i < this.positions.length; i++) {
            output += `${this.positions[i].x},${this.positions[i].y}\n`;
        }
        return output;
    }

    getName() {
        return "Area";
    }
}

class Grid {

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

function highlight(div) {
    var text = div.text();
    text = text.replace(/ArrayList/g, "<span class='class-name'>ArrayList</span>");
    text = text.replace(/List/g, "<span class='class-name'>List</span>");
    text = text.replace(/Position/g, "<span class='class-name'>Position</span>");
    text = text.replace(/Area/g, "<span class='class-name'>Area</span>");
    text = text.replace(/Arrays/g, "<span class='class-name'>Arrays</span>");
    text = text.replace(/new/g, "<span class='keyword'>new</span>");
    div.html(text);
}

var locations = {
    "Mount Quidamortem": new Position(1244, 3558, 0),
    "Lizardman Settlement": new Position(1309, 3540, 0),
    "Xeric's Shrine": new Position(1310, 3619, 0),
    "Lacerta Falls": new Position(1383, 3473, 0),
    "Shayzien's Wall": new Position(1403, 3535, 0),
    "Sulphur mine": new Position(1447, 3879, 0),
    "Lovakite mine": new Position(1426, 3833, 0),
    "Blast mine": new Position(1493, 3848, 0),
    "Lovakengj house": new Position(1471, 3732, 0),
    "Shamans": new Position(1433, 3708, 0),
    "Lizardman Canyon": new Position(1512, 3649, 0),
    "Zeah": new Position(1440, 3657, 0),
    "Shayzien House": new Position(1475, 3590, 0),
    "Graveyard of Heroes": new Position(1512, 3545, 0),
    "Xeric's Look out": new Position(1590, 3530, 0),
    "Infirmary": new Position(1580, 3588, 0),
    "Combat ring": new Position(1544, 3602, 0),
    "Kourend Woodland": new Position(1543, 3466, 0),
    "Woodcutting Guild": new Position(1612, 3492, 0),
    "Land's End": new Position(1509, 3428, 0),
    "Settlement Ruins": new Position(1558, 3891, 0),
    "Unmarked Grave": new Position(1576, 3938, 0),
    "Tower of Magic": new Position(1579, 3818, 0),
    "Library": new Position(1619, 3821, 0),
    "Kingdom of Great Kourend": new Position(1604, 3692, 0),
    "Mess": new Position(1641, 3617, 0),
    "Wintertodt": new Position(1630, 4004, 0),
    "Doors of Dinh": new Position(1630, 3964, 0),
    "Fishing Hamlet": new Position(1693, 3933, 0),
    "Dark Altar": new Position(1689, 3877, 0),
    "Arceuus House": new Position(1688, 3745, 0),
    "Piscarilius House": new Position(1825, 3700, 0),
    "Tithe farm": new Position(1746, 3597, 0),
    "Hosidius House": new Position(1714, 3555, 0),
    "Saltpetre": new Position(1713, 3517, 0),
    "Vinery": new Position(1814, 3544, 0),
    "Charcoal burners": new Position(1738, 3468, 0),
    "Crabclaw Isle": new Position(1759, 3421, 0),
    "Lunar Isle": new Position(2130, 3873, 0),
    "Pirate's Cove": new Position(2205, 3817, 0),
    "Prifddinas": new Position(2235, 3317, 0),
    "Elf Camp": new Position(2196, 3251, 0),
    "Tirannwn": new Position(2240, 3263, 0),
    "Isafdar": new Position(2244, 3180, 0),
    "Tyras Camp": new Position(2186, 3146, 0),
    "Port Tyras": new Position(2150, 3122, 0),
    "Zul-Andra": new Position(2204, 3064, 0),
    "Poision Waste": new Position(2232, 3096, 0),
    "Zulrah's shrine": new Position(2267, 3074, 0),
    "Fremennik Isles": new Position(2349, 3880, 0),
    "Neitiznot": new Position(2317, 3818, 0),
    "Jatizso": new Position(2391, 3814, 0),
    "Piscatoris Fishing Colony": new Position(2343, 3690, 0),
    "Falconer": new Position(2374, 3604, 0),
    "Eagles' Peak": new Position(2332, 3486, 0),
    "Arandar": new Position(2342, 3294, 0),
    "Lletya": new Position(2346, 3177, 0),
    "Castle Wars": new Position(2430, 3104, 0),
    "Observatory": new Position(2441, 3157, 0),
    "Jiggig": new Position(2465, 3045, 0),
    "Underground Pass": new Position(2449, 3312, 0),
    "Outpost": new Position(2441, 3345, 0),
    "Tree Gnome Stronghold": new Position(2430, 3447, 0),
    "Agility Training Area": new Position(2481, 3424, 0),
    "Gnome Ball Field": new Position(2395, 3486, 0),
    "Grand Tree": new Position(2464, 3501, 0),
    "Swamp": new Position(2418, 3511, 0),
    "West Ardougne": new Position(2524, 3305, 0),
    "Battlefield": new Position(2520, 3232, 0),
    "Tree Gnome Village": new Position(2527, 3166, 0),
    "Yanille": new Position(2554, 3089, 0),
    "Gu'Tanoth": new Position(2521, 3043, 0),
    "Miscellania": new Position(2537, 3875, 0),
    "Etceteria": new Position(2609, 3874, 0),
    "Here be penguins": new Position(2615, 3958, 0),
    "Waterbirth Island": new Position(2521, 3757, 0),
    "Lighthouse": new Position(2510, 3626, 0),
    "Barbarian Assault": new Position(2523, 3574, 0),
    "Barbarian Outpost": new Position(2552, 3561, 0),
    "Agility Training Area": new Position(2533, 3538, 0),
    "Otto's Grotto": new Position(2502, 3488, 0),
    "Baxtorian Falls": new Position(2513, 3461, 0),
    "Combat Training Camp": new Position(2515, 3369, 0),
    "Feldip Hills": new Position(2556, 2982, 0),
    "Wizards' Guild": new Position(2583, 3078, 0),
    "Nightmare Zone": new Position(2603, 3115, 0),
    "Fight Arena": new Position(2592, 3161, 0),
    "Port Khazard": new Position(2655, 3185, 0),
    "Trawler": new Position(2683, 3166, 0),
    "Monastery": new Position(2602, 3215, 0),
    "Tower of Life": new Position(2648, 3215, 0),
    "Necromancer": new Position(2669, 3241, 0),
    "Clocktower": new Position(2571, 3240, 0),
    "Ardougne Zoo": new Position(2612, 3275, 0),
    "East Ardougne": new Position(2598, 3295, 0),
    "Witchaven": new Position(2709, 3289, 0),
    "Legends' Guild": new Position(2730, 3377, 0),
    "Sorcerer's Tower": new Position(2702, 3404, 0),
    "Keep Le Faye": new Position(2769, 3399, 0),
    "Ranging Guild": new Position(2666, 3429, 0),
    "Hemenster": new Position(2634, 3437, 0),
    "Fishing Guild": new Position(2604, 3400, 0),
    "Flax": new Position(2744, 3443, 0),
    "Beehives": new Position(2759, 3442, 0),
    "Coal Trucks": new Position(2598, 3489, 0),
    "McGrubor's Wood": new Position(2641, 3480, 0),
    "Seers' Village": new Position(2701, 3483, 0),
    "Camelot Castle": new Position(2758, 3507, 0),
    "Sinclair Mansion": new Position(2742, 3549, 0),
    "Fremennik Province": new Position(2666, 3632, 0),
    "Rellekka": new Position(2668, 3676, 0),
    "Golden Apple Tree": new Position(2766, 3607, 0),
    "Keldagrim Entrance": new Position(2725, 3712, 0),
    "Iceberg": new Position(2676, 4034, 0),
    "Void Knights' Outpost": new Position(2639, 2674, 0),
    "Pest Control": new Position(2656, 2593, 0),
    "Ape Atoll": new Position(2747, 2751, 0),
    "Marim": new Position(2760, 2783, 0),
    "Crash Island": new Position(2914, 2720, 0),
    "Kharazi Jungle": new Position(2833, 2922, 0),
    "Shilo Village": new Position(2844, 2982, 0),
    "Cairn Isle": new Position(2765, 2976, 0),
    "Tai Bwo Wannai": new Position(2789, 3063, 0),
    "Karamja": new Position(2859, 3043, 0),
    "Brimhaven": new Position(2773, 3176, 0),
    "Agility Arena": new Position(2809, 3191, 0),
    "Musa Point": new Position(2897, 3161, 0),
    "Crandor": new Position(2836, 3271, 0),
    "Fishing Platform": new Position(2772, 3283, 0),
    "Rimmington": new Position(2957, 3215, 0),
    "Melzar's Maze": new Position(2933, 3248, 0),
    "Crafting Guild": new Position(2926, 3281, 0),
    "Entrana": new Position(2843, 3378, 0),
    "Dark Wizards' Tower": new Position(2908, 3334, 0),
    "Catherby": new Position(2821, 3433, 0),
    "Taverly": new Position(2896, 3455, 0),
    "Druids' Circle": new Position(2925, 3482, 0),
    "Heroes' Guild": new Position(2896, 3510, 0),
    "White Wolf Mountain": new Position(2847, 3494, 0),
    "Goblin Village": new Position(2956, 3505, 0),
    "Chaos Temple": new Position(2933, 3514, 0),
    "Burthorpe": new Position(2893, 3541, 0),
    "Warriors' Guild": new Position(2855, 3543, 0),
    "Death Plateau": new Position(2863, 3590, 0),
    "Mountain Camp": new Position(2801, 3670, 0),
    "Troll Stronghold": new Position(2832, 3682, 0),
    "Trollheim": new Position(2891, 3676, 0),
    "God Wars Dungeon": new Position(2916, 3751, 0),
    "Ice path": new Position(2854, 3808, 0),
    "Trollweiss Mountain": new Position(2782, 3862, 0),
    "Frozen Waste Plateau": new Position(2962, 3917, 0),
    "Agility Training Area": new Position(2998, 3952, 0),
    "Pirates' Hideout": new Position(3041, 3950, 0),
    "Mage Arena": new Position(3105, 3932, 0),
    "Lava Maze": new Position(3075, 3845, 0),
    "The Forgotten Cemetery": new Position(2976, 3750, 0),
    "Wilderness": new Position(3144, 3775, 0),
    "Ruins": new Position(3164, 3734, 0),
    "Lava Dragon Isle": new Position(3197, 3825, 0),
    "Deserted Keep": new Position(3153, 3931, 0),
    "Resource Area": new Position(3185, 3934, 0),
    "Scorpion Pit": new Position(3232, 3942, 0),
    "Ruins": new Position(2967, 3695, 0),
    "Bandit Camp": new Position(3037, 3699, 0),
    "Dark Warriors' Fortress": new Position(3029, 3630, 0),
    "Graveyard of Shadows": new Position(3164, 3672, 0),
    "Chaos Temple": new Position(3240, 3608, 0),
    "Black Knights' Fortress": new Position(3025, 3514, 0),
    "Ice Mountain": new Position(3007, 3481, 0),
    "Dwarven Mine": new Position(3016, 3445, 0),
    "Monastery": new Position(3052, 3487, 0),
    "Edgeville": new Position(3086, 3497, 0),
    "Grand Exchange": new Position(3164, 3481, 0),
    "Cooks' Guild": new Position(3143, 3447, 0),
    "Palace": new Position(3212, 3479, 0),
    "Varrock": new Position(3213, 3449, 0),
    "Barbarian Village": new Position(3080, 3419, 0),
    "Dwarven Mine": new Position(3015, 3445, 0),
    "Kingdom of Asgarnia": new Position(2991, 3405, 0),
    "Falador": new Position(3004, 3361, 0),
    "White Knights' Castle": new Position(2969, 3341, 0),
    "Draynor Manor": new Position(3104, 3341, 0),
    "River Lum": new Position(3167, 3346, 0),
    "Champions' Guild": new Position(3191, 3360, 0),
    "Kingdom of Misthalin": new Position(3215, 3318, 0),
    "Port Sarim": new Position(3044, 3218, 0),
    "Market": new Position(3082, 3246, 0),
    "Draynor Village": new Position(3105, 3258, 0),
    "Jail": new Position(3125, 3242, 0),
    "Lumbridge": new Position(3224, 3218, 0),
    "Lumbridge Swamp": new Position(3184, 3179, 0),
    "Wizards' Tower": new Position(3110, 3157, 0),
    "Tutorial Island": new Position(3101, 3094, 0),
    "Mudskipper Point": new Position(2992, 3116, 0),
    "Ship Yard": new Position(2987, 3055, 0),
    "Kalphite Lair": new Position(3226, 3106, 0),
    "Bedabin Camp": new Position(3169, 3036, 0),
    "Bandit Camp": new Position(3171, 2979, 0),
    "Quarry": new Position(3172, 2908, 0),
    "Pyramid": new Position(3233, 2896, 0),
    "Menaphos": new Position(3233, 2773, 0),
    "Rogues' Castle": new Position(3286, 3931, 0),
    "Demonic Ruins": new Position(3289, 3885, 0),
    "Bear": new Position(3285, 3838, 0),
    "Bone Yard": new Position(3236, 3746, 0),
    "Spider": new Position(3320, 3756, 0),
    "Fountain of Rune": new Position(3378, 3891, 0),
    "Slayer Tower": new Position(3428, 3554, 0),
    "Temple": new Position(3414, 3487, 0),
    "Lumber Yard": new Position(3305, 3505, 0),
    "Digsite": new Position(3362, 3417, 0),
    "River Salve": new Position(3403, 3442, 0),
    "Canafis": new Position(3495, 3487, 0),
    "Morytania": new Position(3467, 3441, 0),
    "Mausoleum": new Position(3503, 3572, 0),
    "Mort Myre Swamp": new Position(3440, 3380, 0),
    "Exam Centre": new Position(3363, 3339, 0),
    "The Hollows": new Position(3498, 3381, 0),
    "Mage Training Arena": new Position(3363, 3304, 0),
    "Duel Arena": new Position(3361, 3232, 0),
    "Mort'ton": new Position(3487, 3283, 0),
    "Abandoned Mine": new Position(3441, 3236, 0),
    "Burgh de Rott": new Position(3495, 3218, 0),
    "Toll Gate": new Position(3271, 3226, 0),
    "Al Kharid": new Position(3293, 3151, 0),
    "Clan Wars": new Position(3371, 3162, 0),
    "Shantay Pass": new Position(3304, 3122, 0),
    "Ruins of Uzer": new Position(3479, 3098, 0),
    "River Elid": new Position(3372, 3074, 0),
    "Lizards": new Position(3421, 3041, 0),
    "Desert Mining Camp": new Position(3288, 3021, 0),
    "Pollnivneach": new Position(3352, 2977, 0),
    "Kharidian Desert": new Position(3264, 2960, 0),
    "Nardah": new Position(3427, 2903, 0),
    "Vultures": new Position(3337, 2868, 0),
    "Agility Pyramid": new Position(3364, 2840, 0),
    "Sophanem": new Position(3296, 2783, 0),
    "Fenkenstrain's Castle": new Position(3548, 3554, 0),
    "Haunted Woods": new Position(3564, 3490, 0),
    "Ectofuntus": new Position(3659, 3519, 0),
    "Port Phasmatys": new Position(3674, 3486, 0),
    "Graveyard": new Position(3569, 3404, 0),
    "Castle Drakan": new Position(3554, 3357, 0),
    "Sanguinesti region": new Position(3635, 3341, 0),
    "Barrows": new Position(3564, 3288, 0),
    "Meiyerditch": new Position(3618, 3259, 0),
    "Dragontooth Island": new Position(3806, 3554, 0),
    "Mos Le'Harmless": new Position(3709, 3029, 0),
    "Distilleries": new Position(3787, 2997, 0),
    "Harmony": new Position(3801, 2858),
    "Stronghold of Security - Vault of War": new Position(1884, 5218, 0),
    "Stronghold of Security - Catacomb of Famine": new Position(2016, 5215, 0),
    "Stronghold of Security - Pit of Pestilence": new Position(2144, 5280, 0),
    "Stronghold of Security - Sepulchre of Death": new Position(2333, 5219, 0),
    "Dorgesh-Kaan": new Position(2717, 5319, 0),
    "Raids": new Position(3312, 5295, 0),
    "Sorceress's Garden": new Position(2909, 5472, 0),
    "TzHaar City": new Position(2451, 5146, 0),
    "Zanaris": new Position(2415, 4455, 0),
    "Clan Wars": new Position(3422, 4735, 0),
    "Motherlode Mine": new Position(3745, 5665, 0),
    "Varrock Sewers": new Position(3225, 9887, 0),
    "Edgeville Dungeon": new Position(3114, 9917, 0),
    "Dwarven Mine": new Position(3024, 9791, 0),
    "Keldagrim": new Position(2855, 10175, 0),
    "Fremennik Slayer Dungeon": new Position(2805, 10001, 0),
    "Taverley Dungeon": new Position(2886, 9811, 0),
    "Lumbridge Swamp Caves": new Position(3169, 9571, 0)
};

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

function CanvasLayer() {
    return new L.CanvasLayer();
}

$(document).ready(function () {
// TODO: Stop being lazy and clean up this damn file

    var OutputType = Object.freeze({ARRAY: 1, LIST: 2, ARRAYS_AS_LIST: 3, RAW: 4});
    var outputType = OutputType.ARRAY;

    var map = L.map('map', {
        //maxBounds: L.latLngBounds(L.latLng(-40, -180), L.latLng(85, 153))
        zoomControl: false,
        renderer: L.canvas()
    }).setView([-82, -138], 7);

    /*
     Init custom controls
     */
    var titleLabel = L.Control.extend({
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
    map.addControl(new titleLabel());

    var coordinatesControl = L.Control.extend({
        options: {
            position: 'topleft'
        },
        onAdd: function (map) {
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
        position: 'topleft'
    }).addTo(map);

    var planeControl = L.Control.extend({
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
        onAdd: function (map) {
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
        onAdd: function (map) {
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
        onAdd: function (map) {
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
        onAdd: function (map) {
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
        onAdd: function (map) {
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

    $("#toggle-map-labels").click(function () {
        if (map.hasLayer(mapLabels)) {
            map.removeLayer(mapLabels);
        } else {
            mapLabels.addTo(map);
        }
    });

    var grid = new Grid(map, new L.FeatureGroup());

    $("#toggle-region-grid").click(function () {
        if (!grid.isVisible()) {
            grid.show();
        } else {
            grid.hide();
        }
    });

    var regionLabelsEnabled = false;

    var myCustomCanvasDraw = function () {
        this.onLayerDidMount = function () {
        };

        this.onLayerWillUnmount = function () {
        };

        this.setData = function (data) {
            this.needRedraw();
        };

        this.onDrawLayer = function (info) {
            var ctx = info.canvas.getContext('2d');
            ctx.clearRect(0, 0, info.canvas.width, info.canvas.height);

            if (regionLabelsEnabled) {

                ctx.font = '10pt Calibri';
                ctx.fillStyle = 'white';
                ctx.textAlign = "center";

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
        };
    };
    myCustomCanvasDraw.prototype = new CanvasLayer();
    var regionLabelsLayer = new myCustomCanvasDraw();
    regionLabelsLayer.addTo(map);

    $("#toggle-region-labels").click(function () {
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
    });

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

    $("#code-output").on('input propertychange paste', function () {
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
        highlight($("#code-output"));
    }

    $("#increase-level").click(function () {
        if (z == 3) {
            return;
        }
        z++;
        $("#zCoord").val(z);
        setMapLayer();
    });

    $("#decrease-level").click(function () {
        if (z == 0) {
            return;
        }
        z--;
        $("#zCoord").val(z);
        setMapLayer();
    });

    $("#map, #location-lookup").autocomplete({
        minLength: 2,
        source: function (request, response) {
            var locationsArray = $.map(locations, function (value, key) {
                return {
                    label: key,
                    value: value
                }
            });
            response($.ui.autocomplete.filter(locationsArray, request.term));
        },
        focus: function (event, ui) {
            $("#location-lookup").val(ui.item.label);
            return false;
        },
        select: function (event, ui) {
            $("#location-lookup").val(ui.item.label);
            goToCoordinates(ui.item.value.x, ui.item.value.y);
            return false;
        }
    });

});

}());
