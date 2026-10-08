'use strict';

import {Area} from '../model/Area.js';
import {Position} from '../model/Position.js';
import {Areas} from '../model/Areas.js';
import {Path} from '../model/Path.js';
import {PolyArea} from '../model/PolyArea.js';

const WORLD_POINT = 'WorldPoint';
const WORLD_AREA = 'WorldArea';

export class RuneLiteConverter {
    toJava(drawable) {
        switch ($('#output-type').val()) {
            case 'List': return this.toJavaList(drawable);
            case 'Arrays.asList': return this.toJavaArraysAsList(drawable);
            case 'Raw': return this.toRaw(drawable);
            case 'Array':
            default: return this.toJavaArray(drawable);
        }
    }

    fromJava(text, drawable) {
        const compact = text.replace(/\s/g, '');

        if (drawable instanceof Areas) {
            drawable.removeAll();
            const pattern = /newWorldArea\((-?\d+),(-?\d+),(-?\d+),(-?\d+),(-?\d+)\)/g;
            for (const match of compact.matchAll(pattern)) {
                const [x, y, plane, width, height] = match.slice(1).map(Number);
                drawable.add(new Area(new Position(x, y + height - 1, plane), new Position(x + width - 1, y, plane)));
            }
            return;
        }

        if (drawable instanceof Path || drawable instanceof PolyArea) {
            drawable.removeAll();
            const pattern = /newWorldPoint\((-?\d+),(-?\d+),(-?\d+)\)/g;
            for (const match of compact.matchAll(pattern)) {
                const position = new Position(Number(match[1]), Number(match[2]), Number(match[3]));
                drawable.add(position);
            }
        }
    }

    toRaw(drawable) {
        return this.positionsFor(drawable).map(({x, y, z}) => `${x},${y},${z}`).join('\n');
    }

    toJavaArray(drawable) {
        const items = this.itemsFor(drawable);
        if (items.length === 0) return '';
        if (drawable instanceof Areas && items.length === 1) return `${WORLD_AREA} area = ${items[0]};`;
        const type = drawable instanceof Areas ? WORLD_AREA : WORLD_POINT;
        const name = drawable instanceof Areas ? 'areas' : 'positions';
        return `${type}[] ${name} = {\n${items.map(item => `    ${item}`).join(',\n')}\n};`;
    }

    toJavaList(drawable) {
        const items = this.itemsFor(drawable);
        if (items.length === 0) return '';
        if (drawable instanceof Areas && items.length === 1) return `${WORLD_AREA} area = ${items[0]};`;
        const type = drawable instanceof Areas ? WORLD_AREA : WORLD_POINT;
        const name = drawable instanceof Areas ? 'areas' : 'positions';
        return `List&lt;${type}&gt; ${name} = new ArrayList<>();\n${items.map(item => `${name}.add(${item});`).join('\n')}`;
    }

    toJavaArraysAsList(drawable) {
        const items = this.itemsFor(drawable);
        if (items.length === 0) return '';
        if (drawable instanceof Areas && items.length === 1) return `${WORLD_AREA} area = ${items[0]};`;
        const type = drawable instanceof Areas ? WORLD_AREA : WORLD_POINT;
        const name = drawable instanceof Areas ? 'areas' : 'positions';
        return `List&lt;${type}&gt; ${name} = Arrays.asList(\n    ${items.join(',\n    ')}\n);`;
    }

    itemsFor(drawable) {
        if (drawable instanceof Areas) return drawable.areas.map(area => this.toWorldArea(area));
        return this.positionsFor(drawable).map(position => this.toWorldPoint(position));
    }

    positionsFor(drawable) {
        if (drawable instanceof Path || drawable instanceof PolyArea) return drawable.positions;
        if (drawable instanceof Areas) return drawable.areas.flatMap(area => [area.startPosition, area.endPosition]);
        return [];
    }

    toWorldPoint(position) {
        return `new ${WORLD_POINT}(${position.x}, ${position.y}, ${position.z})`;
    }

    toWorldArea(area) {
        const x = Math.min(area.startPosition.x, area.endPosition.x);
        const y = Math.min(area.startPosition.y, area.endPosition.y);
        const width = Math.abs(area.startPosition.x - area.endPosition.x) + 1;
        const height = Math.abs(area.startPosition.y - area.endPosition.y) + 1;
        return `new ${WORLD_AREA}(${x}, ${y}, ${area.startPosition.z}, ${width}, ${height})`;
    }
}
