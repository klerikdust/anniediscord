const Command = require(`../../libs/commands`)
/**
 * Upvote Annie and get the reward!
 * @author klerikdust
 */
class Vote extends Command {
	constructor(Stacks) {
		super(Stacks)
        /**
         * The website to vote Annie
         * @type {string}
         */ 
		this.page = `https://top.gg/bot/501461775821176832`
	}

	/**
	 * Running command workflow
	 * @param {PistachioMethods} Object pull any pistachio's methods in here.
	 */
	async execute({ reply, name, emoji }) {
		await this.requestUserMetadata(2)
		//  Handle if user's vote still in cooldown
		if (await this.bot.dbl.hasVoted(this.user.master.id)) return reply(this.locale.VOTE.IS_COOLDOWN, {
			socket: {
				page: `[write a review](${this.page})`,
				emoji: await emoji(`692428785571856404`)
			}
		})
		return reply(this.locale.VOTE.READY, {
			header: `Hi, ${name(this.user.master.id)}!`,
			image: `banner_votes`,
			socket: {
				emoji: await emoji(`692428927620087850`),
				url: `[Discord Bot List](${this.page}/vote)`
			}
		})
	}
}


module.exports.help = {
	start: Vote,
	name: `vote`,
	aliases: [`vote`, `vt`, `vot`],
	description: `Upvote Annie and get the reward!`,
	usage: `vote`,
	group: `System`,
	permissionLevel: 0,
	multiUser: false
}