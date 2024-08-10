"use strict"
const { ApplicationCommandType } = require(`discord.js`)
const ms = require(`ms`)
/**
 * Displaying your currently active buffs.
 * @author klerikdust
 */
module.exports = {
    name: `buff`,
    name_localizations: {
        fr: ``
    },
    description_localizations: {
        fr: ``
    },
    aliases: [`buffs`, `buff`, `activebuff`],
    description: `Displaying your currently active buffs`,
    usage: `buff`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    server_specific: false,
    type: ApplicationCommandType.ChatInput,
    async execute(client, reply, message, arg, locale) {
        return await this.run(client, reply, message.member, locale)
    },
    async Iexecute(client, reply, interaction, options, locale) {
        return await this.run(client, reply, interaction.member, locale)
    },
    async run(client, reply, guildMember, locale) {
        const buffs = await client.db.durationalBuffs.getSavedUserDurationalBuffs(guildMember.id)
        if (!buffs.length) return await reply.send(locale.BUFF.NO_ACTIVE_BUFFS, {
            socket: {
                emoji: await client.getEmoji(`AnnieHeartPeek`)
            }
        })
        let str = ``
        for (let i = 0; i < buffs.length; i++) {
            const buff = buffs[i]
            const localTime = await client.db.systemUtils.toLocaltime(buff.registered_at)
            const expireAt = new Date(localTime).getTime() + buff.duration
            str += `╰☆～(${buff.multiplier * 100}%)(${ms(new Date(expireAt).getTime() - Date.now(), { long: true })}) ${buff.type} boost from **'${buff.name}'** buff.\n`
        }
        return await reply.send(str, {
            customHeader: [`${guildMember.user.username}'s Active Buffs`, guildMember.displayAvatarURL()]
        })
    }
}