<template lang="pug">
  v-app
    v-content
      v-container(fluid)
        v-app-bar
          //- FIXME autocomplete showing results for null on 1st use
          v-autocomplete(
            label="Location name"
            name="location"
            prepend-icon="map"
            type="text"
            v-model="searchModel.selected"
            :items="searchModel.items"
            :loading="searchModel.loading"
            :search-input.sync="searchModel.searchInput"
            hide-no-data
            clearable
            return-object
          )
        v-container(class="red lighten-5" fluid v-if="searchModel.error || state.error")
          v-row
            v-col(
              cols="12"
            ) {{ searchModel.error || state.error }}

        v-container(class="grey lighten-5" fluid v-if="state.coordinates")
          v-row
            v-col(
              cols="12"
              sm="8"
            )
              //- FIXME Map covering autocomplete search
              div(id="map-wrap" style="height: 80vh; z-index: 0; position: relative;")
                client-only
                  //- TODO: make zoom dynamic. Calculate the bounding box for all markers
                  l-map(:zoom=7 :center="[state.coordinates.lat,state.coordinates.lng]")
                    l-tile-layer( url="http://{s}.tile.osm.org/{z}/{x}/{y}.png")
                    l-marker(
                      v-for="(item, index) in state.searchResults"
                      :name="item.name"
                      :key="`${item.lat},${item.lng}`"
                      :lat-lng="[item.lat,item.lng]"
                    )

            v-col(
              cols="12"
              sm="4"
            )
              v-expansion-panels
                v-expansion-panel(v-for="(item, index) in state.searchResults" :key="`${item.lat},${item.lng}`")
                  v-expansion-panel-header {{ item.stationName }}
                  v-expansion-panel-content
                    div(v-if="index !== 0")
                      strong Distance: &nbsp;
                      | {{ item.distance | readableInt }} Km
                    div
                      strong Temperature (C): &nbsp;
                      | {{ item.temperature }}

        v-container(class="grey lighten-5" fluid v-else)
          v-row
            v-col(
              cols="12"
            ) Search a location by name
</template>

<script lang="ts">
import { Context } from '@nuxt/types'
import { Vue, Component, Watch } from 'vue-property-decorator'
import * as pathToRegexp from 'path-to-regexp'
import debounce from 'debounce'
import { Unpacked } from '~/types/type-utils'
import * as geoApi from '~/plugins/api_client/geo'

interface Coordinates {
  lat: number;
  lng: number;
}
interface SearchSelected{
  text: string;
  value: Coordinates;
}
interface SearchModel {
  items: SearchSelected[];
  loading: boolean;
  searchInput: string;
  selected: string[];
  error: string;
}

const getCoordinates = (path: string) => {
  if (!path) {
    return
  }

  const re = pathToRegexp.match<{ lat: string; lng: string }>(
    'location/:lat/:lng'
  )
  const match = re(path)
  if (match) {
    return {
      lat: parseFloat(match.params.lat),
      lng: parseFloat(match.params.lng)
    }
  }
}

const asyncData = async (context: Context) => {
  const path = context.params.pathMatch
  const coordinates = getCoordinates(path)
  const isHomePage = !path || path === context.base

  const state = {
    coordinates,
    searchResults: [],
    error: ''
  }

  if (!isHomePage && !coordinates) {
    context.error({ statusCode: 404, message: 'Page not found' })
  }

  if (isHomePage) {
    return { state }
  }

  try {
    return {
      state: {
        ...state,
        searchResults: await geoApi.findNearestCities(coordinates!.lat, coordinates!.lng)
      }
    }
  } catch (_) {
    return {
      state: {
        ...state,
        error: 'Unable to get nearby cities'
      }
    }
  }
}

type State = Unpacked<Unpacked<typeof asyncData>>['state'];

@Component({
  asyncData,
  components: {}
})
export default class extends Vue {
  state: State;

  searchModel: SearchModel = {
    items: [],
    loading: false,
    searchInput: '',
    selected: [],
    error: ''
  };

  searchLocation = debounce((name: string) => {
    if (!name) {
      return
    }

    this.searchModel.loading = true

    geoApi.search(name)
      .then((data) => {
        this.searchModel.items = data.map(item => ({
          text: `(${item.countryCode}) ${item.toponymName}`,
          value: { lat: item.lat, lng: item.lng }
        }))
        this.searchModel.error = ''
      })
      .catch(() => {
        this.searchModel.error = 'Unable to search location by name'
        // TODO catch and log original error
      })
      .finally(() => {
        this.searchModel.loading = false
      })
  }, 200);

  @Watch('searchModel.searchInput')
  searchHandler (val: string) {
    this.searchLocation(val)
  }

  @Watch('searchModel.selected')
  async searchSelectedHandler (e: SearchSelected) {
    const coordinates = e.value

    try {
      this.state = {
        ...this.state,
        coordinates,
        error: '',
        searchResults: await geoApi.findNearestCities(coordinates.lat, coordinates.lng)
      }
    } catch (_) {
      this.state = {
        ...this.state,
        error: 'Unable to get nearby cities'
      }
    }

    // TODO: replaceState in url => /location/:lat/:lng
  }
}
</script>
