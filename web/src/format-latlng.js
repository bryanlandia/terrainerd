function toDegree(val, plus, minus) {

	let sign = val > 0 ? plus : minus

	val = Math.abs(val)

	let degrees = Math.floor(val)
	let minutes = Math.floor((val - degrees) * 60)
	let seconds = ((val - degrees - minutes / 60) * 60)

	return `${degrees}° ${('00'+minutes).substr(-2)}' ${('00'+seconds).substr(-2)}" ${sign}`
}

export default function formatLatLng(latLng) {
	return `${toDegree(latLng.lat, 'N', 'S')} ${toDegree(latLng.lng, 'W', 'E')}`
}
