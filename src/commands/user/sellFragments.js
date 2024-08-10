"use strict"
const User = require(`../../libs/user`)
const Confirmator = require(`../../libs/confirmator`)
const GUI = require(`../../ui/prebuild/sellFragment`)
const commanifier = require(`../../utils/commanifier`)
const trueInt = require(`../../utils/trueInt`)
const {
    ApplicationCommandType,
    ApplicationCommandOptionType
} = require(`discord.js`)
/**
 * Exchange all your unused fragments into artcoins!
 * @author klerikdust
 */
module.exports = {
    name: `sellfragments`,
    name_localizations: {
        fr: ``
    },
    description_localizations: {
        fr: ``
    },
    aliases: [`sellfrag`, `sellfragments`, `sellfrags`, `sellfragment`],
    description: `Exchange all your unused fragments into artcoins!`,
    usage: `sellfragments <amount/all>`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    options: [{
        name: `all`,
        description: `Sell all your fragments`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.Subcommand,
    },
    {
        name: `specific`,
        description: `The amount of fragments you want to sell`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            name: `amount`,
            description: `The amount of fragments you want to sell`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            required: true,
            type: ApplicationCommandOptionType.Integer,
            min_value: 5,
        }]
    }
    ],
    type: ApplicationCommandType.ChatInput,
    server_specific: false,
    rate: 5,
    minimumToSell: 5,
    async execute(client, reply, message, arg, locale) {
        //  Display guild if user doesn't specify any arg
        if (!arg) return await reply.send(locale.SELLFRAGMENTS.GUIDE, {
            header: `Hi, ${message.author.username}!`,
            image: `banner_sellfragments`,
            socket: {
                prefix: client.prefix,
                emoji: await client.getEmoji(`700731914801250324`),
                emojiFragment: await client.getEmoji(`577121735917174785`),
                rate: `${this.rate}:1`,
                min: this.minimumToSell
            }
        })
        const amountToSell = arg.startsWith(`all`) ? `all` : trueInt(arg)
        return this.run(client, reply, message, locale, amountToSell)

    },
    async Iexecute(client, reply, interaction, options, locale) {
        let arg = options.getInteger(`amount`)
        if (options.getSubcommand() == `all`) arg = `all`
        if (!arg) return await reply.send(locale.SELLFRAGMENTS.GUIDE, {
            header: `Hi, ${interaction.member.user.username}!`,
            image: `banner_sellfragments`,
            socket: {
                prefix: `/`,
                emoji: await client.getEmoji(`700731914801250324`),
                emojiFragment: await client.getEmoji(`577121735917174785`),
                rate: `${this.rate}:1`,
                min: this.minimumToSell
            }
        })
        return this.run(client, reply, interaction, locale, arg)
    },
    async run(client, reply, messageRef, locale, amount) {
        const userData = await (new User(client, messageRef)).requestMetadata(messageRef.member.user, 2, locale)
        //  Handle if user doesn't have any fragments in their inventory
        if (!userData.inventory.fragments) return await reply.send(locale.SELLFRAGMENTS.EMPTY_FRAGMENTS, {
            socket: {
                emoji: await client.getEmoji(`692428748838010970`)
            },
        })
        //  Handle if user specified an invalid amount        
        const amountToSell = amount === `all` ? userData.inventory.fragments : amount
        if (!amountToSell && amountToSell <= userData.inventory.fragments) return await reply.send(locale.SELLFRAGMENTS.INVALID_AMOUNT)
        //  Handle if user's specified amount is lower than the minimum sell 
        if (amountToSell < this.minimumToSell) return await reply.send(locale.SELLFRAGMENTS.AMOUNT_TOO_LOW, {
            socket: {
                amount: this.minimumToSell,
                emoji: await client.getEmoji(`692428748838010970`)
            }
        })
        //  Calculate amount to receive
        const receivedAmount = Math.floor(amountToSell / this.rate)
        //  Confirmation
        const confirmation = await reply.send(locale.SELLFRAGMENTS.CONFIRMATION, {
            prebuffer: true,
            image: await new GUI(userData, receivedAmount).build(),
            socket: {
                fragmentsAmount: commanifier(amountToSell),
                artcoinsAmount: commanifier(receivedAmount),
                fragmentsEmoji: await client.getEmoji(`577121735917174785`),
                artcoinsEmoji: await client.getEmoji(`758720612087627787`)
            }
        })
        const c = new Confirmator(messageRef, reply, locale)
        await c.setup(messageRef.member.id, confirmation)
        c.onAccept(async () => {
            //  Prevent user from selling over the amount of their owned fragments
            if (amountToSell > userData.inventory.fragments) return await reply.send(locale.SELLFRAGMENTS.INVALID_AMOUNT)
            //  Deliver artcoins to user's inventory
            client.db.databaseUtils.updateInventory({
                itemId: 52,
                userId: messageRef.member.id,
                guildId: messageRef.guild.id,
                value: receivedAmount
            })
            //  Deduct fragments from user's inventory
            client.db.databaseUtils.updateInventory({
                itemId: 51,
                userId: messageRef.member.id,
                guildId: messageRef.guild.id,
                value: amountToSell,
                operation: `-`
            })
            return await reply.send(``, {
                customHeader: [`Fragments has been sold!`, messageRef.member.displayAvatarURL()]
            })
        })
    }
}