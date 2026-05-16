# 🌊 Flood Inundation Mapping Using Sentinel-1 SAR Data

### A Change Detection Approach for the 2022 Sylhet Floods (Bangladesh)

---

## Overview

This project maps flood-affected areas during the **June 2022 Sylhet floods** in Bangladesh using **Sentinel-1 SAR (Synthetic Aperture Radar)** satellite imagery. By comparing pre-flood and post-flood radar backscatter, the system automatically detects and delineates inundated regions using **Otsu thresholding** and change detection techniques.

Unlike optical sensors (e.g., Sentinel-2, Landsat), SAR operates independently of weather and lighting conditions — making it ideal for flood mapping during monsoon seasons when cloud cover renders optical imagery unusable.

## Key Results

| Metric | Value |
|--------|-------|
| Study Area | Sylhet Region, Bangladesh (5,383.22 sq km) |
| Total Flooded Area | 645.06 sq km |
| Flood Coverage | 11.98% of study area |
| Otsu Threshold | 4.50 dB |
| Pre-flood Images Used | 19 (March–April 2022) |
| Post-flood Images Used | 7 (June 10–30, 2022) |
| Spatial Resolution | 10 m |

## Methodology

```
Sentinel-1 GRD Data
       │
       ▼
┌──────────────────┐
│  Pre-Flood Median │──── March – April 2022
│  Composite (VH)   │
└────────┬─────────┘
         │              ┌──────────────────┐
         │              │ Post-Flood Median │──── June 10 – 30, 2022
         │              │ Composite (VH)    │
         │              └────────┬─────────┘
         │                       │
         ▼                       ▼
    Speckle Filter         Speckle Filter
    (Focal Mean 50m)       (Focal Mean 50m)
         │                       │
         └───────────┬───────────┘
                     ▼
          Change Detection
        (Pre − Post Difference)
                     │
                     ▼
           Otsu Thresholding
          (Automatic threshold)
                     │
                     ▼
         ┌───────────────────┐
         │  Post-Processing   │
         │  • Remove noise    │
         │  • Mask permanent  │
         │    water (JRC)     │
         │  • Remove slopes   │
         │    >5° (SRTM DEM) │
         └─────────┬─────────┘
                   ▼
         Final Flood Extent Map
```

### Step-by-Step Explanation

1. **Data Acquisition:** Sentinel-1 GRD (Ground Range Detected) images in IW (Interferometric Wide) mode were collected via Google Earth Engine. VH polarization was selected for superior water-land contrast.

2. **Composite Generation:** Median composites were created for both pre-flood (March–April 2022) and post-flood (June 10–30, 2022) periods to reduce temporal variability and speckle noise.

3. **Speckle Filtering:** A focal mean filter with a 50m circular kernel was applied to smooth residual speckle noise while preserving flood boundaries.

4. **Change Detection:** The difference image (pre-flood minus post-flood backscatter) was computed. Positive values indicate decreased backscatter — a signature of new water surfaces.

5. **Otsu Thresholding:** An automatic histogram-based thresholding method (Otsu's algorithm) determined the optimal separation between flooded and non-flooded pixels. The computed threshold was 4.50 dB.

6. **Post-Processing:**
   - Small isolated pixel clusters (<8 connected pixels) were removed to reduce noise.
   - Permanent water bodies were masked using the JRC Global Surface Water dataset (seasonality ≥ 10 months).
   - Terrain slopes >5° were excluded using SRTM DEM, as flooding doesn't occur on steep terrain.

7. **Area Calculation:** Flooded pixel areas were summed to compute total inundation extent.

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Platform | Google Earth Engine (GEE) |
| Satellite Data | Sentinel-1 SAR (C-band, 10m resolution) |
| Polarization | VH (Vertical-Horizontal) |
| Ancillary Data | JRC Global Surface Water, SRTM DEM |
| Thresholding | Otsu's Method |
| Language | JavaScript (GEE API) |
| Visualization | GEE Map Interface |

## Dataset Details

| Dataset | Source | Purpose |
|---------|--------|---------|
| Sentinel-1 GRD | ESA / Copernicus | SAR backscatter for flood detection |
| JRC Global Surface Water v1.4 | European Commission JRC | Permanent water body masking |
| SRTM Digital Elevation Model | NASA / USGS | Slope-based terrain filtering |
| FAO GAUL Level 2 | FAO | Administrative boundary reference |

## Project Structure

```
flood-inundation-mapping/
├── README.md
├── scripts/
│   └── flood_mapping_sylhet.js    # Complete GEE script
├── maps/
│   ├── pre_flood.png              # Pre-flood SAR composite
│   ├── post_flood.png             # Post-flood SAR composite
│   ├── difference.png             # Backscatter difference map
│   └── flood_extent.png           # Final flood extent map
├── results/
│   └── flood_statistics.csv       # Area statistics
└── report/
    └── project_report.md          # Detailed methodology report
```

## Results Visualization

### Pre-Flood vs Post-Flood SAR

The post-flood SAR image shows significantly more dark regions (low backscatter) compared to the pre-flood image, indicating widespread water surface presence due to flooding.

### Backscatter Difference Map

Red/warm regions in the difference map represent areas where backscatter decreased substantially — these correspond to newly flooded zones. Blue regions indicate increased backscatter (e.g., drying or roughening of surfaces).

### Final Flood Extent Map

The processed flood map shows 645.06 sq km of inundation across the Sylhet region, concentrated in low-lying floodplain areas along major river systems.

## How to Run

1. Open [Google Earth Engine Code Editor](https://code.earthengine.google.com/)
2. Create a new script
3. Copy and paste the contents of `scripts/flood_mapping_sylhet.js`
4. Click **Run**
5. View results in the Console panel and map layers
6. Click **Tasks** tab and run export jobs to save GeoTIFFs to Google Drive

## Context: 2022 Sylhet Floods

In June 2022, the Sylhet division of Bangladesh experienced one of its worst flooding events in recent history. Pre-monsoon heavy rainfall combined with upstream water from India's northeastern states caused rivers to overflow, inundating vast areas. Over 4 million people were affected, and significant damage occurred to infrastructure, agriculture, and livelihoods. This project demonstrates how satellite-based remote sensing can rapidly assess flood extent for disaster response and planning.

## References

- ESA Sentinel-1 Mission: https://sentinel.esa.int/web/sentinel/missions/sentinel-1
- Google Earth Engine: https://earthengine.google.com/
- JRC Global Surface Water: https://global-surface-water.appspot.com/
- Otsu, N. (1979). A Threshold Selection Method from Gray-Level Histograms. IEEE Transactions on Systems, Man, and Cybernetics, 9(1), 62–66.
- Uddin, K. et al. (2019). Operational Flood Mapping Using Multi-Temporal Sentinel-1 SAR Images. Sensors, 19(4), 786.

## Author

**Aishani Kundu**

---

*This project was developed as a remote sensing portfolio project demonstrating SAR-based flood detection capabilities using open-source satellite data and cloud computing platforms.*
