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

```
# Import the Earth Engine Python Package
import ee

# Initialize the Earth Engine object, using the authentication credentials.
ee.Initialize()

# Print the information for an image asset.
image = ee.Image('srtm90_v4')
print(image.getInfo())
```

