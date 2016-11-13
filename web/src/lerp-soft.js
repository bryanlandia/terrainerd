export default class LerpSoft {

	constructor(initValue, params = {}) {

		this.coeff = params.coeff || .5
		this.max = params.max
		this.min = params.min

		this.value = initValue
		this.target = initValue
	}

	setTarget(target) {
		if (target > this.max) {
			this.target = this.max
		} else if (target < this.min) {
			this.target = this.min
		} else {
			this.target = target
		}
	}

	offsetTarget(delta) {
		this.setTarget(this.target + delta)
	}

	update() {
		this.value += (this.target - this.value) * this.coeff
	}

}
