"use strict"
const User = require(`../../libs/user`)
const commanifier = require(`../../utils/commanifier`)
const { ApplicationCommandType, ApplicationCommandOptionType } = require(`discord.js`)
/**
 * Displaying user's current balance
 * @author klerikdust
 */
module.exports = {
    name: `balance`,
    name_localizations: {
        fr: ``
    },
    description_localizations: {
        fr: ``
    },
    aliases: [`bal`, `money`, `credit`, `ball`, `ac`, `artcoin`, `artcoins`],
    description: `Displaying user's current balance`,
    usage: `balance`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    server_specific: false,
    options: [
        {
            name: `user`,
            description: `User you wish to display balance of`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            required: false,
            type: ApplicationCommandOptionType.User
        }
    ],
    type: ApplicationCommandType.ChatInput,
    async execute(client, reply, message, arg, locale) {
        const userLib = new User(client, message)
        let targetUser = arg ? await userLib.lookFor(arg) : message.author
        if (!targetUser) return await reply.send(locale.USER.IS_INVALID)
        //  Normalize structure
        targetUser = targetUser.master || targetUser
        return this.run(targetUser, client, reply, message, locale)
    },
    async Iexecute(client, reply, interaction, options, locale) {
        const targetUser = options.getUser(`user`) || interaction.member.user
        return await this.run(targetUser, client, reply, interaction, locale)
    },
    async run(user, client, reply, messageRef, locale) {
        const targetUserBalance = await client.db.userUtils.getUserBalance(user.id, messageRef.guild.id)
        const negBal = targetUserBalance < 0
        if (negBal) client.db.databaseUtils.updateInventory({ itemId: 52, value: 0, userId: user.id, guildId: messageRef.guild.id })
        return await reply.send(locale.DISPLAY_BALANCE, {
            thumbnail: user.displayAvatarURL(),
            socket: {
                emoji: await client.getEmoji(`758720612087627787`),
                amount: negBal ? 0 : commanifier(targetUserBalance),
                tips: user.id === messageRef.member.id ? `Use **\`${client.prefix}pay\`** to share with friends!` : ` `
            }
        })
    }
}