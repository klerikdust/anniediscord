`use-strict`
const User = require(`./user`)
const stringSimilarity = require(`string-similarity`)
/**
 * Master/Parent module of Command Cluster
 * Not callable unless extended from a sub-command.
 */ 
class Commands {
	constructor(Stacks) {
		this.bot = Stacks.bot
		this.message = Stacks.message

        /**
         * The default prop for accessing command's prefix.
         * @since 1.0.0
         * @type {String}
         */
		this.prefix = Stacks.bot.prefix

        /**
         * Tokenized message into an array.
         * @since 1.0.0
         * @type {Array}
         */
		this.messageArray = Stacks.message.content.split(` `)

		/**
         * Tokenized arguments. Except, no command name included.
         * @since 1.0.0
         * @type {String}
         */	
		this.args = this.messageArray.slice(1)

        /**
         * Untokenized arguments. Except, no command name included.
         * @since 1.0.0
         * @type {String}
         */	
		this.fullArgs = this.args.join(` `)

		/**
         * The used command name.
         * @since 1.0.0
         * @type {String}
         */	
		this.commandName = this.messageArray[0].slice(this.prefix.length).toLowerCase()

		/**
         * The accepted alias to cancel command flow.
         * @type {array}
         */	
		this.cancelParameters = [
			`n`,
			`no`,
			`cancel`,
			`exit`
		]

		/**
		 * Fetched Command Properties
		 * @since 6.0.0
		 * @type {Object}
		 */
		this.commandProperties = Stacks.commandProperties
		
		/**
		 * Define the current instance identifier
		 * @since 6.0.0
		 * @type {stirng}
		 */
		this.instanceId = `${this.commandProperties.name.toUpperCase()}_${this.message.author.id}`
	
		/**
         * User lib
         * @since 6.0.0
         * @type {UserClass}
         */	
		this.userClass = new User(Stacks.bot, Stacks.message)

		/**
         * The default locale for current command instance
         * @type {string}
         */	
		this.locale = Stacks.bot.locale[`en`]	
		this.logger = Stacks.bot.logger
	
	}

	/**
	 *  first-level collector handler. Inherited from `Pistachio.collector()`
	 *  @param {number} [max=2] define the maximum accepted responses
	 *  @param {number} [timeout=120000] 120 seconds timeout
	 *  @returns {MessageCollector}
	 */
	setSequence(max=2, timeout=120000) {
		const fn = `[Commands.setSequence()]`
		this.logger.debug(`${fn} ${this.instanceId} initializing new sequence flow`)
		this.onSequence = 1
		this.sequence = this.message.channel.createMessageCollector(
		m => m.author.id === this.message.author.id, {
			max: max,
			time: timeout,
		})
	}

	/**
	 * Moving sequence forward
	 * @returns {void}
	 */
	nextSequence() {
		const fn = `[Command.nextSequence()]`
		if (!this.onSequence) {
			this.onSequence = 1
			this.logger.debug(`${fn} ${this.instanceId} no sequence found. Automatically set to ${this.onSequence}`)
			return
		}
		const newSequence = this.onSequence + 1
		this.logger.debug(`${fn} ${this.instanceId} moving up from ${this.onSequence} to ${newSequence}`)
		this.onSequence = newSequence
	}

	/**
	 * Nullify/end current sequence
	 * @returns {boolean}
	 */
	endSequence() {
		const fn = `[Command.endSequence()]`
		this.onSequence = null
		this.sequence.stop()
		this.logger.debug(`${fn} ${this.instanceId} has finished`)
		return true
	}

	async requestUserMetadata(dataLevel=1) {
		const fn = `[Commands.requestUserMetadata()]`
		if (!dataLevel) throw new TypeError(`${fn} parameter 'dataLevel' cannot be blank or zero.`)
		const targetUser = await this._userSelector()
		if (!targetUser) {
			this.user = null
			return false
		}
		const result = await this.userClass.requestMetadata(targetUser, dataLevel)
		this.user = result
		//  Remove user searchstring keyword from arg pool
		if (this.args.length > 1) {
			const acceptableRating = 0.3
			for (let i=0; i<this.args.length; i++) {
				const rating = stringSimilarity.compareTwoStrings(this.userClass.usedKeyword, this.args[i])
				if (rating >= acceptableRating) {
					this.fullArgs = this.fullArgs.replace(this.args[i], ``)
				}
			}
		}
		/**
		 * Multi-language support
		 * Temporarily disabled
		 *
		if (result.lang) this.locale = this.bot.locale[result.lang]
		*/
		return true
	}

	async requestAuthorMetadata(dataLevel=1) { 
		const fn = `[Commands.requestAuthorMetadata()]`
		if (!dataLevel) throw new TypeError(`${fn} parameter 'dataLevel' cannot be blank or zero.`)
		const result = await this.userClass.requestMetadata(this.message.author, dataLevel)
		this.author = result
		/**
		 * Multi-language support
		 * Temporarily disabled
		 *
		if (result.lang) this.locale = this.bot.locale[result.lang]
		*/
		return true
	}

	/**
	 * Registering a react-based button as the medium to get confirmation-state from the user.
	 * After calling the method, the button can be accessed by looking up through key in `this.confirmButtons` (Map)
	 * @param {string} [id=this._generateUUID] as an identifier of the current confirmation button
	 * @param {collection} [targetMessage=this.message] target message to registered to
	 * @param {string} [targetUserId] target user that has the privilege of using the confirmation-state
	 * @example `this.confirmButtons.get(ID)``
	 * @author klerikdust
	 * @returns {object}
	 */
	addConfirmButton(id=this._generateUUID(), targetMessage=this.message, targetUserId=this.message.author.id) {
		//  Initialize the container first, if not present
		if (!this.confirmButtons) this.confirmButtons = new Map()
		const confirmationEmoji = `✅`
		targetMessage.react(confirmationEmoji)
        const confirmationButtonFilter = (reaction, user) => reaction.emoji.name === confirmationEmoji && user.id === targetUserId
        const confirmationButton = targetMessage.createReactionCollector(confirmationButtonFilter, { time: 300000, max: 1 })
		this.confirmButtons.set(id, confirmationButton)
		//  Optional metadata for debugging purpose
		return {
			id: id,
			buttonMessageId: targetMessage.id,
			buttonUserId: targetUserId,
			totalAvailableButtons: this.confirmButtons.size,
			registeredAt: new Date()
		}
	}

	/**
	 * Mainly generate ID as a multiple instance's identifier in
	 * a method the generates multiple instance of the same type.
	 * @returns {string}
	 */
	_generateUUID() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
			let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	}

	/**
	 * Selecting user based on the condition of `this.fullArgs` and command's multiUser property.
	 * @returns {object}
	 */
	_userSelector() {
		return this.commandProperties.multiUser && this.fullArgs ? this.userClass.lookFor(this.fullArgs) : this.message.member
	}
}


module.exports = Commands