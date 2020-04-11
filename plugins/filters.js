import Vue from 'vue'

/**
 * Attempts to convert input into an integer and then converts it to a readable format.
 * Will return input as-is if it is not a valid number.
 * e.g.
 *  123456789 -> 123,456,789
 *  1000.314 -> 1,000
 *  10.2 -> 10
 *  "hello world" -> "hello world"
 */
Vue.filter('readableInt', (input) => {
  if (isNaN(input) === false) {
    return Math.trunc(input).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
  }
  return input
})
