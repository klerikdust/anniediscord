const { Canvas } = require(`canvas-constructor`) 
const { resolve, join } = require(`path`)
const { get } = require(`snekfetch`)
const Color = require(`color`)
const imageUrlRegex = /\?size=2048$/g
const moment = require(`moment`)
const profileManager = require(`./profileManager`)
const databaseManager = require(`./databaseManager`)
const formatManager = require(`./formatManager`)
const rankManager = require(`./ranksManager`)
const palette = require(`./colorset`)

Canvas.registerFont(resolve(join(__dirname, `../fonts/Roboto.ttf`)), `Roboto`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/roboto-medium.ttf`)), `RobotoMedium`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/roboto-bold.ttf`)), `RobotoBold`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/roboto-thin.ttf`)), `RobotoThin`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/Whitney.otf`)), `Whitney`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/KosugiMaru.ttf`)), `KosugiMaru`)

async function portfolio(stacks, member) {
	const configProfile = new profileManager()
	const collection = new databaseManager(member.id)
	const configRank = new rankManager(stacks.bot, stacks.message)
    const configFormat = new formatManager(stacks.message)

	/**
     * id = userid, cur = currentexp, max = maxexp,
     * crv = expcurve, lvl = userlevel, ac = userartcoins,
     * rep = userreputation, des = userdescription, ui = userinterfacemode
     * clr = hex code of user's rank color.
     */
	const userdata = await collection.userdata
	const user = {
		id: userdata.userId,
		cur: userdata.currentexp,
		max: userdata.maxexp,
		crv: userdata.nextexpcurve,
		lvl: userdata.level,
		ac: userdata.artcoins,
		rep: userdata.reputations,
		des: userdata.description,
		ui: userdata.interfacemode,
		prt: userdata.partner,
		rtg: userdata.rating,
		likecount: userdata.liked_counts,
		cov: userdata.cover,
		log: userdata.last_login,
		get clr() {
			return this.ui === `light_profileskin` ? (Color(configRank.ranksCheck(this.lvl).color).desaturate(0.2)).hex() :
				this.ui === `dark_profileskin` ? (Color(configRank.ranksCheck(this.lvl).color).desaturate(0.1)).hex() :
					(Color(configRank.ranksCheck(this.lvl).color).desaturate(0.2)).hex()
		},
	}
	const relations = await collection.relationships

	const switchColor = {

		"dark_profileskin": {
			base: palette.nightmode,
			border: palette.deepnight,
			text: palette.white,
			secondaryText: palette.lightgray
		},

		"light_profileskin": {
			base: palette.white,
			border: palette.lightgray,
			text: palette.darkmatte,
			secondaryText: palette.blankgray
		}
	}

	let canvas_x = 320//280
	let canvas_y = 420//380
	let startPos_x = 10
	let startPos_y = 10
	let baseWidth = canvas_x - 20
	let baseHeight = canvas_y - 20

	const {
		body: avatar
	} = await get(member.user.displayAvatarURL.replace(imageUrlRegex, `?size=512`))
	const usercolor = configProfile.checkInterface(user.ui, member)

	let canv = new Canvas(canvas_x, canvas_y) // x y

	/**
	 *    CARD BASE
	 */
	canv = canv.setShadowColor(`rgba(28, 28, 28, 1)`)
		.setShadowOffsetY(5)
		.setShadowBlur(10)
		.setColor(switchColor[usercolor].base)
		.addRect(startPos_x + 7, startPos_y + 7, baseWidth - 14, baseHeight - 14) // (x, y, x2, y2)
		.createBeveledClip(startPos_x, startPos_y, baseWidth, baseHeight, 25)
		.addRect(startPos_x, startPos_y, baseWidth, baseHeight) // (x, y, x2, y2)
		.setShadowBlur(0)
		.setShadowOffsetY(0)
		.save()

	/**
	 *    USER
	 *    AVATAR
	 */
	canv.addRoundImage(avatar, 15, 15, 30, 30, 15)

	/**
	 *    TITLE BAR
	 */
		.setColor(switchColor[usercolor].secondaryText)
		.setTextAlign(`left`)
		.setTextFont(`11pt RobotoBold`)
		.addText(`Relationship`, 55, 35)
		.setColor(switchColor[usercolor].border)
		.addRect(startPos_x, 48, baseWidth, 2) // bottom border

	if (relations.length == 0) {
		return canv.toBuffer()
	}

	//for now we only do the feature for 1 relationship, so take first entry; but database entry is made to be extendable
	const relUser = await stacks.bot.fetchUser(relations[0].userId)
	const {
		body: userAvatar
	} = await get(relUser.displayAvatarURL.replace(imageUrlRegex, `?size=512`))
	const relationship = {
		type: relations[0].theirrelation,
		userId : relations[0].userId,
		userName: relUser.username,
        relStart: relations[0].relationStart,
        relPoints: relations[0].relationPoints,
        gift: relations[0].gift ? relations[0].gift : `None yet :(`

	}


	canv.addRoundImage(userAvatar, 40, 60, 60, 60, 30)
		.setTextAlign(`left`)
		.setTextFont(`18pt RobotoBold`)
		.setColor(user.clr)
		.addText(relationship.userName, 110, 93)
		.setColor(switchColor[usercolor].secondaryText)
		.setTextFont(`8pt RobotoBold`)
		.addText(`My `+relationship.type, 110, 110)
		.setTextAlign(`right`)
		.setTextFont(`10pt RobotoBold`)
		.addText(`In a relation since`, 283, 163)
		.addText(`❤ Love points`, 283, 233)
		.addText(`Recently received gift`, 283, 303)
		.setColor(user.clr)
		.setTextFont(`20pt RobotoBold`)
		.addText(moment(relationship.relStart).fromNow(), 283, 193)
		.addText(configFormat.formatK(relationship.relPoints), 283, 263)
		.addText(relationship.gift, 283, 333)
		.setTextAlign(`left`)
		.setTextFont(`10pt RobotoBold`)
		.addText(`I'm in a total of `+relations.length+` relations ❤`, 30, 390)

	return canv.toBuffer()

}

module.exports = portfolio