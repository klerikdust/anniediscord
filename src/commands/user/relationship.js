"use strict"
const User = require(`../../libs/user`)
const GUI = require((`../../ui/prebuild/relationship`))
const { ApplicationCommandType, ApplicationCommandOptionType } = require(`discord.js`)
/**
 * Display user's relationship trees
 * @author klerikdust
 */
module.exports = {
    name: `relationship`,
    name_localizations: {
        fr: ``
    },
    description_localizations: {
        fr: ``
    },
    aliases: [`rel`, `rtship`, `relation`, `relations`, `relationship`],
    description: `Display user's relationship trees`,
    usage: `relationship <user>(Optional)`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    server_specific: false,
    options: [{
        name: `user`,
        description: `Display the relationship of the specified user`,
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
    async run(client, reply, messageRef, locale, user) {
        const userLib = new User(client, messageRef)
        let targetUser = user

        const targetUserData = await userLib.requestMetadata(targetUser, 2, locale)
        //  Handle if user doesn't have any relationships
        if (!targetUserData.relationships.length) return await reply.send(locale.RELATIONSHIP.IS_EMPTY, {
            socket: { prefix: `/` }
        })
        const fetching = await reply.send(locale.COMMAND.FETCHING, {
            simplified: true,
            socket: {
                command: `relationship`,
                emoji: await client.getEmoji(`790994076257353779`),
                user: targetUser.id
            }
        })
        let userData = userLib.isSelf(targetUser.id) ? targetUserData : await userLib.requestMetadata(messageRef.member.user, 2, locale)
        await reply.send(locale.COMMAND.TITLE, {
            simplified: true,
            prebuffer: true,
            socket: {
                command: `Relationship`,
                emoji: await client.getEmoji(`692429004417794058`),
                user: targetUser.username
            },
            image: await new GUI(targetUserData, client, userData).build()
        })
        fetching.delete()
        if (userLib.isSelf(targetUser.id)) return await reply.send(locale.RELATIONSHIP.TIPS_AUTHOR_ON_CHECK, {
            simplified: true,
            socket: {
                prefix: `/`,
                emoji: await client.getEmoji(`848521456543203349`)
            },
            ephemeral: true
        })
    },
    async execute(client, reply, message, arg, locale, prefix) {
        const userLib = new User(client, message)
        let targetUser = arg ? await userLib.lookFor(arg) : message.author
        if (!targetUser) return await reply.send(locale.USER.IS_INVALID)
        //  Normalize structure
        targetUser = targetUser.master || targetUser

        return await this.run(client, reply, message, locale, targetUser)
    },
    async Iexecute(client, reply, interaction, options, locale) {
        let targetUser = options.getUser(`user`) || interaction.member.user
        return await this.run(client, reply, interaction, locale, targetUser)
    }
}