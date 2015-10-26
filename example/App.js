var React = require('react');
var LeafletMap = require('../src/LeafletMap');

var {Marker, Overlay, ViewState} = LeafletMap;

var INITIAL_LAT = 0;
var INITIAL_LNG = 0;
var INITIAL_ZOOM_LEVEL = 8;
var OVERLAY_KEY = 'OVERLAY_KEY';
var MAP_IMAGE_URL = 'https://dl.dropboxusercontent.com/u/341900/example-map-1.svg';

var App = React.createClass({
  getInitialState() {
    return {
      width: 512,
      height: 384,
      viewState: this._getInitialViewState()
    };
  },

  _getInitialViewState() {
    return new ViewState({
      lat: INITIAL_LAT,
      lng: INITIAL_LNG,
      zoomLevel: INITIAL_ZOOM_LEVEL
    });
  },

  render() {
    return (
      <LeafletMap
        width={this.state.width}
        height={this.state.height}
        viewState={this.state.viewState}
        onViewStateChange={this._onViewStateChange}
        onClick={this._onMapClick}
        onZoomReset={this._resetZoom}>
        <Overlay itemKey={OVERLAY_KEY} url={MAP_IMAGE_URL} width={2} height={2} />
        <Marker lat={0.5} lng={0.5} onClick={this._onMarkerClick} onMove={this._onMarkerMove} />
      </LeafletMap>
    );
  },

  _onViewStateChange(viewState) {
    this.setState({viewState});
  },

  _resetZoom() {
    this.setState({
      viewState: this._getInitialViewState()
    });
  },

  _onMapClick(lat, lng) {
    console.log('map click at', lat, lng);
  },

  _onMarkerClick() {
    console.log('marker clicked');
  },

  _onMarkerMove(lat, lng) {
    // note: since we're not changing any state here, the move will be cancelled
    console.log('marker moved to', lat, lng);
  }
});

module.exports = App;
