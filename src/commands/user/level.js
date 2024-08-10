"use strict"
const GUI = require(`../../ui/prebuild/level`)
const User = require(`../../libs/user`)
const { ApplicationCommandType, ApplicationCommandOptionType } = require(`discord.js`)
/**
 * Display your current exp, level and rank.
 * @author klerikdust
 */
module.exports = {
    name: `level`,
    name_localizations: {
        fr: ``
    },
    description_localizations: {
        fr: ``
    },
    aliases: [`lvl`, `lv`],
    description: `Display your current exp, level and rank.`,
    usage: `level <User>(Optional)`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    server_specific: false,
    options: [{
        name: `user`,
        description: `Display the level of the specified user`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        required: false,
        type: ApplicationCommandOptionType.User
    }],
    type: ApplicationCommandType.ChatInput,
    async execute(client, reply, message, arg, locale) {
        //  Handle if the EXP module isn't enabled in current guild
        if (!message.guild.configs.get(`EXP_MODULE`).value) return await reply.send(locale.COMMAND.DISABLED, {
            socket: { command: `EXP Module` },
        })
        const userLib = new User(client, message)
        let targetUser = arg ? await userLib.lookFor(arg) : message.author
        if (!targetUser) return await reply.send(locale.USER.IS_INVALID)
        //  Normalize structure
        targetUser = targetUser.master || targetUser
        return await this.run(client, reply, message, locale, targetUser)

    },
    async Iexecute(client, reply, interaction, options, locale) {
        //  Handle if the EXP module isn't enabled in current guild
        if (!interaction.guild.configs.get(`EXP_MODULE`).value) return await reply.send(locale.COMMAND.DISABLED, {
            socket: { command: `EXP Module` },
        })
        const targetUser = options.getUser(`user`) || interaction.member.user
        return await this.run(client, reply, interaction, locale, targetUser)
    },
    async run(client, reply, messageRef, locale, user) {
        const userLib = new User(client, messageRef)
        const userData = await userLib.requestMetadata(user, 2, locale)
        return reply.send(locale.COMMAND.FETCHING, {
            simplified: true,
            socket: {
                emoji: await client.getEmoji(`790994076257353779`),
                user: user.id,
                command: `level`
            }
        })
            .then(async loading => {
                await reply.send(locale.COMMAND.TITLE, {
                    simplified: true,
                    prebuffer: true,
                    image: await new GUI(userData).build(),
                    socket: {
                        emoji: await client.getEmoji(`692428597570306218`),
                        user: user.username,
                        command: `Level`
                    }
                })

                return loading.delete()
            })
    }
}