<template lang="pug">
  v-app
    v-content
      v-container(fluid)
        v-autocomplete(
          label="Location name"
          name="location"
          prepend-icon="map"
          type="text"
        )

        div(id="map-wrap" style="height: 90vh" v-if="state.coordinates")
          client-only
            l-map(:zoom=13 :center="[55.9464418,8.1277591]")
              l-tile-layer( url="http://{s}.tile.osm.org/{z}/{x}/{y}.png")
              l-marker(:lat-lng="[55.9464418,8.1277591]")
              l-marker(:lat-lng="[55.95,8.13]")
              l-marker(:lat-lng="[55.93,8.11]")

        div(v-if="state.coordinates")
          | Map page
          div name, current temp, population, distance
</template>

<script lang="ts">
import { Context } from '@nuxt/types'
import { Vue, Component } from 'vue-property-decorator'
import * as pathToRegexp from 'path-to-regexp'
import { Unpacked } from '~/types/type-utils'

const getCoordinates = (path: string) => {
  if (!path) {
    return
  }

  const re = pathToRegexp.match<{lat: string, long: string}>('location/:lat/:long')
  const match = re(path)
  if (match) {
    return match.params
  }
}

const asyncData = (context: Context) => {
  const path = context.params.pathMatch
  const coordinates = getCoordinates(path)
  const isHomePage = !path || path === context.base

  if (!isHomePage && !coordinates) {
    context.error({ statusCode: 404, message: 'Page not found' })
  }

  if (isHomePage) {
    return {
      state: {
        coordinates
      }
    }
  }

  // todo get data for coordinates
  return {
    state: {
      coordinates
    }
  }
}

type State = Unpacked<Unpacked<typeof asyncData>>['state'];

@Component({
  asyncData,
  components: {
  }
})
export default class extends Vue {
  state: State;
}
</script>
