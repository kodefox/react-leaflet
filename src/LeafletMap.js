var leafletStylesheet = require('file?name=[name]-[hash].css!leaflet/dist/leaflet.css');
var isLeafletStylesheetAdded = false;

var Leaflet = require('leaflet');
var React = require('react');
var ViewState = require('./ViewState');
var Marker = require('./Marker');
var Overlay = require('./Overlay');

var addStylesheet = require('./helpers/addStylesheet');
var diffByKey = require('./helpers/diffByKey');
var shallowIsEqual = require('./helpers/shallowIsEqual');

var {PropTypes} = React;
var {DEFAULT_CRS_TYPE, FLUSH_VIEWSTATE_DELAY_MS} = require('./Constants');

var MAP_OPTIONS = {
  attributionControl: false,
  minZoom: 6,
  maxZoom: 14,
  doubleClickZoom: false,
  scrollWheelZoom: false,
  // todo: make this configurable (props?)
  crs: Leaflet.CRS[DEFAULT_CRS_TYPE]
};

var LeafletMap = React.createClass({
  propTypes: {
    viewState: PropTypes.instanceOf(ViewState).isRequired,
    onViewStateChange: PropTypes.func.isRequired,
    onClick: PropTypes.func,
    onZoomReset: PropTypes.func
  },

  componentWillMount() {
    if (!isLeafletStylesheetAdded) {
      addStylesheet(leafletStylesheet);
      isLeafletStylesheetAdded = true;
    }
    this._map = null;
    // key[string]: marker wrapper
    this._markers = {};
    // key[string]: overlay wrapper
    this._overlays = {};
    // the current state of Leaflet's view (may be temporarily out of sync with props)
    this._currentViewState = null;
    // a refresh will be scheduled using setTimeout when Leaflet's view is out of sync with props
    this._refreshTimeout = null;
    // an optional button added to the zoom control to reset zoom to default
    this._zoomResetButton = null;
  },

  componentDidMount() {
    var props = this.props;
    this._initMap(props);
    this._parsedChildren = this._parseChildren(props);
    var {markerChildren, overlayChildren} = this._parsedChildren;
    Object.keys(overlayChildren).forEach((key) => this._addOverlay(key, overlayChildren[key]));
    Object.keys(markerChildren).forEach((key) => this._addMarker(key, markerChildren[key]));
    if (props.onZoomReset != null) {
      this._addZoomResetButton();
    }
  },

  componentWillUnmount() {
    clearTimeout(this._refreshTimeout);
    this._removeAllMarkers();
    this._removeAllOverlays();
    this._map.remove();
  },

  shouldComponentUpdate() {
    return false;
  },

  componentWillReceiveProps(newProps) {
    var oldProps = this.props;
    var shouldRefreshView = false;
    if (oldProps.children !== newProps.children) {
      this._parsedChildren = this._parseChildren(newProps);
      shouldRefreshView = true;
    }
    if (oldProps.width !== newProps.width || oldProps.height !== newProps.height) {
      this._setContainerSize(newProps);
      shouldRefreshView = true;
    }
    if (oldProps.viewState !== newProps.viewState && newProps.viewState !== this._currentViewState) {
      shouldRefreshView = true;
    }
    if (shouldRefreshView) {
      this._refreshView(newProps);
    }
    var oldHasZoomResetButton = (oldProps.onZoomReset != null);
    var newHasZoomResetButton = (newProps.onZoomReset != null);
    if (oldHasZoomResetButton !== newHasZoomResetButton) {
      newHasZoomResetButton ? this._addZoomResetButton() : this._removeZoomResetButton();
    }
  },

  render() {
    var style = {
      width: this.props.width,
      height: this.props.height
    };
    return <div className={this.props.className} style={style} />;
  },

  _parseChildren(props) {
    var markerChildren = {};
    var overlayChildren = {};
    React.Children.forEach(props.children, (child) => {
      if (child == null) return;
      if (child.type === Marker) {
        markerChildren[child.props.itemKey] = child;
      } else
      if (child.type === Overlay) {
        overlayChildren[child.props.itemKey] = child;
      } else {
        throw new Error('LeafletMap children must be of type Marker or Overlay');
      }
    });
    return {markerChildren, overlayChildren};
  },

  _initMap(props) {
    var rootNode = React.findDOMNode(this);
    // todo: options passed as props
    var map = Leaflet.map(rootNode, MAP_OPTIONS);
    this._map = map;
    this._setViewState(props.viewState);
    // add some event handlers
    map.on('click', this._onMapClick);
    // todo: debounce these due to animation calling moveend excessively?
    map.on('moveend', this._onMapZoomPan);
    map.on('zoomend', this._onMapZoomPan);
  },

  _addZoomResetButton() {
    // todo: zoomResetText, zoomResetTitle ?
    var zoomControl = this._map.zoomControl;
    var a = this._zoomResetButton = document.createElement('a');
    a.className = 'leaflet-control-zoom-reset';
    a.href = '#';
    a.title = 'Reset zoom';
    a.appendChild(document.createTextNode('×'));
    a.addEventListener('mousedown', Leaflet.DomEvent.stopPropagation);
    a.addEventListener('dblclick', Leaflet.DomEvent.stopPropagation);
    a.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (this.props.onZoomReset) this.props.onZoomReset(event);
    });
    var zoomOutButton = zoomControl._zoomOutButton;
    zoomOutButton.parentNode.insertBefore(a, zoomOutButton);
  },

  _removeZoomResetButton() {
    this._zoomResetButton.parentNode.removeChild(this._zoomResetButton);
    this._zoomResetButton = null;
  },

  _refreshView(props) {
    props = props || this.props;
    this._setViewState(props.viewState);
    var {markerChildren, overlayChildren} = this._parsedChildren;
    this._updateOverlays(overlayChildren);
    this._updateMarkers(markerChildren);
  },

  _setViewState(viewState) {
    var map = this._map;
    var {lat, lng, zoomLevel} = viewState;
    map.setView([lat, lng], zoomLevel, {reset: true});
    this._currentViewState = viewState;
  },

  _onMapZoomPan() {
    var map = this._map;
    var {lat, lng} = map.getCenter();
    var zoomLevel = map.getZoom();
    var oldViewState = this._currentViewState;
    var newViewState = new ViewState({
      lat: lat,
      lng: lng,
      zoomLevel: zoomLevel
    });
    if (shallowIsEqual(oldViewState, newViewState)) {
      return;
    }
    this._currentViewState = newViewState;
    // Leaflet's view state may now be out of sync with `props.viewState`. Refresh Leaflet's view
    // in a moment (unless we receive newViewState back immediately in the props).
    clearTimeout(this._refreshTimeout);
    this._refreshTimeout = setTimeout(() => {
      if (this.props.viewState !== newViewState) {
        this._refreshView();
      }
    }, FLUSH_VIEWSTATE_DELAY_MS);
    this.props.onViewStateChange(newViewState);
  },

  _setContainerSize(props) {
    var rootNode = React.findDOMNode(this);
    rootNode.style.width = (props.width == null) ? 'auto' : props.width + 'px';
    rootNode.style.height = (props.height == null) ? 'auto' : props.height + 'px';
    this._map.invalidateSize(true);
  },

  _updateMarkers(markerChildren) {
    var {toRemove, toAdd, toUpdate} = diffByKey(this._markers, markerChildren);
    toRemove.forEach((key) => this._removeMarker(key));
    toUpdate.forEach((key) => this._markers[key].update(markerChildren[key]));
    toAdd.forEach((key) => this._addMarker(key, markerChildren[key]));
  },

  _addMarker(key, marker) {
    this._markers[key] = Marker.addToMap(marker, this._map);
  },

  _removeMarker(key) {
    this._markers[key].destroy();
    delete this._markers[key];
  },

  _removeAllMarkers() {
    Object.keys(this._markers).forEach((key) => this._removeMarker(key));
  },

  _updateOverlays(overlayChildren) {
    var {toRemove, toAdd, toUpdate} = diffByKey(this._overlays, overlayChildren);
    toRemove.forEach((key) => this._removeOverlay(key));
    toUpdate.forEach((key) => this._overlays[key].update(overlayChildren[key]));
    toAdd.forEach((key) => this._addOverlay(key, overlayChildren[key]));
  },

  _addOverlay(key, overlay) {
    this._overlays[key] = Overlay.addToMap(overlay, this._map);
  },

  _removeOverlay(key) {
    this._overlays[key].destroy();
    delete this._overlays[key];
  },

  _removeAllOverlays() {
    Object.keys(this._overlays).forEach((key) => this._removeOverlay(key));
  },

  _onMapClick(event) {
    if (this.props.onClick) {
      var {lat, lng} = event.latlng;
      this.props.onClick(lat, lng);
    }
  }
});

LeafletMap.Overlay = Overlay;
LeafletMap.Marker = Marker;
LeafletMap.ViewState = ViewState;

module.exports = LeafletMap;
