"use strict"
const { ApplicationCommandType, PermissionFlagsBits } = require(`discord.js`)
/**
 * App command to remove reactions on a message.
 * @author Andrew
 */
module.exports = {
    name: `removeallreactions`,
    name_localizations: {
        fr: ``
    },
    description_localizations: {
        fr: ``
    },
    aliases: [],
    description: `Remove all reactions on a message`,
    usage: `removeallreactions`,
    server_specific: false,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    messageCommand: false,
    type: ApplicationCommandType.Message,
    default_member_permissions: PermissionFlagsBits.AddReactions.toString(),
    async Iexecute(client, reply, interaction, options, locale) {
        const messageToRemoveAllReactionsFrom = interaction.targetMessage
        const possibleReactions = messageToRemoveAllReactionsFrom.reactions
        return possibleReactions.removeAll().then(async (c) => await reply.send(`I have removed all possible reactions from message with id: ${c.id}`, { ephemeral: true })).catch((error) => client.logger.error(`[removeAllReactions.js] error: ${error.stack}`))
    }
}