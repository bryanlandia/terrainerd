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


# GOOGLE_WATER_RGB_COLOR = (255,255,0)  # this is not the default color. 
GOOGLE_WATER_RGB_COLOR = (42, 90, 124)  # #2a5a7c
GMAP_STATIC_BRANDING_CROP_PX = 23
MIN_COLOR_MATCH_COUNT_THRESHOLD = 100

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


class ColorNotFound(Exception):
    pass


class NoColorAtEdge(Exception):
    pass


searcher = search.Search()


parser = optparse.OptionParser(usage='%prog [options] -k <API key>  -d <data path> [-z <zoom> -o <output file> -m <map type> -j <JSON output path> -l <locations JSON file instead of shapefile -d datapath> -c <continent to use within shapefile> -p <step: lat/lng decimal to step between queries> -8 <get landsat8 images> ]')
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
parser.add_option('-c', '--continent', 
                  action="store", dest="continent", 
                  default="south america",
                  help="Which continent to explore (lower case): europe, north america, south america, australia, asia, antarctica")
parser.add_option('-p', '--step', 
                  action="store", dest="step", 
                  default="0.1",
                  help="Lat/Lng step when finding water images")
parser.add_option('-s', '--size', 
                  action="store", dest="image_size", 
                  default="100",
                  help="Image size for Google Static map (side of square)")
parser.add_option('-8', '--landsat8', 
                  action="store_true", dest="landsat8", 
                  help="Whether or not to retrieve landsat8 images corresponding to GMap")
parser.add_option('-g', '--gsat', 
                  action="store_true", dest="googlesat", 
                  help="Whether or not to retrieve google satellite images corresponding to GMap")

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
    big_step = 1  # use this until the first match
    
    # we will use a bigger step until we find a match
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
    with open('/opt/sfpc/landsatproj/data/out/europe_locs.json', 'r+') as locsfile:
        locsfile.write(json.dumps(locations))

    return locations


def get_loc_landsat_images(point, outpath):
    """
    """
    # subprocess landsat-util
    # subprocess.call(["landsat", "search", "--lat", str(point['lat']), "--lon", str(point['lng']), "-l", "1", "--start", "2016-01-01"])
    resp = searcher.search(paths_rows=None, lat=point['lat'], lon=point['lng'], start_date="2016-01-01", end_date=None, cloud_min=None, cloud_max=20.0, limit=10)
    lres = resp.get('results', [])
    images_data = []

    for res in lres:
        url = res['thumbnail']
        fn = url.split("/").pop()
        r = requests.get(url, stream=True)      
        path = "img/orig/{}".format(fn)
        try:
            filepath = "{}/{}".format(outpath, fn)
        except UnboundLocalError:
            # import pdb; pdb.set_trace()
            pass
        with open(filepath, 'wb') as f:
            for chunk in r:
                f.write(chunk)
        images_data.append(filepath)
    
    return images_data


def test_edge_pixels(image, color, width, height):
    """
    return (x,y) tuple if color present at at least _two_ edges
    else raise a NoColorAtEdge exception
    """
    # PIL sets 0,0 in upper left
    edge_pixels = dict(top=[(i,0) for i in range(0,width-1)],
                       left=[(0,i) for i in range(0,height-1)],
                       bottom=[(i,height-1) for i in range(0,width-1)],
                       right=[(width-1,i) for i in range(0,height-1)]
                       )

    pixels_matched = {}

    img_pixels = image.load()
    # test each edge for pixel matches
    for edge in edge_pixels.iterkeys():
        for px in edge_pixels[edge]:
            if img_pixels[px] == color:  # this is returning single value via image.load                
                pm = pixels_matched.get(edge, [])
                pm.append(px)
                pixels_matched[edge] = pm

    if len(pixels_matched.keys()) != 2:
        # must have water pixels on two sides, ..
        # for now, we don't want any with more sides than that
        raise NoColorAtEdge
    else:
        return pixels_matched


def get_gmap_static_image(point, options):
    
    size = int(options.image_size)
    gmap = motionless.CenterMap(lat=point['lat'], lon=point['lng'], 
                                        zoom=int(options.zoom), size_x=size, size_y=size, 
                                        maptype=options.maptype, scale=1, key=options.key)
    # url = gmap.generate_url() + "&style=feature:all|element:all|color:0xFFFFFF&style=feature:water|element:all|color:0x2a5a7c|weight:4&style=feature:all|element:labels|visibility:off" # "&style=feature:road.highway|element:geometry.fill|color:0xFED930"
    url = gmap.generate_url() + "&style=feature:water|element:all|color:0x2a5a7c|weight:4" # "&style=feature:road.highway|element:geometry.fill|color:0xFED930"
    buffer = BytesIO()

    try:
        curl = pycurl.Curl()
        curl.setopt(curl.URL, url)
        curl.setopt(curl.WRITEDATA, buffer)
        curl.perform()
        curl.close()
    except:
        raise  

    return buffer


def get_loc_gmapsat_images(point, options):
    size = int(options.image_size)
    gmap = motionless.CenterMap(lat=point['lat'], lon=point['lng'], 
                                        zoom=int(options.zoom), size_x=size, size_y=size, 
                                        maptype="hybrid", scale=1, key=options.key)
    url = gmap.generate_url()
    buffer = BytesIO()

    try:
        curl = pycurl.Curl()
        curl.setopt(curl.URL, url)
        curl.setopt(curl.WRITEDATA, buffer)
        curl.perform()
        curl.close()
    except:
        raise  

    return buffer

def crop_gmap_image(img, options):
    """
    takes a PIL Image object and returns it 
    cropped to remove Google branding :P
    and the new cropped size as a tuple
    """
    size = int(options.image_size)
    cropped_size = size - GMAP_STATIC_BRANDING_CROP_PX
    img = img.crop((0,0,cropped_size,cropped_size))  # maintain a square
    return img, cropped_size


def process_gmap_image(img, point, options, test_colors=False):
    # look through the Image data for water colored pixels
    # crop off the bottom 'Google' text
    size = int(options.image_size)
    img, cropped_size = crop_gmap_image(img, options)

    if not test_colors:  # this is for satellite secondary image
        fpath = os.path.join(options.out_dir,'gsat', 'water-sat-{}-{}.png'.format(point['lat'],point['lng']))
        img.save(fpath)
        print "Wrote satellite image from Google Static Maps API for point {}\n".format(point)
        return fpath
    else:    
        
        img = img.convert('RGB')
        colors_list = img.getcolors()
        colors = [c[1] for c in colors_list]
        colors_dict = dict([(v,k) for k,v in colors_list])

        if GOOGLE_WATER_RGB_COLOR in colors:
            # we don't want image if it's nearly solid water (i.e, close to 
            # h*w pixel count for the color) or if there is barely any water
            color_count = colors_dict[GOOGLE_WATER_RGB_COLOR]
            # there's something strange here.  ...
            # if you do: reduce(lambda x,y: x+y, [val for key, val in colors_dict.iteritems()]),
            # you don't get the value of size * size which I think you should
            if (color_count >= .4 * (size * size)) or (color_count < MIN_COLOR_MATCH_COUNT_THRESHOLD):
                raise ColorNotFound
            try:
                # import pdb; pdb.set_trace()
                edge_color_points = test_edge_pixels(img, GOOGLE_WATER_RGB_COLOR, width=cropped_size, height=cropped_size)
                
                # yay, save the image
                fpath = os.path.join(options.out_dir,'water-{}-{}.png'.format(point['lat'],point['lng']))
                img.save(fpath)
                print "Wrote image from Google Static Maps API for point {}\n".format(point)

                return fpath, edge_color_points
            except NoColorAtEdge:
                raise 
        
        else:    
            raise ColorNotFound


def get_images(locations, options):

    size = int(options.image_size)
    images_data = []
    

    for point in locations:
        try:
            img_buffer = get_gmap_static_image(point, options)
            img = Image.open(img_buffer)
            img_filepath, edge_color_points = process_gmap_image(img, point, options, test_colors=True)
            img_buffer.close()
            img_data = dict(lat=point['lat'], lon=point['lng'],
                            gmapstatic=img_filepath,
                            gmap_edge_pixel_matches=edge_color_points)

            # record a successful point 
            # and get corresponding gmap satellite and/or landsat thumb(s)
            if options.googlesat:
                img_buffer = get_loc_gmapsat_images(point, options)
                img = Image.open(img_buffer)
                gmap_sat_image = process_gmap_image(img, point, options)
                img_buffer.close()
                img_data['gmapsat_image'] = gmap_sat_image

            if options.landsat8:
                landsats_data = get_loc_landsat_images(point, options.out_dir+'/landsat')
                img_data['landsat_images'] = landsats_data

            if options.json_out:
                with open(options.json_out, 'a+') as jsonf:
                    jsonf.write(json.dumps(img_data))            

        except (ColorNotFound, NoColorAtEdge, TypeError):
            print "Didn't find water match for point {}\n".format(point)        


if __name__ == '__main__':
    options, args =  parser.parse_args()

    if not options.key:
        raise CommandError("Error: Missing Google Maps API key.\n\nUsage:{}".format(parser.usage))
    if not options.datafile and not options.locations:
        raise CommandError("Error: you must specify a shapefile or a JSON locations file.\n\nUsage:{}".format(parser.print_help()))


    if options.datafile and not os.path.exists(options.datafile):

        raise CommandError("Error: data file does not exist.\n\nUsage:{}".format(parser.print_help()))

    if options.locations and not os.path.exists(options.locations):
        raise CommandError("Error: locations file does not exist.\n\nUsage:{}".format(parser.print_help()))

    # parse the data file for lat/lngs
    locations = get_locations(options)
    test_maps = get_images(locations, options)





    