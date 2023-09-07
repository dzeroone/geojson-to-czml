const path = require('path');
const fs = require('fs');

const inputDir = path.resolve(__dirname, './geojson-inputs')
const outputDir = path.resolve(__dirname, './czml-outputs')

fs.mkdirSync(inputDir, { recursive: true})
fs.mkdirSync(outputDir, { recursive: true})

const options = {
  polygon: {
    fillColor: [
      255,
      234,
      175,
      125
    ],
    outline: {
      width: 1,
      color: [
        0,
        255,
        0,
        100
      ]
    }
  }
}

const inputFiles = fs.readdirSync(inputDir);

const start = () => {
  for(const geojsonFile of inputFiles) {
    const geojsonStr = fs.readFileSync(path.resolve(inputDir, geojsonFile), 'utf8')
    const geojson = JSON.parse(geojsonStr)
    geo2czml(geojson, geojsonFile)
  }
}

const geo2czml = (geojson, fileName) => {
  const czml = [
    {
      "id": "document",
      "name": path.parse(fileName).name,
      "version": "1.00"
    }
  ]

  for(const feature of geojson.features) {
    convertFeature(feature, czml)
  }
  fs.writeFileSync(path.resolve(outputDir, fileName), JSON.stringify(czml, null, 2), {
    encoding: 'utf8'
  })
}

const convertFeature = (feature, czml) => {
  switch(feature.geometry.type) {
    case 'MultiPolygon':
      convertMultiPloygon(feature, czml)
      break;
  }
}

const convertMultiPloygon = (feature, czml) => {
  feature.geometry.coordinates.forEach((polygon, index) => {
    convertPolygon(polygon, `${feature.id}-${index}`, feature, czml)
  })
}

const convertPolygon = (polygon, id, feature, czml) => {
  const data = {
    id,
    name: feature.geometry_name || '',
    polygon: {
      positions: {
        cartographicDegrees: []
      },
      height: 0,
      material: {
        solidColor: {
          color: {
            rgba: options.polygon.fillColor
          }
        }
      }
    }
  }
  if(options.polygon && options.polygon.outline) {
    const olConfig = options.polygon.outline
    data.polygon.outline = true
    data.polygon.outlineColor = {
      rgba: olConfig.color
    }
    data.polygon.outlineWidth = olConfig.width ?? 1
  }
  const defaultElevation = 0;
  for(const lineArr of polygon) {
    for(const point of lineArr) {
      data.polygon.positions.cartographicDegrees.push(point[0], point[1], defaultElevation)
    }
  }
  czml.push(data)
}

start();