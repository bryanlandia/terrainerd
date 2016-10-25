"""
Poll Google Static Maps API for a series of coordinates and test for presence 
of pixels with water color. 
"""
import os
import optparse
from io import BytesIO

import motionless
import fiona
from shapely import geometry
import pycurl
from PIL import Image


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
	              help="path to a file where to store successful water images")
parser.add_option('-k', '--apikey', 
	              action="store", dest="key",
	     		  help="your Google Maps API key")
parser.add_option('-m', '--maptype', action="store", 
	              dest="maptype", default="terrain",
	              type="choice", choices=("terrain", "streetmap", "satellite", "hybrid"),
	              help="Google map type: 'terrain', 'streetmap', 'satellite', or 'hybrid'. defaults to 'terrain' ")


def get_locations(datapath):
	""" 
	return a list of lat/lng tuples for map requests based on boundary points from XML datafile,
	the zoom level, and map tile size desired
	"""

	# we want to get a list of every point for which to query Static Maps API
	# so this will be a large set of points which must all be contained inside the
	# shape of the state
	with fiona.open(datapath) as collection:
	    # In this case, we'll assume the shapefile only has one record/layer (e.g., the shapefile
	    # is just for the borders of a single country, etc.).
	    rec = collection.next()
	    while rec['properties']['STATE_ABBR'] != 'WA':
	    	rec = collection.next()


	shape = geometry.asShape( rec['geometry'])
	(minx, miny, maxx, maxy) = shape.bounds
	x = minx 
	y = miny
	locations = []
	# step should be determined by zoom level and tile size
	step =  0.05  # dummy
	while y < maxy:
		while x < maxx:
			p = geometry.Point(x,y)
			if shape.contains(p):
				locations.append({'lat':y, 'lng':x})
			x += step
		x = minx
		y+= step
	print len(locations)
	return locations

def get_gmaps(locations, options):

	for point in locations:
		gmap = motionless.CenterMap(lat=point['lat'], lon=point['lng'], 
			                        zoom=int(options.zoom), size_x=100, size_y=100, 
			                        maptype=options.maptype, scale=1, key=options.key)
		url = gmap.generate_url() + "&style=feature:all|element:all|color:0xFFFFFF&style=feature:water|element:all|color:0xFFFF00|weight:4&style=feature:all|element:labels|visibility:off" # "&style=feature:road.highway|element:geometry.fill|color:0xFED930"
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

		buffer.close()
		


if __name__ == '__main__':
	options, args =  parser.parse_args()
	if not options.key:
		raise CommandError("Error: Missing Google Maps API key.\n\nUsage:{}".format(parser.usage))
	if not options.datafile:
		raise CommandError("Error: data file does not exist.\n\n{}\\Usage:{}".format(parser.options.datafile.help, parser.usage))

	if not os.path.exists(options.datafile):
		raise CommandError("Error: data file does not exist.\n\n{}\\Usage:{}".format(parser.options.datafile.help, parser.usage))

	# parse the data file for lat/lngs
	locations = get_locations(options.datafile)
	test_maps = get_gmaps(locations, options)





	