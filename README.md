## Installation

* Make a virtualenv inside the project
* `$ source env/bin/activate`
* Make sure you have a recent pip version if you are using Mac OS X El Capitan and later or `cryptography` package won't install correctly
  * `pip install -U upgrade pip`
* `pip install -r requirements/base.txt`

## Google EarthEngine

* Set up Google EarthEngine access
* `python -c "import ee;  ee.Initialize()"`
* `earthengine authenticate`
* Authenticate to Google with your Google account
* Enter your token at the prompt in your terminal.  This will save your credentials to `$HOME/.config/earthengine/credentials`
* test authentication is working:

`python`

```
# Import the Earth Engine Python Package
import ee

# Initialize the Earth Engine object, using the authentication credentials.
ee.Initialize()

# Print the information for an image asset.
image = ee.Image('srtm90_v4')
print(image.getInfo())
```

## Google Map > Landsat tool

For example:
```
python watersat.py -l /path/to/project/dir/data/in/southamerica1x1.json -j /path/to/project/dir/data/in/southamerica_water.json -o /path/to/project/dir/data/out/static -k `cat ~/.config/googlestaticmapsapi/credentials`
```

Also, see python `watersat.py -h` for options.  At present,

```
python watersat.py -h
Usage: watersat.py [options] -k <API key>  -d <data path> [-z <zoom> -o <output file> -m <map type>]

Options:
  -h, --help            show this help message and exit
  -z ZOOM, --zoom=ZOOM  Google Maps Zoom Level 1-18
  -d DATAFILE, --data=DATAFILE
                        path to an ESRI .shp input file for lat/lng area
                        boundaries.
  -o OUT_DIR, --out=OUT_DIR
                        path to a folder where to store successful water
                        images
  -j JSON_OUT, --jsonout=JSON_OUT
                        path where to save successful lat/lngs in JSON format
  -k KEY, --apikey=KEY  your Google Maps API key
  -m MAPTYPE, --maptype=MAPTYPE
                        Google map type: 'terrain', 'streetmap', 'satellite',
                        or 'hybrid'. defaults to 'terrain'
  -l LOCATIONS, --locations=LOCATIONS
                        path to an JSON file of point lat,lng pairs to use
                        instead of searching in shapefile
  -c CONTINENT, --continent=CONTINENT
                        Which continent to explore (lower case): europe, north
                        america, south america, australia, asia, antarctica
```