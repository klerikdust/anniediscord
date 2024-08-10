"use strict"
const commanifier = require(`../../utils/commanifier`)
const Confirmator = require(`../../libs/confirmator`)
const trueInt = require(`../../utils/trueInt`)
const { ApplicationCommandType, ApplicationCommandOptionType } = require(`discord.js`)

/**
 * Converts Artcoins into EXP at the rate of 1:8
 * @author klerikdust
 */
module.exports = {
    name: `cartcoin`,
    name_localizations: {
        fr: ``
    },
    description_localizations: {
        fr: ``
    },
    aliases: [`convertac`, `acconvert`, `cartcoin`, `cartcoins`, `artcoinconvert`, `convertartcoin`],
    description: `Converts Artcoins into EXP at the rate of 1:8`,
    usage: `cartcoin <Amount>`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    server_specific: false,
    options: [
        {
            name: `all`,
            description: `Convert all of your Artcoins`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: `amount`,
            description: `choose the amount of Artcoins you want to convert`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            type: ApplicationCommandOptionType.Subcommand,
            options: [{
                name: `how_many`,
                description: `How many Artcoins you wish to convert`,
                name_localizations: {
                    fr: ``
                },
                description_localizations: {
                    fr: ``
                },
                requied: true,
                type: ApplicationCommandOptionType.Integer,
                min_value: 8
            }]
        }
    ],
    type: ApplicationCommandType.ChatInput,
    artcoinsRatio: 8,
    async execute(client, reply, message, arg, locale) {
        //  Returns as guide if user doesn't specify any parameters
        if (!arg) return await reply.send(locale.CARTCOIN.SHORT_GUIDE, {
            image: `banner_cartcoins`,
            socket: {
                emoji: await client.getEmoji(`692428692999241771`),
                prefix: client.prefix
            },
            footer: `Keep in mind the conversion rate is 1:${this.artcoinsRatio}`
        })
        return await this.run(client, reply, message, arg, locale)
    },
    async Iexecute(client, reply, interaction, options, locale) {
        let arg = options.getSubcommand() == `all` ? `all` : `${options.getInteger(`how_many`)}`
        return await this.run(client, reply, interaction, arg, locale)
    },
    async run(client, reply, messageRef, arg, locale,) {
        const cacheId = `CARTCOIN:${messageRef.member.id}@${messageRef.guildId}`
        if (await client.db.databaseUtils.doesCacheExist(cacheId)) {
            return await reply.send(locale.CARTCOIN.ALREADY_IN_PROGRESS, { ephemeral: true })
        }
        client.db.databaseUtils.setCache(cacheId, `1`, { EX: 60 * 30 })
        const userBalance = await client.db.userUtils.getUserBalance(messageRef.member.id, messageRef.guildId)
        const amountToUse = arg.startsWith(`all`) ? userBalance : trueInt(arg)
        //  Returns if user amount input is below the acceptable threeshold
        if (!amountToUse || amountToUse < this.artcoinsRatio) {
            client.db.databaseUtils.delCache(cacheId)
            return await reply.send(locale.CARTCOIN.INVALID_AMOUNT, {
                socket: {
                    emoji: await client.getEmoji(`692428748838010970`)
                }
            })
        }
        const totalGainedExp = amountToUse / this.artcoinsRatio
        const confirmation = await reply.send(locale.CARTCOIN.CONFIRMATION, {
            thumbnail: messageRef.member.displayAvatarURL(),
            notch: true,
            socket: {
                emoji: await client.getEmoji(`758720612087627787`),
                amount: commanifier(amountToUse),
                gainedExp: commanifier(totalGainedExp)
            }
        })
        const c = new Confirmator(messageRef, reply, locale)
        await c.setup(messageRef.member.id, confirmation)
        c.onAccept(async () => {
            //  Returns if user's artcoins is below the amount of going to be used
            if (userBalance < amountToUse) {
                client.db.databaseUtils.delCache(cacheId)
                return await reply.send(locale.CARTCOIN.INSUFFICIENT_AMOUNT, {
                    socket: {
                        amount: `${await client.getEmoji(`758720612087627787`)}${commanifier(userBalance)}`,
                        emoji: await client.getEmoji(`790338393015713812`)
                    }
                })
            }
            //	Deduct balance & add new exp
            client.db.databaseUtils.updateInventory({
                itemId: 52,
                value: amountToUse,
                operation: `-`,
                userId: messageRef.member.id,
                guildId: messageRef.guild.id
            })
            client.experienceLibs(messageRef.member, messageRef.guild, messageRef.channel, locale).execute(totalGainedExp)
            client.db.databaseUtils.delCache(cacheId)
            return await reply.send(locale.CARTCOIN.SUCCESSFUL, {
                status: `success`,
                socket: {
                    artcoins: `${await client.getEmoji(`758720612087627787`)} ${commanifier(amountToUse)}`,
                    exp: `${commanifier(totalGainedExp)} EXP`
                }
            })
        })
    }
}