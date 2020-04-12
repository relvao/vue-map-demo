import * as t from 'io-ts'
import * as tPromise from 'io-ts-promise'
import axios from 'axios'

const SearchResult = t.interface({
  geonames: t.array(t.interface({
    geonameId: t.number,
    lat: t.string,
    lng: t.string,
    countryCode: t.string,
    toponymName: t.string
  }))
})
type SearchResult = t.TypeOf<typeof SearchResult>

const client = axios.create({
  timeout: 1000
})

export function search (name: string, numResults = 10) {
  const username = process.env.apiUsername
  const url = `http://api.geonames.org/searchJSON?name=${encodeURIComponent(name)}&lang=en&username=${username}&style=short&maxRows=${numResults}`

  return client.get(url)
    .then(res => tPromise.decode(SearchResult, res.data))
    .then(data => data.geonames.map((item) => {
      return {
        ...item,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lng)
      }
    }))
}

const WeatherResult = t.interface({
  weatherObservations: t.array(t.interface({
    temperature: t.string,
    stationName: t.string,
    lat: t.number,
    lng: t.number
  }))
})
type WeatherResult = t.TypeOf<typeof SearchResult>

export function findNearestCities (lat: number, lng: number, numResults = 5) {
  const username = process.env.apiUsername
  // http://api.geonames.org/findNearbyPlaceNameJSON?lat=38.736946&lng=-9.142685&username=relvao&cities=cities1000&maxRows=5&radius=100&featureCode=PPL
  const url = `http://api.geonames.org/findNearByWeatherJSON?lat=${lat}&lng=${lng}&username=${username}&maxRows=${numResults}&radius=50`

  return client.get(url)
    .then(res => tPromise.decode(WeatherResult, res.data))
    .then(data => data.weatherObservations.map((item) => {
      return {
        ...item,
        lat: item.lat,
        lng: item.lng,
        distance: distance(lat, lng, item.lat, item.lng, 'K')
      }
    }))
}

// https://www.geodatasource.com/developers/javascript
function distance (lat1: number, lon1: number, lat2: number, lon2: number, unit: 'K' | 'N' | 'M') {
  if ((lat1 === lat2) && (lon1 === lon2)) {
    return 0
  } else {
    const radlat1 = Math.PI * lat1 / 180
    const radlat2 = Math.PI * lat2 / 180
    const theta = lon1 - lon2
    const radtheta = Math.PI * theta / 180
    let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta)

    if (dist > 1) {
      dist = 1
    }
    dist = Math.acos(dist)
    dist = dist * 180 / Math.PI
    dist = dist * 60 * 1.1515
    if (unit === 'K') {
      dist = dist * 1.609344
    }
    if (unit === 'N') {
      dist = dist * 0.8684
    }

    return dist
  }
}
