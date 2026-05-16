// ============================================
// FLOOD INUNDATION MAPPING USING SENTINEL-1 SAR
// Study Area: Sylhet, Bangladesh — June 2022 Floods
// ============================================

// ===== STEP 1: CONFIGURATION =====
// Using a rectangle over Sylhet region
var aoi = ee.Geometry.Rectangle([91.5, 24.6, 92.3, 25.2]);

var preFloodStart  = '2022-03-01';
var preFloodEnd    = '2022-04-30';
var postFloodStart = '2022-06-10';
var postFloodEnd   = '2022-06-30';

Map.centerObject(aoi, 10);
Map.addLayer(ee.Image().paint(aoi, 0, 2), {palette: ['red']}, 'Study Area Boundary');

// ===== STEP 2: LOAD SENTINEL-1 DATA (try both orbits) =====
var s1 = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filterBounds(aoi)
  .filter(ee.Filter.eq('instrumentMode', 'IW'))
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
  .filter(ee.Filter.eq('resolution_meters', 10));

var preFlood = s1.filterDate(preFloodStart, preFloodEnd).select('VH');
var postFlood = s1.filterDate(postFloodStart, postFloodEnd).select('VH');

print('Pre-flood image count:', preFlood.size());
print('Post-flood image count:', postFlood.size());

// ===== STEP 3: CREATE COMPOSITES =====
var preFloodComposite  = preFlood.median().clip(aoi);
var postFloodComposite = postFlood.median().clip(aoi);

var sarVis = {min: -25, max: -5, palette: ['black', 'white']};
Map.addLayer(preFloodComposite, sarVis, 'Pre-Flood VH');
Map.addLayer(postFloodComposite, sarVis, 'Post-Flood VH');

// ===== STEP 4: SPECKLE FILTER =====
var smoothingRadius = 50;
var preFiltered  = preFloodComposite.focal_mean(smoothingRadius, 'circle', 'meters');
var postFiltered = postFloodComposite.focal_mean(smoothingRadius, 'circle', 'meters');

Map.addLayer(preFiltered, sarVis, 'Pre-Flood Filtered');
Map.addLayer(postFiltered, sarVis, 'Post-Flood Filtered');

// ===== STEP 5: CHANGE DETECTION =====
var difference = preFiltered.subtract(postFiltered);
var diffVis = {min: -5, max: 10, palette: ['blue', 'white', 'red']};
Map.addLayer(difference, diffVis, 'Backscatter Difference');

// ===== STEP 6: OTSU THRESHOLDING =====
var histogram = difference.reduceRegion({
  reducer: ee.Reducer.histogram(255, 0.1),
  geometry: aoi,
  scale: 30,
  maxPixels: 1e13,
  bestEffort: true
});

function otsu(histogram) {
  var counts = ee.Array(ee.Dictionary(histogram).get('histogram'));
  var means  = ee.Array(ee.Dictionary(histogram).get('bucketMeans'));
  var size   = means.length().get([0]);
  var total  = counts.reduce(ee.Reducer.sum(), [0]).get([0]);
  var sum    = means.multiply(counts).reduce(ee.Reducer.sum(), [0]).get([0]);
  var mean   = sum.divide(total);
  var indices = ee.List.sequence(1, size);
  var bss = indices.map(function(i) {
    var aCounts = counts.slice(0, 0, i);
    var aCount  = aCounts.reduce(ee.Reducer.sum(), [0]).get([0]);
    var aMeans  = means.slice(0, 0, i);
    var aMean   = aMeans.multiply(aCounts)
      .reduce(ee.Reducer.sum(), [0]).get([0])
      .divide(aCount);
    var bCount = total.subtract(aCount);
    var bMean  = sum.subtract(aCount.multiply(aMean)).divide(bCount);
    return aCount.multiply(bCount).multiply(aMean.subtract(bMean).pow(2));
  });
  return means.sort(bss).get([-1]);
}

var threshold = otsu(histogram.get('VH'));
print('Otsu Threshold:', threshold);

// ===== STEP 7: BINARY FLOOD MAP =====
var floodExtent = difference.gt(threshold);
var floodMask = floodExtent.updateMask(floodExtent);
Map.addLayer(floodMask, {palette: ['cyan']}, 'Flood Extent (Raw)');

// ===== STEP 8: POST-PROCESSING =====
var connections = floodMask.connectedPixelCount(25, false);
var floodCleaned = floodMask.updateMask(connections.gte(8));

var permanentWater = ee.Image('JRC/GSW1_4/GlobalSurfaceWater')
  .select('seasonality').gte(10);
var floodOnly = floodCleaned.updateMask(permanentWater.not());

var dem = ee.Image('USGS/SRTMGL1_003');
var slope = ee.Terrain.slope(dem);
var floodFinal = floodOnly.updateMask(slope.lt(5));

Map.addLayer(floodFinal, {palette: ['#0066FF']}, 'Final Flood Extent');

// ===== STEP 9: AREA CALCULATION =====
var floodArea = floodFinal.multiply(ee.Image.pixelArea()).divide(1e6);
var stats = floodArea.reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: aoi,
  scale: 10,
  maxPixels: 1e13,
  bestEffort: true
});
print('Total Flooded Area (sq km):', stats.get('VH'));
var totalArea = aoi.area().divide(1e6);
print('Total Study Area (sq km):', totalArea);

// ===== STEP 10: FINAL MAP STYLING =====
Map.setOptions('HYBRID');

var legend = ui.Panel({style: {position: 'bottom-left', padding: '8px'}});
legend.add(ui.Label('Flood Map Legend', {fontWeight: 'bold', fontSize: '14px'}));
var makeRow = function(color, name) {
  var colorBox = ui.Label('', {
    backgroundColor: color, padding: '10px', margin: '0 8px 4px 0'
  });
  return ui.Panel([colorBox, ui.Label(name)], ui.Panel.Layout.Flow('horizontal'));
};
legend.add(makeRow('#0066FF', 'Flooded Area'));
legend.add(makeRow('#FF0000', 'Study Area Boundary'));
Map.add(legend);

// ===== STEP 11: EXPORT =====
Export.image.toDrive({
  image: floodFinal.toFloat(),
  description: 'Flood_Extent_Map',
  folder: 'flood_mapping',
  region: aoi,
  scale: 10,
  maxPixels: 1e13,
  crs: 'EPSG:4326'
});

Export.image.toDrive({
  image: difference,
  description: 'Backscatter_Difference',
  folder: 'flood_mapping',
  region: aoi,
  scale: 10,
  maxPixels: 1e13,
  crs: 'EPSG:4326'
});

print('Script complete! Click Tasks tab for exports.');
