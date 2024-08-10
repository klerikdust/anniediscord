"use strict"
const User = require(`../../libs/user`)
const Confirmator = require(`../../libs/confirmator`)
const ItemEffects = require(`../../libs/itemEffects`)
const stringSimilarity = require(`string-similarity`)
const {
    ApplicationCommandType,
    ApplicationCommandOptionType
} = require(`discord.js`)
/**
 * Consume an item and gain certain effect.
 * @author klerikdust
 */
module.exports = {
    name: `use`,
    name_localizations: {
        fr: ``
    },
    description_localizations: {
        fr: ``
    },
    aliases: [`use`, `uses`, `eat`, `drink`, `open`, `consume`],
    description: `Consume an item and gain certain effect`,
    usage: `use <item>`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    server_specific: false,
    options: [{
        name: `item`,
        description: `The item you want to use`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        required: true,
        type: ApplicationCommandOptionType.String,
    }],
    type: ApplicationCommandType.ChatInput,
    async execute(client, reply, message, arg, locale) {
        return await this.run(client, reply, message, arg, locale)
    },
    async Iexecute(client, reply, interaction, options, locale) {

        await interaction.deferReply({ ephemeral: true })
        let arg = options.getString(`item`)
        return await this.run(client, reply, interaction, arg, locale)
    },
    async run(client, reply, messageRef, arg, locale) {
        const data = await (new User(client, messageRef)).requestMetadata(messageRef.member.user, 2, locale)
        if (!data.inventory.raw.length) return await reply.send(locale.USE.NO_ITEMS, {
            socket: {
                emoji: await client.getEmoji(`AnnieYandereAnim`)
            },
            editReply: true
        })
        //  Finding the closest target item.
        const searchStringResult = stringSimilarity.findBestMatch(arg.toLowerCase(), data.inventory.raw.map(i => i.name.toLowerCase()))
        const targetItem = searchStringResult.bestMatch.rating >= 0.5
            //  By name
            ?
            data.inventory.raw.find(i => i.name.toLowerCase() === searchStringResult.bestMatch.target)
            //  Fallback search by ID
            :
            data.inventory.raw.find(i => parseInt(i.item_id) === parseInt(arg))
        if (!targetItem) return await reply.send(locale.USE.INVALID_ITEM, {
            socket: {
                emoji: await client.getEmoji(`AnnieThinking`)
            },
            editReply: true
        })
        if (targetItem.quantity <= 0) return await reply.send(locale.USE.INSUFFICIENT, {
            editReply: true
        })
        //  Handle non-usable item
        if (targetItem.usable === 0) return await reply.send(locale.USE.UNUSABLE, {
            socket: {
                emoji: await client.getEmoji(`AnnieYandereAnim`)
            },
            editReply: true
        })
        const effectLib = new ItemEffects(client, messageRef, locale)
        //  Usage confirmation
        const confirmation = await reply.send(locale.USE.CONFIRMATION, {
            thumbnail: messageRef.member.displayAvatarURL(),
            socket: {
                item: targetItem.name,
                footer: await effectLib.displayItemBuffs(targetItem.item_id) || locale.USE.CONFIRMATION_TIPS
            },
            editReply: true
        })
        const c = new Confirmator(messageRef, reply, locale)
        await c.setup(messageRef.member.id, confirmation)
        c.onAccept(async () => {
            //  Deduct item from user's inventory.
            client.db.databaseUtils.updateInventory({
                itemId: targetItem.item_id,
                userId: messageRef.member.id,
                guildId: messageRef.guild.id,
                operation: `-`,
                value: 1
            })
            //  Applying effect if there's any.
            effectLib.applyItemEffects(targetItem.item_id)
            //  Displaying custom message upon use (if there's any).
            const displayedMsg = targetItem.response_on_use === `~` ? locale.USE.SUCCESSFUL : targetItem.response_on_use
            return await reply.send(displayedMsg, {
                status: `success`,
                socket: {
                    item: `**${targetItem.name}**`,
                    user: `**${messageRef.member.user.username}**`
                }
            })
        })
    }
}