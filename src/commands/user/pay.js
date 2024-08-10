"use strict"
const User = require(`../../libs/user`)
const Confirmator = require(`../../libs/confirmator`)
const GUI = require(`../../ui/prebuild/pay`)
const commanifier = require(`../../utils/commanifier`)
const trueInt = require(`../../utils/trueInt`)
const { ApplicationCommandType, ApplicationCommandOptionType } = require(`discord.js`)
/**
 * Share artcoins with your friends!
 * @author klerikdust
 */
module.exports = {
    name: `pay`,
    name_localizations: {
        fr: ``
    },
    description_localizations: {
        fr: ``
    },
    aliases: [`pay`, `transfer`, `transfers`, `share`, `give`],
    description: `Share artcoins with your friends!`,
    usage: `pay <User>`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    server_specific: false,
    options: [
        {
            name: `pay`,
            description: `Pay a user`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            type: ApplicationCommandOptionType.Subcommand,
            options: [{
                name: `user`,
                description: `The user you want to pay`,
                name_localizations: {
                    fr: ``
                },
                description_localizations: {
                    fr: ``
                },
                required: true,
                type: ApplicationCommandOptionType.User
            }, {
                name: `amount`,
                description: `The amount of artcoins you want to pay`,
                name_localizations: {
                    fr: ``
                },
                description_localizations: {
                    fr: ``
                },
                required: true,
                type: ApplicationCommandOptionType.Integer,
                min_value: 1,
                max_value: 9999999
            }]
        }, {
            name: `how`,
            description: `How to pay a user`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            type: ApplicationCommandOptionType.Subcommand
        }],
    type: ApplicationCommandType.ChatInput,
    tax: 0.02,
    requirementLevel: 3,
    maxAllowed: 999999,
    async userCheck(client, message, locale, arg, target) {
        const userLib = new User(client, message)
        if (target == `sender`) {
            const userData = await userLib.requestMetadata(message.member, 2, locale)
            if (userData.exp.level < this.requirementLevel) return false
            return userData
        } else if (target == `reciever`) {
            let targetUser = await userLib.lookFor(arg)
            if (!targetUser) return 3 // 3
            arg = arg.replace(targetUser.usedKeyword + ` `, ``)
            targetUser = targetUser.master || targetUser
            //  Handle if user is trying to pay themselves
            if (userLib.isSelf(targetUser.id)) return 4// 4
            return await userLib.requestMetadata(targetUser, 2, locale)
        }
        return false
    },
    amountCheck(amount) {
        if (!amount) return 1 // 1
        //  Handle if user isn't inputting valid amount to send
        if (!trueInt(amount)) return 2 // 2
        //  Handle if user inputted amount to send way above limit.
        if (amount > this.maxAllowed) return 3 // 3
        //  Parse amount of tax to be deducted from the transaction
        const amountOfTax = amount * this.tax
        const total = Math.round(amount - amountOfTax)
        return { senderAmount: amount, amountToSend: total }
    },
    async execute(client, reply, message, arg, locale) {
        if (!arg) return await reply.send(locale.PAY.SHORT_GUIDE, {
            header: `Hi, ${message.author.username}`,
            image: `banner_pay`,
            socket: { prefix: client.prefix }
        })
        const amountToCheck = arg.split(` `).splice(-1).join(``)
        // const amountToCheck = 5
        return await this.run(client, reply, message, locale, { a: amountToCheck, u: arg })

    },
    async Iexecute(client, reply, interaction, options, locale) {
        if (options.getSubcommand() == `how`) return await reply.send(locale.PAY.SHORT_GUIDE, {
            header: `Hi, ${interaction.member.user.username}`,
            image: `banner_pay`,
            socket: { prefix: `/` }
        })
        const amountToSend = options.getInteger(`amount`)
        const targetUser = options.getUser(`user`)
        return await this.run(client, reply, interaction, locale, { a: amountToSend, u: targetUser.username })
    },
    async run(client, reply, messageRef, locale, { a: amount, u: user }) {
        const sender = await this.userCheck(client, messageRef, locale, null, `sender`)
        if (!sender) return await reply.send(locale.PAY.LVL_TOO_LOW, { socket: { level: this.requirementLevel } })
        const reciever = await this.userCheck(client, messageRef, locale, user, `reciever`)
        if (reciever == 3) return await reply.send(locale.USER.IS_INVALID)
        if (reciever == 4) return await reply.send(locale.PAY.SELF_TARGETING, { socket: { emoji: await client.getEmoji(`692428748838010970`) } })

        //  Parse amount of artcoins to be send
        const amountToCheck = amount
        const atc = this.amountCheck(amountToCheck)
        if (atc == 1) return await reply.send(locale.PAY.INVALID_AMOUNT)
        if (atc == 2) return await reply.send(locale.PAY.INVALID_NUMBER)
        if (atc == 3) return await reply.send(locale.PAY.EXCEEDING_LIMIT, { socket: { limit: commanifier(this.maxAllowed) } })

        //  Render confirmation
        const confirmation = await reply.send(locale.PAY.USER_CONFIRMATION, {
            prebuffer: true,
            image: await new GUI(reciever, atc.amountToSend).build(),
            socket: {
                user: reciever.master.username,
                amount: `${await client.getEmoji(`758720612087627787`)} ${commanifier(atc.amountToSend)}`
            }
        })

        const c = new Confirmator(messageRef, reply, locale)
        await c.setup(messageRef.member.id, confirmation)
        c.onAccept(async () => {
            // Redundant check
            //  Handle if user trying to send artcoins above the amount they had
            if (sender.inventory.artcoins < atc.senderAmount) return await reply.send(locale.PAY.INSUFFICIENT_BALANCE)
            //  Send artcoins to target user
            client.db.databaseUtils.updateInventory({ itemId: 52, value: atc.amountToSend, userId: reciever.master.id, guildId: messageRef.guild.id })
            //  Deduct artcoins from sender's balance
            client.db.databaseUtils.updateInventory({ itemId: 52, value: atc.senderAmount, operation: `-`, userId: messageRef.member.id, guildId: messageRef.guild.id })
            // client.db.databaseUtils.delCache(sessionId)
            await reply.send(``, {
                customHeader: [`${reciever.master.username} has received your artcoins!♡`, reciever.master.displayAvatarURL()],
                socket: { target: reciever.master.username }
            })
        })
    }
}