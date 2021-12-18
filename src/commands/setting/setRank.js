const moment = require(`moment`)
const Confirmator = require(`../../libs/confirmator`)
const trueInt = require(`../../utils/trueInt`)
const findRole = require(`../../utils/findRole`)
const commanifier = require(`../../utils/commanifier`)
/**
 * Customize role-rank system in the guild.
 * @author Pan
 * @revised by klerikdust
 */
module.exports = {
    name: `setRank`,
    aliases: [`setranks`, `setrank`, `setRanks`, `setrnk`],
    description: `Customize role-rank system in the guild`,
    usage: `setranks`,
    permissionLevel: 3,
    /**
     * List of available actions for the current command
     * @type {array}
     */
    actions: [`enable`, `add`, `delete`, `info`, `stack`, `reset`, `disable`],
    /**
     * Current instance's config code
     * @type {string}
     */
    primaryConfigID: `CUSTOM_RANK_MODULE`,
    /**
     * Current instance's sub config code
     * @type {string}
     */
    subConfigID: `RANKS_LIST`,
    async execute(client, reply, message, arg, locale, prefix) {
        //  Handle if user doesn't specify any arg
        if (!arg) return reply.send(locale.SETRANK.GUIDE, {
            header: `Hi, ${message.author.usernam}!`,
            image: `banner_setranks`,
            socket: {
                prefix: prefix,
                emoji: await client.getEmoji(`692428864021987418`)
            }
        })
        this.args = arg.split(` `)
        //  Handle if selected action doesn't exists
        if (!this.actions.includes(this.args[0])) return reply.send(locale.SETRANK.INVALID_ACTION)
        //  Otherwise, run the action.
        this.guildConfigurations = message.guild.configs
        this.action = this.args[0]
        //  This is the main configuration of setwelcomer, so everything dependant on this value
        this.primaryConfig = this.guildConfigurations.get(this.primaryConfigID)
        //  This is the sub-part of main configuration such as welcomer's channel, text, etc
        this.subConfig = this.guildConfigurations.get(this.subConfigID)
        this.annieRole = (await message.guild.members.fetch(client.user.id)).roles.highest
        return this[this.args[0]](client, reply, message, arg, locale, prefix)
    },

    /**
     * Enable Action
     * @return {void}
     */
    async enable(client, reply, message, arg, locale, prefix) {
        if (!this.primaryConfig.value && !this.primaryConfig.setByUserId) this.firstTimer = true
        //  Handle if custom ranks already enabled before the action.
        if (this.primaryConfig.value) {
            let localizeTime = await client.db.toLocaltime(this.primaryConfig.updatedAt)
            return reply.send(locale.SETRANK.ALREADY_ENABLED, {
                socket: {
                    user: await client.getUsername(this.primaryConfig.setByUserId),
                    date: moment(localizeTime).fromNow()
                }
            })
        }
        //  Update configs
        client.db.updateGuildConfiguration({
            configCode: this.primaryConfigID,
            customizedParameter: 1,
            guild: message.guild,
            setByUserId: message.author.id,
            cacheTo: this.guildConfigurations
        })
        reply.send(locale.SETRANK.SUCCESSFULLY_ENABLED, {
            status: `success`
        })
        //  Spawn tip if user is a first timer
        if (this.firstTimer) return reply.send(locale.SETRANK.FIRST_TIMER_TIP, {
            simplified: true,
            socket: {
                prefix: prefix
            }
        })
    },

    /**
     * Registering new role-rank
     * @return {void}
     */
    async add(client, reply, message, arg, locale, prefix) {
        if (!this.args[1]) return reply.send(locale.SETRANK.ADD_MISSING_TARGET_ROLE, {
            socket: {
                prefix: prefix
            }
        })
        //  Handle if target role doesn't exists
        const getRole = findRole(this.args[1], message.guild)
        if (!getRole) return reply.send(locale.SETRANK.INVALID_ROLE, {
            socket: {
                emoji: await client.getEmoji(`692428578683617331`)
            }
        })
        //  Handle if target role is too high
        if (getRole.position > this.annieRole.position) return reply.send(locale.SETRANK.ROLE_TOO_HIGH, {
            socket: {
                role: getRole,
                annieRole: this.annieRole.name,
                emoji: await client.getEmoji(`692428578683617331`)
            }
        })
        //  Handle if the role is already registered
        const getRegisteredRank = this.subConfig.value.filter(node => node.ROLE === getRole.id)
        if (getRegisteredRank.length >= 1) {
            const localizeTime = await client.db.toLocaltime(this.subConfig.updatedAt)
            return reply.send(locale.SETRANK.ADD_ROLE_ALREADY_REGISTERED, {
                header: locale.SETRANK.ADD_ROLE_ALREADY_REGISTERED_HEADER,
                socket: {
                    level: getRegisteredRank[0].LEVEL,
                    user: await client.getUsername(this.subConfig.setByUserId),
                    date: moment(localizeTime).fromNow(),
                    prefix: prefix,
                    role: getRole.name.toLowerCase()
                },
            })
        }
        //  Handle if user doesn't specify the target required level
        if (!this.args[2]) return reply.send(locale.SETRANK.ADD_MISSING_REQUIRED_LEVEL, {
            socket: {
                prefix: prefix,
                role: getRole.name.toLowerCase()
            },
        })
        //  Handle if the specified required level is a faulty value/non-parseable number
        const getRequiredLevel = trueInt(this.args[2])
        if (!getRequiredLevel) return reply.send(locale.SETRANK.ADD_INVALID_REQUIRED_LEVEL)
        //  Update configs
        this.subConfig.value.push({
            "ROLE": getRole.id,
            "LEVEL": getRequiredLevel
        })
        client.db.updateGuildConfiguration({
            configCode: this.subConfigID,
            customizedParameter: this.subConfig.value,
            guild: message.guild,
            setByUserId: message.author.id,
            cacheTo: this.guildConfigurations
        })
        return reply.send(locale.SETRANK.SUCCESSFULLY_ADDED, {
            status: `success`,
            header: locale.SETRANK.SUCCESSFULLY_ADDED_HEADER,
            socket: {
                role: getRole.name,
                level: getRequiredLevel
            }
        })
    },

    /**
     * Deleting a rank-role from the guild's configurations
     * @return {void}
     */
    async delete(client, reply, message, arg, locale) {
        if (!this.args[1]) return reply.send(locale.SETRANK.DELETE_MISSING_TARGET_ROLE, {
            socket: {
                emoji: await client.getEmoji(`790338393015713812`)
            }
        })
        //  Handle if target role doesn't exists
        const getRole = findRole(this.args[1], message.guild)
        if (!getRole) return reply.send(locale.SETRANK.INVALID_ROLE, {
            socket: {
                emoji: await client.getEmoji(`692428578683617331`)
            }
        })
        //  Handle if the role hasn't been registered in the first place
        const getRegisteredRank = this.subConfig.value.filter(node => node.ROLE === getRole.id)
        if (getRegisteredRank.length <= 0) return reply.send(locale.SETRANK.DELETE_UNREGISTERED_ROLE, {
            socket: {
                emoji: await client.getEmoji(`692428748838010970`)
            }
        })
        //  Delete rank from the guild's configurations entry
        this.subConfig.value = this.subConfig.value.filter(node => node.ROLE !== getRole.id)
        client.db.updateGuildConfiguration({
            configCode: this.subConfigID,
            customizedParameter: this.subConfig.value,
            guild: message.guild,
            setByUserId: message.author.id,
            cacheTo: this.guildConfigurations
        })
        return reply.send(locale.SETRANK.SUCCESSFULLY_DELETED, {
            header: locale.SETRANK.SUCCESSFULLY_DELETED_HEADER,
            status: `success`,
            socket: {
                role: getRole.name
            }
        })
    },

    /**
     * Displaying the configuration status of current guild
     * @return {void}
     */
    async info(client, reply, message, arg, locale, prefix) {
        //  Handle if the main module is disabled in the guild for the first time
        if (!this.primaryConfig.value && !this.primaryConfig.setByUserId) {
            return reply.send(locale.SETRANK.INFO_DISABLED_FIRST_TIME, {
                thumbnail: message.guild.iconURL(),
                header: locale.SETRANK.HEADER_INFO,
                socket: {
                    emoj: await client.getEmoji(`751020535865016420`),
                    prefix: prefix,
                    guild: message.guild.name
                }
            })
        }
        //  Handle if the main module is disabled for the few times
        const localizeTime = await client.db.toLocaltime(this.primaryConfig.updatedAt)
        if (!this.primaryConfig.value && this.primaryConfig.setByUserId) {
            return reply.send(locale.SETRANK.INFO_DISABLED_BY_USER, {
                thumbnail: message.guild.iconURL(),
                header: locale.SETRANK.HEADER_INFO,
                socket: {
                    emoji: await client.getEmoji(`751020535865016420`),
                    prefix: prefix,
                    user: await client.getUsername(this.primaryConfig.setByUserId),
                    date: moment(localizeTime).fromNow(),
                    guild: message.guild.name
                }
            })
        }
        //  Handle if the main module is enabled, but the guild hasn't setting up the ranks yet.
        if (this.primaryConfig.value && (this.subConfig.value.length <= 0)) {
            return reply.send(locale.SETRANK.INFO_ENABLED_ZERO_RANKS, {
                thumbnail: message.guild.iconURL(),
                header: locale.SETRANK.HEADER_INFO,
                socket: {
                    emoji: await client.getEmoji(`751016612248682546`),
                    prefix: prefix,
                    guild: message.guild.name
                }
            })
        }
        //  Otherwise, display info like usual
        const localizeSubConfigTime = await client.db.toLocaltime(this.subConfig.updatedAt)
        return reply.send(locale.SETRANK.INFO_ENABLED, {
            status: `success`,
            thumbnail: message.guild.iconURL(),
            header: locale.SETRANK.HEADER_INFO,
            socket: {
                emoji: await client.getEmoji(`751016612248682546`),
                rankSize: this.subConfig.value.length,
                guild: message.guild.name,
                list: await this._prettifyList(this.subConfig.value, client, message)
            },
            footer: `Updated by ${await client.getUsername(this.subConfig.setByUserId)}, ${moment(localizeSubConfigTime).fromNow()}`
        })
    },

    /**
     * Toggle RANKS_STACK support
     * @return {void}
     */
    stack(client, reply, message, arg, locale) {
        const wasEnabled = message.guild.configs.get(`RANKS_STACK`).value ? 1 : 0
        client.db.updateGuildConfiguration({
            configCode: `RANKS_STACK`,
            //  Act as toggle (enable -> disable or disable -> enable)
            customizedParameter: wasEnabled ? 0 : 1,
            guild: message.guild,
            setByUserId: message.author.id,
            cacheTo: this.guildConfigurations
        })
        return reply.send(locale.SETRANK[wasEnabled ? `STACK_DISABLE` : `STACK_ENABLE`], {
            status: `success`
        })
    },

    /**
     * Wipes out all custom ranks configurations in current guild
     * @return {void}
     */
    async reset(client, reply, message, arg, locale) {
        let timestamp = await client.db.getCurrentTimestamp()
        //  Handle if guild doesn't have any registered rank.
        if (this.subConfig.value.length <= 0) return reply.send(locale.SETRANK.RESET_NULL_RANKS)
        //  Confirmation before performing the action
        const confirmation = await reply.send(``, {
            header: locale.SETRANK.RESET_CONFIRMATION
        })
        const c = new Confirmator(message, reply)
        await c.setup(message.author.id, confirmation)
        c.onAccept(() => {
            //  Reset values
            this.primaryConfig.updatedAt = timestamp
            this.primaryConfig.value = 0
            this.primaryConfig.setByUserId = message.author.id
            this.subConfig.setByUserId = message.author.id
            this.subConfig.updatedAt = timestamp
            this.subConfig.value = []
            client.db.deleteGuildConfiguration(this.subConfigID, message.guild.id)
            return reply.send(locale.SETRANK.SUCCESSFULLY_RESET, {
                status: `success`
            })
        })
    },

    /**
     * Disables the module
     * @return {void}
     */
    async disable(client, reply, message, arg, locale, prefix) {
        //  Handle if the guild already has disabled the configuration
        if (!this.primaryConfig.value) return reply.send(locale.SETRANK.ALREADY_DISABLED, {
            socket: {
                prefix: prefix
            }
        })
        //  Otherwise, update the configuration. Both in the cache and database.
        client.db.updateGuildConfiguration({
            configCode: this.primaryConfigID,
            customizedParameter: 0,
            guild: message.guild,
            setByUserId: message.author.id,
            cacheTo: this.guildConfigurations
        })
        return reply.send(locale.SETRANK.SUCCESSFULLY_DISABLED, {
            status: `success`
        })
    },

    /**
     * Parse & prettify elements from given source.
     * @param {array} [source=[]] refer to guild configuration structure
     * @param {Client} client Current bot instance
     * @param {Message} message Current message instance
     * @returns {string}
     */
    async _prettifyList(source = [], client, message) {
        let res = ``
        for (let i = 0; i < source.length; i++) {
            if (i <= 0) res += `\n╭*:;,．★ ～☆*──────────╮\n\n`
            const rank = source[i]
            const expMeta = await client.experienceLibs(message.member, message.guild).xpReverseFormula(rank.LEVEL)
            res += `**• LV${rank.LEVEL} - ${this._getRoleName(rank.ROLE, message)}**\n> Required EXP: ${commanifier(expMeta.minexp)}\n\n`
            if (i === (source.length - 1)) res += `╰──────────☆～*:;,．*╯\n`
        }
        return res
    },

    /**
     * Parse role's name. Also adds a fallback to ID if name cannot be found.
     * @param {string} [roleId=``] target role
     * @param {Message} message Current message instance
     * @returns {string}
     */
    _getRoleName(roleId = ``, message) {
        const res = message.guild.roles.cache.get(roleId)
        return res ? res.name : roleId
    }
}