
import * as $ from 'jquery';

import Position from './Position';

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
      url: 'resources/locations.json',
      dataType: 'json',
      context: this,
      success(data) {
        this.locations = data.locations.map(location => (
          {
            name: location.name,
            position: new Position(...location.coords),
          }
        ));

        callback(this.locations);
      },
    });
  }
}

export default (new Locations());
