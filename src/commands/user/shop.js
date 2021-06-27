const commanifier = require(`../../utils/commanifier`)
const loadAsset = require(`../../utils/loadAsset`)
/**
 * Buy purchasable items in server's shop!
 * @author klerikdust
 */
module.exports = {
    name: `shop`,
	aliases: [`shops`, `marketplace`, `market`],
	description: `Buy purchasable items in server's shop!`,
	usage: `shop`,
	permissionLevel: 0,
    async execute(client, reply, message, arg, locale, prefix) {
        const guildShop = await client.db.getGuildShop(message.guild.id)
        if (!guildShop.length) {
            await reply.send(locale.SHOP.NO_ITEMS)
            return reply.send(locale.SHOP.SETUP_TIPS, {
                simplified: true,
                socket: {prefix: prefix}
            })
        }
        //  Handle shop closure
        if (!message.guild.configs.get(`SHOP_MODULE`).value) return reply.send(locale.SHOP.CLOSED)
        let res = []
        let str = ``
        let breakpoint = 0
        const artcoinsEmoji = await client.getEmoji(`artcoins`)
        const shopText = (message.guild.configs.get(`SHOP_TEXT`).value).replace(`{{guild}}`, `**${message.guild.name}**`)
        for (let i=0; i<guildShop.length; i++) {
            const shopMeta = guildShop[i]
            const item = await client.db.getItem(shopMeta.item_id)
            breakpoint++
            if (breakpoint <= 1) {
                str += shopText+`\n\n` 
            }
            str += `╰☆～(ID:${item.item_id}) **${item.name}**\n> ${artcoinsEmoji}**${commanifier(shopMeta.price)}**\n> ${item.description}\n> Available Stock :: ${shopMeta.quantity === `~` ? `unlimited` : commanifier(shopMeta.quantity)}\n`
            if (breakpoint >= 3 || i === (guildShop.length-1)) {
                str += `\n╰──────────☆～*:;,．*╯`
                breakpoint = 0
                res.push(str)
                str = ``
            }
            else {
                str += `\n⸻⸻⸻⸻\n`
            }
        }
        //  Displaying shop
        const customBanner = message.guild.configs.get(`SHOP_IMAGE`).value
        await reply.send(res, {
            image: customBanner ? await loadAsset(customBanner, `./src/assets/customShop`) : `banner_setshop`,
            prebuffer: customBanner ? true : false,
            paging: true,
            header: `${message.guild.name}'s Shop!`,
            thumbnail: message.guild.iconURL(),
            socket: {
                user: `**${message.author.username}**`
            }
        })
        return reply.send(locale.SHOP.BUY_TIPS, {
            simplified: true,
            socket: {
                emoji: await client.getEmoji(`AnnieHeartPeek`),
                prefix: prefix
            }
        })
    }
}
