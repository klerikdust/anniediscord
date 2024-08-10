"use strict"
const Confirmator = require(`../../libs/confirmator`)
const GUI = require(`../../ui/prebuild/welcomer`)
const moment = require(`moment`)
const fs = require(`fs`)
const superagent = require(`superagent`)
const {
    v4: uuidv4
} = require(`uuid`)
const findRole = require(`../../utils/findRole`)
const { Collection } = require(`discord.js`)

const {
    ApplicationCommandType,
    ApplicationCommandOptionType,
    PermissionFlagsBits,
    ChannelType
} = require(`discord.js`)
/**
 * Manage welcomer module for your guild.
 * @author klerikdust
 */
module.exports = {
    name: `setwelcomer`,
    name_localizations: {
        fr: ``
    },
    description_localizations: {
        fr: ``
    },
    aliases: [`setwelcomer`, `setwelcome`, `setwlcm`],
    description: `Manage welcomer module for your guild.`,
    usage: `setWelcomer`,
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
        name: `preview`,
        description: `Preview this module.`,
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
            description: `The channel to set for Annie's logs.`,
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
        name: `text`,
        description: `Set text for welcomer module.`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            name: `set`,
            description: `The text to set for the welcome message.`,
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
        name: `role`,
        description: `The role to set for the welcome message.`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            name: `set`,
            description: `The role to set for the welcome message.`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            required: true,
            type: ApplicationCommandOptionType.Role
        }]
    }, {
        name: `reset_role`,
        description: `Reset the welcome role.`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.Subcommand
    }, {
        name: `image`,
        description: `Set an image for the welcome message.`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.SubcommandGroup,
        options: [{
            name: `attachment`,
            description: `Set an image from an attachment.`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            type: ApplicationCommandOptionType.Subcommand,
            options: [{
                name: `set`,
                description: `The image to set for the welcome message.`,
                name_localizations: {
                    fr: ``
                },
                description_localizations: {
                    fr: ``
                },
                required: true,
                type: ApplicationCommandOptionType.Attachment
            }]
        }, {
            name: `url`,
            description: `Set an image from a url.`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            type: ApplicationCommandOptionType.Subcommand,
            options: [{
                name: `set`,
                description: `The image to set for the welcome message.`,
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
            name: `reset`,
            description: `Resets the welcomer image back to default.`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            type: ApplicationCommandOptionType.Subcommand
        }]
    }, {
        name: `userimage`,
        description: `Allow user set image for welcome message.`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.Subcommand,
    }, {
        name: `multiple`,
        description: `Send a welcome message to a specfic channel based on roles/channels`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.SubcommandGroup,
        options: [{
            name: `add`,
            description: `Add a channel to recieve welcome messages`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            type: ApplicationCommandOptionType.Subcommand,
            options: [{
                name: `channel`,
                description: `Channel name`,
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
                name: `text`,
                description: `Set text for welcome message in this channel.`,
                name_localizations: {
                    fr: ``
                },
                description_localizations: {
                    fr: ``
                },
                type: ApplicationCommandOptionType.String,
                required: true,
            }]
        }, {
            name: `remove`,
            description: `Remove a channel to recieve welcome messages`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            type: ApplicationCommandOptionType.Subcommand,
            options: [{
                name: `channel`,
                description: `Channel name`,
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
            name: `list`,
            description: `view all channels that can recieve welcome messages`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            type: ApplicationCommandOptionType.Subcommand,
        }]
    }, {
        name: `onboardwait`,
        description: `Wait for user to finish onboarding before sending welcome message.`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            name: `wait`,
            description: `toggle to wait or not`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            required: true,
            type: ApplicationCommandOptionType.Boolean,
        }]
    }, {
        name: `noimage`,
        description: `Allow user set image for welcome message.`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.Subcommand,
    }, {
        name: `theme`,
        description: `Set a theme for the welcome message.`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            name: `set`,
            description: `The theme to set for the welcome message.`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            required: true,
            type: ApplicationCommandOptionType.String,
            choices: [{ name: `light`, value: `light` }, { name: `dark`, value: `dark` }]
        }]
    }],
    type: ApplicationCommandType.ChatInput,
    /**
     * An array of the available options for welcomer module
     * @type {array}
     */
    actions: [`enable`, `disable`, `channel`, `text`, `role`, `image`, `userimage`, `noimage`, `theme`, `preview`, `multipleadd`, `multipleremove`, `multiplelist`, `onboardwait`],

    /**
     * Reference key to welcomer sub-modules config code.
     * @type {object}
     */
    actionReference: {
        "enable": `WELCOMER_MODULE`,
        "disable": `WELCOMER_MODULE`,
        "channel": `WELCOMER_CHANNEL`,
        "text": `WELCOMER_TEXT`,
        "role": `WELCOMER_ROLES`,
        "image": `WELCOMER_IMAGE`,
        "userimage": `WELCOMER_USERIMAGE`,
        "noimage": `WELCOMER_NOIMAGE`,
        "theme": `WELCOMER_THEME`,
        "multipleadd": `WELCOMER_ADDITIONAL_CHANNELS`,
        "multipleremove": `WELCOMER_ADDITIONAL_CHANNELS`,
        "multiplelist": `WELCOMER_ADDITIONAL_CHANNELS`,
        "onboardwait": `WELCOMER_ONBOARDWAIT`
    },
    async execute(client, reply, message, arg, locale, prefix) {
        if (!arg) return await reply.send(locale.SETWELCOMER.GUIDE, {
            image: `banner_setwelcomer`,
            header: `Hi, ${message.member.user.username}!`,
            socket: {
                prefix: prefix,
                emoji: await client.getEmoji(`692428660824604717`)
            }
        })
        this.args = arg.split(` `)
        //  Handle if the selected options doesn't exists
        if (!this.actions.includes(this.args[0].toLowerCase())) return await reply.send(locale.SETWELCOMER.INVALID_ACTION, {
            socket: {
                availableActions: this.actions.join(`, `)
            }
        })
        //  Run action
        this.annieRole = (await message.guild.members.fetch(client.user.id)).roles.highest
        this.guildConfigurations = message.guild.configs
        this.action = this.args[0]
        this.selectedModule = this.actionReference[this.action]
        //  This is the main configuration of setwelcomer, so everything dependant on this value
        this.primaryConfig = this.guildConfigurations.get(`WELCOMER_MODULE`)
        return this[this.args[0].toLowerCase()](client, reply, message, locale, prefix)
    },
    async Iexecute(client, reply, interaction, options, locale) {
        if (options.getSubcommand() === `enable`) {
            this.action = `enable`
            this.args = [this.action]
        }
        if (options.getSubcommand() === `disable`) {
            this.action = `disable`
            this.args = [this.action]
        }
        if (options.getSubcommand() === `channel`) {
            this.action = `channel`
            this.args = [this.action, options.getChannel(`set`).id]
        }
        if (options.getSubcommand() === `text`) {
            this.action = `text`
            this.args = [this.action, options.getString(`set`)]
        }
        if (options.getSubcommand() === `role`) {
            this.action = `role`
            this.args = [this.action, options.getRole(`set`).id]
        }
        if (options.getSubcommand() === `reset_role`) {
            this.action = `role`
            this.args = [this.action, `reset`]
        }
        if (options.getSubcommandGroup() === `image`) {
            if (options.getSubcommand() === `attachment`) {
                this.action = `image`
                this.args = [this.action, options.getAttachment(`set`).url]
            } else if (options.getSubcommand() === `url`) {
                this.action = `image`
                this.args = [this.action, options.getString(`set`)]
            } else if (options.getSubcommand() === `reset`) {
                this.action = `imagereset`
                this.args = [this.action]
            }
        }
        if (options.getSubcommand() === `userimage`) {
            this.action = `userimage`
            this.args = [this.action]
        }
        if (options.getSubcommand() === `noimage`) {
            this.action = `noimage`
            this.args = [this.action]
        }
        if (options.getSubcommand() === `theme`) {
            this.action = `theme`
            this.args = [this.action, options.getString(`set`)]
        }
        if (options.getSubcommand() === `preview`) {
            this.action = `preview`
            this.args = [this.action]
        }
        if (options.getSubcommandGroup() === `multiple`) {
            if (options.getSubcommand() === `add`) {
                this.action = `multipleadd`
                this.args = [this.action, options.getChannel(`channel`).id, options.getString(`text`)]
            } else if (options.getSubcommand() === `remove`) {
                this.action = `multipleremove`
                this.args = [this.action, options.getChannel(`channel`).id]
            } else if (options.getSubcommand() === `list`) {
                this.action = `multiplelist`
                this.args = [this.action]
            }
        }
        if (options.getSubcommand() === `onboardwait`) {
            this.action = `onboardwait`
            this.args = [this.action, options.getBoolean(`wait`)]
        }
        //  Run action
        this.annieRole = (await interaction.guild.members.fetch(client.user.id)).roles.highest
        this.guildConfigurations = interaction.guild.configs
        this.selectedModule = this.actionReference[this.action]
        //  This is the main configuration of setwelcomer, so everything dependant on this value
        this.primaryConfig = this.guildConfigurations.get(`WELCOMER_MODULE`)
        return this[this.args[0].toLowerCase()](client, reply, interaction, locale, `/`)
    },
    async onboardwait(client, reply, message, locale, prefix) {
        if (!this.primaryConfig.value) return await reply.send(locale.SETWELCOMER.ALREADY_DISABLED, {
            socket: {
                prefix: prefix
            }
        })
        // WELCOMER_ONBOARDWAIT
        if (!(await message.guild.fetchOnboarding()).enabled) return await reply.send(`Onboarding must be turned on first`)
        const currentSelection = this.guildConfigurations.get(this.selectedModule).value === 0 ? false : this.guildConfigurations.get(this.selectedModule).value === 1 ? true : false
        const changeSelection = typeof (this.args[1]) === `string` ? this.args[1].toLowerCase() === `true` ? 1 : this.args[1].toLowerCase() === `false` ? 0 : 0 : this.args[1]
        const valueToAddToDB = changeSelection ? 1 : 0
        if (currentSelection === changeSelection) return await reply.send(`Module is already configured`)

        client.db.guildUtils.updateGuildConfiguration({
            configCode: this.selectedModule,
            customizedParameter: valueToAddToDB,
            guild: message.guild,
            setByUserId: message.member.id,
            cacheTo: this.guildConfigurations
        })
        return await reply.send(locale.SETWELCOMER.ONBOARDWAIT_CONFIRM, {
            status: `success`,
            socket: {
                setting: changeSelection ? `enabled` : `disabled`
            }
        })
    },
    async multiplelist(client, reply, message, locale, prefix) {
        if (!this.primaryConfig.value) return await reply.send(locale.SETWELCOMER.ALREADY_DISABLED, {
            socket: {
                prefix: prefix
            }
        })
        const PARENT_CONFIG_CHANNEL = this.guildConfigurations.get(`WELCOMER_CHANNEL`)

        if (!PARENT_CONFIG_CHANNEL) return await reply.send(locale.SETWELCOMER.NO_DEFAULT_CHANNEL)
        const channels_raw = !this.guildConfigurations.get(this.selectedModule) ? [] : this.guildConfigurations.get(this.selectedModule).value
        return await reply.send(locale.SETWELCOMER.ADDITIONAL_CHANNELS, {
            socket: {
                channels: `<#${PARENT_CONFIG_CHANNEL.value}>, ${(channels_raw.map(x => `<#${x.channel}>`)).join(`, `)}`
            }
        })
    },
    async multipleremove(client, reply, message, locale, prefix) {
        if (!this.primaryConfig.value) return await reply.send(locale.SETWELCOMER.ALREADY_DISABLED, {
            socket: {
                prefix: prefix
            }
        })
        const PARENT_CONFIG_CHANNEL = this.guildConfigurations.get(`WELCOMER_CHANNEL`)

        if (!PARENT_CONFIG_CHANNEL) return await reply.send(locale.SETWELCOMER.NO_DEFAULT_CHANNEL)
        let channels_raw = !this.guildConfigurations.get(this.selectedModule) ? [] : this.guildConfigurations.get(this.selectedModule).value
        let channelsWithText = new Collection(channels_raw.map((obj) => [obj.channel, obj.text]))
        //  Handle if search keyword isn't provided
        if (!this.args[1]) return await reply.send(locale.SETWELCOMER.EMPTY_CHANNEL_PARAMETER, {
            socket: {
                prefix: prefix
            }
        })
        let testCondition = false
        if (message.mentions) {
            testCondition = message.mentions.channels.first() || message.guild.channels.cache.get(this.args[1]) ||
                message.guild.channels.cache.find(channel => channel.name === this.args[1].toLowerCase())
        } else {
            testCondition = message.guild.channels.cache.get(this.args[1]) ||
                message.guild.channels.cache.find(channel => channel.name === this.args[1].toLowerCase())
        }

        //  Do channel searching by three possible conditions
        const searchChannel = testCondition
        //  Handle if target channel couldn't be found
        if (!searchChannel) return await reply.send(locale.SETWELCOMER.INVALID_CHANNEL, {
            socket: {
                emoji: await client.getEmoji(`692428578683617331`)
            }
        })
        let condition = channelsWithText.has(searchChannel.id)
        if (!condition) return await reply.send(locale.SETWELCOMER.ADDITIONAL_CHANNEL_FAIL_NOT_REGISTERED, {
            status: `fail`
        })

        channelsWithText.delete(searchChannel.id)
        const channels = Array.from(channelsWithText, ([channel, text]) => ({ channel, text }))

        client.db.guildUtils.updateGuildConfiguration({
            configCode: this.selectedModule,
            customizedParameter: channels,
            guild: message.guild,
            setByUserId: message.member.id,
            cacheTo: this.guildConfigurations
        })
        return await reply.send(locale.SETWELCOMER.ADDITIONAL_CHANNEL_SUCCESSFULLY_REGISTERED, {
            status: `success`,
            socket: {
                channels: `<#${PARENT_CONFIG_CHANNEL.value}>, ${(channels.map(x => `<#${x.channel}>`)).join(`, `)}`
            }
        })
    },
    async multipleadd(client, reply, message, locale, prefix) {
        if (!this.primaryConfig.value) return await reply.send(locale.SETWELCOMER.ALREADY_DISABLED, {
            socket: {
                prefix: prefix
            }
        })
        const PARENT_CONFIG_CHANNEL = this.guildConfigurations.get(`WELCOMER_CHANNEL`)
        const PARENT_CONFIG_TEXT = this.guildConfigurations.get(`WELCOMER_TEXT`)

        if (!PARENT_CONFIG_CHANNEL || !PARENT_CONFIG_TEXT) return await reply.send(locale.SETWELCOMER.NO_DEFAULT_CHANNEL)
        let channels_raw = !this.guildConfigurations.get(this.selectedModule).value ? [] : this.guildConfigurations.get(this.selectedModule).value
        let channelsWithText = new Collection(channels_raw.map((obj) => [obj.channel, obj.text]))
        channelsWithText.set(PARENT_CONFIG_CHANNEL.value, PARENT_CONFIG_TEXT.value)

        //  Handle if search keyword isn't provided
        if (!this.args[1]) return await reply.send(locale.SETWELCOMER.EMPTY_CHANNEL_PARAMETER, {
            socket: {
                prefix: prefix
            }
        })
        let testCondition = false
        if (message.mentions) {
            testCondition = message.mentions.channels.first() || message.guild.channels.cache.get(this.args[1]) ||
                message.guild.channels.cache.find(channel => channel.name === this.args[1].toLowerCase())
        } else {
            testCondition = message.guild.channels.cache.get(this.args[1]) ||
                message.guild.channels.cache.find(channel => channel.name === this.args[1].toLowerCase())
        }

        //  Do channel searching by three possible conditions
        const searchChannel = testCondition
        //  Handle if target channel couldn't be found
        if (!searchChannel) return await reply.send(locale.SETWELCOMER.INVALID_CHANNEL, {
            socket: {
                emoji: await client.getEmoji(`692428578683617331`)
            }
        })

        /**
         * Put all info together to save to db
         */
        let condition = channelsWithText.has(searchChannel.id)
        // let condition = channels.includes(searchChannel.id) || channels.includes(PARENT_CONFIG.value)
        if (condition) return await reply.send(locale.SETWELCOMER.ADDITIONAL_CHANNEL_FAIL_REGISTERED, {
            status: `fail`
        })

        channelsWithText.set(searchChannel.id, this.args[2])
        channelsWithText.delete(PARENT_CONFIG_CHANNEL.value)
        const channels = Array.from(channelsWithText, ([channel, text]) => ({ channel, text }))

        client.db.guildUtils.updateGuildConfiguration({
            configCode: this.selectedModule,
            customizedParameter: channels,
            guild: message.guild,
            setByUserId: message.member.id,
            cacheTo: this.guildConfigurations
        })
        return await reply.send(locale.SETWELCOMER.ADDITIONAL_CHANNEL_SUCCESSFULLY_REGISTERED, {
            status: `success`,
            socket: {
                channels: `<#${PARENT_CONFIG_CHANNEL.value}>, ${(channels.map(x => `<#${x.channel}>`)).join(`, `)}`
            }
        })
    },
    /**
     * Enabling welcomer module
     * @return {void}
     */
    async enable(client, reply, message, locale, prefix) {
        if (this.primaryConfig.value) {
            const localizeTime = await client.db.systemUtils.toLocaltime(this.primaryConfig.updatedAt)
            const localed = localizeTime == `now` ? moment().toISOString() : localizeTime
            return await reply.send(locale.SETWELCOMER.ALREADY_ENABLED, {
                socket: {
                    user: await client.getUsername(this.primaryConfig.setByUserId),
                    date: moment(localed).fromNow()
                }
            })
        }
        //  Update configs
        client.db.guildUtils.updateGuildConfiguration({
            configCode: this.selectedModule,
            customizedParameter: 1,
            guild: message.guild,
            setByUserId: message.member.id,
            cacheTo: this.guildConfigurations
        })
        return await reply.send(locale.SETWELCOMER.SUCCESSFULLY_ENABLED, {
            status: `success`,
            socket: {
                prefix: prefix
            }
        })
    },

    /**
     * Disabling welcomer module
     * @return {void}
     */
    async disable(client, reply, message, locale, prefix) {
        if (!this.primaryConfig.value) return await reply.send(locale.SETWELCOMER.ALREADY_DISABLED, {
            socket: {
                prefix: prefix
            }
        })
        client.db.guildUtils.updateGuildConfiguration({
            configCode: this.selectedModule,
            customizedParameter: 0,
            guild: message.guild,
            setByUserId: message.member.id,
            cacheTo: this.guildConfigurations
        })
        return await reply.send(locale.SETWELCOMER.SUCCESSFULLY_DISABLED, {
            status: `success`
        })
    },

    /**
     * Set new target channel for welcomer module
     * @return {void}
     */
    async channel(client, reply, message, locale, prefix) {
        if (!this.primaryConfig.value) return await reply.send(locale.SETWELCOMER.ALREADY_DISABLED, {
            socket: {
                prefix: prefix
            }
        })
        //  Handle if search keyword isn't provided
        if (!this.args[1]) return await reply.send(locale.SETWELCOMER.EMPTY_CHANNEL_PARAMETER, {
            socket: {
                prefix: prefix
            }
        })
        let testCondition = false
        if (message.mentions) {
            testCondition = message.mentions.channels.first() || message.guild.channels.cache.get(this.args[1]) ||
                message.guild.channels.cache.find(channel => channel.name === this.args[1].toLowerCase())
        } else {
            testCondition = message.guild.channels.cache.get(this.args[1]) ||
                message.guild.channels.cache.find(channel => channel.name === this.args[1].toLowerCase())
        }

        //  Do channel searching by three possible conditions
        const searchChannel = testCondition
        //  Handle if target channel couldn't be found
        if (!searchChannel) return await reply.send(locale.SETWELCOMER.INVALID_CHANNEL, {
            socket: {
                emoji: await client.getEmoji(`692428578683617331`)
            }
        })
        client.db.guildUtils.updateGuildConfiguration({
            configCode: this.selectedModule,
            customizedParameter: searchChannel.id,
            guild: message.guild,
            setByUserId: message.member.id,
            cacheTo: this.guildConfigurations
        })
        return await reply.send(locale.SETWELCOMER.CHANNEL_SUCCESSFULLY_REGISTERED, {
            status: `success`,
            socket: {
                channel: `<#${searchChannel.id}>`
            }
        })
    },

    /**
     * Set message to be attached in the welcomer.
     * @return {void}
     */
    async text(client, reply, message, locale, prefix) {
        //  Handle if the user hasn't enabled the module yet
        if (!this.primaryConfig.value) return await reply.send(locale.SETWELCOMER.ALREADY_DISABLED, {
            socket: {
                prefix: prefix
            }
        })
        //  Handle if text content isn't provided
        if (!this.args[1]) return await reply.send(locale.SETWELCOMER.EMPTY_TEXT_PARAMETER, {
            socket: {
                prefix: prefix
            },
        })
        //  Update configs
        const welcomerText = this.args.slice(1).join(` `)
        client.db.guildUtils.updateGuildConfiguration({
            configCode: this.selectedModule,
            customizedParameter: welcomerText,
            guild: message.guild,
            setByUserId: message.member.id,
            cacheTo: this.guildConfigurations
        })
        await reply.send(locale.SETWELCOMER.TEXT_SUCCESSFULLY_REGISTERED, {
            status: `success`
        })
        const tipsToPreview = await reply.send(locale.SETWELCOMER.TIPS_TO_PREVIEW, {
            simplified: true,
            socket: {
                emoji: await client.getEmoji(`692428927620087850`)
            }
        })
        const c = new Confirmator(message, reply, locale)
        await c.setup(message.member.id, tipsToPreview)
        c.onAccept(() => this.preview(client, reply, message, locale, prefix))
    },

    /**
     * Preview this guild's welcomer message
     * @return {void}
     */
    async preview(client, reply, message, locale, prefix) {
        //  Handle if the user hasn't enabled the module yet
        if (!this.primaryConfig.value) return await reply.send(locale.SETWELCOMER.ALREADY_DISABLED, {
            socket: {
                prefix: prefix
            }
        })
        const renderingMsg = await reply.send(locale.COMMAND.FETCHING, {
            simplified: true,
            socket: {
                user: message.member.id,
                command: `WELCOMER_PREVIEW`,
                emoji: await client.getEmoji(`790994076257353779`)
            },
            followUp: message.deferred || message.replied ? true : false
        })
        const img = await new GUI(message.member, client).build()
        renderingMsg.delete()
        return await reply.send(this._parseWelcomeText(message), {
            simplified: true,
            prebuffer: true,
            image: img
        })
    },

    /**
     * Adding role when user joined the guild 
     * @return {void}
     */
    async role(client, reply, message, locale, prefix) {
        //  Handle if the user hasn't enabled the module yet
        if (!this.primaryConfig.value) return await reply.send(locale.SETWELCOMER.ALREADY_DISABLED, {
            socket: {
                prefix: prefix
            }
        })
        //  Handle if search keyword isn't provided
        if (!this.args[1]) return await reply.send(locale.SETWELCOMER.EMPTY_ROLE_PARAMETER, {
            socket: {
                prefix: prefix
            },
            status: `warn`
        })
        //  Handle role reset
        if (this.args[1].startsWith(`reset`)) {
            client.db.guildUtils.updateGuildConfiguration({
                configCode: this.selectedModule,
                customizedParameter: [],
                guild: message.guild,
                setByUserId: message.member.id,
                cacheTo: this.guildConfigurations
            })
            return await reply.send(locale.SETWELCOMER.ROLE_SUCCESSFULLY_RESET)
        }
        let rolesContainer = []
        let specifiedRoles = this.args.slice(1)
        for (let i = 0; i < specifiedRoles.length; i++) {
            //  Do role searching
            const searchRole = findRole(specifiedRoles[i], message.guild)
            //  Handle if target role couldn't be found
            if (!searchRole) return await reply.send(locale.SETWELCOMER.INVALID_ROLE, {
                status: `fail`
            })
            //  Handle if role is higher than annie
            if (searchRole.position > this.annieRole.position) return await reply.send(locale.SETWELCOMER.ROLE_TOO_HIGH, {
                socket: {
                    role: searchRole,
                    annieRole: this.annieRole.name,
                    emoji: await client.getEmoji(`692428578683617331`)
                }
            })
            rolesContainer.push(searchRole)
        }
        //  Update configs
        client.db.guildUtils.updateGuildConfiguration({
            configCode: this.selectedModule,
            customizedParameter: rolesContainer.map(role => role.id),
            guild: message.guild,
            setByUserId: message.member.id,
            cacheTo: this.guildConfigurations
        })
        return await reply.send(locale.SETWELCOMER.ROLE_SUCCESSFULLY_REGISTERED, {
            socket: {
                role: rolesContainer.join(` `)
            },
            status: `success`
        })
    },
    /**
     * Managing welcomer's image. 
     * @return {void}
     */
    async imagereset(client, reply, message, locale, prefix) {
        const welcomerImage = message.guild.configs.get(`WELCOMER_IMAGE`).value
        if (welcomerImage === `welcomer` || !welcomerImage) return await reply.send(`You use the default configuration already.`)
        const confirmation = await reply.send(locale.SETWELCOMER.CONFIRMATION_IMAGE, {
            image: await new GUI(message.member, client, `welcomer`).build(),
            prebuffer: true
        })
        const c = new Confirmator(message, reply, locale)
        await c.setup(message.member.id, confirmation)
        c.onAccept(async () => {
            client.db.guildUtils.deleteGuildConfiguration(`WELCOMER_IMAGE`, message.guild.id)
            fs.unlink(`./src/assets/customWelcomer/${welcomerImage}.png`, (error) => {
                if (error) client.logger.warn(`[setWelcomer.js][Removing Image from filetree] ${error.stack}`)
            })
            await reply.send(locale.SETWELCOMER.IMAGE_SUCCESSFULLY_APPLIED, {
                socket: {
                    emoji: await client.getEmoji(`789212493096026143`)
                }
            })
        })

    },

    /**
     * Managing welcomer's image. 
     * @return {void}
     */
    async image(client, reply, message, locale, prefix) {
        //  Handle if the user hasn't enabled the module yet
        if (!this.primaryConfig.value) return await reply.send(locale.SETWELCOMER.ALREADY_DISABLED, {
            socket: {
                prefix: prefix
            }
        })
        const {
            isValidUpload,
            url
        } = await this.getImage(message)
        if (!url) return await reply.send(locale.SETWELCOMER.IMAGE_MISSING_ATTACHMENT, {
            socket: {
                emoji: await client.getEmoji(`692428692999241771`),
                prefix: prefix
            }
        })
        if (!isValidUpload) return await reply.send(locale.SETWELCOMER.IMAGE_INVALID_UPLOAD, {
            socket: {
                emoji: await client.getEmoji(`692428969667985458`)
            }
        })
        const id = uuidv4()
        const response = await superagent.get(url)
        const buffer = response.body
        try {
            await fs.writeFileSync(`./src/assets/customWelcomer/${id}.png`, buffer)
        } catch (error) {
            client.logger.error(error)
            return reply.send(`im sorry but that link/attachment is not supported. Please try again with a link/attachment of the image itself.`)
        }
        if (this.guildConfigurations.get(`WELCOMER_NOIMAGE`).value) {
            await client.db.guildUtils.updateGuildConfiguration({
                configCode: `WELCOMER_NOIMAGE`,
                customizedParameter: 0,
                guild: message.guild,
                setByUserId: message.member.id,
                cacheTo: this.guildConfigurations
            })
        }
        if (this.guildConfigurations.get(`WELCOMER_USERIMAGE`).value) {
            await client.db.guildUtils.updateGuildConfiguration({
                configCode: `WELCOMER_USERIMAGE`,
                customizedParameter: 0,
                guild: message.guild,
                setByUserId: message.member.id,
                cacheTo: this.guildConfigurations
            })
        }
        const confirmation = await reply.send(locale.SETWELCOMER.CONFIRMATION_IMAGE, {
            image: await new GUI(message.member, client, id).build(),
            prebuffer: true
        })
        const c = new Confirmator(message, reply, locale)
        await c.setup(message.member.id, confirmation)
        c.onAccept(async () => {
            client.db.guildUtils.updateGuildConfiguration({
                configCode: this.selectedModule,
                customizedParameter: id,
                guild: message.guild,
                setByUserId: message.member.id,
                cacheTo: this.guildConfigurations
            })
            await reply.send(locale.SETWELCOMER.IMAGE_SUCCESSFULLY_APPLIED, {
                socket: {
                    emoji: await client.getEmoji(`789212493096026143`)
                }
            })
        })
    },
    /**
     * Toggle user's profile picture as the background of welcomer message.
     * @return {void}
     */
    async userimage(client, reply, message, locale, prefix) {
        //  Handle if the user hasn't enabled the module yet
        if (!this.primaryConfig.value) return await reply.send(locale.SETWELCOMER.ALREADY_DISABLED, {
            socket: {
                prefix: prefix
            }
        })
        //  Update configs
        let settingValue = this.guildConfigurations.get(this.selectedModule).value
        settingValue = settingValue == 1 ? 0 : 1
        client.db.guildUtils.updateGuildConfiguration({
            configCode: this.selectedModule,
            customizedParameter: settingValue,
            guild: message.guild,
            setByUserId: message.member.id,
            cacheTo: this.guildConfigurations
        })
        if (this.guildConfigurations.get(`WELCOMER_NOIMAGE`).value) {
            await client.db.guildUtils.updateGuildConfiguration({
                configCode: `WELCOMER_NOIMAGE`,
                customizedParameter: 0,
                guild: message.guild,
                setByUserId: message.member.id,
                cacheTo: this.guildConfigurations
            })
        }
        await reply.send(locale.SETWELCOMER[settingValue ? `USERIMAGE_SUCCESSFULLY_ENABLED` : `USERIMAGE_SUCCESSFULLY_DISABLED`], {
            status: `success`
        })
        const tipsToPreview = await reply.send(locale.SETWELCOMER.TIPS_TO_PREVIEW, {
            simplified: true,
            socket: {
                emoji: await client.getEmoji(`692428927620087850`)
            }
        })
        const c = new Confirmator(message, reply, locale)
        await c.setup(message.member.id, tipsToPreview)
        c.onAccept(() => this.preview(client, reply, message, locale, prefix))
    },

    /**
     * Enabling/disabling image from the welcomer.
     * @return {void}
     */
    async noimage(client, reply, message, locale, prefix) {
        //  Handle if the user hasn't enabled the module yet
        if (!this.primaryConfig.value) return await reply.send(locale.SETWELCOMER.ALREADY_DISABLED, {
            socket: {
                prefix: prefix
            }
        })
        //  Update configs
        let settingValue = this.guildConfigurations.get(this.selectedModule).value
        settingValue = settingValue == 1 ? 0 : 1
        client.db.guildUtils.updateGuildConfiguration({
            configCode: this.selectedModule,
            customizedParameter: settingValue,
            guild: message.guild,
            setByUserId: message.member.id,
            cacheTo: this.guildConfigurations
        })
        await reply.send(locale.SETWELCOMER[settingValue ? `NOIMAGE_SUCCESSFULLY_ENABLED` : `NOIMAGE_SUCCESSFULLY_DISABLED`], {
            status: `success`
        })
        const tipsToPreview = await reply.send(locale.SETWELCOMER.TIPS_TO_PREVIEW, {
            simplified: true,
            socket: {
                emoji: await client.getEmoji(`692428927620087850`)
            }
        })
        const c = new Confirmator(message, reply, locale)
        await c.setup(message.member.id, tipsToPreview)
        c.onAccept(() => this.preview(client, reply, message, locale, prefix))
    },

    /** 
     * Check if user has attempted to upload a custom image
     * @param {Message} message Current message instance
     * @return {object}
     */
    getImage(message) {
        if (message.type !== 0) {
            const hasAttachment = this.args[1] ? true : false
            const imageArgs = this.args.slice(1).join(` `)
            const hasImageURL = imageArgs.startsWith(`http`) && imageArgs.length >= 15 ? true : false
            return {
                isValidUpload: hasAttachment || hasImageURL ? true : false,
                url: imageArgs.startsWith(`http`) && imageArgs.length >= 15 ? this.args[1] : null
            }
        }
        const hasAttachment = message.attachments.first() ? true : false
        const imageArgs = this.args.slice(1).join(` `)
        const hasImageURL = imageArgs.startsWith(`http`) && imageArgs.length >= 15 ? true : false
        return {
            isValidUpload: hasAttachment || hasImageURL ? true : false,
            url: message.attachments.first() ?
                message.attachments.first().url : imageArgs.startsWith(`http`) && imageArgs.length >= 15 ?
                    imageArgs : null
        }
    },

    /**
     * Theme management
     * @return {void}
     */
    async theme(client, reply, message, locale, prefix) {
        //  Handle if the user hasn't enabled the module yet
        if (!this.primaryConfig.value) return await reply.send(locale.SETWELCOMER.ALREADY_DISABLED, {
            socket: {
                prefix: prefix
            }
        })
        if (!this.args[1]) return await reply.send(locale.SETWELCOMER.THEME_MISSING_NAME, {
            socket: {
                prefix: prefix,
                emoji: await client.getEmoji(`AnniePeek1`)
            }
        })
        const availableThemes = [`light`, `dark`]
        if (!availableThemes.includes(this.args[1])) return await reply.send(locale.SETWELCOMER.THEME_INVALID, {
            socket: {
                emoji: await client.getEmoji(`AnnieMad`)
            }
        })
        client.db.guildUtils.updateGuildConfiguration({
            configCode: this.selectedModule,
            customizedParameter: this.args[1],
            guild: message.guild,
            setByUserId: message.member.id,
            cacheTo: this.guildConfigurations
        })
        return await reply.send(locale.SETWELCOMER.THEME_SUCCESSFULLY_UPDATED, {
            status: `success`,
            socket: {
                theme: this.args[1],
                user: message.member.user.username,
                emoji: await client.getEmoji(`789212493096026143`)
            }
        })
    },

    /**
     * Parse sockets (if available) in the guild's welcomer text.
     * @param {Message} message Current message instance
     * @private
     * @returns {string}
     */
    _parseWelcomeText(message) {
        let text = this.guildConfigurations.get(`WELCOMER_TEXT`).value
        // Replace new line character in case it doesnt make the new line
        text = text.replace(/\\n/g, `\n`)
        text = text.replace(/{{guild}}/gi, `**${message.guild.name}**`)
        text = text.replace(/{{user}}/gi, message.member)
        return text
    }
}