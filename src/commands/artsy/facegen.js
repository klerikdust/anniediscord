"use strict"
const { ApplicationCommandType } = require(`discord.js`)

/**
 * AI-Generated Anime Face provided by Gwern@TWDNE
 * @author klerikdust
 */
module.exports = {
    name: `facegen`,
    name_localizations: {
        fr: `facegen`
    },
    description_localizations: {
        fr: `Visage d'anime généré par l'IA proposé par Gwern@TWDNE`
    },
    aliases: [`facegen`, `anigen`, `waifugen`, `wfgen`, `fcgen`, `waifu`, `generatewaifu`],
    description: `AI-Generated Anime Face provided by Gwern@TWDNE`,
    usage: `facegen`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    type: ApplicationCommandType.ChatInput,
    server_specific: false,
    async execute(client, reply, message, arg, locale) {
        return await this.getRandomId(client, reply, message, locale)
    },

    async Iexecute(client, reply, interaction, options, locale) {
        return await this.getRandomId(client, reply, interaction, locale)
    },
    async getRandomId(client, reply, messageRef, locale) {
        const source = `https://www.thiswaifudoesnotexist.net/`
        const getID = Math.floor(Math.random() * 100000)
        const fetching = await reply.send(locale.FACEGEN.FETCHING, {
            simplified: true,
            socket: {
                emoji: await client.getEmoji(`790994076257353779`)
            }
        })
        await reply.send(locale.FACEGEN.HEADER, {
            customHeader: [messageRef.member.user.username, messageRef.member.displayAvatarURL()],
            image: source + `example-${getID}.jpg`,
            prebuffer: true
        })
        fetching.delete()
    }
}