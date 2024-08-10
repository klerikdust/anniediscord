"use strict"
const { ApplicationCommandType } = require(`discord.js`)
/**
 * List of servers that supporting the development of Annie.
 * @author klerikdust
 */
module.exports = {
    name: `affiliates`,
    name_localizations: {
        fr: ``
    },
    description_localizations: {
        fr: ``
    },
    aliases: [`affiliate`, `affiliates`, `affil`],
    description: `List of servers that supporting the development of Annie.`,
    usage: `affiliate`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    server_specific: false,
    type: ApplicationCommandType.ChatInput,
    async execute(client, reply, message, arg, locale) {
        const user = message.author
        await await this.run(client, reply, user, locale)
    },
    async Iexecute(client, reply, interaction, options, locale) {
        const user = interaction.user
        await await this.run(client, reply, user, locale)
    },
    async run(client, reply, user, locale) {
        const affiliateList = await client.db.guildUtils.getAffiliates()
        //  Handle if there are no registered affiliates
        if (!affiliateList.length) return await reply.send(locale.AFFILIATES.EMPTY)
        return await reply.send(locale.AFFILIATES.DISPLAY, {
            header: locale.AFFILIATES.HEADER,
            thumbnail: client.user.displayAvatarURL(),
            socket: {
                list: await this._prettifyList(affiliateList, client),
                user: user.username
            },
        })
    },
    /**
     * Parse & prettify elements from given source.
     * @param {array} [source=[]] refer to guild configuration structure
     * @param {Client} client Current client instance
     * @returns {string}
     */
    async _prettifyList(source = [], client) {
        //  Pull from cache if available
        const cacheId = `AFFILIATES_LIST`

        if (await client.db.databaseUtils.doesCacheExist(cacheId)) return await client.db.databaseUtils.getCache(cacheId)
        let res = ``
        for (let i = 0; i < source.length; i++) {
            if (i <= 0) res += `\n╭───────────────────╮\n\n`
            let server = source[i]
            let serverPreview = null
            try {
                serverPreview = await client.fetchGuildPreview(server.guild_id)
            } catch (error) {
                client.logger.error(error)
                serverPreview = null
            }
            if (!serverPreview) break
            res += `**• ${serverPreview ? serverPreview.name : `???`}**\n"*${server.description}*"\n[Click here to join!](${server.invite_link})\n\n`
            if (i === (source.length - 1)) res += `╰───────────────────╯\n`
        }
        //  Cache the result to avoid broadcasting.
        //  Expire until 12 hours
        client.db.databaseUtils.setCache(cacheId, JSON.stringify(res), { EX: (60 * 60) * 12 })
        return res
    }
}