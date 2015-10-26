var Leaflet = require('leaflet');

var {
  DEFAULT_CRS_TYPE,
  DEFAULT_LAT,
  DEFAULT_LNG,
  DEFAULT_ZOOM_LEVEL
} = require('./Constants');

class ViewState {
  constructor(viewState) {
    Object.assign(this, {
      lat: viewState.lat != null ? viewState.lat : DEFAULT_LAT,
      lng: viewState.lng != null ? viewState.lng : DEFAULT_LNG,
      zoomLevel: viewState.zoomLevel != null ? viewState.zoomLevel : DEFAULT_ZOOM_LEVEL
    });
  }

  getPixelsPerUnit(zoomLevel) {
    if (zoomLevel == null) {
      zoomLevel = this.zoomLevel;
    }
    return Leaflet.CRS[DEFAULT_CRS_TYPE].scale(zoomLevel);
  }
}

module.exports = ViewState;
