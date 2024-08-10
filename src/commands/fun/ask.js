"use strict"
const { ApplicationCommandType, ApplicationCommandOptionType } = require(`discord.js`)
/**
 * You can ask any question and Annie will answer you.
 * @author klerikdust
 */
module.exports = {
    name: `ask`,
    name_localizations: {
        fr: `demander`
    },
    description_localizations: {
        fr: `Vous pouvez poser n'importe quelle question et Annie vous répondra.`
    },
    aliases: [`8ball`],
    description: `You can ask any question and Annie will answer you.`,
    usage: `ask <Message>`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    server_specific: false,
    options: [
        {
            name: `question`,
            description: `Type out your question.`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            required: true,
            type: ApplicationCommandOptionType.String
        }
    ],
    type: ApplicationCommandType.ChatInput,
    async execute(client, reply, message, arg, locale) {
        if (!arg) return await reply.send(locale.ASK.SHORT_GUIDE)
        return await this.run(reply, locale)
    },
    async Iexecute(client, reply, interaction, options, locale) {
        return await this.run(reply, locale)
    },
    async run(reply, locale) {
        const pool = locale.ASK.ANSWERS
        return await reply.send(pool[Math.floor(Math.random() * pool.length)])
    }
}