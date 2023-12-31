"use strict"
const { ApplicationCommandType, ApplicationCommandOptionType, PermissionFlagsBits, Collection } = require(`discord.js`)
const customReward = require(`../../libs/customRewards`)
/**
 * Command's Class description
 * @author yourname
 */
module.exports = {
    name: `sendreward`,
    aliases: [],
    description: `Send a package made from 'makereward' to a user`,
    usage: `sendreward <user>`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    messageCommand: false,
    default_member_permissions: PermissionFlagsBits.ManageEvents.toString(),
    options: [{
        name: `user`,
        description: `The user you would like to send to`,
        required: true,
        type: ApplicationCommandOptionType.User
    }, {
        name: `package_name`,
        description: `The name of the reward package`,
        required: true,
        type: ApplicationCommandOptionType.String,
        autocomplete: true
    }],
    type: ApplicationCommandType.ChatInput,
    async autocomplete(client, interaction) {
        /**
         * Fill choices with the available packages found in DB
         */
        const focusedValue = interaction.options.getFocused()
        const packages_raw = await client.db.customRewardUtils.getCustomRewards(interaction.guild.id)
        if (packages_raw.length < 1) return await interaction.respond([{ name: `No Packages Available`, value: `none` }])
        const packages_collection = new Collection()
        packages_raw.forEach(element => {
            let rewardSchema = new customReward(element.reward_name)
            packages_collection.set(element.reward_name, rewardSchema.unpack(element.reward))
            rewardSchema = null
        })
        const choices = Array.from(packages_collection.keys())
        const filtered = choices.filter(choice => choice.startsWith(focusedValue))
        await interaction.respond(
            filtered.map(choice => ({ name: choice, value: choice })),
        )
    },
    async Iexecute(client, reply, interaction, options, locale) {
        const user = options.getUser(`user`)
        const packageName = options.getString(`package_name`)
        
        // handle if no packages are availble
        if (packageName === `none`) return await reply.send(`I'm sorry but you dont have any packages made, you can make one with \`/makereward create\``)

        let rewardSchema = new customReward(packageName)
        let rewardraw = await client.db.customRewardUtils.getRewardByName(interaction.guild.id, packageName)
        let reward = rewardraw[0]
        let rawObject = rewardSchema.unpack(reward.reward)
        let roles = []
        const items = new Collection()
        const ac = rawObject.acReward
        console.log(roles)
        console.log(items)
        console.log(ac)
        if (rawObject.roles.length > 0) {
            console.log(`roles`)
            roles = rawObject.roles.map(a => JSON.parse(a.id))
            for (const id of roles) {
                await interaction.guild.members.fetch(user.id)
                // Ignore the role if the user already has the role
                if (interaction.guild.members.cache.get(user.id).roles.cache.has(id)) continue
                interaction.guild.members.addRole({user:user.id,role:id})
            }
        }
        if (rawObject.item.length > 0) {
            console.log(`items`)
            const rawItems = rawObject.item
            for (const i of rawItems) {
                let item_raw = JSON.parse(i.object)
                items.set(item_raw.item_id,i.amount) // Use item_id as key to prevent overwriting values
            }
            for (const i of items) {
                client.db.databaseUtils.updateInventory({
                    itemId: i[0],
                    value: i[1],
                    userId: interaction.member.id,
                    guildId: interaction.guild.id
                })
            }
        }
        if (ac > 0) {
            console.log(`ac`)
            console.log(interaction.member.id)
            console.log(interaction.guild.id)
            client.db.databaseUtils.updateInventory({
                itemId: 52,
                value: ac,
                userId: interaction.member.id,
                guildId: interaction.guild.id
            })
        }

        await reply.send(`${user} has recieved the package ${packageName}`,{ephemeral:true})
    }
}
