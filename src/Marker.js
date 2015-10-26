var Leaflet = require('leaflet');
var MapIcon = require('./LeafletMapIcon');
var React = require('react');

var {PropTypes} = React;
var {FLUSH_VIEWSTATE_DELAY_MS} = require('./Constants');

// prevent any image from loading; we want to use a div that is styled by css
Leaflet.Icon.Default.imagePath = 'javascript:void(0)//#';

var markerIcon = new MapIcon();
var markerData = (typeof WeakMap === 'undefined') ? new Map() : new WeakMap();

var Marker = React.createClass({
  _map: null,
  _marker: null,
  _refreshTimeout: null,

  propTypes: {
    itemKey: PropTypes.string.isRequired,
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
    onClick: PropTypes.func,
    onMove: PropTypes.func
  },

  statics: {
    addToMap(component, map) {
      var props = component.props;
      var marker = Leaflet.marker([props.lat, props.lng], {
        icon: markerIcon,
        draggable: (props.onMove != null)
      });
      marker.addTo(map);
      var element = marker.getElement();
      // this is a little hacky, but we need a way for the React instance to access map and marker
      markerData.set(element, {map, marker});
      React.render(component, element);
      return {
        update(component) {
          React.render(component, element);
        },
        destroy() {
          React.unmountComponentAtNode(element);
          markerData.delete(element);
          marker.remove();
        }
      };
    }
  },

  componentDidMount() {
    var parentElement = React.findDOMNode(this).parentNode;
    var {map, marker} = markerData.get(parentElement);
    marker.on('dragstart', this._onDragStart);
    marker.on('dragend', this._onDragEnd);
    marker.on('click', this._onClick);
    this._map = map;
    this._marker = marker;
  },

  componentWillReceiveProps(newProps) {
    var oldProps = this.props;
    var oldIsDraggable = (oldProps.onMove != null);
    var newIsDraggable = (newProps.onMove != null);
    if (oldIsDraggable !== newIsDraggable) {
      this._marker.options.draggable = newIsDraggable;
      if (newIsDraggable) {
        this._marker.dragging.enable();
      } else {
        this._marker.dragging.disable()
      }
    }
    if (oldProps.lat !== newProps.lat || oldProps.lng !== newProps.lng) {
      this._refreshView(newProps);
    }
  },

  componentWillUnmount() {
    clearTimeout(this._refreshTimeout);
    var marker = this._marker;
    marker.off('dragstart', this._onDragStart);
    marker.off('dragend', this._onDragEnd);
    marker.off('click', this._onClick);
  },

  render() {
    return (
      <div>{this.props.children}</div>
    );
  },

  _refreshView(props) {
    props = props || this.props;
    this._marker.setLatLng([props.lat, props.lng]);
  },

  _onClick() {
    if (this.props.onClick) this.props.onClick();
  },

  _onDragStart() {
    React.findDOMNode(this).parentNode.classList.add('dragging');
    this._marker.getElement().classList.add('dragging');
  },

  _onDragEnd() {
    this._marker.getElement().classList.remove('dragging');
    if (!this.props.onMove) return;
    var {lat, lng} = this._marker.getLatLng();
    this.props.onMove(lat, lng);
    clearTimeout(this._refreshTimeout);
    // The marker's view state may now be out of sync with props. Refresh its view in a moment.
    this._refreshTimeout = setTimeout(() => {
      if (this.props.lat !== lat || this.props.lng !== lng) {
        this._refreshView();
      }
    }, FLUSH_VIEWSTATE_DELAY_MS);
  }
});

module.exports = Marker;
