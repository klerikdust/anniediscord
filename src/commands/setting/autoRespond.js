"use strict"
const moment = require(`moment`)
const Confirmator = require(`../../libs/confirmator`)

const {
    ApplicationCommandType,
    ApplicationCommandOptionType,
    PermissionFlagsBits
} = require(`discord.js`)
/**
 * Create a set of autoresponder!
 * @author klerikdust
 */
module.exports = {
    name: `autorespond`,
    name_localizations: {
        fr: ``
    },
    description_localizations: {
        fr: ``
    },
    aliases: [`autorespond`, `ar`, `autoresponse`, `autorespons`],
    description: `Create a set of autoresponder!`,
    usage: `ar`,
    permissionLevel: 2,
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    server_specific: false,
    default_member_permissions: PermissionFlagsBits.ManageRoles.toString(),
    options: [{
        name: `enable`,
        description: `Enable the autorespond module`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.Subcommand
    }, {
        name: `info`,
        description: `View currently configured ARs`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.Subcommand
    }, {
        name: `reset`,
        description: `Reset the autorespond module`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.Subcommand
    }, {
        name: `disable`,
        description: `Disable the autorespond module`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.Subcommand
    }, {
        name: `help`,
        description: `View a brief help overview for the autoresponder module`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.Subcommand
    }, {
        name: `delete`,
        description: `Delete an AR`,
        type: ApplicationCommandOptionType.Subcommand,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        options: [{
            name: `id_trigger`,
            description: `Delete an AR`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            required: true,
            type: ApplicationCommandOptionType.String
        }]
    }, {
        name: `add`,
        description: `Add an AR`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            name: `id_trigger`,
            description: `Name of AR to add`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            required: true,
            type: ApplicationCommandOptionType.String
        }, {
            name: `response`,
            description: `What to respond with`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            required: true,
            type: ApplicationCommandOptionType.String
        }]
    }],
    type: ApplicationCommandType.ChatInput,
    /**
     * Maximum characters for the trigger.
     * @type {number}
     */
    triggerCharLimit: 156,

    /**
     * Maximum characters for the response.
     * @type {number}
     */
    responseCharLimit: 1900,

    /**
     * List of available actions.
     * @type {array}
     */
    availableActions: [`enable`, `add`, `delete`, `info`, `reset`, `disable`],
    /**
     * Primary ID for current module
     * @type {string}
     */
    primaryConfigID: `AR_MODULE`,
    async execute(client, reply, message, arg, locale, prefix) {
        this.args = arg.split(` `)
        this.guildConfigurations = message.guild.configs
        this.primaryConfig = this.guildConfigurations.get(`AR_MODULE`)
        //  Handle if user doesn't specify any parameter.
        if (!arg) return await reply.send(locale.AUTORESPONDER.GUIDE, {
            image: `banner_autoresponder`,
            header: `Hi, ${message.author.username}!`,
            socket: {
                emoji: await client.getEmoji(`781504248868634627`),
                guild: message.guild.name,
                prefix: prefix,
                statusEmoji: await client.getEmoji(this.primaryConfig.value ? `751016612248682546` : `751020535865016420`),
                status: this.primaryConfig.value ? `enabled` : `disabled`
            }
        })
        //  Handle if the used action is invalid
        this.selectedAction = this.args[0].toLowerCase()
        if (!this.availableActions.includes(this.selectedAction)) return await reply.send(locale.AUTORESPONDER.INVALID_ACTION, {
            socket: {
                actions: this._parseAvailableActions(),
                emoji: await client.getEmoji(`692428969667985458`)
            }
        })
        //  Run action
        return this[this.args[0]](client, reply, message, arg, locale, prefix)
    },
    async Iexecute(client, reply, interaction, options, locale) {
        // const arg = options.getString(`action`)
        if (options.getSubcommand() === `add`) this.args = [`add`, options.getString(`id_trigger`), `-`, options.getString(`response`)]
        if (options.getSubcommand() === `delete`) this.args = [`delete`, options.getString(`id_trigger`)]
        if (options.getSubcommand() === `info`) this.args = [`info`]
        if (options.getSubcommand() === `reset`) this.args = [`reset`]
        if (options.getSubcommand() === `enable`) this.args = [`enable`]
        if (options.getSubcommand() === `disable`) this.args = [`disable`]

        this.guildConfigurations = interaction.guild.configs
        this.primaryConfig = this.guildConfigurations.get(`AR_MODULE`)
        if (options.getSubcommand() === `help`) return await reply.send(locale.AUTORESPONDER.GUIDE, {
            image: `banner_autoresponder`,
            header: `Hi, ${interaction.user.username}!`,
            socket: {
                emoji: await client.getEmoji(`781504248868634627`),
                guild: interaction.guild.name,
                prefix: `/`,
                statusEmoji: await client.getEmoji(this.primaryConfig.value ? `751016612248682546` : `751020535865016420`),
                status: this.primaryConfig.value ? `enabled` : `disabled`
            }
        })

        const arg = this.args.join(` `)
        //  Handle if the used action is invalid
        this.selectedAction = this.args[0].toLowerCase()
        if (!this.availableActions.includes(this.selectedAction)) return await reply.send(locale.AUTORESPONDER.INVALID_ACTION, {
            socket: {
                actions: this._parseAvailableActions(),
                emoji: await client.getEmoji(`692428969667985458`)
            }
        })
        //  Run action
        return this[this.args[0]](client, reply, interaction, arg, locale, `/`, true)
    },

    /**
     * Enabling AR module.
     * @return {void}
     */
    async enable(client, reply, message, arg, locale) {
        //  Handle if module already enabled
        if (this.primaryConfig.value) {
            const localizeTime = await client.db.systemUtils.toLocaltime(this.primaryConfig.updatedAt)
            const localed = localizeTime == `now` ? moment().toISOString() : localizeTime
            return await reply.send(locale.AUTORESPONDER.ALREADY_ENABLED, {
                socket: {
                    emoji: await client.getEmoji(`692428969667985458`),
                    user: await client.getUsername(this.primaryConfig.setByUserId),
                    time: moment(localed).fromNow()
                }
            })
        }
        //  Update configurations
        client.db.guildUtils.updateGuildConfiguration({
            configCode: this.primaryConfigID,
            customizedParameter: 1,
            guild: message.guild,
            setByUserId: message.member.id,
            cacheTo: this.guildConfigurations
        })
        return await reply.send(locale.AUTORESPONDER.SUCCESSFULLY_ENABLED, {
            socket: { emoji: await client.getEmoji(`789212493096026143`) },
            status: `success`
        })
    },

    /**
     * Disabling AR module.
     * @return {void}
     */
    async disable(client, reply, message, arg, locale, prefix) {
        //  Handle if module already disabled
        if (!this.primaryConfig.value) {
            return await reply.send(locale.AUTORESPONDER.ALREADY_DISABLED, {
                socket: {
                    prefix: prefix,
                    emoji: await client.getEmoji(`692428578683617331`)
                }
            })
        }
        //  Update configurations
        client.db.guildUtils.updateGuildConfiguration({
            configCode: this.primaryConfigID,
            customizedParameter: 0,
            guild: message.guild,
            setByUserId: message.member.id,
            cacheTo: this.guildConfigurations
        })
        return await reply.send(locale.AUTORESPONDER.SUCCESSFULLY_DISABLED, {
            socket: { emoji: await client.getEmoji(`692428927620087850`) },
            status: `success`
        })
    },


    /**
     * Displaying the registered ARs.
     * @return {void}
     */
    async info(client, reply, message, arg, locale, prefix) {
        //  Fetch registered ARs.
        const ars = await client.db.autoResponder.getAutoResponders(message.guild.id)
        //  Handle if there are no registered ARs.
        if (ars.length <= 0) return await reply.send(locale.AUTORESPONDER.EMPTY, {
            socket: {
                emoji: await client.getEmoji(`692428969667985458`),
                prefix: prefix
            }
        })
        const localizedTime = await client.db.systemUtils.toLocaltime(ars[0].registered_at)
        const localed = localizedTime == `now` ? moment().toISOString() : localizedTime
        const author = await client.users.fetch(ars[0].user_id)
        return await reply.send(this._parseRegisteredAutoResponders(ars, false, {
            size: ars.length,
            user: author ? author.username : ars[0].user_id,
            time: moment(localed).fromNow(),
            emoji: await client.getEmoji(`692428692999241771`)
        }, message), {
            thumbnail: message.guild.iconURL(),
            header: `Learned ARs`,
            color: `crimson`,
            paging: true
        })
    },

    /**
     * Registering new AR.
     * @return {void}
     */
    async add(client, reply, message, arg, locale, prefix, slashCommand = false) {
        //  Handle if user didn't put any additional parameters
        if (!this.args[1]) return await reply.send(locale.AUTORESPONDER.REGISTER_NO_PARAM, {
            socket: { prefix: prefix }
        })
        const msg = this.args.slice(1).join(` `)
        const splittedContext = msg.split(` - `)
        const trigger = splittedContext[0]
        //  Handle if user hasn't included separator for trigger and separator
        if (!msg.includes(`-`)) return await reply.send(locale.AUTORESPONDER.REGISTER_MISSING_SEPARATOR, {
            socket: {
                prefix: prefix,
                trigger: trigger
            }
        })
        //  Handle if response is empty
        const response = splittedContext[1]
        if (!response) return await reply.send(locale.AUTORESPONDER.REGISTER_EMPTY_RESPONSE, {
            socket: {
                prefix: prefix,
                emoji: await client.getEmoji(`692428969667985458`),
                trigger: trigger
            }
        })
        //  Display AR confirmation
        const confirmation = await await reply.send(locale.AUTORESPONDER.REGISTER_CONFIRMATION, {
            thumbnail: message.member.displayAvatarURL(),
            socket: {
                trigger: trigger,
                response: response
            }
        })
        const c = new Confirmator(message, reply, locale)
        await c.setup(message.member.id, confirmation)
        c.onAccept(async () => {
            //  Register
            client.db.autoResponder.registerAutoResponder({
                guildId: message.guild.id,
                userId: message.member.id,
                trigger: trigger,
                response: response
            })
            //  Finalize
            await await reply.send(locale.AUTORESPONDER.REGISTER_SUCCESSFUL, {
                socket: { emoji: await client.getEmoji(`789212493096026143`) },
                followUp: true
            })
            await await reply.send(locale.AUTORESPONDER.REGISTER_FOOTER_TIP, {
                simplified: true,
                socket: {
                    trigger: trigger,
                    emoji: await client.getEmoji(`692428692999241771`)
                },
                followUp: true
            })
        })
    },

    /**
     * Deleting AR.
     * @return {void}
     */
    async delete(client, reply, message, arg, locale, prefix, slashCommand = false) {
        //  Handle if guild does not have any ARs to be deleted
        const ars = await client.db.autoResponder.getAutoResponders(message.guild.id)
        if (ars.length <= 0) return await reply.send(locale.AUTORESPONDER.EMPTY, {
            socket: {
                emoji: await client.getEmoji(`692428969667985458`),
                prefix: prefix
            }
        })
        //  Handle if user doesn't provide the keyword.
        const keyword = this.args.slice(1).join(` `)
        if (!keyword.length) return await reply.send(locale.AUTORESPONDER.DELETE_MISSING_KEYWORD, {
            socket: {
                guild: message.guild.name,
                prefix: prefix,
                list: this._parseRegisteredAutoResponders(ars, true)
            }
        })
        //  Handle if target AR to be deleted does not exists.
        let targetAR = ars.filter(ar => (ar.ar_id === parseInt(keyword)) || (ar.trigger === keyword))
        if (!targetAR.length) return await reply.send(locale.AUTORESPONDER.DELETE_TARGET_INVALID, {
            socket: { emoji: await client.getEmoji(`692428807193493657`) }
        })
        //  Performs deletion
        targetAR = targetAR[0]
        client.db.autoResponder.deleteAutoResponder(targetAR.ar_id, message.guild.id)
        return await reply.send(locale.AUTORESPONDER.SUCCESSFULLY_DELETED, {
            socket: { emoji: await client.getEmoji(`789212493096026143`) },
            status: `success`
        })
    },

    /**
     * Deletes all the registered ARs from specific server.
     * @return {void}
     */
    async reset(client, reply, message, arg, locale, prefix) {
        //  Handle if guild does not have any ARs to be deleted
        const ars = await client.db.autoResponder.getAutoResponders(message.guild.id)
        if (ars.length <= 0) return await reply.send(locale.AUTORESPONDER.EMPTY, {
            socket: {
                emoji: await client.getEmoji(`692428969667985458`),
                prefix: prefix
            }
        })
        //  Reset confirmation
        const confirmation = await await reply.send(locale.AUTORESPONDER.RESET_CONFIRMATION, {
            socket: {
                totalArs: ars.length,
                emoji: await client.getEmoji(`692428578683617331`,)
            }
        })
        const c = new Confirmator(message, reply, locale)
        await c.setup(message.member.id, confirmation)
        c.onAccept(async () => {
            //  Wipeout ARs
            client.db.autoResponder.clearAutoResponders(message.guild.id)
            await reply.send(locale.AUTORESPONDER.SUCCESSFULLY_RESET, {
                socket: { totalArs: ars.length }
            })
        })
    },

    /**
     * Trimming AR content (response/trigger).
     * @param {string} [str=``] Target AR response/trigger.
     * @param {number} [breakpoint=70] The string breakpoint before gets trimmed. Optional.
     * @return {string}
     */
    _trimAutoResponderString(str = ``, breakpoint = 70) {
        if (str.length >= breakpoint) return str.substring(0, breakpoint) + `...`
        return str
    },

    /**
     * Parsing registered ARs into proper format.
     * @param {array} [src=[]] ARs source.
     * @param {boolean} [simplified=false] Set message as simple w/o embed
     * @param {object} [headerMetadata={}]
     * @param {Message} message Current message instance.
     * @return {object|string}
     */
    _parseRegisteredAutoResponders(src = [], simplified = false, header = {}, message) {
        let res = []
        let str = ``
        let breakpoint = 0
        for (let i = 0; i < src.length; i++) {
            const ar = src[i]
            if (simplified) {
                str += `╰☆～(ID:${ar.ar_id}) **${ar.trigger}**\n`
                continue
            }
            breakpoint++
            if (breakpoint <= 1) {
                str += `Currently there are total of **${header.size}** registered ARs in **${message.guild.name}** where the latest one was added by ${header.user}, ${header.time}. ${header.emoji}\n╭*:;,．★ ～☆*────────╮\n`
            }
            str += `[ID:${ar.ar_id}]** "${this._trimAutoResponderString(ar.trigger)}"**\n> Annie's Response: ${this._trimAutoResponderString(ar.response)}`
            if (breakpoint >= 5 || i === (src.length - 1)) {
                str += `\n╰──────────☆～*:;,．*╯`
                breakpoint = 0
                res.push(str)
                str = ``
            } else {
                str += `\n⸻⸻⸻⸻\n`
            }
        }
        return simplified ? str : res
    },

    /**
     * Parsing available actions into proper format.
     * @return {string}
     */
    _parseAvailableActions() {
        let str = ``
        for (let i = 0; i < this.availableActions.length; i++) {
            const action = this.availableActions[i]
            if ((i + 1) === this.availableActions.length) {
                str += ` and **\`${action}\`**`
                break
            }
            str += `**\`${action}\`**, `
        }
        return str
    }
}