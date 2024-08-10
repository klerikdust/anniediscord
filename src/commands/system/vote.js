"use strict"
const { ApplicationCommandType } = require(`discord.js`)
/**
 * Upvote Annie and get the reward!
 * @author klerikdust
 */
module.exports = {
    name: `vote`,
    name_localizations: {
        fr: ``
    },
    description_localizations: {
        fr: ``
    },
    aliases: [`vote`, `vt`, `vot`, `votes`, `upvote`],
    description: `Upvote Annie and get the reward!`,
    usage: `vote`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    server_specific: false,
    type: ApplicationCommandType.ChatInput,
    page: `https://top.gg/bot/501461775821176832`,
    async execute(client, reply, message, arg, locale) {
        const user = message.author
        return await this.run(client, reply, locale, user)
    },
    async Iexecute(client, reply, interaction, options, locale) {
        await interaction.deferReply({ ephemeral: true })
        const guildMember = interaction.member.user
        return await this.run(client, reply, locale, guildMember)
    },
    async run(client, reply, locale, user) {
        if (!client.dblApi) return await reply.send(locale.VOTE.UNAVAILABLE, {
            editReply: true
        })
        const voted = await client.dblApi.hasVoted(user.id)
        if (voted) return await reply.send(locale.VOTE.IS_COOLDOWN, {
            socket: {
                page: `[write a review](${this.page})`,
                emoji: await client.getEmoji(`692428785571856404`)
            },
            editReply: true
        })
        return await reply.send(locale.VOTE.READY, {
            header: `Hi, ${user.username}`,
            image: `banner_votes`,
            socket: {
                emoji: await client.getEmoji(`692428927620087850`),
                url: `[Discord Bot List](${this.page}/vote)`
            },
            editReply: true
        })
    }
}