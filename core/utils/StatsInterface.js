const { Canvas } = require(`canvas-constructor`) 
const { resolve, join } = require(`path`)
const { get } = require(`snekfetch`)
const Color = require(`color`)
const imageUrlRegex = /\?size=2048$/g
const Card = require(`./UILibrary/Cards`)
const Typography = require(`./UILibrary/Typography`)

Canvas.registerFont(resolve(join(__dirname, `../fonts/Roboto.ttf`)), `Roboto`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/roboto-medium.ttf`)), `RobotoMedium`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/roboto-bold.ttf`)), `RobotoBold`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/roboto-thin.ttf`)), `RobotoThin`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/Whitney.otf`)), `Whitney`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/KosugiMaru.ttf`)), `KosugiMaru`)

//	Pistachio stacks from module/stats.js
class StatsInterface {
	constructor(Stacks) {
		this.card = new Card({color:`lightgray`})
	}


	render() {

		let data = new Typography(this.card.base, `nightmode`).addTitle(`Add Title`)

		return data.card.toBuffer()
	}

}

module.exports = StatsInterface