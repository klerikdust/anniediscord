"use strict"
const { EmbedBuilder } = require(`discord.js`)
const User = require(`../../libs/user`)
const { crimson } = require(`../../ui/colors/default`)
const { ApplicationCommandType, ApplicationCommandOptionType } = require(`discord.js`)
/**
 * Display user's avatar
 * @author klerikdust
 */
module.exports = {
    name: `avatar`,
    name_localizations: {
        fr: ``
    },
    description_localizations: {
        fr: ``
    },
    aliases: [`ava`, `pfp`],
    description: `Display user's avatar`,
    usage: `avatar <user>`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    server_specific: false,
    options: [
        {
            name: `user`,
            description: `User you wish to display avatar of`,
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
        let targetUser = arg ? await (new User(client, message)).lookFor(arg) : message.author
        if (!targetUser) return await reply.send(locale.USER.IS_INVALID)
        //  Normalize structure
        targetUser = targetUser.master || targetUser
        await message.react(`📸`)
        return this.run(targetUser, message)
    },
    async Iexecute(client, reply, interaction, options, locale) {
        const target = options.getUser(`user`) || interaction.member.user
        return this.run(target, interaction)
    },
    run(user, messageRef) {
        const [avatar, name] = [user.displayAvatarURL({ forceStatic: false, size: 512, extension: `png` }), user.username]
        const embed = new EmbedBuilder()
            .setImage(avatar)
            .setAuthor({ name: name, iconURL: avatar })
            .setColor(crimson)
        return messageRef.reply({ embeds: [embed] })
    }
}