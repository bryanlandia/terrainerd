import urllib, urllib2
import json
import numpy as np
from PIL import Image
from math import ceil

ELEVATION_API = 'https://maps.googleapis.com/maps/api/elevation/json?%s'
API_KEY = 'AIzaSyCDjX6XIv-VYdbkTY2vrBTGcPPR0nw-sNU'
NUM_PER_REQUEST = 256

def lerpLatLng(pt1, pt2, t):
	return {
		'lat': (pt2['lat'] - pt1['lat']) * t + pt1['lat'],
		'lng': (pt2['lng'] - pt1['lng']) * t + pt1['lng']
	}

def latLngToString(latLng):
	return '%f,%f' % (latLng['lat'], latLng['lng'])

def createLatLngGrid(rect, resolution):

	locations = []

	for y in xrange(resolution ):
		for x in xrange(resolution):
			tx = (x + .5) / resolution
			ty = (y + .5) / resolution

			t = lerpLatLng(rect['tl'], rect['tr'], tx)
			b = lerpLatLng(rect['bl'], rect['br'], tx)

			latLng = lerpLatLng(t, b, ty)
			locations.append(latLngToString(latLng))

	return locations

def generateHeightmap(rect, resolution):

	locations = createLatLngGrid(rect, resolution)

	reqestNum = int(ceil(len(locations) / NUM_PER_REQUEST))

	elevations = []

	for i in xrange(reqestNum):

		print 'Downloading... (%d/%d)' % (i, reqestNum)

		lfrom = i * NUM_PER_REQUEST
		lto   = (i+1) * NUM_PER_REQUEST

		params = {
			'key': API_KEY,
			'locations': '|'.join(locations[lfrom:lto])
		}
		url = ELEVATION_API % urllib.urlencode(params)

		responce = json.load(urllib2.urlopen(url))

		if responce['status'] == 'OK': 
			results = responce['results']
			elevations += [pt['elevation'] for pt in results]


		else:
			return None

	elevations = np.array(elevations)

	elevations = elevations.reshape((resolution, resolution))

	minElevation = elevations.min()
	maxElevation = elevations.max()
	elevationDiff = maxElevation - minElevation

	normalized = (elevations - minElevation) / elevationDiff

	image = Image.fromarray(np.uint8(normalized * 255))

	print 'Finished. (min: %f, max: %f, diff: %f)' % (minElevation, maxElevation, elevationDiff)

	return {
		'image': image,
		'min': minElevation,
		'max': maxElevation,
		'diff': elevationDiff
	}
