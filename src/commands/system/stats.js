"use strict"
const memUsage = require(`../../utils/memoryUsage`)
const pkg = require(`../../../package`)
const shardName = require(`../../config/shardName`)
const ms = require(`ms`)
const commanifier = require(`../../utils/commanifier`)

const { ApplicationCommandType } = require(`discord.js`)
/**
 * Gives info about the current bot performance.
 * @author klerikdust
 */
module.exports = {
    name: `stats`,
    name_localizations: {
        fr: ``
    },
    description_localizations: {
        fr: ``
    },
    aliases: [`stats`, `botinfo`, `annieinfo`, `info`, `anniestatus`],
    description: `Gives info about the current Annie's Statistic.`,
    usage: `stats`,
    permissionLevel: 0,
    multiUser: false,
    server_specific: false,
    applicationCommand: true,
    messageCommand: true,
    type: ApplicationCommandType.ChatInput,
    async execute(client, reply, message, arg, locale) {
        return await this.run(client, reply, message, locale)
    },
    async Iexecute(client, reply, interaction, options, locale) {
        return await this.run(client, reply, interaction, locale)
    },
    async run(client, reply, messageRef, locale) {
        const { total } = await client.db.systemUtils.getTotalCommandUsage()
        //  Cache server size for every 12 hour
        const serverSize = async () => {
            const key = `MASTER:GUILD_SIZE`
            const onCache = await client.db.databaseUtils.getCache(key)
            // const onCache = await client.db.redis.get(key)
            if (onCache) return onCache
            const size = (await client.shard.fetchClientValues(`guilds.cache.size`)).reduce((acc, guildCount) => acc + guildCount, 0)
            client.db.databaseUtils.setCache(key, size.toString(), { EX: (60 * 60) * 12 })
            return size
        }
        return await reply.send(locale.SYSTEM_STATS.DISPLAY, {
            header: locale.SYSTEM_STATS.HEADER,
            thumbnail: client.user.displayAvatarURL(),
            socket: {
                shard: shardName[messageRef.guild.shard.id],
                ping: commanifier(client.ws.ping),
                uptime: ms(client.uptime, { long: true }),
                memory: this.formatBytes(memUsage()),
                totalCommands: commanifier(total),
                version: pkg.version,
                servers: commanifier(await serverSize()),
                emoji: await client.getEmoji(`AnnieNyaa`)
            }
        })
    },

    /**
     * Used to format returned bytes value into more human-readable data.
     * @param {Bytes/Number} bytes 
     * @param {*} decimals 
     */
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return `0 Bytes`
        const k = 1024
        const dm = decimals < 0 ? 0 : decimals
        const sizes = [`Bytes`, `KB`, `MB`, `GB`, `TB`, `PB`, `EB`, `ZB`, `YB`]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ` ` + sizes[i]
    }
}