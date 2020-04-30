const Command = require(`../../libs/commands`)
/**
 * Converts Artcoins into EXP at the rate of 2:1
 * @author klerikdust
 */
class ConvertArtcoins extends Command {

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
    async execute({ reply, emoji, name, trueInt, commanifier, avatar, bot:{db} }) {
    	await this.requestUserMetadata(2)

		//  Returns as guide if user doesn't specify any parameters
		if (!this.args[0]) return reply(this.locale.CARTCOIN.SHORT_GUIDE)
		const amountToUse = this.args[0].startsWith(`all`) ? this.user.inventory.artcoins : trueInt(this.args[0])
		//  Returns if user's artcoins is below the amount of going to be used
		if (this.user.inventory.artcoins < amountToUse) return reply(this.locale.CARTCOIN.INSUFFICIENT_AMOUNT, {
			socket: {amount: `${emoji(`artcoins`)}${commanifier(this.user.inventory.artcoins)}`},
			color: `red`
		})
		//  Returns if user amount input is below the acceptable threeshold
		if (!amountToUse || amountToUse < 2) return reply(this.locale.CARTCOIN.INVALID_AMOUNT, {color: `red`})
		const totalGainedExp = amountToUse / 2

		this.setSequence(5)
		this.confirmation = await reply(this.locale.CARTCOIN.CONFIRMATION, {
			thumbnail: avatar(this.user.id),
			color: `golden`,
			notch: true,
			socket: {
				emoji: emoji(`artcoins`),
				amount: commanifier(amountToUse),
				gainedExp: commanifier(totalGainedExp)
			}
		})
		this.sequence.on(`collect`, async msg => {
			let input = msg.content.toLowerCase()

			/** --------------------
			 *  Sequence Cancellations
			 *  --------------------
			 */
			if (this.cancelParameters.includes(input)) {
				this.endSequence()
				return reply(this.locale.ACTION_CANCELLED)
			}

			//  Silently ghosting.
			if (!input.startsWith(`y`)) return
			//	Deduct balance & add new exp
			await db.updateInventory({itemId: 52, value: amountToUse, operation: `-`, userId: this.user.id})
			db.addUserExp(totalGainedExp, this.user.id)

			msg.delete()
			this.endSequence()
			this.confirmation.delete()
			reply(this.locale.CARTCOIN.SUCCESSFUL, {
				color: `lightgreen`,
				socket: {
					artcoins: `${emoji(`artcoins`)} ${commanifier(amountToUse)}`,
					exp: `${commanifier(totalGainedExp)} EXP`
				}
			})
		})
	}
}

module.exports.help = {
	start: ConvertArtcoins,
	name: `convertArtcoins`,
	aliases: [`convertac`, `acconvert`, `cartcoin`, `cartcoins`],
	description: `Converts Artcoins into EXP at the rate of 1:2`,
	usage: `cartcoin <Amount>`,
	group: `Shop`,
	permissionLevel: 0,
	multiUser: false
}