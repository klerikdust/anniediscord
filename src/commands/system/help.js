const Command = require(`../../libs/commands`)
/**
 * 	Displaying all the available commands. Complete with the usage.
 * 	@author klerikdust
 */
class Help extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
	constructor(Stacks) {
		super(Stacks)
		this.defaultColor = `crimson`
		this.commandpediaButton = `📖`
		this.ignoreGroups = [`Developer`, `modmail`]
		this.commandpediaThumbnail = `https://i.ibb.co/kHfmDv0/book.png`
		this.commandpediaBanner = `https://i.ibb.co/5X3S3yq/1.png`
		this.permmissionInteger = 268823638
		this.botInviteUrl = `https://discord.com/oauth2/authorize?client_id=${this.bot.user.id}&permissions=${this.permmissionInteger}&scope=bot`
	}

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
	async execute({ reply, name, emoji, bot:{db, supportServer} }) {
		await this.requestUserMetadata(1)
		const cmds = this.getCommandStructures()

		//  Displaying the help center if user doesn't specify any arg
		if (!this.fullArgs)	{

			// Display 5 most used commands suggestions
			const commandSuggestions = await db.mostUsedCommands()
			const affiliate = await db.getAffiliates()
			return reply(this.locale.HELP.LANDING, {
				socket: {
					user: name(this.user.id),
					recommendedCommands: this.prettifySuggestions(commandSuggestions),
					serverLink: supportServer,
					emoji: emoji(`AnnieWave`),
					prefix: this.bot.prefix
				},
				color: this.defaultColor,
				header: `Hi, ${name(this.user.id)}!`,
				thumbnail: this.bot.user.displayAvatarURL()
			})
			
			.then(response => {
				response.react(this.commandpediaButton)
				const bookEmoji = (reaction, user) => (reaction.emoji.name === this.commandpediaButton) && (user.id === this.user.id)
				const bookEmojiCollector = response.createReactionCollector(bookEmoji, {
					time: 60000
				})

				//  Display Commandpedia layout once user pressed the :book: button
				bookEmojiCollector.on(`collect`, () => {
					response.delete()
					reply(this.locale.HELP.COMMANDPEDIA.HEADER, {
						socket: {
							prefix: this.bot.prefix,
							serverLink: `[Join Support Server](${supportServer})`,
							botInviteLink: `[Invite Annie](${this.botInviteUrl})`,
							affiliateInviteLink: `[My Affiliate](${affiliate[0].invite_link})`,
							commandList: this.prettifyCommandpedia(cmds)
						},
						image: this.commandpediaBanner,
						prebuffer: true,
						thumbnail: this.commandpediaThumbnail,
						customHeader: [`Commandpedia`, this.bot.user.displayAvatarURL()],
						color: this.defaultColor
					})
				})
			})
		}

		//  Display command's properties based on given keyword (if match. Otherwise, return)
		const res = await this.findCommandByKeyword(this.fullArgs, cmds)
		if (!res) return reply(this.locale.HELP.UNABLE_TO_FIND_COMMAND, {color: `red`})
		const perm = this.getPermissionProperties(res.help.permissionLevel)
		const cmdName = res.help.name.charAt(0).toUpperCase() + res.help.name.slice(1)
		const cmdDesc = `"${res.help.description.charAt(0).toUpperCase() + res.help.description.slice(1)}"`
		const footer = `\`\`\`javascript\nUSAGE: ${this.prefix}${res.help.usage}\nPERM_LVL: ${perm.level} or equivalent to ${perm.name} privileges\`\`\``

		return reply(`**${cmdName}**\n${cmdDesc}\n${footer}`, {
			color: this.defaultColor
		})

	}

	/**
	 * Finding command by a category, name or alias.
	 * @param {String} [keyword=``] user input
	 * @param {Map} [src={}] tree-structural commands list 
	 * @returns {CommandProperties}
	 */
	async findCommandByKeyword(keyword=``, src={}) {
		let res = null
		//  Returns if keyword has matched with parent
		if (src[keyword]) res = src[keyword]
		//  Find on deep layer and recursively
		for (let group in src) {
			src[group].filter(child => {
				//  Returns result if keyword has matched with command's name
				if (child.help.name === keyword) res = child
				//  Returns result if keyword has matched with command's aliases
				if (child.help.aliases.includes(keyword)) res = child
			})	
		}
		return res
	}

	/**
	 * Parsing registered commands into a tree-structured map collection.
	 * @returns {CommandsObject}
	 */
	getCommandStructures() {
		let obj = {}
		let groups = this.bot.commands.names.map(el => el.help.group)
		let uniqueGroups = [...new Set(groups)].filter(el => !this.ignoreGroups.includes(el))
		for (let groupName of uniqueGroups) {
			const groupChilds = this.bot.commands.names.filter(el => el.help.group === groupName && !el.help.invisible)
			obj[groupName] = groupChilds
		}
		return obj
	}

	/**
	 * Fetch complete properties of given permission level
	 * @param {Number} [lvl=0] Permission level.
	 * @returns {PermissionObject}
	 */
	getPermissionProperties(lvl=0) {
		const src = this.bot.permission
		for (let key in src) {
			if (src[key].level === lvl) return src[key]
		}
	}

	/**
	 * Prettifying commands collection into a readable list.
	 * @param {Object} [obj={}] returned result from [this.getCommandStructures()]
	 * @returns {String}
	 */
	prettifyCommandpedia(obj=[]) {
		let str = ``
		for (let group in obj) {
			const cmdNames = obj[group].map(el => `\`${this.bot.prefix}${el.help.usage.toLowerCase()}\``)
			str += `**${group}**\n${cmdNames.join(`,`).replace(/,/g, `\n`)}\n\n`
		}
		return str
	}

	/**
	 * Prettifying suggested commands array
	 * @param {Array} [arr=[]] returned result from [Database.mostUsedCommands()]
	 * @returns {String}
	 */
	prettifySuggestions(arr=[]) {
		const cmdNames = arr.map(el => { return `\`${this.bot.prefix}${el.command_alias}\``})
		return cmdNames.join(`,`)
	}

}

module.exports.help = {
	start: Help,
	name: `help`,
	aliases: [`help`, `help`, `cmdhelp`],
	description: `Displaying all the available commands. Complete with the usage.`,
	usage: `help <Category/CommandName>(Optional)`,
	group: `System`,
	permissionLevel: 0,
	multiUser: false
}