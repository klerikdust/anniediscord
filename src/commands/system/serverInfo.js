"use strict"
const moment = require(`moment`)
const commanifier = require(`../../utils/commanifier`)

const { ApplicationCommandType } = require(`discord.js`)
/**
 * Displays info about the server
 * @author klerikdust
 */
module.exports = {
    name: `serverinfo`,
    name_localizations: {
        fr: ``
    },
    description_localizations: {
        fr: ``
    },
    aliases: [`guildinfo`, `infoguild`, `serverinfo`, `infoserver`, `aboutserver`],
    description: `Displays info about the server`,
    usage: `serverinfo`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    server_specific: false,
    type: ApplicationCommandType.ChatInput,
    async execute(client, reply, message, arg, locale) {
        return this.run(client, reply, message, locale)
    },
    async Iexecute(client, reply, interaction, options, locale) {
        return this.run(client, reply, interaction, locale)
    },
    async getStats(client, messageRef) {
        const cacheId = `SERVERINFO_${messageRef.guildId}`

        if (await client.db.databaseUtils.doesCacheExist(cacheId)) {
            let res = await client.db.databaseUtils.getCache(cacheId)
            try {
                let jsonRes = JSON.parse(res)
                return jsonRes
            } catch (error) {
                client.logger.error(error)
            }
        }
        if (!messageRef.guild.available) messageRef.guild.fetch()
        await messageRef.guild.members.fetch()
        const userSize = messageRef.guild.members.cache.filter(member => !member.user.bot).size
        const botSize = messageRef.guild.members.cache.filter(member => member.user.bot).size
        const guildOwner = (await messageRef.guild.fetchOwner()).user.username
        const joinedAt = messageRef.member.joinedAt
        const channelSize = messageRef.guild.channels.cache.size
        const roleSize = messageRef.guild.channels.cache.size
        const { preferredLocale, name, createdAt, systemChannel } = messageRef.guild
        const iconURL = messageRef.guild.iconURL()
        const res = { userSize, botSize, guildOwner, preferredLocale, name, createdAt, joinedAt, systemChannel, channelSize, roleSize, iconURL }
        client.db.databaseUtils.setCache(cacheId, JSON.stringify(res), { EX: 60 * 30 })
        return res
    },
    async run(client, reply, messageRef, locale) {
        const { userSize, botSize, guildOwner, preferredLocale, name, createdAt, joinedAt, systemChannel, channelSize, roleSize, iconURL } = await this.getStats(client, messageRef)

        return await reply.send(locale.SERVERINFO, {
            socket: {
                userSize: commanifier(userSize),
                botSize: commanifier(botSize),
                guildOwner: guildOwner,
                preferredLocale: preferredLocale,
                createdAt: moment(createdAt).fromNow(),
                joinedAt: moment(joinedAt).fromNow(),
                systemChannel: systemChannel,
                channelSize: channelSize,
                roleSize: roleSize
            },
            header: name,
            thumbnail: iconURL
        })
    }
}