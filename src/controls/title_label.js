import * as L from 'leaflet';

const TitleLabel = L.Control.extend({
  options: {
    position: 'topleft',
  },

  onAdd() {
    const container = L.DomUtil.create('div');
    container.id = 'titleLabel';
    container.href = 'http://osbot.org/forum/user/192661-explv/';
    container.innerHTML = "<span id='explv'>Explv</span>'s Map";

    L.DomEvent.disableClickPropagation(container);
    return container;
  },
});

export default TitleLabel;
