# React LeafletMap component

This is a primitive React wrapper for Leaflet. Currently, it only supports the `Leaflet.CRS.Simple` coordinate system so it is useful for non-geographical maps (like that of a shopping center or a park) but not real-world, geographical maps (like that of the Earth). It should be straightforward to expand this to fit any coordinate system, but my needs were simple at the time I created this module so I did not get into further complexity. Pull requests are welcome.

## Usage:

```
<LeafletMap width={400} width={300} viewState={viewState} onViewStateChange={onViewStateChange}>
  <Overlay itemKey="0" url="overlay.svg" width={2} height={2} />
  <Marker lat={0.5} lng={0.5} />
  {/* ... more markers ... */}
</LeafletMap>
```

For more in-depth example, see `example/App.js`.
