export function search (name: string) {
  // http://api.geonames.org/searchJSON?name=lisboa&lang=en&username=relvao&style=short&maxRows=10
  return name
}

export function findNearestCities (name: string, maxItems: number) {
  // https://www.geonames.org/export/web-services.html#findNearby
  return name + maxItems
}
