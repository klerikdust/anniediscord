"use strict"
const Confirmator = require(`../../libs/confirmator`)

const {
    ApplicationCommandType,
    ApplicationCommandOptionType,
    PermissionFlagsBits,
    ChannelType
} = require(`discord.js`)
/**
 * Set a specific channel for Annie's command usage..
 * @author klerikdust
 */
module.exports = {
    name: `setcommand`,
    name_localizations: {
        fr: ``
    },
    description_localizations: {
        fr: ``
    },
    aliases: [`setcommand`, `setcommands`, `setcmd`],
    description: `Set a specific channel for Annie's command usage.`,
    usage: `setcommand <channel/info/reset>`,
    permissionLevel: 3,
    multiUser: false,
    default_member_permissions: PermissionFlagsBits.Administrator.toString(),
    applicationCommand: true,
    messageCommand: true,
    server_specific: false,
    options: [{
        name: `channel`,
        description: `Action to perform.`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            name: `set`,
            description: `Set a specific channel for Annie's command usage.`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            required: true,
            type: ApplicationCommandOptionType.Channel,
            channel_types: [ChannelType.GuildText, ChannelType.PublicThread, ChannelType.PrivateThread]
        }, {
            name: `additional_channel_1`,
            description: `Set a specific channel for Annie's command usage.`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            required: false,
            type: ApplicationCommandOptionType.Channel,
            channel_types: [ChannelType.GuildText, ChannelType.PublicThread, ChannelType.PrivateThread]
        }, {
            name: `additional_channel_2`,
            description: `Set a specific channel for Annie's command usage.`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            required: false,
            type: ApplicationCommandOptionType.Channel,
            channel_types: [ChannelType.GuildText, ChannelType.PublicThread, ChannelType.PrivateThread]
        }, {
            name: `additional_channel_3`,
            description: `Set a specific channel for Annie's command usage.`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            required: false,
            type: ApplicationCommandOptionType.Channel,
            channel_types: [ChannelType.GuildText, ChannelType.PublicThread, ChannelType.PrivateThread]
        }, {
            name: `additional_channel_4`,
            description: `Set a specific channel for Annie's command usage.`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            required: false,
            type: ApplicationCommandOptionType.Channel,
            channel_types: [ChannelType.GuildText, ChannelType.PublicThread, ChannelType.PrivateThread]
        }, {
            name: `additional_channel_5`,
            description: `Set a specific channel for Annie's command usage.`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            required: false,
            type: ApplicationCommandOptionType.Channel,
            channel_types: [ChannelType.GuildText, ChannelType.PublicThread, ChannelType.PrivateThread]
        }]
    }, {
        name: `reset`,
        description: `Action to perform.`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.Subcommand
    }],
    type: ApplicationCommandType.ChatInput,
    configId: `COMMAND_CHANNELS`,
    async execute(client, reply, message, arg, locale, prefix) {
        const actions = [`channel`, `reset`]
        const currentCommandChannels = message.guild.configs.get(`COMMAND_CHANNELS`).value
        //  Handle if user doesn't specify the new bio/description
        if (!arg) return await reply.send(locale.SETCOMMAND.GUIDE, {
            header: `Hi, ${message.author.username}!`,
            image: `banner_setcommand`,
            socket: {
                prefix: prefix,
                channelStatus: currentCommandChannels.length > 0 ?
                    `currently there are total of ${currentCommandChannels.length} command channels in this server.` :
                    `but since there are no command channel has been set, I'm currently listening to all the visible channels.`
            }
        })
        this.args = arg.split(` `)
        const targetAction = this.args[0].toLowerCase()
        if (!actions.includes(targetAction)) return await reply.send(locale.SETCOMMAND.INVALID_ACTION, {
            socket: { prefix: prefix }
        })
        return this[targetAction](client, reply, message, arg, locale)
    },
    async Iexecute(client, reply, interaction, options, locale) {
        this.args = options.getSubcommand() == `channel` ? [options.getChannel(`set`).id] : options.getSubcommand() == `reset` ? `reset` : null
        if (options.getSubcommand() == `channel` && options.getChannel(`additional_channel_1`)) this.args.push(options.getChannel(`additional_channel_1`).id)
        if (options.getSubcommand() == `channel` && options.getChannel(`additional_channel_2`)) this.args.push(options.getChannel(`additional_channel_2`).id)
        if (options.getSubcommand() == `channel` && options.getChannel(`additional_channel_3`)) this.args.push(options.getChannel(`additional_channel_3`).id)
        if (options.getSubcommand() == `channel` && options.getChannel(`additional_channel_4`)) this.args.push(options.getChannel(`additional_channel_4`).id)
        if (options.getSubcommand() == `channel` && options.getChannel(`additional_channel_5`)) this.args.push(options.getChannel(`additional_channel_5`).id)
        const targetAction = options.getSubcommand() == `channel` ? `channel` : options.getSubcommand() == `reset` ? `reset` : null
        return this[targetAction](client, reply, interaction, this.args, locale)
    },
    /**
     * Perform channel add action.
     * @return {void}
     */
    async channel(client, reply, message, arg, locale) {
        let channelsContainer = message.guild.configs.get(`COMMAND_CHANNELS`).value
        if (!this.args) return await reply.send(locale.SETCOMMAND.MISSING_TARGET_CHANNEL, {
            socket: {
                emoji: await client.getEmoji(`AnnieMad2`)
            }
        })

        const specifiedChannels = message.type == 0 ? this.args.slice(1) : this.args
        const thinkingEmoji = await client.getEmoji(`692428969667985458`)
        const madEmoji = await client.getEmoji(`692428748838010970`)
        //  Iterate over multi channel registering
        for (let i = 0; i < specifiedChannels.length; i++) {
            const ch = specifiedChannels[i].toLowerCase().replace(/[^0-9a-z-A-Z ]/g, ``)
            const targetNewChannel = message.guild.channels.cache.get(ch) ||
                message.guild.channels.cache.find(channel => channel.name.toLowerCase() === ch)
            if (!targetNewChannel) return await reply.send(locale.SETCOMMAND.INVALID_NEW_CHANNEL, {
                socket: {
                    channel: ch,
                    emoji: thinkingEmoji
                }
            })
            if (channelsContainer.includes(targetNewChannel.id)) return await reply.send(locale.SETCOMMAND.CHANNEL_ALREADY_REGISTERED, {
                socket: {
                    emoji: madEmoji
                }
            })
            channelsContainer.push(targetNewChannel.id)
        }
        // Update existing pool
        client.db.guildUtils.updateGuildConfiguration({
            configCode: this.configId,
            customizedParameter: channelsContainer,
            guild: message.guild,
            setByUserId: message.member.id,
            cacheTo: message.guild.configs
        })
        return await reply.send(locale.SETCOMMAND.UPDATE_CHANNEL_SUCCESSFUL, {
            status: `success`,
            socket: {
                channel: specifiedChannels.length,
                emoji: await client.getEmoji(`789212493096026143`)
            }
        })
    },

    /**
     * Perform channel reset action.
     * @return {void} 
     */
    async reset(client, reply, message, arg, locale) {
        const currentChannels = message.guild.configs.get(`COMMAND_CHANNELS`).value
        if (!currentChannels.length) return await reply.send(locale.SETCOMMAND.CHANNEL_POOL_ALREADY_EMPTY, {
            socket: {
                emoji: await client.getEmoji(`AnnieYandereAnim`)
            }
        })
        const confirmation = await reply.send(locale.SETCOMMAND.RESET_CONFIRMATION, {
            header: `Reset command channels?`,
            socket: {
                totalChannels: currentChannels.length,
                emoji: await client.getEmoji(`692428785571856404`)
            }
        })
        const c = new Confirmator(message, reply, locale)
        await c.setup(message.member.id, confirmation)
        c.onAccept(async () => {
            //  Reset configuration
            client.db.guildUtils.updateGuildConfiguration({
                configCode: this.configId,
                customizedParameter: [],
                guild: message.guild,
                setByUserId: message.member.id,
                cacheTo: message.guild.configs
            })
            return await reply.send(locale.SETCOMMAND.RESET_SUCCESSFUL, {
                status: `success`,
                socket: {
                    emoji: await client.getEmoji(`789212493096026143`)
                }
            })
        })
    }
}