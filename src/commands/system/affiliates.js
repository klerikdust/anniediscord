const Command = require(`../../libs/commands`)
    /**
     * List of servers that supporting the development of Annie.
     * @author klerikdust
     */
module.exports = {
        name: `affiliates`,
        aliases: [`affiliate`, `affiliates`, `affil`],
        description: `List of servers that supporting the development of Annie.`,
        usage: `affiliate`,
        permissionLevel: 0,
        applicationCommand: false,
        async execute(client, reply, message, arg, locale) {
            const affiliateList = await client.db.getAffiliates()
                //  Handle if there are no registered affiliates
            if (!affiliateList.length) return reply.send(locale.AFFILIATES.EMPTY)
            return reply.send(locale.AFFILIATES.DISPLAY, {
                header: `Annie's Affiliated Servers`,
                thumbnail: client.user.displayAvatarURL(),
                socket: {
                    list: await this._prettifyList(affiliateList, client),
                    user: message.author.username
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
            if (await client.db.redis.exists(cacheId)) return client.db.redis.get(cacheId)
            let res = ``
            for (let i = 0; i < source.length; i++) {
                if (i <= 0) res += `\n╭───────────────────╮\n\n`
                let server = source[i]
                let serverSnowflake = await client.shard.broadcastEval(c => {if (c.guilds.cache.has(server.guild_id)) return c.guilds.cache.get(server.guild_id).name})
                serverSnowflake = serverSnowflake.filter(g => g !== null)
                res += `**• ${serverSnowflake[0] ? serverSnowflake[0].name : `???`}**\n"*${server.description}*"\n[Click here to join!](${server.invite_link})\n\n`
            if (i === (source.length-1)) res += `╰───────────────────╯\n`
        }
        //  Cache the result to avoid broadcasting.
        //  Expire until 12 hours
        client.db.redis.set(cacheId, res)
        return res
    }
}