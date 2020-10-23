const Canvas = require(`../setup`)
const loadAsset = require((`../../utils/loadAsset`))
const palette = require(`../colors/default`)
const { resolveImage } = require(`canvas-constructor`)

class UI {
	/**
	 * Welcomer UI Builder.
	 * to access the buffer, please call `.toBuffer()` after running `this.build()`
	 * @param {guildMember} [member] member object.
	 * @param {client} [bot] current client instance.
	 * @return {Canvas}
	 */
	constructor(member, bot){
		this.bot = bot
		this.member = member
	}

	async build() {
		const user = this.bot.users.cache.get(this.member.id)
		const avatar = await resolveImage(user.displayAvatarURL({format: `png`, dynamic: false}))

		let canvas_x = 800
		let canvas_y = 250
		let start_x = 30
		let start_y = 30

		let canv = new Canvas(800, 250)

		canv.save()
		canv.save()
			.createRoundedClip(start_x, start_y, canvas_x - 50, canvas_y - 50, 500)
			.printImage(await resolveImage(await loadAsset(`welcomer`)), 0, 0, 800, 300)//, 400)
		canv.context.globalAlpha = 0.8
		canv.setColor(palette.white)
			.printRectangle(start_x, start_y, canvas_x - 40, canvas_y - 40)
			.restore()

			.setTextAlign(`left`)
			.setTextFont(`41pt roboto-bold`)
			.setColor(palette.nightmode)
			.printText(`${user.username.length >= 10 ? user.username.substring(0, 10)+`..` : user.username+`!`}`, 320, 150) //102
		
			.setTextFont(`42pt roboto`)
			.printText(`Hi,`, 240, 150)

			.setColor(palette.white)
			.printCircularImage(avatar, 120, 130, 100)

		return canv.toBuffer()
	}

}


module.exports = UI