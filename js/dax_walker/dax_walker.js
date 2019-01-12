'use strict';

import { Position } from '../model/Position.js';

const API_URL = "https://osrs-map.herokuapp.com/getPath";

const errorMessageMapping = {
    "UNMAPPED_REGION": "Unmapped region",
    "BLOCKED": "Tile is blocked",
    "EXCEEDED_SEARCH_LIMIT": "Exceeded search limit",
    "UNREACHABLE": "Unreachable tile",
    "NO_WEB_PATH" : "No web path",
    "INVALID_CREDENTIALS": "Invalid credentials",
    "RATE_LIMIT_EXCEEDED": "Rate limit exceeded",
    "NO_RESPONSE_FROM_SERVER": "No response from server",
    "UNKNOWN": "Unknown"
};

export function getPath({start, end, onSuccess, onError}) {
    $.ajax({
        url: API_URL,
        type: 'POST',
        data: JSON.stringify({
            "start": {
                "x": start.x,
                "y": start.y,
                "z": start.z
            },
            "end": {
                "x": end.x,
                "y": end.y,
                "z": end.z
            }
        }),
        dataType: 'json',
        contentType: 'application/json',
        success: function (data) {
            if (data['pathStatus'] !== "SUCCESS") {
                onError(start, end, errorMessageMapping[data['pathStatus']]);
            } else {
                const path = data['path'];
                const pathPositions = path.map(pos => new Position(pos.x, pos.y, pos.z));
                onSuccess(pathPositions);
            }
        }
    });
}