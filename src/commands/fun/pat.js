"use strict"
const { ApplicationCommandType, ApplicationCommandOptionType } = require(`discord.js`)
const superagent = require(`superagent`)
const User = require(`../../libs/user`)
/**
 * Displays a random gif of a pat.
 * @author klerikdust
 */
module.exports = {
    name: `pat`,
    name_localizations: {
        fr: `tapoter`
    },
    description_localizations: {
        fr: `Affiche un gif aléatoire d'une tape.`
    },
    aliases: [],
    description: `Displays a random gif of a pat.`,
    usage: `pat <User>(Optional)`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    server_specific: false,
    options: [{
        name: `user`,
        description: `Any user you would like to give a pat?`,
        name_localizations: {
            fr: `utilisateur`
        },
        description_localizations: {
            fr: `Un utilisateur à qui vous souhaiteriez donner une tape ?`
        },
        required: false,
        type: ApplicationCommandOptionType.User
    }],
    type: ApplicationCommandType.ChatInput,
    hugGenLink: `https://purrbot.site/api/img/sfw/pat/gif`,
    async execute(client, reply, message, arg, locale) {
        const target = arg ? (await (new User(client, message)).lookFor(arg)).master : null
        const user = message.author
        return await this.run(target, user, reply, locale)
    },
    async Iexecute(client, reply, interaction, options, locale) {
        const target = options.getUser(`user`)
        const user = interaction.member.user
        return await this.run(target, user, reply, locale)
    },
    async run(targetUser, user, reply, locale) {
        const { body } = await superagent.get(this.hugGenLink)
        return !targetUser ? await reply.send(locale.HUG.THEMSELVES, {
            socket: {
                user: user.username
            },
            imageGif: body.link
        }) : await reply.send(locale.HUG.OTHER_USER, {
            socket: {
                user: user.username,
                targetUser: targetUser.username
            },
            imageGif: body.link
        })
    }
}