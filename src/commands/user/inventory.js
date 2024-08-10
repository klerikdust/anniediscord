"use strict"
const GUI = require(`../../ui/prebuild/ownerHeader`)
const commanifier = require(`../../utils/commanifier`)
const User = require(`../../libs/user`)
const { ApplicationCommandType, ApplicationCommandOptionType } = require(`discord.js`)
/**
 * Views all items in your inventory
 * @author klerikdust
 */
module.exports = {
    name: `inventory`,
    name_localizations: {
        fr: ``
    },
    description_localizations: {
        fr: ``
    },
    aliases: [`inventory`, `inv`, `bag`, `invent`, `inven`],
    description: `Views all items in user's inventory`,
    usage: `inventory <User>(Optional)`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    server_specific: false,
    options: [{
        name: `user`,
        description: `User you wish to view inventory of`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        required: false,
        type: ApplicationCommandOptionType.User
    }],
    type: ApplicationCommandType.ChatInput,
    ignoreItems: [`Cards`, `Themes`],
    async execute(client, reply, message, arg, locale, prefix) {
        const userLib = new User(client, message)
        let targetUser = arg ? await userLib.lookFor(arg) : message.author
        if (!targetUser) return await reply.send(locale.USER.IS_INVALID)
        //  Normalize structure
        targetUser = targetUser.master || targetUser
        return await this.run(client, reply, message, locale, targetUser)
    },
    async Iexecute(client, reply, interaction, options, locale) {
        return await this.run(client, reply, interaction, locale, options.getUser(`user`) || interaction.member.user)
    },
    async run(client, reply, messageRef, locale, user) {
        const itemsFilter = item => (item.quantity > 0) && (item.in_use === 0) && !this.ignoreItems.includes(item.type_name)
        const userLib = new User(client, messageRef)
        if (!user) return await reply.send(locale.USER.IS_INVALID)
        let targetUserData = await userLib.requestMetadata(user, 2, locale)
        //  Handle if couldn't fetch the inventory
        const INVALID_INVENTORY = userLib.isSelf(user.id) ? locale.INVENTORY.AUTHOR_EMPTY : locale.INVENTORY.OTHER_USER_EMPTY
        if (targetUserData.inventory.raw.length <= 0) return await reply.send(INVALID_INVENTORY, { socket: { user: user.username } })
        reply.send(locale.INVENTORY.FETCHING, { socket: { emoji: await client.getEmoji(`AAUloading`) } })
            .then(async loading => {
                //  Remove faulty values and sort order by rarity
                const filteredInventory = targetUserData.inventory.raw.filter(itemsFilter).sort((a, b) => a.rarity_id - b.rarity_id).reverse()
                targetUserData.inventory.raw = filteredInventory
                let res = []
                let str = ``
                let breakpoint = 0
                const limitPerPage = 3
                for (let i = 0; i < filteredInventory.length; i++) {
                    const item = filteredInventory[i]
                    if (breakpoint < 1) {
                        str += `╭*:;,．★ ～☆*───────╮\n`
                    }
                    breakpoint++
                    str += `╰☆～(ID:${item.item_id}) ${commanifier(item.quantity)}x **${item.name}**\n> Rarity/type:: ${item.rarity_name}, ${item.type_name}\n> Description:: ${item.description}\n> ${item.usable ? `__Consumable__` : `__Cannot be used__`}\n\n`
                    if (breakpoint >= limitPerPage || i === (filteredInventory.length - 1)) {
                        str = str.substring(0, str.length - 1)
                        str += `╰────────☆～*:;,．*╯`
                        breakpoint = 0
                        res.push(str)
                        str = ``
                    }
                }
                await reply.send(res, {
                    prebuffer: true,
                    image: await new GUI(targetUserData).build(),
                    paging: true,
                    customHeader: [`${user.username}'s Inventory!`, user.displayAvatarURL()]
                })
                if (userLib.isSelf(user.id)) await reply.send(locale.INVENTORY.AUTHOR_TIPS, {
                    simplified: true,
                    socket: {
                        prefix: `/`,
                        emoji: await client.getEmoji(`848521358236319796`)
                    }
                })
                return loading.delete()
            })
    }
}