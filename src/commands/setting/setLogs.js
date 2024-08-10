"use strict"
const moment = require(`moment`)
const {
    ApplicationCommandType,
    ApplicationCommandOptionType,
    PermissionFlagsBits,
    InteractionType,
    ChannelType
} = require(`discord.js`)
/**
 * Customize Logging-System for your guild
 * @author klerikdust
 */
module.exports = {
    name: `setlogs`,
    name_localizations: {
        fr: ``
    },
    description_localizations: {
        fr: ``
    },
    aliases: [`setlogs`, `setlog`, `setlogging`],
    description: `Customize Logging-System for your guild`,
    usage: `setlog`,
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
        type: ApplicationCommandOptionType.Subcommand
    }, {
        name: `disable`,
        description: `Disable this module.`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.Subcommand
    }, {
        name: `channel`,
        description: `Set a specific channel for Annie's logs.`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            name: `set`,
            description: `Set a specific channel for Annie's logs.`,
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
    }],
    type: ApplicationCommandType.ChatInput,
    /**
     * List of available actions for the current command
     * @type {array}
     */
    actions: [`enable`, `disable`, `channel`],
    /**
     * Current instance's config code
     * @type {string}
     */
    primaryConfigID: `LOGS_MODULE`,
    /**
     * Current instance's sub-config code
     * @type {string}
     */
    subConfigID: `LOGS_CHANNEL`,
    async execute(client, reply, message, arg, locale, prefix) {
        //  Handle if user doesn't specify any arg
        if (!arg) return await reply.send(locale.SETLOGS.GUIDE, {
            header: `Hi, ${message.author.username}!`,
            image: `banner_setlogs`,
            socket: {
                prefix: prefix,
                emoji: await client.getEmoji(`692428927620087850`)
            }
        })
        this.args = arg.split(` `)
        //  Handle if selected action doesn't exists
        if (!this.actions.includes(this.args[0])) return await reply.send(locale.SETLOGS.INVALID_ACTION, {
            socket: { actions: this.actions.join(`, `) },
        })
        //  This is the main configuration of setlogs, so everything dependant on this value
        this.guildConfigurations = message.guild.configs
        this.primaryConfig = this.guildConfigurations.get(this.primaryConfigID)
        this.subConfig = this.guildConfigurations.get(this.subConfigID)
        return this[this.args[0]](client, reply, message, arg, locale, prefix)
    },
    async Iexecute(client, reply, interaction, options, locale) {
        if (options.getSubcommand() === `enable`) {
            this.args = [`enable`]
        }
        if (options.getSubcommand() === `disable`) {
            this.args = [`disable`]
        }
        if (options.getSubcommand() === `channel`) {
            this.args = [`channel`, options.getChannel(`set`)]
        }
        this.guildConfigurations = interaction.guild.configs
        this.primaryConfig = this.guildConfigurations.get(this.primaryConfigID)
        this.subConfig = this.guildConfigurations.get(this.subConfigID)
        return this[this.args[0]](client, reply, interaction, null, locale, `/`)
    },
    /**
     * Enable Action
     * @return {void}
     */
    async enable(client, reply, message, arg, locale) {
        const fn = `[setLogs.enable()]`
        //  Handle if module is already enabled
        if (this.primaryConfig.value) {
            const localizeTime = await client.db.systemUtils.toLocaltime(this.primaryConfig.updatedAt)
            const localed = localizeTime == `now` ? moment().toISOString() : localizeTime
            return await reply.send(locale.SETLOGS.ALREADY_ENABLED, {
                socket: {
                    user: await client.getUsername(this.primaryConfig.setByUserId),
                    date: moment(localed).fromNow()
                }
            })
        }
        //  Update configs
        client.db.guildUtils.updateGuildConfiguration({
            configCode: this.primaryConfigID,
            customizedParameter: 1,
            guild: message.guild,
            setByUserId: message.member.id,
            cacheTo: this.guildConfigurations
        })
        return await reply.send(locale.SETLOGS.SUCCESSFULLY_ENABLED, { status: `success` })
    },

    /**
     * Disable Action
     * @return {void}
     */
    async disable(client, reply, message, arg, locale, prefix) {
        const fn = `[setLogs.disable()]`
        if (!this.primaryConfig.value) {
            return await reply.send(locale.SETLOGS.ALREADY_DISABLED, {
                socket: { prefix: prefix }
            })
        }
        //  Update configs
        client.db.guildUtils.updateGuildConfiguration({
            configCode: this.primaryConfigID,
            customizedParameter: 0,
            guild: message.guild,
            setByUserId: message.member.id,
            cacheTo: this.guildConfigurations
        })
        await reply.send(locale.SETLOGS.SUCCESSFULLY_DISABLED, { status: `success` })
    },

    /**
     * Define target logs channel
     * @return {void}
     */
    async channel(client, reply, message, arg, locale, prefix) {
        //  Handle if module is already enabled
        if (!this.primaryConfig.value) return await reply.send(locale.SETLOGS.SHOULD_BE_ENABLED, {
            socket: { prefix: prefix }
        })
        //  Handle if user hasn't specified the target channel
        if (!this.args[1]) return await reply.send(locale.SETLOGS.MISSING_CHANNEL, {
            socket: { prefix: prefix, emoji: await client.getEmoji(`692428927620087850`) }
        })
        //  Do channel searching by three possible conditions
        const searchChannel = message.type != InteractionType.ApplicationCommand ? message.mentions.channels.first() ||
            message.guild.channels.cache.get(this.args[1]) ||
            message.guild.channels.cache.find(channel => channel.name === this.args[1].toLowerCase()) : this.args[1]
        //  Handle if target channel couldn't be found
        if (!searchChannel) return await reply.send(locale.SETLOGS.INVALID_CHANNEL, {
            socket: { emoji: await client.getEmoji(`692428969667985458`) }
        })
        //  Update configs
        client.db.guildUtils.updateGuildConfiguration({
            configCode: this.subConfigID,
            customizedParameter: searchChannel.id,
            guild: message.guild,
            setByUserId: message.member.id,
            cacheTo: this.guildConfigurations
        })
        await reply.send(locale.SETLOGS.SUCCESSFULLY_UPDATING_CHANNEL, {
            socket: { channel: searchChannel },
            status: `success`
        })
    }
}