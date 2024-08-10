"use strict"
const moment = require(`moment`)
const { ApplicationCommandType, ApplicationCommandOptionType, InteractionType, PermissionFlagsBits, ChannelType } = require(`discord.js`)
/**
 * Displays your server leaderboard!
 * @author klerikdust
 */
module.exports = {
    name: `shoplog`,
    aliases: [],
    name_localizations: {
        fr: `journal de la boutique`
    },
    description_localizations: {
        fr: `Affichage du classement de votre serveur pour l'élément sélectionné !`
    },
    description: `Displaying your server leaderboard for selected item!`,
    usage: `shopLog enable`,
    permissionLevel: 2,
    multiUser: false,
    applicationCommand: true,
    messageCommand: false,
    server_specific: true,
    servers: [`577121315480272908`, `882552960771555359`],
    options: [{
        name: `enable`,
        description: `Enable this module.`,
        name_localizations: {
            fr: `activer`
        },
        description_localizations: {
            fr: `Activez ce module.`
        },
        type: ApplicationCommandOptionType.Subcommand
    }, {
        name: `disable`,
        description: `Disable this module.`,
        name_localizations: {
            fr: `désactiver`
        },
        description_localizations: {
            fr: `Désactivez ce module.`
        },
        type: ApplicationCommandOptionType.Subcommand
    }, {
        name: `channel`,
        description: `Set a specific channel for Annie's shop logs.`,
        name_localizations: {
            fr: `canal`
        },
        description_localizations: {
            fr: `Set a specific channel for Annie's shop logs.`
        },
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            name: `set`,
            description: `Set a specific channel for Annie's shop logs.`,
            name_localizations: {
                fr: `ensemble`
            },
            description_localizations: {
                fr: `Set a specific channel for Annie's shop logs.`
            },
            required: true,
            type: ApplicationCommandOptionType.Channel,
            channel_types: [ChannelType.GuildText, ChannelType.PublicThread, ChannelType.PrivateThread]
        }]
    }
    ],
    /**
     * Current instance's config code
     * @type {string}
     */
    primaryConfigID: `CUSTOM_SHOP_LOG_MODULE`,
    /**
     * Current instance's sub-config code
     * @type {string}
     */
    subConfigID: `CUSTOM_SHOP_LOG_CHANNEL`,
    type: ApplicationCommandType.ChatInput,
    default_member_permissions: PermissionFlagsBits.ManageRoles.toString(),
    async execute(client, reply, message, arg, locale) {
        return await this.run(client, reply, message, locale)
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
        const fn = `[shopLog.enable()]`
        //  Handle if module is already enabled
        if (this.primaryConfig.value) {
            const localizeTime = await client.db.systemUtils.toLocaltime(this.primaryConfig.updatedAt)
            const localed = localizeTime == `now` ? moment().toISOString() : localizeTime
            return await reply.send(locale.SHOP_LOG.ALREADY_ENABLED, {
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
        return await reply.send(locale.SHOP_LOG.SUCCESSFULLY_ENABLED, { status: `success` })
    },

    /**
     * Disable Action
     * @return {void}
     */
    async disable(client, reply, message, arg, locale, prefix) {
        const fn = `[shopLog.disable()]`
        if (!this.primaryConfig.value) {
            return await reply.send(locale.SHOP_LOG.ALREADY_DISABLED, {
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
        await reply.send(locale.SHOP_LOG.SUCCESSFULLY_DISABLED, { status: `success` })
    },
    /**
     * Define target logs channel
     * @return {void}
     */
    async channel(client, reply, message, arg, locale, prefix) {
        //  Handle if module is already enabled
        if (!this.primaryConfig.value) return await reply.send(locale.SHOP_LOG.SHOULD_BE_ENABLED, {
            socket: { prefix: prefix }
        })
        //  Handle if user hasn't specified the target channel
        if (!this.args[1]) return await reply.send(locale.SHOP_LOG.MISSING_CHANNEL, {
            socket: { prefix: prefix, emoji: await client.getEmoji(`692428927620087850`) }
        })
        //  Do channel searching by three possible conditions
        const searchChannel = message.type != InteractionType.ApplicationCommand ? message.mentions.channels.first() ||
            message.guild.channels.cache.get(this.args[1]) ||
            message.guild.channels.cache.find(channel => channel.name === this.args[1].toLowerCase()) : this.args[1]
        //  Handle if target channel couldn't be found
        if (!searchChannel) return await reply.send(locale.SHOP_LOG.INVALID_CHANNEL, {
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
        await reply.send(locale.SHOP_LOG.SUCCESSFULLY_UPDATING_CHANNEL, {
            socket: { channel: searchChannel },
            status: `success`
        })
    }
}