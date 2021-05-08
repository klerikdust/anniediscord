const GUI = require(`../ui/prebuild/levelUpMessage`)
const closestBelow = require(`../utils/closestBelow`)
const { MessageAttachment } = require(`discord.js`) 

/**
 * @typedef {object} MemberExperience
 * @property {number} [level] calculated level from given current exp
 * @property {number} [maxexp] calculated max cap exp from given current exp
 * @property {number} [nextexpcurve] calculated curve between min and max exp of current level
 * @property {number} [minexp] calculated lowest exp cap for current level
 */

/**
 * Experience gaining controller.
 * @author klerikdust
 * @since 6.0.0
 */
class Experience {
    //  For the 'user' parameter it is recommended to use GuildMember object instead of raw user.
    constructor(client, user, guild) {
        /**
         * Current bot client instance.
         * @type {Client}
         */
        this.client = client
        /**
         * Entailed user for current instance.
         * @type {GuildMember}
         */
        this.user = user
        /**
         * Current guild's instance object.
         * @type {Guild}
         */
        this.guild = guild
        /**
         * Instance identifier.
         * @type {string}
         */
        this.instanceId = `[EXP_LIBS_${this.guild.id}@${this.user.id}]` 
	}
    
    /**
     *  The default gained exp from chatting.
     *  @type {number}
     */
    get defaultGain() {
        const [ max, min ] = [ 10, 15 ]
    	return Math.floor(Math.random() * (max - min + 1) + min)
    }

    /**
     *  Running EXP workflow.
     *  @param {number} [expToBeAdded=this.defaultGain] amount of exp to be added into user's current exp pool
     *  @return {void}
     */
    execute(expToBeAdded=this.defaultGain) {
    	this.client.db.getUserExp(this.user.id, this.guild.id)
        .then(exp => {
            const prevExp = this.xpFormula(exp.current_exp)
            const newExp = this.xpFormula(exp.current_exp + expToBeAdded)
            //  Send level up message if new level is higher than previous level
            if (newExp.level > prevExp.level) {
		        if (this.guild.configs.get(`CUSTOM_RANK_MODULE`).value) this.updateRank(newExp.level)
                if (this.guild.configs.get(`LEVEL_UP_MESSAGE`).value) this.levelUpPerks(newExp.level)
            }
            //  Update user's exp data.
            this.client.db.addUserExp(expToBeAdded, this.user.id, this.guild.id)
        })
        .catch(e => {
            this.client.logger.warn(`${this.instanceId} <FAIL> to gain exp > ${e.message}`)
        })
    }
	
	/**
	 * Takes the level of a user and finds the corresponding rank role and removing previous rank roles (if prompted).
	 * @param {number} [level=0] Target updated rank level. 
     * @return {void}
	 */
	async updateRank(level=0){
        let registeredRanks = this.guild.configs.get(`RANKS_LIST`).value
        if (registeredRanks.length <= 0) return
        const userRankLevel = closestBelow(registeredRanks.map(r => r.LEVEL), level) 
        //  Early exit on unranked level. Also remove all the existing rank role.
        if (!isFinite(userRankLevel)) return this.user.roles.remove(registeredRanks.map(r => r.ROLE))
        .catch(e => this.client.logger.warn(`${this.instanceId} <FAIL> role clear > ${e.message}`))
        const expectedTargetRole = registeredRanks.find(r => parseInt(r.LEVEL) === userRankLevel)
        if (!expectedTargetRole) return
        //  Ensure that role is exist in the server/guild.
        const userRankRole = this.guild.roles.cache.get(expectedTargetRole.ROLE)
        if (!userRankRole) return
        //  Assign new rank role if target level is not -infinity (due to below threshold).
        if (isFinite(userRankLevel)) this.user.roles.add(userRankRole)
        .catch(e => this.client.logger.warn(`${this.instanceId} <FAIL> role assign > ${e.message}`))
        if (this.guild.configs.get(`RANKS_STACK`).value) return
        //  Remove non-current rank roles if RANKS_STACK is disabled
        const nonCurrentRankRoles = registeredRanks
        .filter(r => r.ROLE !== userRankRole.id)
        .map(r => r.ROLE)
        this.user.roles.remove(nonCurrentRankRoles)
        .catch(e => this.client.logger.warn(`${this.instanceId} <FAIL> role remove > ${e.message}`))
	}

    /**
     *  Parsing custom level_up message content.
     *  @author {klerikdust}
     *  @param {string} [content=``] Target string.
     *  @return {string}
     */
    _parseLevelUpContent(content=``) {
        content = content.replace(/{{guild}}/gi, `**${this.guild.name}**`)
        content = content.replace(/{{user}}/gi, this.user)
        return content
    }

    /**
     *  Sending level-up message and reward to the user.
     *  @author {klerikdust}
     *  @param {number} [newLevel=0] New level to be displayed in the message.
     *  return {Message|void}
     */
    async levelUpPerks(newLevel=0) {
        //  Parsing content for level-up message
        const img = await new GUI(await this._getMinimalUserMetadata(), newLevel).build()
        const defaultText = this.client.locale.en.LEVELUP.DEFAULT_RESPONSES
        const savedText = this.guild.configs.get(`LEVEL_UP_TEXT`).value
        let displayedText = this._parseLevelUpContent(savedText || defaultText[Math.floor(Math.random() * defaultText.length)])
        const messageComponents = [displayedText, new MessageAttachment(img, `LEVELUP_${this.user.id}.jpg`)]
        //  Send to custom channel if provided
        const customLevelUpMessageChannel = this.guild.configs.get(`LEVEL_UP_MESSAGE_CHANNEL`).value
        if (customLevelUpMessageChannel) {
            const targetChannel = this.guild.channels.cache.get(customLevelUpMessageChannel)
            if (!targetChannel) return this.client.logger.warn(`${this.instanceId} <FAIL> invalid level up message channel`)
            return targetChannel.send(...messageComponents)
            .catch(e => this.client.logger.warn(`${this.instanceId} <FAIL> send levelup msg in custom channel > ${e.message}`))
        }
        //  Otherwise, send message to the channel where user got leveled-up.
        return response.send(...messageComponents)
        .catch(e => this.client.logger.warn(`${this.instanceId} <FAIL> send levelup msg in regular channel > ${e.message}`))
    }

    /**
     *  Default EXP Calculation formula. Reversed.
     *  @param {ExpData} [data] the metadata to be calculated from.
     *  @author [sunnyrainyworks, fwubbles, the frying pan]
     *  @returns {ExpData}
     */
	async xpReverseFormula(data) {
		const formula = (level) => {
			if (level < 1) {
				return {
					level: 0,
					maxexp: 100,
					nextexpcurve: 100,
					minexp: 0
				}
			}
			level < 60 ? level-=1 : level+=0
			let exp = Math.floor(((390.0625*(Math.pow(level+1, 2)))+375)/4)
			level = Math.sqrt(4 * exp - 375) / 20 - 0.25
			level = Math.floor(level)
			var maxexp = Math.round(100 * (Math.pow(level + 1, 2)) + 50 * (level + 1) + 100)			
			var minexp = Math.round(100 * (Math.pow(level, 2)) + 50 * level + 100)
			var nextexpcurve = Math.round(maxexp - minexp)
			level = level + 1

			return {
				maxexp: maxexp,
				nextexpcurve: nextexpcurve,
				minexp: minexp,
				level: level
			}
		}
		let level = Math.floor(data)
		const main = formula(level)
		let maxexp = main.maxexp
		let nextexpcurve = main.nextexpcurve
		let minexp = main.minexp
		level = main.level
		return { level, maxexp, nextexpcurve, minexp }
	}

    /**
     *  Default EXP Calculation formula.
     *  @param {number} [exp=0] the exp to be calculated from.
     *  @author [sunnyrainyworks, fwubbles, the frying pan]
     *  @returns {ExpData}
     */
	xpFormula(exp=0) {
		if (exp < 100) {
			return {
				level: 0,
				maxexp: 100,
				nextexpcurve: 100,
				minexp: 0
			}
		}
		let level = Math.sqrt(4 * exp - 375) / 20 - 0.25
		level = Math.floor(level)
		const maxexp = Math.round(100 * (Math.pow(level + 1, 2)) + 50 * (level + 1) + 100)
	    const minexp = Math.round(100 * (Math.pow(level, 2)) + 50 * level + 100)
		const nextexpcurve = Math.round(maxexp - minexp)
		level = level + 1
		return {
			level: level,
			maxexp: maxexp,
			nextexpcurve: nextexpcurve,
			minexp: minexp
		}
    }

    /**
     *  Fetching minimal metadata for the user to be supplied in level-up message ui.
     *  @return {object}
     */
    async _getMinimalUserMetadata() {
        const inventoryData = await this.client.db.getUserInventory(this.user.id, this.guild.id)
        const theme = inventoryData.filter(key => (key.type_name === `Themes`) && (key.in_use === 1))
        const usedTheme = theme.length ? theme[0] : await this.client.db.getItem(`light`)
		const cover = await this.client.db.getUserCover(this.user.id, this.guild.id)
		let usedCover = {}
		if (cover) {
			usedCover = cover
		}
		else {
			usedCover = await this.client.db.getItem(`defaultcover1`)
			usedCover.isDefault = true
		}
        return {
            //  Calling user property in GuildMember object.
			master: this.user.user,
			theme: theme,
			usedTheme: usedTheme,
			cover: cover,
			usedCover: usedCover
		}
    }
}

module.exports = Experience
