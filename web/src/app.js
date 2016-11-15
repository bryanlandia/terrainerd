import VirtualScroll from 'virtual-scroll'

import Canvas from './canvas'

export default class App {

	constructor() {
		this.virtualScroll = new VirtualScroll()

		this.canvas = new Canvas()
		this.virtualScroll.on(this.canvas.onScroll)

		$(window).on('scroll', (e) => {
			e.preventDefault()
		})

		window.addEventListener('scroll', preventMotion, false)
		window.addEventListener('touchmove', preventMotion, false)

		function preventMotion(event)
		{
			window.scrollTo(0, 0)
			event.preventDefault()
			event.stopPropagation()
		}


	}
}
