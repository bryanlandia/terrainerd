"""
Build JSON file of lat/lon locations within a continent.  We do this
because we must step through lat/lon points and make sure they fall within
the land-mass of the selected continent
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


# arguments will be zoom level, data file, output directory, api key, map type

# parse xml of boundary coordinates
# figure out size and latlngs based on boundaries and zoom level

class CommandError(Exception):
    pass


parser = optparse.OptionParser(usage='%prog -d <data file path> -j <JSON output directory path> ]')
parser.add_option('-d', '--data', 
                  action="store", dest="datafile", 
                  help="path to an ESRI .shp input file for lat/lng area boundaries.")
parser.add_option('-j', '--jsonout', action="store", 
                  dest="json_out", default=None,
                  help="directory path where to save successful lat/lngs in JSON format")
parser.add_option('-c', '--continent', 
                  action="store", dest="continent", 
                  default="south america",
                  help="Which continent to explore (lower case): europe, north america, south america, australia, asia, antarctica")
parser.add_option('-p', '--step', 
                  action="store", dest="step", 
                  default="0.1",
                  help="Lat/Lng step when finding water images")

def get_locations(options):
    """ 
    return a list of lat/lng tuples for map requests based on boundary points from XML datafile,
    the zoom level, and map tile size desired
    """

    # we want to get a list of every point for which to query map APIs
    # so this will be a large set of points which must all be contained inside the
    # shape of the state
    with fiona.open(options.datafile) as collection:
        # In this case, we'll assume the shapefile only has one record/layer (e.g., the shapefile
        # is just for the borders of a single country, etc.).
        rec = collection.next()
        # import pdb; pdb.set_trace()
        while rec['properties']['CONTINENT'].lower() != options.continent.lower():
            rec = collection.next()


    shape = geometry.asShape( rec['geometry'])
    (minx, miny, maxx, maxy) = shape.bounds
    x = minx 
    y = miny
    locations = []
    # step should be determined by zoom level and tile size
    step = float(options.step)
    
    # we will use a bigger step until we find a match
    big_step = step * 5  # use this until the first match
    
    while y < maxy:
        found_x_match = False
        while x < maxx:
            p = geometry.Point(x,y)
            print "trying point at:x{},y{}".format(p.x, p.y)
            if shape.contains(p):
                locations.append({'lat':y, 'lng':x})
                found_x_match = True
            x += found_x_match and step or big_step
        x = minx
        y += found_x_match and step or big_step
    print len(locations)

    json_out_fn = "locs_{}_step_{}.json".format(options.continent.lower(), options.step)
    json_out_path = os.path.join(options.json_out, json_out_fn)

    with open(json_out_path, 'w+') as locsfile:
        locs_dict = dict(continent=options.continent, step=options.step, locations=locations)
        locsfile.write(json.dumps(locs_dict))

    return locations


if __name__ == '__main__':
    options, args =  parser.parse_args()

    if not options.datafile:
        raise CommandError("Error: you must specify a shapefile.\n\nUsage:{}".format(parser.print_help()))

    if options.datafile and not os.path.exists(options.datafile):

        raise CommandError("Error: data file does not exist.\n\nUsage:{}".format(parser.print_help()))

    if not options.json_out:
        raise CommandError("Error: you must specify a JSON file to save locations.\n\nUsage:{}".format(parser.print_help()))

    if options.json_out and not os.path.exists(options.json_out):
        raise CommandError("Error: Directory for JSON out files does not exist.\n\nUsage:{}".format(parser.print_help()))

    # parse the data file for lat/lngs
    locations = get_locations(options)
    
