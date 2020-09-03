const Command = require(`../../libs/commands`)
const Card = require(`../../ui/components/cards`)
const urlToBuffer = require(`../../utils/urlToBuffer`)
const loadAsset = require(`../../utils/loadAsset`)
/**
 * 	Dummy command to test anything.
 * 	@author klerikdust
 */
class Test extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
	constructor(Stacks) {
		super(Stacks)
	}

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
	async execute({ reply }) {
		await this.requestUserMetadata(2)
		let card = await new Card({width: 150, height: 50, theme: this.user.usedTheme.alias})

			//  Base
			card.createBase({cornerRadius: 100})
			//  Semi-opaque background
			.addCover({ img: await loadAsset(this.user.usedCover.alias) })
			//  User's avatar on left
			await card.addContent({ 
				avatar: await urlToBuffer(this.user.user.displayAvatarURL({format: `png`, dynamic: false})),
				avatarRadius: 7,
				marginLeft: 25,
				marginTop: 30,
				inline: true
			})
			//  Main text content
			card.addTitle({ 
				main: `Level up to ${this.user.exp.level+1}`,
				size: 8, 
				fontWeight: `bold`,
				marginLeft: -5,
				marginTop: 29,
				align: `left`,
				inline: true
			})
			//  Finalize
			card.ready()

		return reply(`test`, {
			prebuffer: true,
			image: card.canv.toBuffer(),
			simplified: true
		})
	}
}

module.exports.help = {
	start: Test,
	name: `test`,
	aliases: [`test`],
	description: `Dummy command to test anything.`,
	usage: `test <>`,
	group: `Developer`,
	permissionLevel: 4,
	multiUser: true,
}