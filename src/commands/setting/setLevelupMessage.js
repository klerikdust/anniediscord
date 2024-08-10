"use strict"
const GUI = require(`../../ui/prebuild/levelUpMessage`)
const Confirmator = require(`../../libs/confirmator`)
const User = require(`../../libs/user`)

const {
    ApplicationCommandType,
    ApplicationCommandOptionType,
    PermissionFlagsBits,
    ChannelType
} = require(`discord.js`)
/**
 * Enable or disable level-up message module for this guild
 * @author klerikdust
 */
module.exports = {
    name: `setlevelupmessage`,
    name_localizations: {
        fr: ``
    },
    description_localizations: {
        fr: ``
    },
    aliases: [`setlevelupmsg`, `setlvlupmsg`, `setlvlupmessage`, `setlevelupmessage`],
    description: `Enable or disable level-up message module for this guild`,
    usage: `setlvlupmsg <Enable/Disable>`,
    permissionLevel: 3,
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    server_specific: false,
    default_member_permissions: PermissionFlagsBits.Administrator.toString(),
    options: [{
        name: `enable`,
        description: `Enable this module.`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.Subcommand,
    }, {
        name: `disable`,
        description: `Disable this module.`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.Subcommand,
    }, {
        name: `channel`,
        description: `Set a specific channel for level-up message.`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.Subcommand,
        options: [
            {
                name: `set`,
                description: `Set a specific channel for level-up message.`,
                name_localizations: {
                    fr: ``
                },
                description_localizations: {
                    fr: ``
                },
                required: true,
                type: ApplicationCommandOptionType.Channel,
                channel_types: [ChannelType.GuildText, ChannelType.PublicThread, ChannelType.PrivateThread]
            }]
    }, {
        name: `channel_reset`,
        description: `Reset the channel for level-up message.`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.Subcommand
    }, {
        name: `text`,
        description: `Set a specific text for level-up message.`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            name: `set`,
            description: `Set a specific text for level-up message.`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            required: true, type: ApplicationCommandOptionType.String
        }]
    }, {
        name: `help`,
        description: `Show help dialoge for this command.`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.Subcommand
    }],
    type: ApplicationCommandType.ChatInput,
    /**
     * An array of the available options for welcomer module
     * @type {array}
     */
    actions: [`enable`, `disable`, `channel`, `text`],
    /**
     * Current instance's config code
     * @type {string}
     */
    primaryConfigID: `LEVEL_UP_MESSAGE`,
    async execute(client, reply, message, arg, locale, prefix) {
        //  Handle if user doesn't specify any arg
        if (!arg) return await reply.send(locale.SETLEVELUPMESSAGE.GUIDE, {
            header: `Hi, ${message.author.username}!`,
            socket: {
                prefix: prefix,
                emoji: await client.getEmoji(`692428660824604717`)
            }
        })
        this.args = arg.split(` `)
        //  Handle if the selected options doesn't exists
        this.selectedAction = this.args[0].toLowerCase()
        if (!this.actions.includes(this.selectedAction)) return await reply.send(locale.SETLEVELUPMESSAGE.INVALID_ACTION, {
            socket: { actions: this.actions.join(`, `) },
        })
        //  Run action
        this.guildConfigurations = message.guild.configs
        this.primaryConfig = this.guildConfigurations.get(this.primaryConfigID)
        return this[this.selectedAction](client, reply, message, arg, locale, prefix)
    },
    async Iexecute(client, reply, interaction, options, locale) {

        if (options.getSubcommand() === `enable`) {
            this.args = [`enable`]
        }
        if (options.getSubcommand() === `disable`) {
            this.args = [`disable`]
        }
        if (options.getSubcommand() === `channel`) {
            this.args = [`channel`, options.getChannel(`set`).id]
        }
        if (options.getSubcommand() === `channel_reset`) {
            this.args = [`channel`, `reset`]
        }
        if (options.getSubcommand() === `text`) {
            this.args = [`text`, options.getString(`set`)]
        }
        if (options.getSubcommand() === `help`) return await reply.send(locale.SETLEVELUPMESSAGE.GUIDE, {
            header: `Hi, ${interaction.member.username}!`,
            socket: {
                prefix: `/`,
                emoji: await client.getEmoji(`692428660824604717`)
            }
        })
        //  Handle if the selected options doesn't exists
        this.selectedAction = this.args[0].toLowerCase()
        if (!this.actions.includes(this.selectedAction)) return await reply.send(locale.SETLEVELUPMESSAGE.INVALID_ACTION, {
            socket: { actions: this.actions.join(`, `) },
        })
        //  Run action
        this.guildConfigurations = interaction.guild.configs
        this.primaryConfig = this.guildConfigurations.get(this.primaryConfigID)
        return this[this.selectedAction](client, reply, interaction, null, locale, `/`)
    },
    /**
     * Enabling levelup-message module
     * @return {void}
     */
    async enable(client, reply, message, arg, locale, prefix) {
        client.db.guildUtils.updateGuildConfiguration({
            configCode: this.primaryConfigID,
            customizedParameter: 1,
            guild: message.guild,
            setByUserId: message.member.id,
            cacheTo: this.guildConfigurations
        })
        return await reply.send(locale.SETLEVELUPMESSAGE.SUCCESSFULLY_ENABLED, {
            socket: { prefix: prefix },
            status: `success`
        })
    },

    /**
     * Disabling levelup-message module.
     * @return {void}
     */
    async disable(client, reply, message, arg, locale) {
        client.db.guildUtils.updateGuildConfiguration({
            configCode: this.primaryConfigID,
            customizedParameter: 0,
            guild: message.guild,
            setByUserId: message.member.id,
            cacheTo: this.guildConfigurations
        })
        return await reply.send(locale.SETLEVELUPMESSAGE.SUCCESSFULLY_DISABLED, { status: `success` })
    },

    /**
     * Registering custom channel for the level-up message.
     * @return {}
     */
    async channel(client, reply, message, arg, locale, prefix) {
        const fn = `[setLevelupMessage.channel]`
        const subConfigId = `LEVEL_UP_MESSAGE_CHANNEL`
        //  Handle if module hasn't been enabled yet
        if (!this.primaryConfig.value) return await reply.send(locale.SETLEVELUPMESSAGE.ALREADY_DISABLED, {
            socket: { prefix: prefix }
        })
        //  Handle if the custom channel already present
        const customLevelUpMessageChannel = this.guildConfigurations.get(subConfigId).value
        if (customLevelUpMessageChannel) {
            //  Handle if no channel parameter has been inputted
            const { isExists, res } = this._getChannel(customLevelUpMessageChannel, message)
            const displayingExistingData = isExists ? `DISPLAY_REGISTERED_CHANNEL` : `DISPLAY_UNREACHABLE_CHANNEL`
            if (!this.args[1]) return await reply.send(locale.SETLEVELUPMESSAGE[displayingExistingData], {
                socket: {
                    prefix: prefix,
                    channel: res || customLevelUpMessageChannel
                }
            })
            //  Handle if user has asked to reset the custom channel
            if (this.args[1] === `reset`) {
                //  Update and finalize
                client.db.guildUtils.updateGuildConfiguration({
                    configCode: subConfigId,
                    customizedParameter: ``,
                    guild: message.guild,
                    setByUserId: message.member.id,
                    cacheTo: this.guildConfigurations
                })
                return await reply.send(locale.SETLEVELUPMESSAGE.SUCCESSFULLY_RESET_CHANNEL, {
                    status: `success`,
                    socket: { emoji: await client.getEmoji(`789212493096026143`) }
                })
            }
        } else {
            //  Handle if no channel parameter has been inputted
            if (!this.args[1]) return await reply.send(locale.SETLEVELUPMESSAGE.MISSING_CHANNEL_PARAMETER, {
                socket: { prefix: prefix }
            })
        }
        //  Handle if target channel does not exist
        const { isExists, res } = this._getChannel(this.args[1], message)
        if (!isExists) return await reply.send(locale.SETLEVELUPMESSAGE.INVALID_CHANNEL, {
            socket: { emoji: await client.getEmoji(`692428578683617331`) }
        })
        //  Update and finalize
        client.db.guildUtils.updateGuildConfiguration({
            configCode: subConfigId,
            customizedParameter: res.id,
            guild: message.guild,
            setByUserId: message.member.id,
            cacheTo: this.guildConfigurations
        })
        return await reply.send(locale.SETLEVELUPMESSAGE.SUCCESSFULLY_SET_CHANNEL, {
            status: `success`,
            socket: {
                channel: res,
                emoji: await client.getEmoji(`789212493096026143`)
            }
        })
    },

    /**
     * Customizing the content of level up message.
     * @return {void}
     */
    async text(client, reply, message, arg, locale, prefix) {
        const fn = `[setLevelupMessage.text]`
        const subConfigId = `LEVEL_UP_TEXT`
        if (!this.primaryConfig.value) return await reply.send(locale.SETLEVELUPMESSAGE.ALREADY_DISABLED, {
            socket: { prefix: prefix }
        })
        if (!this.args[1]) return await reply.send(locale.SETLEVELUPMESSAGE.MISSING_TEXT_PARAMETER, {
            socket: { prefix: prefix }
        })
        let newText = this.args.slice(1).join(` `)
        //  Dummy level-up message for the preview
        const userData = await (new User(client, message)).requestMetadata(message.member, 2, locale)
        await reply.send(newText, {
            prebuffer: true,
            simplified: true,
            image: await new GUI(userData, 60).build(),
            socket: {
                user: message.member
            }
        })
        const confirmation = await reply.send(locale.SETLEVELUPMESSAGE.TEXT_CONFIRMATION)
        const c = new Confirmator(message, reply, locale)
        await c.setup(message.member.id, confirmation)
        c.onAccept(async () => {
            client.db.guildUtils.updateGuildConfiguration({
                configCode: subConfigId,
                customizedParameter: newText,
                guild: message.guild,
                setByUserId: message.member.id,
                cacheTo: this.guildConfigurations
            })
            await reply.send(locale.SETLEVELUPMESSAGE.SUCCESSFULLY_UPDATE_TEXT, {
                status: `success`,
                socket: {
                    emoji: await client.getEmoji(`789212493096026143`)
                }
            })
        })
    },

    /**
     * Fetching channel in the guild
     * @param {*} channelKeyword
     * @param {Message} message Current message instance
     * @return {object}
     */
    _getChannel(channelKeyword, message) {
        //  Omit surrounded symbols if user using #mention method to be used as the searchstring keyword
        channelKeyword = channelKeyword.replace(/[^0-9a-z-A-Z ]/g, ``)
        const channels = message.guild.channels.cache
        const channel = channels.get(channelKeyword) || channels.find(node => node.name.toLowerCase() === channelKeyword.toLowerCase())
        return {
            isExists: channel ? true : false,
            res: channel
        }
    }
}