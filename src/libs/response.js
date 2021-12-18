const palette = require(`../ui/colors/default`)
const {
	MessageEmbed,
	MessageAttachment
} = require(`discord.js`)
const loadAsset = require(`../utils/loadAsset`)
const GUI = require(`../ui/prebuild/cardCollection`)
/**
 * @typedef {object} Plugins
 * @property {string} content as the message content
 * @property {array} socket is the optional message modifier. Array
 * @property {string} color for the embed color. Hex code
 * @property {object} field as the message field target (GuildChannel/DM). Object
 * @property {buffer} image as the attachment url. Buffer
 * @property {boolean} simplified as non embed message toggle. Boolean
 * @property {string} thumbnail as embed icon. StringuRL
 * @property {boolean} notch as huge blank space on top and bottom
 * @property {buffer|string} thumbnail as message icon on top right
 * @property {number} deleteIn as countdown before the message get deleted. In seconds.
 * @property {boolean} prebuffer as indicator if parameter supply in "image" already contains image buffer.
 * @property {string} header use header in an embed.
 * @property {array} customHeader First index as header text and second index as header icon.
 * @property {boolean} [timestamp=false] Toggle true to include the timestamp on the message.
 * @property {boolean} [paging=false] Toggle true to use paging mode in the message.
 * @property {string|null} [status=null] Set to `sucesss`, `warn`, or `fail` to indicate the status of the message.
 * @property {boolean} [cardPreviews=false] Toggle true to allow the embed to display the card.
 * @property {string|null} [topNotch=null] Adds topnotch with custom message. Leave blank/null to ommit it.
 * @property {boolean} [raw=false] Toggle `true` to return the message's composition without sending it to the target field.
 * @property {boolean} [timestampAsFooter=false] Toggle `true` to include the message timestamp in the footer of embed.
 */

/** 
 * Annie's response message system.
 * @abstract
 * @class
 */
class Response {
	/**
	 * @param {object} [message={}] Target message's instance.
	 * @param {boolean} [channelAsInstance=false] Toggle `true` when supplied
	 * 'message' parameter is replaced with 'channel' object.
	 */
	constructor(message = {}, channelAsInstance = false) {
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

	/**
	 *
	 * Sending response
	 * @param {string} [content=``] Main content of the message to be displayed.
	 * @param {plugins} [plugins={}] List of plugins to be applied into the message.
	 * @return {void}
	 */
	async send(content = ``, plugins = {}) {
		let socket = plugins.socket || []
		let color = plugins.color || palette.crimson
		plugins.color = color
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
		//  Handle message with paging property enabled
		if (paging) {
			let page = 0
			const embeddedPages = await this._registerPages(content, plugins)
			return field.send(embeddedPages[0])
				.then(async msg => {
					//  Buttons
					if (embeddedPages.length > 1) {
						await msg.react(`⏪`)
						await msg.react(`⏩`)
					}
					// Filters - These make sure the varibles are correct before running a part of code
					const backwardsFilter = (reaction, user) => reaction.emoji.name === `⏪` && user.id === this.message.author.id
					const forwardsFilter = (reaction, user) => reaction.emoji.name === `⏩` && user.id === this.message.author.id
					//  Timeout limit for page buttons
					const backwards = msg.createReactionCollector(backwardsFilter, {
						time: 300000
					})
					const forwards = msg.createReactionCollector(forwardsFilter, {
						time: 300000
					})
					//  Add preview button if cardPreviews is enabled
					if (cardPreviews) {
						await msg.react(`👀`)
						let previewFilter = (reaction, user) => reaction.emoji.name === `👀` && user.id === this.message.author.id
						let preview = msg.createReactionCollector(previewFilter, {
							time: 300000
						})
						let previewedPages = []
						preview.on(`collect`, async r => {
							r.users.remove(this.message.author.id)
							if (previewedPages.includes(page)) return
							previewedPages.push(page)
							let loading = await field.send(`\`Rendering preview for cards page ${page+1}/${embeddedPages.length} ...\``)
							let img = await new GUI(plugins.cardPreviews[page]).create()
							field.send(``, new MessageAttachment(img))
							loading.delete()
						})
					}
					//	Left navigation
					backwards.on(`collect`, r => {
						r.users.remove(this.message.author.id)
						page--
						if (embeddedPages[page]) {
							msg.edit(embeddedPages[page])
						} else {
							page = embeddedPages.length - 1
							msg.edit(embeddedPages[page])
						}
					})
					//	Right navigation
					forwards.on(`collect`, r => {
						r.users.remove(this.message.author.id)
						page++
						if (embeddedPages[page]) {
							msg.edit(embeddedPages[page])
						} else {
							page = 0
							msg.edit(embeddedPages[page])
						}
					})
				})
		}
		//  Replace content with error message if content is a faulty value
		if (typeof content != `string`) content = this.message.client.locales.en.LOCALIZATION_ERROR
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
		//  Mutate message if status property is defined
		if ([`success`, `warn`, `fail`].includes(status)) color = status === `success` ? `#ffc9e2` : `crimson`
		//  Returns simple message w/o embed
		if (simplified) return field.send(content,
			image ? new MessageAttachment(prebuffer ? image : await loadAsset(image)) : null)
		//  Add notch/chin
		if (notch) content = `\u200C\n${content}\n\u200C`
		const embed = new MessageEmbed()
			.setColor(palette[color] || color)
			.setDescription(content)
			.setThumbnail(thumbnail)
		//  Add header
		if (header) embed.setTitle(header)
		//  Custom header
		if (customHeader) embed.setAuthor(customHeader[0], customHeader[1])
		//  Add footer
		if (footer) embed.setFooter(footer)
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
			embed.attachFiles(new MessageAttachment(prebuffer ? image : await loadAsset(image), `preview.jpg`))
			embed.setImage(`attachment://preview.jpg`)
		} else if (embed.file) {
			embed.image.url = null
			embed.file = null
		}
		if (raw) return embed
		let sent = field.send(topNotch, embed)
		if (!deleteIn) return sent
		return sent
			.then(msg => {
				//  Convert deleteIn parameter into milliseconds.
				msg.delete({
					timeout: deleteIn * 1000
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
			res[i] = new MessageEmbed().setFooter(`(${i+1}/${pages.length})`).setDescription(`${src.topNotch||``}\n${this.socketing(pages[i], src.socket)}`)
			if (src.image) {
				res[i].attachFiles(new MessageAttachment(src.prebuffer ? src.image : await loadAsset(src.image), `preview.jpg`))
				res[i].setImage(`attachment://preview.jpg`)
			}
			if (src.color) res[i].setColor(palette[src.color] || src.color || palette[`crimson`])
			if (src.header) res[i].setTitle(src.header)
			if (src.customHeader) res[i].setAuthor(src.customHeader[0], src.customHeader[1])
			if (src.thumbnail) res[i].setThumbnail(src.thumbnail)
			if (src.cardPreviews) res[i].setFooter(`Press the eyes emoji to preview. (${i+1}/${pages.length})`)
		}
		return res
	}
}

module.exports = Response