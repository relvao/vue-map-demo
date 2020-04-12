import * as t from 'io-ts'
import * as tPromise from 'io-ts-promise';
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
  const username = process.env.apiUsername;
  const url = `http://api.geonames.org/searchJSON?name=${name}&lang=en&username=${username}&style=short&maxRows=${numResults}`
  
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

export function findNearestCities (name: string, maxItems: number) {
  // https://www.geonames.org/export/web-services.html#findNearby
  return name + maxItems
}
