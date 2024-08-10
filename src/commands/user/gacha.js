"use strict"
const User = require(`../../libs/user`)
const Confirmator = require(`../../libs/confirmator`)
const GUI = require(`../../ui/prebuild/gacha`)
const closestBelow = require(`../../utils/closestBelow`)
const trueInt = require(`../../utils/trueInt`)
const random = require(`../../utils/random`)
const { ApplicationCommandType, ApplicationCommandOptionType } = require(`discord.js`)
/**
 * Opens a Lucky Ticket and wins various exclusive rewards!
 * @author klerikdust
 */
module.exports = {
    name: `gacha`,
    name_localizations: {
        fr: ``
    },
    description_localizations: {
        fr: ``
    },
    aliases: [`gch`, `gacha`, `reroll`],
    description: `Opens a Lucky Ticket and wins various rewards such as card collection and cosmetic items!`,
    usage: `gacha <Amount>`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    amountToOpenRanges: [1, 10],
    server_specific: false,
    options: [{
        name: `amount`,
        description: `Amount of tickets to open`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        required: true,
        type: ApplicationCommandOptionType.Integer,
        choices: [{ name: `one`, value: 1 }, { name: `ten`, value: 10 }, { name: `1`, value: 1 }, { name: `10`, value: 10 }]
    }],
    type: ApplicationCommandType.ChatInput,
    async execute(client, reply, message, arg, locale, prefix) {
        const amountToOpen = arg ? trueInt(arg) : 1
        //  Handle if amount to be opened is out of defined range.
        if (!this.amountToOpenRanges.includes(amountToOpen)) return await reply.send(locale.GACHA.AMOUNT_OUTOFRANGE, {
            socket: { emoji: await client.getEmoji(`781504248868634627`) }
        })
        return await this.run(client, message, reply, locale, amountToOpen)
    },
    async Iexecute(client, reply, interaction, options, locale) {
        const amountToOpen = options.getInteger(`amount`)
        return await this.run(client, interaction, reply, locale, amountToOpen)
    },
    async run(client, messageRef, reply, locale, amountToOpen) {
        const userData = await (new User(client, messageRef)).requestMetadata(messageRef.member.user, 2, locale)

        //  Handle if amount to be opened is out of defined range.
        if (!this.amountToOpenRanges.includes(amountToOpen)) return await reply.send(locale.GACHA.AMOUNT_OUTOFRANGE, {
            socket: { emoji: await client.getEmoji(`781504248868634627`) }
        })
        //  Direct roll if user already has the tickets.
        const instanceId = `GACHA_SESSION:${messageRef.member.id}@${messageRef.guild.id}`
        if (userData.inventory.lucky_ticket >= amountToOpen) return this.startsRoll(client, reply, messageRef, amountToOpen, locale, instanceId, userData)
        const userCurrentCurrency = userData.inventory.artcoins
        const amountToPay = 120 * amountToOpen
        //  Handle if user doesn't have enough artcoins to buy tickets
        if (userCurrentCurrency < amountToPay) return await reply.send(locale.GACHA.SUGGEST_TO_GRIND, {
            socket: {
                prefix: `/`,
                emoji: await client.getEmoji(`692428927620087850`)
            }
        })

        if (await client.db.databaseUtils.doesCacheExist(instanceId)) return await reply.send(locale.GACHA.SESSION_STILL_ACTIVE)
        /**
         * --------------------
         * 1.) GIVE PURCHASE OFFER TO USER
         * --------------------
         */
        const suggestToBuy = await reply.send(locale.GACHA.SUGGEST_TO_BUY, {
            footer: locale.GACHA.UPON_PURCHASE_WARN,
            socket: {
                amount: amountToOpen
            }
        })

        const c = new Confirmator(messageRef, reply, locale)
        await c.setup(messageRef.member.id, suggestToBuy)
        //  Timeout in 30 seconds
        client.db.databaseUtils.setCache(instanceId, `1`, { EX: 30 })
        c.onAccept(async () => {
            //  Deduct balance & deliver lucky tickets
            await client.db.databaseUtils.updateInventory({ itemId: 52, value: amountToPay, operation: `-`, userId: messageRef.member.id, guildId: messageRef.guild.id })
            await client.db.databaseUtils.updateInventory({ itemId: 71, value: amountToOpen, userId: messageRef.member.id, guildId: messageRef.guild.id })
            this.startsRoll(client, reply, messageRef, amountToOpen, locale, instanceId, userData)
        })
    },
    /**
     * Rolling loots
     * @return {void}
     */
    async startsRoll(client, reply, message, arg, locale, instanceId, userData) {
        const rewardsPool = await client.db.shop.getGachaRewardsPool()
        //  Handle if no rewards are available to be pulled from gacha.
        if (!rewardsPool.length) return await reply.send(locale.GACHA.UNAVAILABLE_REWARDS, { socket: { emoji: client.getEmoji(`AnnieCry`) } })
        const fetching = await reply.send(random(locale.GACHA.OPENING_WORDS), {
            simplified: true,
            socket: {
                user: message.member.user.username,
                emoji: await client.getEmoji(`781504248868634627`)
            },
            followUp: !reply.message.replied && !reply.message.deferred ? false : true
        })
        //  Registering loot
        let loots = []
        const drawCount = this.drawCounts(arg)
        for (let i = 0; i < drawCount; i++) {
            const loot = this.getLoot(rewardsPool)
            loots.push(loot)
        }
        //  Subtract user's box
        client.db.databaseUtils.updateInventory({ itemId: 71, value: drawCount, operation: `-`, userId: message.member.user.id, guildId: message.guild.id })
        //  Storing received loots into user's inventory
        for (let i = 0; i < loots.length; i++) {
            const item = loots[i]
            await client.db.databaseUtils.updateInventory({ itemId: item.item_id, value: item.quantity, userId: message.member.user.id, guildId: message.guild.id })
        }
        client.db.databaseUtils.delCache(instanceId)
        // client.db.redis.del(instanceId)
        //  Displaying result
        await reply.send(locale.GACHA.HEADER, {
            prebuffer: true,
            customHeader: [`${message.member.user.username} has opened Pandora Box!`, message.member.displayAvatarURL()],
            image: await new GUI(loots, drawCount, userData).build(),
            socket: {
                items: this.displayDetailedLoots(client, loots)
            }
        })
        return message.type == 0 ? fetching.delete() : null
    },

    /**
     * Aggregate and prettify loots into a readable list.
     * @param {Client} client Current bot/client instance.
     * @param {object} loots Source loots
     * @returns {string}
     */
    displayDetailedLoots(client, loots) {
        let str = ``
        let items = loots.map(item => item.name)
        let uniqueItems = [...new Set(items)]
        for (let i = 0; i < uniqueItems.length; i++) {
            const item = loots.filter(item => item.name === uniqueItems[i])
            const amount = item.map(item => item.quantity)
            const receivedAmount = amount.reduce((acc, current) => acc + current)
            str += `╰☆～(${item[0].rarity_name}/${item[0].type_name}) ${receivedAmount}x ${uniqueItems[i]}\n`
        }
        return str
    },

    /**
     * Get possible item from given rewards pool (returned result from `Database.getGachaRewardsPool()`).
     * Uses basic RNG by weight.
     * @param {array} [rewardsPool=[]] returned array from `Database.getGachaRewardsPool()`
     * @returns {object}
     */
    getLoot(rewardsPool = []) {
        const totalProbability = rewardsPool.reduce((total, item) => total + item.weight, 0)
        const weightsPool = rewardsPool.map(item => item.weight)
        let rng = Math.random() * totalProbability
        //  Handle if rng is hitting infinity, auto select fragments
        if (rng === `-infinity`) rng = 50
        const fitInRanges = closestBelow(weightsPool, rng)
        const item = rewardsPool.filter(item => item.weight === fitInRanges)
        //  Variable 'result' will determine if there are multiple items in the same weight
        //  then randomize the array. Otherwise, returns the first index.
        const result = item.length > 1 ? item[Math.floor(Math.random() * item.length)] : item[0]
        return result
    },

    /**
     * Determine user's gacha counts
     * @param {string} arg
     * @return {number}
     */
    drawCounts(arg) {
        return !arg || arg == 1 ? 1 : 10
    }
}