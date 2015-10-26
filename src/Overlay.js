var Leaflet = require('leaflet');
var React = require('react');

var {PropTypes} = React;

var Overlay = React.createClass({
  propTypes: {
    itemKey: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired
  },

  statics: {
    addToMap(component, map) {
      var {url, width, height} = component.props;
      // center the overlay over [0 0]
      var getBounds = (width, height) => {
        var xOffset = width / 2;
        var yOffset = height / 2;
        return Leaflet.latLngBounds([yOffset, -xOffset], [-yOffset, xOffset]);
      };
      var overlay = Leaflet.imageOverlay(url, getBounds(width, height));
      overlay.addTo(map);
      return {
        update(newComponent) {
          var oldProps = component.props;
          var newProps = newComponent.props;
          if (oldProps.url !== newProps.url) {
            overlay.setUrl(newProps.url);
          }
          if (oldProps.width !== newProps.width || oldProps.height !== newProps.height) {
            overlay.setBounds(getBounds(newProps.width, newProps.height));
          }
          component = newComponent;
        },
        destroy() {
          map.removeLayer(overlay);
        }
      };
    }
  },

  render() {
    return null;
  }
});

module.exports = Overlay;
