"use strict"
const commanifier = require(`../../utils/commanifier`)
const loadAsset = require(`../../utils/loadAsset`)
const {
    ApplicationCommandType
} = require(`discord.js`)
/**
 * Buy purchasable items in server's shop!
 * @author klerikdust
 */
module.exports = {
    name: `shop`,
    name_localizations: {
        fr: ``
    },
    description_localizations: {
        fr: ``
    },
    aliases: [`shops`, `marketplace`, `market`],
    description: `Buy purchasable items in server's shop!`,
    usage: `shop`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    server_specific: false,
    type: ApplicationCommandType.ChatInput,
    async run(client, reply, messageRef, locale) {
        const guildShop = await client.db.shop.getGuildShop(messageRef.guild.id)

        if (!guildShop.length) {
            await reply.send(locale.SHOP.NO_ITEMS)
            return await reply.send(locale.SHOP.SETUP_TIPS, {
                simplified: true,
                socket: {
                    prefix: `/`
                },
                followUp: true
            })
        }
        //  Handle shop closure
        if (!messageRef.guild.configs.get(`SHOP_MODULE`).value) return await reply.send(locale.SHOP.CLOSED)
        let res = []
        let str = ``
        let breakpoint = 0
        const artcoinsEmoji = await client.getEmoji(`758720612087627787`)
        const shopText = (messageRef.guild.configs.get(`SHOP_TEXT`).value).replace(`{{guild}}`, `**${messageRef.guild.name}**`)
        for (let i = 0; i < guildShop.length; i++) {
            const shopMeta = guildShop[i]
            const item = await client.db.shop.getItem(shopMeta.item_id)
            breakpoint++
            if (breakpoint <= 1) {
                str += shopText + `\n\n`
            }
            str += `╰☆～(ID:${item.item_id}) **${item.name}**\n> ${artcoinsEmoji}**${commanifier(shopMeta.price)}**\n> ${item.description}\n> Available Stock :: ${shopMeta.quantity === `~` || BigInt(shopMeta.quantity) == 9223372036854775808n ? `unlimited` : commanifier(shopMeta.quantity)}\n`
            if (breakpoint >= 3 || i === (guildShop.length - 1)) {
                str += `\n╰──────────☆～*:;,．*╯`
                breakpoint = 0
                res.push(str)
                str = ``
            } else {
                str += `\n⸻⸻⸻⸻\n`
            }
        }
        //  Displaying shop
        const customBanner = messageRef.guild.configs.get(`SHOP_IMAGE`).value
        await reply.send(res, {
            image: customBanner ? await loadAsset(customBanner, { assetsPath: `./src/assets/customShop` }) : `banner_setshop`,
            prebuffer: customBanner ? true : false,
            paging: true,
            header: `${messageRef.guild.name}'s Shop!`,
            thumbnail: messageRef.guild.iconURL(),
            socket: {
                user: `**${messageRef.member.user.username}**`
            }
        })
        return await reply.send(locale.SHOP.BUY_TIPS, {
            simplified: true,
            socket: {
                emoji: await client.getEmoji(`AnnieHeartPeek`),
                prefix: `/`
            }
        })
    },
    async execute(client, reply, message, arg, locale, prefix) {
        return await this.run(client, reply, message, locale)
    },
    async Iexecute(client, reply, interaction, options, locale) {
        return await this.run(client, reply, interaction, locale)
    }
}