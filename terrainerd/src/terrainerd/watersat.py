"""
Poll Google Static Maps API for a series of coordinates and test for presence 
of pixels with water color. 
"""
import os
import optparse
from io import BytesIO
import json
import subprocess

import motionless
import fiona
from shapely import geometry
import pycurl
from PIL import Image
from landsat import search
import requests


GOOGLE_WATER_RGB_COLOR = (255,255,0)

# arguments will be zoom level, data file, output directory, api key, map type

# boundary coordinates
# zoom level
# map size

# parse xml of boundary coordinates
# figure out size and latlngs based on boundaries and zoom level
# go through and make requests for every tile
# test each tile for water color
# if the color is present, ...
# remake the request to LandSat haha!

# give a progress indicator


class CommandError(Exception):
	pass


searcher = search.Search()


parser = optparse.OptionParser(usage='%prog [options] -k <API key>  -d <data path> [-z <zoom> -o <output file> -m <map type>]')
parser.add_option('-z', '--zoom', 
	              action="store", dest="zoom", 
	              type="choice", default="17",
	              choices=[str(x) for x in range(1,18)],
	              help="Google Maps Zoom Level 1-18")
parser.add_option('-d', '--data', 
	              action="store", dest="datafile", 
	              help="path to an ESRI .shp input file for lat/lng area boundaries.")
parser.add_option('-o', '--out', action="store", 
	              dest="out_dir", default="out",
	              help="path to a folder where to store successful water images")
parser.add_option('-j', '--jsonout', action="store", 
	              dest="json_out", default=None,
	              help="path where to save successful lat/lngs in JSON format")
parser.add_option('-k', '--apikey', 
	              action="store", dest="key",
	     		  help="your Google Maps API key")
parser.add_option('-m', '--maptype', action="store", 
	              dest="maptype", default="terrain",
	              type="choice", choices=("terrain", "streetmap", "satellite", "hybrid"),
	              help="Google map type: 'terrain', 'streetmap', 'satellite', or 'hybrid'. defaults to 'terrain' ")
parser.add_option('-l', '--locations', 
	              action="store", dest="locations", 
	              help="path to an JSON file of point lat,lng pairs to use instead of searching in shapefile")



def get_locations(options):
	""" 
	return a list of lat/lng tuples for map requests based on boundary points from XML datafile,
	the zoom level, and map tile size desired
	"""

	# we want to get a list of every point for which to query Static Maps API
	# so this will be a large set of points which must all be contained inside the
	# shape of the state
	if options.locations:
		# use the locations file
		with open(options.locations, 'r') as locsfile:
			locations = json.load(locsfile)

		return locations

	with fiona.open(options.datatfile) as collection:
	    # In this case, we'll assume the shapefile only has one record/layer (e.g., the shapefile
	    # is just for the borders of a single country, etc.).
	    rec = collection.next()
	    # import pdb; pdb.set_trace()
	    while rec['properties']['CONTINENT'] != 'South America':
	    	rec = collection.next()


	shape = geometry.asShape( rec['geometry'])
	(minx, miny, maxx, maxy) = shape.bounds
	x = minx 
	y = miny
	locations = []
	# step should be determined by zoom level and tile size
	step =  1  # dummy
	while y < maxy:
		while x < maxx:
			p = geometry.Point(x,y)
			print "trying point at:x{},y{}".format(p.x, p.y)
			if shape.contains(p):
				locations.append({'lat':y, 'lng':x})
			x += step
		x = minx
		y+= step
	print len(locations)
	return locations


def get_loc_landsat_images(point, outpath):
	"""
	"""
	# this should be done with landsat-util py classes/methods instead
	# of via command line, but for now...

	# subprocess landsat-util
	# subprocess.call(["landsat", "search", "--lat", str(point['lat']), "--lon", str(point['lng']), "-l", "1", "--start", "2016-01-01"])
	resp = searcher.search(paths_rows=None, lat=point['lat'], lon=point['lng'], start_date="2016-01-01", end_date=None, cloud_min=None, cloud_max=20.0, limit=10)
	lres = resp.get('results', [])
	for res in lres:
		url = res['thumbnail']
		fn = url.split("/").pop()
		r = requests.get(url, stream=True)		
		path = "img/orig/{}".format(fn)
        filepath = "{}/{}".format(outpath, fn)
        with open(filepath, 'wb') as f:
            for chunk in r:
                f.write(chunk)


def get_gmaps(locations, options):

	for point in locations:
		gmap = motionless.CenterMap(lat=point['lat'], lon=point['lng'], 
			                        zoom=int(options.zoom), size_x=100, size_y=100, 
			                        maptype=options.maptype, scale=1, key=options.key)
		# url = gmap.generate_url() + "&style=feature:all|element:all|color:0xFFFFFF&style=feature:water|element:all|color:0xFFFF00|weight:4&style=feature:all|element:labels|visibility:off" # "&style=feature:road.highway|element:geometry.fill|color:0xFED930"
		url = gmap.generate_url() + "&style=feature:water|element:all|color:0xFFFF00|weight:4&style=feature:all|element:labels|visibility:off" # "&style=feature:road.highway|element:geometry.fill|color:0xFED930"
		buffer = BytesIO()

		try:
			curl = pycurl.Curl()
			curl.setopt(curl.URL, url)
			curl.setopt(curl.WRITEDATA, buffer)
			curl.perform()
			curl.close()
		except:
			next 

		# look through the Image data for water colored pixels
		img = Image.open(buffer)

		# crop off the bottom 'Google' text
		img = img.crop((0,0,100,85))
		colors_list = img.convert('RGB').getcolors()
		colors = [c[1] for c in colors_list]
		colors_dict = dict([(v,k) for k,v in colors_list])

		if GOOGLE_WATER_RGB_COLOR in colors:
			# we don't want image if it's nearly solid water (i.e, close to 
			# h*w pixel count for the color) or if there is barely any water
			color_count = colors_dict[GOOGLE_WATER_RGB_COLOR]
			if (color_count >= .8 * (gmap.size_x * gmap.size_y)) or (color_count < 100):
				next
			# yay, save the image
			img.save(os.path.join(options.out_dir,'water-{}-{}.png'.format(point['lat'],point['lng'])))
			# and get corresponding landsat thumb(s)
			get_loc_landsat_images(point, options.out_dir+'/landsat')

			if options.json_out:
				with open(options.json_out, 'a+') as jsonf:
					jsonf.write(json.dumps(point))

		buffer.close()
		


if __name__ == '__main__':
	options, args =  parser.parse_args()

	if not options.key:
		raise CommandError("Error: Missing Google Maps API key.\n\nUsage:{}".format(parser.usage))
	if not options.datafile and not options.locations:
		raise CommandError("Error: you must specify a shapefile or a JSON locations file.\n\n{}\\Usage:{}".format(parser.options.datafile.help, parser.usage))


	if options.datafile and not os.path.exists(options.datafile):
		raise CommandError("Error: data file does not exist.\n\n{}\\Usage:{}".format(parser.options.datafile.help, parser.usage))

	if options.locations and not os.path.exists(options.locations):
		raise CommandError("Error: locations file does not exist.\n\n{}\\Usage:{}".format(parser.options.locations.help, parser.usage))

	# parse the data file for lat/lngs
	locations = get_locations(options)
	test_maps = get_gmaps(locations, options)





	