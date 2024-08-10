"use strict"
const { ApplicationCommandType, PermissionFlagsBits, OAuth2Scopes } = require(`discord.js`)
const getBotInviteUrl = require(`../../utils/botInvite.js`)
/**
 * Generates Server & Bot invitation link
 * @author klerikdust
 */
module.exports = {
    name: `invite`,
    name_localizations: {
        fr: ``
    },
    description_localizations: {
        fr: ``
    },
    aliases: [`serverinvite`, `serverlink`, `linkserver`, `invitelink`, `invite`, `botinvite`, `invitebot`],
    description: `Generates Support Server & Bot Invitation link`,
    usage: `invite`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    server_specific: false,
    messageCommand: true,
    type: ApplicationCommandType.ChatInput,
    async execute(client, reply, message, arg, locale) {
        return await this.run(client, reply, message, locale)
    },
    async Iexecute(client, reply, interaction, options, locale) {
        return await this.run(client, reply, interaction, locale)
    },
    async run(client, reply, messageRef, locale) {
        try {
            //  Attempt to send through DM.
            await this.sendInvites(messageRef.member.user)
            return await reply.send(locale.INVITE_LINK_SENT, { status: `success`, socket: { emoji: `:e_mail:` } })
        } catch (error) {
            // Send to channel if failed send attempt to dm
            return this.sendInvites(messageRef.channel, client, reply, locale)
        }
    },

    /**
     * Default template for sending invites.
     * @param {Object} [targetChannel={}] target channel to be sent in..
     * @param {Discord.Client} client The client passthrough parameter
     * @param {Function} reply The reply passthrough parameter
     * @param {Object} locale The locale passthrough parameter
     * @param {Boolean} dm whether or not to try and send message as a Direct message
     * @returns {void}
     */
    async sendInvites(targetChannel = {}, client, reply, locale, dm = false) {
        await reply.send(locale.GENERATE_BOT_INVITE, {
            socket: { botInviteLink: getBotInviteUrl(client) },
            field: targetChannel,
            dm: dm
        })
        return await reply.send(locale.GENERATE_SERVER_INVITE, {
            simplified: true,
            socket: {
                serverLink: client.supportServer,
                emoji: await client.getEmoji(`692428927620087850`)
            },
            field: targetChannel,
            dm: dm
        })
    }
}