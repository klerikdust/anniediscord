"use strict"
const Confirmator = require(`../../libs/confirmator`)
const User = require(`../../libs/user`)
const inventoryGUI = require(`../../ui/prebuild/inventory`)
const giftGUI = require(`../../ui/prebuild/gift`)
const stringSimilarity = require(`string-similarity`)
const commanifier = require(`../../utils/commanifier`)
const { ApplicationCommandType, ApplicationCommandOptionType } = require(`discord.js`)
/**
 * Send gifts to your friends! They will receive 1 reputation point for each gift you send.
 * @author klerikdust
 */
module.exports = {
    name: `gift`,
    name_localizations: {
        fr: ``
    },
    description_localizations: {
        fr: ``
    },
    aliases: [`gifts`, `giveitem`, `senditem`, `praise`],
    description: `Send gifts to your friends! They will receive 1 reputation point for each gift you send.`,
    usage: `gift <User>`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    server_specific: false,
    options: [{
        name: `send`,
        description: `Send a gift to a user`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            name: `user`,
            description: `User you wish to send gift to`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            required: true,
            type: ApplicationCommandOptionType.User
        },
        {
            name: `amount`,
            description: `Amount of gifts you wish to send`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            required: true,
            type: ApplicationCommandOptionType.Integer,
            min_value: 1
        }, {
            name: `item`,
            description: `Item you wish to send`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            required: true,
            type: ApplicationCommandOptionType.String
        }]
    }, {
        name: `how`,
        description: `how to use the gift command`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.Subcommand,
    }
    ],
    type: ApplicationCommandType.ChatInput,
    /**
     *  Prettify result from `this.author.inventory.row` into a readable list.
     *  @param {array} [inventory=[]] returned result from filtered `this.author.inventory.raw`
     *  @param {Client} client Current bot/client instance.
     *  @retuns {string}
     */
    async displayGifts(inventory = [], client) {
        let str = ``
        for (let i = 0; i < inventory.length; i++) {
            const item = inventory[i]
            str += `• ${await client.getEmoji(item.alias)} ${commanifier(item.quantity)}x ${item.name}`
            if (i != (inventory.length - 1)) str += `\n`
        }
        return str
    },
    async execute(client, reply, message, arg, locale) {
        if (!arg) {
            return await this.run(client, message, reply, locale, arg, client.prefix)
        }
        const userLib = new User(client, message)
        const targetUser = await userLib.lookFor(arg)
        // Invalid target
        if (!targetUser) return await reply.send(locale.USER.IS_INVALID)
        // Returns if user trying to gift themselves.
        if (userLib.isSelf(targetUser.id)) return await reply.send(locale.GIFT.SELF_TARGETING, { socket: { emoji: await client.getEmoji(`790338393015713812`) } })
        //  Handle if the specified gift cannot be found
        const item = arg.replace(targetUser.usedKeyword + ` `, ``) // Trim additional whitespace
        const amount = item.replace(/\D/g, ``)
        let args = [targetUser.master, item, amount]
        return await this.run(client, message, reply, locale, args, client.prefix)
    },
    async Iexecute(client, reply, interaction, options, locale) {
        let args = options.getSubcommand() === `how` ? null : [options.getUser(`user`), options.getString(`item`), options.getInteger(`amount`)]
        return await this.run(client, interaction, reply, locale, args, `/`)
    },
    async run(client, messageRef, reply, locale, args, prefix) {
        const itemFilter = item => (item.type_id === 10) && (item.quantity > 0)
        const userLib = new User(client, messageRef)
        let userData = await userLib.requestMetadata(messageRef.member.user, 2, locale)
        const availableGifts = userData.inventory.raw.filter(itemFilter)
        //  Handle if user don't have any gifts to send
        if (!availableGifts.length) return await reply.send(locale.GIFT.UNAVAILABLE, {
            socket: {
                prefix: prefix,
                emoji: await client.getEmoji(`692428927620087850`)
            }
        })
        userData.inventory.raw = availableGifts
        // Handle if user doesn't specify anything
        if (!args) {
            const loading = await reply.send(locale.GIFT.RENDERING_AVAILABLE_GIFTS, {
                simplified: true,
                socket: { emoji: await client.getEmoji(`790994076257353779`) }
            })
            await reply.send(locale.GIFT.SHORT_GUIDE, {
                prebuffer: true,
                image: (await new inventoryGUI(userData, client).build()).png(),
                socket: {
                    prefix: prefix,
                    referenceItem: availableGifts[0].name.toLowerCase(),
                    items: await this.displayGifts(availableGifts, client)
                }
            })
            return loading.delete()
        }
        const targetUser = args[0]
        // Invalid target
        if (!targetUser) return await reply.send(locale.USER.IS_INVALID)
        // Returns if user trying to gift themselves.
        if (userLib.isSelf(targetUser.id)) return await reply.send(locale.GIFT.SELF_TARGETING, { socket: { emoji: await client.getEmoji(`790338393015713812`) } })
        //  Handle if the specified gift cannot be found
        let arg = args[1]
        arg = arg.replace(` `, ``) // Trim additional whitespace
        let searchStringResult = stringSimilarity.findBestMatch(arg, availableGifts.map(i => i.name))
        const gift = searchStringResult.bestMatch.rating >= 0.2 ? availableGifts.filter(i => i.name === searchStringResult.bestMatch.target)[0] : null
        if (!gift) return await reply.send(locale.GIFT.MISSING_ITEM, {
            socket: { example: `e.g. **\`${prefix}gift ${targetUser.username} 10 ${availableGifts[0].name.toLowerCase()}\`**` }
        })
        //  Handle if can't parse the desired user's gift amount
        const amount = args[2]
        if (!amount || amount < 1) return await reply.send(locale.GIFT.INVALID_AMOUNT, {
            socket: {
                gift: gift.name,
                example: `e.g. **\`${prefix}gift ${targetUser.username} 10 ${gift.name.toLowerCase()}\`**`
            }
        })
        //  Render confirmation
        const targetUserData = await userLib.requestMetadata(targetUser, 2, locale)
        const confirmation = await reply.send(locale.GIFT.CONFIRMATION, {
            prebuffer: true,
            image: await new giftGUI(targetUserData, gift, amount).build(),
            socket: {
                user: targetUser.username,
                gift: `${await client.getEmoji(gift.alias, `634111906625617960`)} ${gift.name}`,
                amount: commanifier(amount)
            }
        })
        const c = new Confirmator(messageRef, reply, locale)
        await c.setup(messageRef.member.id, confirmation)
        c.onAccept(async () => {
            //  Handle if the amount to send is lower than total owned item
            if (gift.quantity < amount) return await reply.send(locale.GIFT.INSUFFICIENT_AMOUNT, {
                socket: {
                    gift: `${await client.getEmoji(gift.alias)} ${commanifier(gift.quantity)}x ${gift.name}`,
                    emoji: await client.getEmoji(`692428613122785281`)
                }
            })
            //  Adds reputation point to target user
            client.db.userUtils.updateUserReputation(amount, targetUser.id, messageRef.member.id, messageRef.guild.id)
            //  Deduct gifts from sender
            client.db.databaseUtils.updateInventory({ itemId: gift.item_id, value: amount, operation: `-`, userId: messageRef.member.id, guildId: messageRef.guild.id })
            return await reply.send(``, {
                customHeader: [`${targetUser.username} ${locale.GIFT.HEADER}`, targetUser.displayAvatarURL()],
                socket: {
                    user: targetUser.username,
                    gift: `${await client.getEmoji(gift.alias, `634111906625617960`)} ${commanifier(amount)}x ${gift.name}!`
                }
            })
        })
    }
}