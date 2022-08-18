const { ApplicationCommandType } = require(`discord.js`)

/**
 * Command's Class description
 * @author Pan
 */
module.exports = {
    name: `donate`,
    aliases: [],
    description: `Provides link to our donate link if you wish to support us further`,
    usage: `donate`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: false,
    messageCommand: false,
    type: ApplicationCommandType.ChatInput,
    async execute(client, reply, message, arg, locale) {
        reply.send(locale.DONATE)
    },
    async Iexecute(client, reply, interaction, options, locale) {
        reply.send(locale.DONATE)
    }

}