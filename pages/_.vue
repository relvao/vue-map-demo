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
        v-container(class="red lighten-5" fluid v-if="searchModel.error")
          v-row
            v-col(
              cols="12"
            ) {{ searchModel.error }}

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
                  l-map(:zoom=13 :center="[state.coordinates.lat,state.coordinates.lng]")
                    l-tile-layer( url="http://{s}.tile.osm.org/{z}/{x}/{y}.png")
                    l-marker(:lat-lng="[55.9464418,8.1277591]")
                    l-marker(:lat-lng="[55.95,8.13]")
                    l-marker(:lat-lng="[55.93,8.11]")

            v-col(
              cols="12"
              sm="4"
            )
              v-expansion-panels
                v-expansion-panel()
                  v-expansion-panel-header Main City
                  v-expansion-panel-content
                    | name, current temp, population, distance
                v-expansion-panel
                  v-expansion-panel-header Closest City 1
                  v-expansion-panel-content
                    | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                v-expansion-panel
                  v-expansion-panel-header Closest City 2
                  v-expansion-panel-content
                    | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                v-expansion-panel
                  v-expansion-panel-header Closest City 3
                  v-expansion-panel-content
                    | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                v-expansion-panel
                  v-expansion-panel-header Closest City 4
                  v-expansion-panel-content
                    | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

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

const asyncData = (context: Context) => {
  const path = context.params.pathMatch
  const coordinates = getCoordinates(path)
  const isHomePage = !path || path === context.base

  const state = {
    state: {
      coordinates,
      searchResults: [],
      error: ''
    }
  }

  if (!isHomePage && !coordinates) {
    context.error({ statusCode: 404, message: 'Page not found' })
  }

  if (isHomePage) {
    return state
  }

  // TODO get data for coordinates
  return state
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
  searchSelectedHandler (e: SearchSelected) {
    const coordinates = e.value

    this.state = {
      ...this.state,
      coordinates
    }

    // TODO: replaceState in url => /location/:lat/:lng
  }
}
</script>
