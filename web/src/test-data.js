/* global google */
import store from 'store'

const API_KEY = 'AIzaSyCDjX6XIv-VYdbkTY2vrBTGcPPR0nw-sNU'
const STATIC_API = 'https://maps.googleapis.com/maps/api/staticmap?'
let MAP_STYLE = 'style=element:labels%7Cvisibility:off&style=feature:administrative%7Celement:geometry%7Cvisibility:off&style=feature:administrative.land_parcel%7Cvisibility:off&style=feature:administrative.neighborhood%7Cvisibility:off&style=feature:landscape%7Celement:geometry%7Ccolor:0xffffff&style=feature:poi%7Cvisibility:off&style=feature:road%7Cvisibility:off&style=feature:road%7Celement:labels.icon%7Cvisibility:off&style=feature:transit%7Cvisibility:off&style=feature:water%7Celement:geometry%7Ccolor:0x000000'

function pad(val) {
	return ('0000' + val).substr(-4)
}

class App {

	constructor() {

		this.dataList = store.get('dataList') || []

		window.initMap = this.initMap.bind(this)

		$('.generate').on('click', this.getMapInfo.bind(this))
		$('.export').on('click', this.displayData.bind(this))
		$('.export-clear').on('click', () => {
			store.clear()
			this.dataList = []
			this.displayData()
		})

		$('.search').on('click', () => {
			let url = $('.url').val()

			console.log(url)

			let match = url.match(/maps\/@([-0-9.]+),([-0-9.]+),/)
			let lat = match[1]
			let lng = match[2]

			this.map.setCenter(new google.maps.LatLng(lat, lng))
		})

		this.displayData()



	}

	initMap() {
		this.map = new google.maps.Map(document.getElementById('map'), {
			center: {lat: -34.397, lng: 150.644},
			zoom: 8,
			mapTypeId: google.maps.MapTypeId.SATELLITE
		})

		this.geocoder = new google.maps.Geocoder()
	}

	displayData() {
		$('.export-json').html(JSON.stringify(this.dataList))
		$('.export-count').html(this.dataList.length)

		store.set('dataList', this.dataList)
	}

	downloadImage(url, filename) {
		let $a = $(`<a>${filename}</a>`)
			.attr('href', url)
			.attr('download', filename)
			.appendTo('body')

		$a[0].click()
		$a.remove()
	}

	getMapInfo() {

		const bounds = this.map.getBounds()
		const center = this.map.getCenter()
		const lat = center.lat()
		const lng = center.lng()

		this.geocoder.geocode({location: center}, (results, status) => {

			let index = this.dataList.length

			let urlTerrain = STATIC_API + $.param({
				size: '512x536',
				center: `${lat},${lng}`,
				scale: 2,
				zoom: this.map.getZoom(),
				key: API_KEY,
				maptype: 'satellite',
				format: 'jpg'
			})

			let urlWater = STATIC_API + $.param({
				size: '512x536',
				center: `${lat},${lng}`,
				scale: 2,
				zoom: this.map.getZoom(),
				format: 'png',
				maptype: 'roadmap'
			}) + '&' + MAP_STYLE

			let address = 'Unknown Place'
			if (status === google.maps.GeocoderStatus.OK) {
				if (results.length > 2) {
					address = results[1].formatted_address
				} else {
					address = results[0].formatted_address
				}
				console.log(address)
			}

			let width = google.maps.geometry.spherical.computeDistanceBetween(
				bounds.getNorthEast(),
				bounds.getSouthWest()
			) / Math.sqrt(2)

			let data = {
				terrain_image: `/test/images/${pad(index)}_terrain.jpg`,
				river_image: `/test/images/${pad(index)}_terrain.jpg`,
				height_image: `/test/images/${pad(index)}_terrain.jpg`,
				meta: {
					width,
					address,
					center: center.toJSON(),
					northEast: bounds.getNorthEast().toJSON(),
					southWest: bounds.getSouthWest().toJSON()
				}
			}

			this.downloadImage(urlTerrain, `${pad(index)}_terrain.jpg`)
			this.downloadImage(urlWater, `${pad(index)}_water.png`)

			this.dataList.push(data)

			$('.result').append(`
				<li>
					<img src=${urlTerrain}>
					<img src=${urlWater}>
				</li>
			`)

			this.displayData()
		})

	}
}



window.app = new App()
