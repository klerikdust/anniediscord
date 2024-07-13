const palette = require(`../ui/colors/default`)
const {
	EmbedBuilder,
	AttachmentBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle
} = require(`discord.js`)
const loadAsset = require(`../utils/loadAsset`)
const GUI = require(`../ui/prebuild/cardCollection`)
const {PermissionFlagsBits} = require(`discord.js`)

/** 
 * Annie's response message system.
 * @abstract
 * @class
 */
class Response {
	/**
	 * @param {object} [message={}] Target message's instance.
	 * @param {boolean} [channelAsInstance=false] Toggle `true` when supplied
	 * @param {object} [localeMetadata=null] For testing purposes. Optional
	 * 'message' parameter is replaced with 'channel' object.
	 */
	constructor(message = {}, channelAsInstance = false, localeMetadata = null) {
		/**
		 * Target's message instance.
		 * @type {object}
		 */
		this.message = message

		/**
		 * Default target channel
		 * @type {object|null}
		 */
		this.targetField = channelAsInstance ?
			message :
			message.channel ?
				message.channel : null

		/**
		 * Determine if the message is a Slash command.
		 * @deprecated
		 */
		this.isSlash = message.applicationId === null ? true : false

		/**
		 * The metadata of locale to be used
		 * @type {object|null}
		 */
		this.localeMetadata = localeMetadata
	}

	/**
	 * Sending response
	 * @param {String} [content=``] Main content of the message to be displayed.
	 * @param {Object} plugins List of plugins to be applied into the message.
	 * @param {Array} plugins.socket optional message modifiers.
	 * @param {String} plugins.color for the embed color. [Hex code]
	 * @param {String} plugins.url as the url for an embed.
	 * @param {Buffer} plugins.image as the attachment url.
	 * @param {String} plugins.imageGif as the attachment url.
	 * @param {String} plugins.thumbnail as embed icon.
	 * @param {String} plugins.header use header in an embed.
	 * @param {String} plugins.footer use footer in an embed.
	 * @param {String} plugins.customHeader First index as header text and second index as header icon.
	 * @param {String} plugins.timestamp Toggle true to include the timestamp on the message.
	 * @param {String} plugins.status Set to `sucesss`, `warn`, or `fail` to indicate the status of the message.
	 * @param {String} plugins.topNotch Adds topnotch with custom message. Leave blank/null to ommit it.
	 * @param {Boolean} plugins.simplified as non embed message toggle.
	 * @param {Boolean} plugins.notch as huge blank space on top and bottom
	 * @param {Boolean} plugins.prebuffer as indicator if parameter supply in "image" already contains image buffer.
	 * @param {Boolean} plugins.paging Toggle true to use paging mode in the message.
	 * @param {Boolean} plugins.cardPreviews Toggle true to allow the embed to display the card.
	 * @param {Boolean} plugins.raw Toggle `true` to return the message's composition without sending it to the target field.
	 * @param {Boolean} plugins.timestampAsFooter Toggle `true` to include the message timestamp in the footer of embed.
	 * @param {Boolean} plugins.directMessage Indicate if the message is a DM
	 * @param {Boolean} plugins.feedback  beta feature, **not used often**
	 * @param {Boolean} plugins.fetchReply Application command option to grab reference
	 * @param {Boolean} plugins.ephemeral Application command option to hide message from public
	 * @param {Boolean} plugins.replyAnyway Reply to a message reguardless of other options
	 * @param {Boolean} plugins.messageToReplyTo required for [plugins.replyAnyway] to work
	 * @param {Object | String} plugins.field message field target (GuildChannel/DM).
	 * @param {String | Number} plugins.deleteIn as countdown before the message get deleted. In seconds.
	 * @param {Array | String | Object} plugins.components Array of components like buttons
	 * @param {Object} plugins.file	object for local file attachments
	 * @param {String} plugins.file.filePath local file file path
	 * @param {String} plugins.file.fileName local file name
	 * @param {String} plugins.file.fileDescription local file description
	 * @return {void}
	 */
	async send(content = ``, plugins = {}) {
		let socket = plugins.socket || []
		let color = plugins.color || palette.crimson
		let url = plugins.url || null
		let image = plugins.image || null
		let imageGif = plugins.imageGif || null
		let field = plugins.field || this.targetField
		let simplified = plugins.simplified || false
		let thumbnail = plugins.thumbnail || null
		let notch = plugins.notch || false
		let prebuffer = plugins.prebuffer || false
		let header = plugins.header || null
		let footer = plugins.footer || null
		let customHeader = plugins.customHeader || null
		let deleteIn = plugins.deleteIn || null
		let timestamp = plugins.timestamp || null
		let paging = plugins.paging || null
		let status = plugins.status || null
		let cardPreviews = plugins.cardPreviews || null
		let topNotch = plugins.topNotch || null
		let raw = plugins.raw || false
		let timestampAsFooter = plugins.timestampAsFooter || false
		let directMessage = plugins.dm || false
		let feedback = plugins.feedback || false
		let components = plugins.components || null
		let file = plugins.file || null
		let fetchReply = plugins.fetchReply || true
		let ephemeral = plugins.ephemeral || false
		let messageToReplyTo = plugins.messageToReplyTo || null
		let replyAnyway = messageToReplyTo ? plugins.replyAnyway || false : false

		const isSlash = this.message.applicationId === null || this.message.applicationId === undefined ? false : true // Not a application command <Message> : Is a application command <ChatInputCommandInteraction>

		// If object to send is coming from a regular message object, check if bot has correct perms to send otherwise return and dont send anything.
		if (!isSlash){
			const ViewChannel = this.message.guild.members.me.permissionsIn(field).has(PermissionFlagsBits.ViewChannel)
			if (!ViewChannel) return
			const SendMessages = this.message.guild.members.me.permissionsIn(field).has(PermissionFlagsBits.SendMessages)
			if(!SendMessages) return
		}
		const followUp = isSlash ? this.message.deferred || this.message.replied ? true : false : false
		const RESPONSE_REF =  messageToReplyTo ? messageToReplyTo : directMessage ? `send` : isSlash ? this.message : field
		const RESPONSE_TYPE = replyAnyway ? `reply` : directMessage ? `send` : isSlash ? followUp ? `followUp` : `reply` : `send`
		const embed = new EmbedBuilder()

		/**
		 * Format Components to correct data type
		 */
		formatComponents()

		/**
		 * Create file object if supplied data
		 */
		constructFileProp()

		/**
		 * Add feedback button to message if enabled
		 */
		betaFeedback()

		//  Handle message with paging property enabled
		if (paging) return await this.pageModule(content, plugins, RESPONSE_REF, RESPONSE_TYPE, components, fetchReply, ephemeral, isSlash, cardPreviews)

		//  Replace content with error message if content is a faulty value
		if (typeof content != `string`) content = this.localeMetadata.LOCALIZATION_ERROR

		//  Find all the available {{}} socket in the string.
		content = this.socketing(content, socket)

		//  Mutate message if status property is defined
		if ([`success`, `warn`, `fail`].includes(status)) color = status === `success` ? `#ffc9e2` : `crimson`

		//  Returns simple message w/o embed
		if (simplified) return await sendMessage()

		//  Add notch/chin
		if (notch) content = `\u200C\n${content}\n\u200C`

		if (content === ``) content = null

		await createEmbed()

		if (raw) return embed

		let sent = await sendMessage()

		if (file) sent = await sendMessage()

		if (!deleteIn) return sent
		sent

		return setTimeout(() => {
			sent.delete()
		}, deleteIn * 1000)


		async function sendMessage() {
			const noEmbed = Object.keys(embed.data).length === 0
			if (!RESPONSE_REF) return
			if (!RESPONSE_TYPE) return
			if (!RESPONSE_REF[RESPONSE_TYPE]) return

			if (file) return RESPONSE_REF[RESPONSE_TYPE]({
				files: [file]
			})

			return RESPONSE_REF[RESPONSE_TYPE]({
				content: noEmbed ? content : topNotch ? topNotch : null,
				embeds: noEmbed ? null : [embed],
				files: embed.file ? [embed.file] : image ? [new AttachmentBuilder(prebuffer ? image : await loadAsset(image))] : null,
				components: components ? components : null,
				fetchReply: fetchReply,
				ephemeral: ephemeral
			}) // Add catch statement? Unknown if it is needed
		}

		async function createEmbed() {
			embed.setColor(palette[color] || color).setDescription(content).setThumbnail(thumbnail)
			embed.file = null
			//  Add header
			if (header) embed.setTitle(header)
			//  Custom header
			if (customHeader) embed.setAuthor({
				name: customHeader[0],
				iconURL: customHeader[1]
			})
			//  Add footer
			if (footer) embed.setFooter({
				text: footer
			})
			//  Timestamp footer
			if (timestampAsFooter) embed.setTimestamp()
			//  Add timestamp on footer part
			if (timestamp) embed.setTimestamp()
			// Add url
			if (url) embed.setURL(url)
			//  Add image preview
			if (imageGif) {
				embed.setImage(imageGif)
			} else if (embed.file) {
				embed.image.url = null
				embed.file = null
			}
			//  Add image preview
			if (image) {
				const img = new AttachmentBuilder(prebuffer ? image : await loadAsset(image), { name: `preview.jpg` })
				embed.file = img
				embed.setImage(`attachment://preview.jpg`)
			} else if (embed.file) {
				embed.image.url = null
				embed.file = null
			}
		}

		function formatComponents() {
			const isComponentArray = Array.isArray(components)
			if (components && !isComponentArray) components = [components]
		}

		function betaFeedback() {
			const row = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId(`betaFeedback`)
						.setLabel(`Beta Feature Feedback`)
						.setStyle(ButtonStyle.Secondary)
				)

			if (feedback) return !components ? components = [row] : components.push(row)
		}

		function constructFileProp() {
			if (file === null || file === undefined || !plugins.file.filePath || !plugins.file.fileName || !plugins.file.fileDescription) {
				file = null
			} else {
				file.attachment = plugins.file.filePath
				file.name = plugins.file.fileName
				file.description = plugins.file.fileDescription
			}
		}
	}

	/**
	 * Plug variables into available socket in the target string.
	 * @param {string} [content=``] Target string.
	 * @param {object} [socket={}] List of sockets to attach in the string.
	 * return {string}
	 */
	socketing(content = ``, socket = {}) {
		//  Find all the available {{}} socket in the string.
		let sockets = content.match(/\{{(.*?)\}}/g)
		if (sockets === null) sockets = []
		for (let i = 0; i < sockets.length; i++) {
			const key = sockets[i].match(/\{{([^)]+)\}}/)
			if (!key) continue
			//  Index `0` has key with the double curly braces, index `1` only has the inside value.
			const pieceToAttach = socket[key[1]]
			if (pieceToAttach || pieceToAttach === 0) content = content.replace(new RegExp(`\\` + key[0], `g`), pieceToAttach)
		}
		return content
	}

	async pageModule(content, plugins, RESPONSE_REF, RESPONSE_TYPE, components, fetchReply, ephemeral, isSlash, cardPreviews) {
		let page = 0
		const embeddedPages = await this._registerPages(content, plugins)
		return RESPONSE_REF[RESPONSE_TYPE](embeddedPages[0].file ? components ? {
			embeds: [embeddedPages[0]],
			files: [embeddedPages[0].file],
			components: components,
			fetchReply: fetchReply,
			ephemeral: ephemeral
		} : {
			embeds: [embeddedPages[0]],
			files: [embeddedPages[0].file],
			fetchReply: fetchReply,
			ephemeral: ephemeral
		} : components ? {
			embeds: [embeddedPages[0]],
			files: [],
			components: components,
			fetchReply: fetchReply,
			ephemeral: ephemeral
		} : {
			embeds: [embeddedPages[0]],
			files: [],
			fetchReply: fetchReply,
			ephemeral: ephemeral
		}).then(async (msg) => {
			this.ref = this.message.user
			//  Buttons
			if (embeddedPages.length > 1) {
				await msg.react(`⏪`)
				await msg.react(`⏩`)
			}
			// Filters - These make sure the varibles are correct before running a part of code
			let filter = (reaction, user) => isSlash ? reaction.emoji.name === `⏪` && user.id === this.ref.id : reaction.emoji.name === `⏪` && user.id === this.message.author.id
			//  Timeout limit for page buttons
			const backwards = msg.createReactionCollector({
				filter,
				time: 300000
			})
			filter = (reaction, user) => isSlash ? reaction.emoji.name === `⏩` && user.id === this.ref.id : reaction.emoji.name === `⏩` && user.id === this.message.author.id
			const forwards = msg.createReactionCollector({
				filter,
				time: 300000
			})
			//  Add preview button if cardPreviews is enabled
			if (cardPreviews) {
				await msg.react(`👀`)
				let filter = (reaction, user) => isSlash ? reaction.emoji.name === `👀` && user.id === this.ref.id : reaction.emoji.name === `👀` && user.id === this.message.author.id
				let preview = msg.createReactionCollector(filter, {
					time: 300000
				})
				let previewedPages = []
				preview.on(`collect`, async (r) => {
					r.users.remove(isSlash ? this.ref.id : this.message.author.id)
					if (previewedPages.includes(page)) return
					previewedPages.push(page)
					let loading = await RESPONSE_REF[RESPONSE_TYPE]({
						content: `\`Rendering preview for cards page ${page + 1}/${embeddedPages.length} ...\``
					})
					let img = await new GUI(plugins.cardPreviews[page]).create()
					RESPONSE_REF[RESPONSE_TYPE]({
						files: [new AttachmentBuilder(img)]
					})
					loading.delete()
				})
			}
			//	Left navigation
			backwards.on(`collect`, r => {
				r.users.remove(isSlash ? this.ref.id : this.message.author.id)
				page--
				if (embeddedPages[page]) {
					msg.edit(embeddedPages[page].file ? {
						embeds: [embeddedPages[page]],
						files: [embeddedPages[page].file]
					} : {
						embeds: [embeddedPages[page]],
						files: []
					})
				} else {
					page = embeddedPages.length - 1
					msg.edit(embeddedPages[page].file ? {
						embeds: [embeddedPages[page]],
						files: [embeddedPages[page].file]
					} : {
						embeds: [embeddedPages[page]],
						files: []
					})
				}
			})
			//	Right navigation
			forwards.on(`collect`, r => {
				r.users.remove(isSlash ? this.ref.id : this.message.author.id)
				page++
				if (embeddedPages[page]) {
					msg.edit(embeddedPages[page].file ? {
						embeds: [embeddedPages[page]],
						files: [embeddedPages[page].file]
					} : {
						embeds: [embeddedPages[page]],
						files: []
					})
				} else {
					page = 0
					msg.edit(embeddedPages[page].file ? {
						embeds: [embeddedPages[page]],
						files: [embeddedPages[page].file]
					} : {
						embeds: [embeddedPages[page]],
						files: []
					})
				}
			})
		})
	}

	/**
	 *  Registering each element of array into its own embed.
	 *  @param {array} [pages=[]] source array to be registered. Element must be `string`.
	 *  @param {object} [src=null] reply's options parameters for customized embed.
	 *  @returns {array}
	 */
	async _registerPages(pages = [], src = null) {
		let res = []
		for (let i = 0; i < pages.length; i++) {
			res[i] = new EmbedBuilder().setFooter({
				text: `(${i + 1}/${pages.length})`
			}).setDescription(`${src.topNotch || ``}\n${this.socketing(pages[i], src.socket)}`)
			if (src.image) {
				let attachment = new AttachmentBuilder(src.prebuffer ? src.image : await loadAsset(src.image), `preview.jpg`)
				res[i].setImage(`attachment://${attachment.name}`)
				res[i].file = attachment
			}
			if (src.color) res[i].setColor(palette[src.color] || src.color || palette[`crimson`])
			if (src.header) res[i].setTitle(src.header)
			if (src.customHeader) res[i].setAuthor({
				name: src.customHeader[0],
				iconURL: src.customHeader[1]
			})
			if (src.thumbnail) res[i].setThumbnail(src.thumbnail)
			if (src.cardPreviews) res[i].setFooter({
				text: `Press the eyes emoji to preview. (${i + 1}/${pages.length})`
			})
		}
		return res
	}
}

module.exports = Response