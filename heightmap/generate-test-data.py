import json
from heightmap import generateHeightmap



def main():

	with open('../web/public/test/data.json') as f:
		data = json.load(f)

	terrains = data['terrains']

	heightData = []

	for i, terrain in enumerate(terrains):

		ne = terrain['meta']['ne']
		sw = terrain['meta']['sw']

		rect = {
			'tl': {'lat': ne['lat'], 'lng': sw['lng']},
			'tr': {'lat': ne['lat'], 'lng': ne['lng']},
			'bl': {'lat': sw['lat'], 'lng': sw['lng']},
			'br': {'lat': sw['lat'], 'lng': ne['lng']}
		}

		result = generateHeightmap(rect, 128)

		data['terrains'][i]['meta']['elevation_min'] = result['min']
		data['terrains'][i]['meta']['elevation_max'] = result['max']
		data['terrains'][i]['meta']['elevation_diff'] = result['diff']

		if result == None:
			print 'ERROR'
		else:
			result['image'].save('./out/height_%04d.png' % i)

	with open('./data.json', 'w') as f:
		json.dump(data, f)


main()