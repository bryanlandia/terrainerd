import MobileDetect from 'mobile-detect'

let md = new MobileDetect(window.navigator.userAgent)

window.Config = {

	// terrain
	TERRAIN_STEP : 30,
	TERRAIN_WIDTH: 50,
	TERRAIN_SEGMENTS: 64,
	TERRAIN_PER_LOAD: 32,
	ELEVATION_AMP: 5,

	// waterfall
	WATERFALL_DEPTH: 4,

	// environment
	BG: 0xe4e3d4,
	SCROLL_SPEED: md.mobile() ? .1 : .05
}
