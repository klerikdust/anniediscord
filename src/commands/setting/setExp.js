"use strict"
const Confirmator = require(`../../libs/confirmator`)
const moment = require(`moment`)
const User = require(`../../libs/user`)
const GUI = require(`../../ui/prebuild/level`)
const trueInt = require(`../../utils/trueInt`)
const commanifier = require(`../../utils/commanifier`)

const {
    ApplicationCommandType,
    ApplicationCommandOptionType,
    PermissionFlagsBits
} = require(`discord.js`)
/**
 * Enable or disable EXP Leveling System for this guild
 * @author klerikdust
 */
module.exports = {
    name: `setexp`,
    name_localizations: {
        fr: ``
    },
    description_localizations: {
        fr: ``
    },
    aliases: [`setexp`, `setexperience`, `setxp`],
    description: `Configure the exp for your member and the server.`,
    usage: `setexp`,
    permissionLevel: 3,
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    server_specific: false,
    default_member_permissions: PermissionFlagsBits.Administrator.toString(),
    options: [{
        name: `enable`,
        description: `Action to perform.`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.Subcommand,
    }, {
        name: `disable`,
        description: `Action to perform.`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.Subcommand,
    }, {
        name: `add`,
        description: `Action to perform.`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            name: `user`,
            description: `User to adjust.`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            required: true,
            type: ApplicationCommandOptionType.User
        }, {
            name: `amount`,
            description: `Amount to adjust by.`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            required: true,
            type: ApplicationCommandOptionType.Integer
        }]
    }, {
        name: `minus`,
        description: `Action to perform.`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            name: `user`,
            description: `User to adjust.`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            required: true,
            type: ApplicationCommandOptionType.User
        }, {
            name: `amount`,
            description: `Amount to adjust by.`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            required: true,
            type: ApplicationCommandOptionType.Integer
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
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            name: `user`,
            description: `User to adjust.`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            required: true,
            type: ApplicationCommandOptionType.User
        }]
    }],
    /**
     * An array of the available options for EXP_MODULE module
     * @type {array}
     */
    actions: [`enable`, `disable`, `add`, `minus`, `reset`],
    type: ApplicationCommandType.ChatInput,
    /**
     * Thumbnail's img source
     * @type {string}
     */
    thumbnail: `https://i.ibb.co/Kwdw0Pc/config.png`,

    /**
     * Current instance's config code
     * @type {string}
     */
    primaryConfigID: `EXP_MODULE`,

    /**
     * Soft limit exp addition
     * type {number}
     */
    softLimit: 1000000,
    async execute(client, reply, message, arg, locale, prefix) {
        //  Handle if user doesn't specify any arg
        if (!arg) return await reply.send(locale.SETEXP.GUIDE, {
            thumbnail: this.thumbnail,
            header: `Hi, ${message.author.username}!`,
            image: `banner_setexp`,
            socket: {
                prefix: prefix,
                emoji: await client.getEmoji(`692428597570306218`)
            }
        })
        this.args = arg.split(` `)
        //  Handle if the selected options doesn't exists
        this.selectedAction = this.args[0].toLowerCase()
        if (!this.actions.includes(this.selectedAction)) return await reply.send(locale.SETEXP.INVALID_ACTION, {
            socket: { actions: this.actions.join(`, `) }
        })
        //  Run action
        this.guildConfigurations = message.guild.configs
        this.primaryConfig = this.guildConfigurations.get(this.primaryConfigID)
        return this[this.selectedAction](client, reply, message, arg, locale, prefix)
    },
    async Iexecute(client, reply, interaction, options, locale) {

        //  Handle if the selected options doesn't exists
        if (options.getSubcommand() == `enable`) {
            this.selectedAction = `enable`
        }
        if (options.getSubcommand() == `disable`) {
            this.selectedAction = `disable`
        }
        if (options.getSubcommand() == `add`) {
            this.selectedAction = `add`
            this.args = [`add`, options.getUser(`user`).id, options.getInteger(`amount`)]
        }
        if (options.getSubcommand() == `minus`) {
            this.selectedAction = `minus`
            this.args = [`minus`, options.getUser(`user`).id, options.getInteger(`amount`)]
        }
        if (options.getSubcommand() == `reset`) {
            this.selectedAction = `reset`
            this.args = [`reset`, options.getUser(`user`).id]
        }

        //  Run action
        this.guildConfigurations = interaction.guild.configs
        this.primaryConfig = this.guildConfigurations.get(this.primaryConfigID)
        return this[this.selectedAction](client, reply, interaction, null, locale, `/`)
    },
    /**
     * Enabling EXP Leveling Module
     * @returns {void}
     */
    async enable(client, reply, message, arg, locale, prefix) {
        const fn = `[setExp.enable()]`
        //  Handle if module already enabled before the action.
        if (this.primaryConfig.value) {
            //  Handle if module used the default value.
            if (!this.primaryConfig.setByUserId) return await reply.send(locale.SETEXP.ALREADY_ENABLED_BY_DEFAULT, {
                socket: { emoji: await client.getEmoji(`692428843058724994`) }
            })
            const localizeTime = await client.db.systemUtils.toLocaltime(this.primaryConfig.updatedAt)
            const localed = localizeTime == `now` ? moment().toISOString() : localizeTime
            return await reply.send(locale.SETEXP.ALREADY_ENABLED, {
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
        return await reply.send(locale.SETEXP.SUCCESSFULLY_ENABLED, {
            socket: { prefix: prefix },
            status: `success`
        })
    },

    /**
     * Disabling EXP Leveling Module
     * @return {void}
     */
    async disable(client, reply, message, arg, locale, prefix) {
        const fn = `[setExp.disable()]`
        //  Handle if module already disabled before the action.
        if (!this.primaryConfig.value) return await reply.send(locale.SETEXP.ALREADY_DISABLED, {
            socket: { prefix: prefix }
        })
        //  Update configs
        client.db.guildUtils.updateGuildConfiguration({
            configCode: this.primaryConfigID,
            customizedParameter: 0,
            guild: message.guild,
            setByUserId: message.member.id,
            cacheTo: this.guildConfigurations
        })
        return await reply.send(locale.SETEXP.SUCCESSFULLY_DISABLED, { status: `success` })
    },

    /**
     * Substraction exp action.
     * @return {void}
     */
    async minus(client, reply, message, arg, locale, prefix) {
        if (!this.args[1]) return await reply.send(locale.SETEXP.MISSING_USER_ON_MINUS, {
            socket: {
                prefix: prefix
            }
        })
        const userClass = new User(client, message)
        const targetUser = await userClass.lookFor(this.args[1])
        if (!targetUser) return await reply.send(locale.USER.IS_INVALID)
        if (!this.args[2]) return await reply.send(locale.SETEXP.MISSING_AMOUNT_ON_MINUS, {
            socket: {
                prefix: prefix,
                user: targetUser.master.username
            }
        })
        const amountToSubtract = trueInt(this.args[2])
        if (!amountToSubtract) return await reply.send(locale.SETEXP.INVALID_AMOUNT_TO_MINUS, {
            socket: {
                prefix: prefix,
                user: targetUser.master.username
            }
        })
        let baseData = await userClass.requestMetadata(targetUser.master, 2, locale)
        const combinedExp = baseData.exp.current_exp - amountToSubtract
        if (combinedExp <= 0) return await reply.send(locale.SETEXP.MINUS_OVERLIMIT, {
            socket: {
                user: targetUser.master.username,
                emoji: await client.getEmoji(`692428748838010970`)
            }
        })
        const expLib = client.experienceLibs(message.guild.members.cache.get(targetUser.master.id), message.guild, message.channel, locale)
        let newData = expLib.xpFormula(combinedExp)
        baseData.exp = {
            current_exp: combinedExp,
            level: newData.level,
            maxexp: newData.maxexp,
            nextexpcurve: newData.nextexpcurve,
            minexp: newData.minexp
        }
        const confirmation = await reply.send(locale.SETEXP.MINUS_CONFIRMATION, {
            prebuffer: true,
            image: await new GUI(baseData).build(),
            socket: {
                user: targetUser.master.username
            }
        })
        const c = new Confirmator(message, reply, locale)
        await c.setup(message.member.id, confirmation)
        c.onAccept(async () => {
            expLib.updateRank(newData.level)
            client.db.userUtils.updateUserExp(amountToSubtract, targetUser.master.id, message.guild.id, `-`)
            await reply.send(``, {
                customHeader: [`${targetUser.master.username} exp has been updated!♡`, targetUser.master.displayAvatarURL()]
            })
        })
    },

    /**
     * Addition EXP action.
     * @return {void}
     */
    async add(client, reply, message, arg, locale, prefix) {
        if (!this.args[1]) return await reply.send(locale.SETEXP.MISSING_USER_ON_ADD, {
            socket: {
                prefix: prefix
            }
        })
        const userClass = new User(client, message)
        const targetUser = await userClass.lookFor(this.args[1])
        if (!targetUser) return await reply.send(locale.USER.IS_INVALID)
        if (!this.args[2]) return await reply.send(locale.SETEXP.MISSING_AMOUNT_ON_ADD, {
            socket: {
                prefix: prefix,
                user: targetUser.master.username
            }
        })
        const amountToAdd = trueInt(this.args[2])
        if (!amountToAdd) return await reply.send(locale.SETEXP.INVALID_AMOUNT_TO_ADD, {
            socket: {
                prefix: prefix,
                user: targetUser.master.username
            }
        })
        if (amountToAdd > this.softLimit) return await reply.send(locale.SETEXP.ADD_OVERLIMIT, {
            socket: {
                emoji: await client.getEmoji(`692428578683617331`),
                amount: commanifier(this.softLimit)
            }
        })
        let baseData = await userClass.requestMetadata(targetUser.master, 2, locale)
        const combinedExp = baseData.exp.current_exp + amountToAdd
        const expLib = client.experienceLibs(message.guild.members.cache.get(targetUser.master.id), message.guild, message.channel, locale)
        let newData = expLib.xpFormula(combinedExp)
        baseData.exp = {
            current_exp: combinedExp,
            level: newData.level,
            maxexp: newData.maxexp,
            nextexpcurve: newData.nextexpcurve,
            minexp: newData.minexp
        }
        const confirmation = await reply.send(locale.SETEXP.ADD_CONFIRMATION, {
            prebuffer: true,
            image: await new GUI(baseData).build(),
            socket: {
                user: targetUser.master.username
            }
        })
        const c = new Confirmator(message, reply, locale)
        await c.setup(message.member.id, confirmation)
        c.onAccept(async () => {
            expLib.execute(amountToAdd)
            await reply.send(``, {
                customHeader: [`${targetUser.master.username} exp has been updated!♡`, targetUser.master.displayAvatarURL()]
            })
        })
    },

    /**
     * Reset user'e exp to zero.
     * @return {void}
     */
    async reset(client, reply, message, arg, locale, prefix) {
        if (!this.args[1]) return await reply.send(locale.SETEXP.MISSING_USER_ON_RESET, {
            socket: {
                prefix: prefix,
                emoji: await client.getEmoji(`692428692999241771`)
            }
        })
        const userClass = new User(client, message)
        const targetUser = await userClass.lookFor(this.args.slice(1).join(` `))
        if (!targetUser) return await reply.send(locale.USER.IS_INVALID)
        let baseData = await userClass.requestMetadata(targetUser.master, 2, locale)
        const expLib = client.experienceLibs(message.guild.members.cache.get(targetUser.master.id), message.guild, message.channel, locale)
        let newData = expLib.xpFormula(0)
        baseData.exp = {
            current_exp: 0,
            level: newData.level,
            maxexp: newData.maxexp,
            nextexpcurve: newData.nextexpcurve,
            minexp: newData.minexp
        }
        const confirmation = await reply.send(locale.SETEXP.RESET_CONFIRMATION, {
            prebuffer: true,
            image: await new GUI(baseData).build(),
            socket: {
                user: targetUser.master.username
            }
        })
        const c = new Confirmator(message, reply, locale)
        await c.setup(message.member.id, confirmation)
        c.onAccept(async () => {
            expLib.updateRank(0)
            client.db.userUtils.resetUserExp(targetUser.master.id, message.guild.id)
            await reply.send(``, {
                customHeader: [`${targetUser.master.username} exp has been wiped out!♡`, targetUser.master.displayAvatarURL()]
            })
        })
    }
}