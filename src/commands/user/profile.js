"use strict"
const GUI = require(`../../ui/prebuild/profile`)
const User = require(`../../libs/user`)
const { ApplicationCommandType, ApplicationCommandOptionType } = require(`discord.js`)
/**
 * Displaying user's profile card!
 * @author klerikdust
 */
module.exports = {
    name: `profile`,
    name_localizations: {
        fr: ``
    },
    description_localizations: {
        fr: ``
    },
    aliases: [`profile`, `p`, `prof`],
    description: `Displaying user's profile card!`,
    usage: `profile <User>(Optional)`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    server_specific: false,
    options: [{
        name: `user`,
        description: `Display the profile of the specified user`,
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
        const userLib = new User(client, message)
        let targetUser = arg ? await userLib.lookFor(arg) : message.author
        if (!targetUser) return await reply.send(locale.USER.IS_INVALID)
        //  Normalize structure
        targetUser = targetUser.master || targetUser
        const userData = await userLib.requestMetadata(targetUser, 2, locale)
        return await this.run(client, reply, locale, userData)
    },
    async Iexecute(client, reply, interaction, options, locale) {
        const userLib = new User(client, interaction)
        let targetUser = options.getUser(`user`) || interaction.member.user
        const userData = await userLib.requestMetadata(targetUser, 2, locale)
        return await this.run(client, reply, locale, userData)
    },
    async run(client, reply, locale, user) {
        const fetching = await reply.send(locale.PROFILECARD.FETCHING, {
            socket: { emoji: await client.getEmoji(`790994076257353779`) }
        })
        const image = (await new GUI(user, client).build()).png()
        fetching.delete()
        // Followup tips for newcomer
        return reply.send(locale.COMMAND.TITLE + (!user.usedCover.isSelfUpload ? `\n` + locale.PROFILECARD.NEWCOMER_TIPS : ``), {
            socket: {
                user: user.master.username,
                emoji: await client.getEmoji(`692428927620087850`),
                command: `Profile`
            },
            image: image,
            prebuffer: true,
            simplified: true
        })
    }
}