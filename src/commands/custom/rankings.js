"use strict"
const GUI = require(`../../ui/prebuild/leaderboard`)
const User = require(`../../libs/user`)
const commanifier = require(`../../utils/commanifier`)
const { ApplicationCommandType } = require(`discord.js`)
/**
 * Displays your server leaderboard!
 * @author klerikdust
 */
module.exports = {
    name: `rankings`,
    name_localizations: {
        fr: `classements`
    },
    description_localizations: {
        fr: `Affichage du classement de votre serveur pour l'élément sélectionné !`
    },
    aliases: [],
    description: `Displaying your server leaderboard for selected item!`,
    usage: `rankings`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    messageCommand: false,
    server_specific: true,
    servers: [`577121315480272908`, `882552960771555359`],
    type: ApplicationCommandType.ChatInput,
    async execute(client, reply, message, arg, locale) {
        return await this.run(client, reply, message, locale)
    },
    async Iexecute(client, reply, interaction, options, locale) {
        return await this.run(client, reply, interaction, locale)
    },
    async run(client, reply, messageRef, locale) {
        const itemConfigId = `CUSTOM_LB_ITEM`
        if (!messageRef.guild.configs.get(itemConfigId)) return await reply.send(`Please run \`setitem\` first.`)
        const itemId = messageRef.guild.configs.get(itemConfigId).value
        const item = await client.db.shop.getItem(Number(itemId), messageRef.guild.id)
        if (!item) return await reply.send(`Please run \`setitem\` first.`)
        const selectedGroup = item.name
        return await reply.send(locale.COMMAND.FETCHING, {
            socket: {
                command: `Custom leaderboard for ${selectedGroup}(s)`,
                emoji: await client.getEmoji(`790994076257353779`),
                user: messageRef.member.id
            },
            simplified: true
        })
            .then(async load => {
                //  Fetch points data and eliminates zero values if present.
                let lbData = (await client.db.databaseUtils.indexRanking(`custom`, messageRef.guild.id, item.item_id)).filter(node => node.points > 0)
                let validUsers = []
                //  Fetching uncached users
                for (let i = 0; i < lbData.length; i++) {
                    //  Make sure to limit the iterations once hit the limit
                    if (validUsers.length >= 10) break
                    const node = lbData[i]
                    //  It will check on the members cache first, if not available, then fetch. 
                    try {
                        const target = await messageRef.guild.members.fetch(node.id)
                        if (target.id) validUsers.push(node)
                    } catch (e) { e }
                }
                //  Handle if no returned leaderboard data
                if (!validUsers.length) {
                    load.delete()
                    return await reply.send(locale.LEADERBOARD.NO_DATA, {
                        color: `golden`,
                        socket: {
                            category: selectedGroup.charAt(0).toUpperCase() + selectedGroup.slice(1),
                            emoji: await client.getEmoji(`751024231189315625`)
                        }
                    })
                }
                const userData = await (new User(client, messageRef)).requestMetadata(messageRef.member.user, 2, locale)
                const img = await new GUI(userData, validUsers, client, messageRef.guild).build()
                load.delete()
                await reply.send(`:trophy: **| ${selectedGroup.charAt(0).toUpperCase() + selectedGroup.slice(1)} Leaders**\n${messageRef.guild.name}'s Ranking`, {
                    prebuffer: true,
                    image: img.png(),
                    simplified: true
                })
                const author = validUsers.filter(key => key.id === messageRef.member.id)[0]
                const footer = author ? locale.LEADERBOARD.AUTHOR_RANK : locale.LEADERBOARD.UNRANKED
                await reply.send(footer, {
                    simplified: true,
                    socket: {
                        rank: validUsers.indexOf(author) + 1,
                        points: author ? commanifier(author.points) : 0,
                        emoji: `⭐`,
                    }
                })
            })
    }
}