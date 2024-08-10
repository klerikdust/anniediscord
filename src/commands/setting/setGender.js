"use strict"
const {
    ApplicationCommandType,
    ApplicationCommandOptionType
} = require(`discord.js`)
/**
 * Define your gender.
 * @author klerikdust
 */
module.exports = {
    name: `setgender`,
    name_localizations: {
        fr: ``
    },
    description_localizations: {
        fr: ``
    },
    aliases: [`setgender`, `setgenders`, `setgndr`],
    description: `Define your gender`,
    usage: `setgender <F/M>`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    server_specific: false,
    messageCommand: true,
    options: [{
        name: `gender`,
        description: `Choose between our available options`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.String,
        choices: [{ name: `male`, value: `male` }, { name: `female`, value: `female` }, { name: `neutral`, value: `neutral` }]
    }],
    type: ApplicationCommandType.ChatInput,
    async execute(client, reply, message, arg, locale, prefix) {
        const userGender = await client.db.userUtils.getUserGender(message.author.id)
        if (!arg) return await reply.send(locale.SETGENDER.GUIDE, {
            image: `banner_setgender`,
            socket: {
                prefix: prefix,
                currentGender: reply.socketing(locale.SETGENDER[!userGender ? `HASNT_SET` : `ALREADY_SET`], {
                    gender: userGender ? (userGender.gender === `m` ? `male` : `female`) : null
                })
            }
        })
        const malePool = [`male`, `ml`, `m`, `boy`, `man`]
        const femalePool = [`female`, `fl`, `f`, `girl`, `woman`]
        //  Handle out of range options
        const key = arg.toLowerCase()
        const targetGender = malePool.includes(key) ? `m` :
            femalePool.includes(key) ? `f` : null
        //  Update/register gender
        !targetGender ? client.db.userUtils.updateUserGenderToneutral(message.author.id) :
            client.db.userUtils.updateUserGender(message.author.id, targetGender)
        return await reply.send(locale.SETGENDER.SUCCESSFUL, {
            status: `success`,
            socket: {
                emoji: await client.getEmoji(`789212493096026143`)
            }
        })
    },
    async Iexecute(client, reply, interaction, options, locale) {
        const userGender = await client.db.userUtils.getUserGender(interaction.member.id)
        const key = options.getString(`gender`)
        if (!key) return await reply.send(locale.SETGENDER.GUIDE, {
            image: `banner_setgender`,
            socket: {
                prefix: `/`,
                currentGender: reply.socketing(locale.SETGENDER[!userGender ? `HASNT_SET` : `ALREADY_SET`], {
                    gender: userGender ? (userGender.gender === `m` ? `male` : `female`) : null
                })
            }
        })
        const malePool = [`male`, `ml`, `m`, `boy`, `man`]
        const femalePool = [`female`, `fl`, `f`, `girl`, `woman`]
        //  Handle out of range options
        const targetGender = malePool.includes(key.toLowerCase()) ? `m` :
            femalePool.includes(key.toLowerCase()) ? `f` :
                null
        !targetGender ? client.db.userUtils.updateUserGenderToneutral(interaction.member.id) :
            //  Update/register gender
            client.db.userUtils.updateUserGender(interaction.member.id, targetGender)
        return await reply.send(locale.SETGENDER.SUCCESSFUL, {
            status: `success`,
            socket: {
                emoji: await client.getEmoji(`789212493096026143`)
            }
        })
    }
}