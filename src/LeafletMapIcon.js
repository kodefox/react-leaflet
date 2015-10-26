/*
 * MapIcon is an icon class that you can use with Leaflet.Marker for custom markers.
 */

var Leaflet = require('leaflet');

var MapIcon = Leaflet.Class.extend({
	/*
	options: {
		iconUrl: (String)
		iconSize: (Point) (can be set through CSS)
		iconAnchor: (Point) (centered by default, can be set in CSS with negative margins)
		popupAnchor: (Point) (if not specified, popup opens in the anchor point)
		shadowUrl: (String) (no shadow by default)
		shadowSize: (Point)
		shadowAnchor: (Point)
		className: (String)
	},
	*/

  initialize: function (options) {
    this.options = Object.assign({}, options);
  },

  createIcon: function (oldIcon) {
    return this._createIcon('icon', oldIcon);
  },

  createShadow: function (oldIcon) {
    return this._createIcon('shadow', oldIcon);
  },

  _createIcon: function (name, oldIcon) {
    var el = this._createIconEl(name, oldIcon && oldIcon.tagName ? oldIcon : null);
    this._setIconStyles(el, name);
    return el;
  },

  _setIconStyles: function (el, name) {
    var options = this.options;
    var size = Leaflet.point(options[name + 'Size']);
    var anchor = Leaflet.point((name === 'shadow') ? options.shadowAnchor : options.iconAnchor);
    if (anchor == null && size != null) {
      anchor = size.divideBy(2, true);
    }
    el.classList.add('leaflet-marker-' + name);
    if (options.className) {
      el.classList.add(options.className);
    }
    if (anchor) {
      el.style.marginLeft = (-anchor.x) + 'px';
      el.style.marginTop  = (-anchor.y) + 'px';
    }
    if (size) {
      el.style.width  = size.x + 'px';
      el.style.height = size.y + 'px';
    }
  },

  _createIconEl: function (name, el) {
    var src = this._getIconUrl(name);
    if (el) {
      while (el.firstChild) {
        el.removeChild(el.firstChild);
      }
    } else {
      el = document.createElement('div');
    }
    if (src) {
      var img = document.createElement('img');
      img.src = src;
      el.appendChild(img);
    }
    return el;
  },

  _getIconUrl: function (name) {
    return this.options[name + 'Url'];
  }
});

module.exports = MapIcon;
