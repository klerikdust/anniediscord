"use strict"
const User = require(`../../libs/user`)
const { ApplicationCommandType, ApplicationCommandOptionType } = require(`discord.js`)
/**
 * Views all items in your inventory
 * @author klerikdust
 */
module.exports = {
    name: `collection`,
    name_localizations: {
        fr: ``
    },
    description_localizations: {
        fr: ``
    },
    aliases: [`cardcollection`, `mycard`, `card`, `cards`, `cc`],
    description: `View yours or someones collected cards`,
    usage: `collection`,
    permissionLevel: 0,
    multiUser: false,
    messageCommand: true,
    applicationCommand: true,
    server_specific: false,
    options: [
        {
            name: `user`,
            description: `User you wish to view collection of`,
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
    upperLimit: 10,
    async execute(client, reply, message, arg, locale) {
        const userLib = new User(client, message)
        let targetUser = arg ? await userLib.lookFor(arg) : message.author
        if (!targetUser) return await reply.send(locale.USER.IS_INVALID)
        //  Normalize structure
        targetUser = targetUser.master || targetUser
        return await this.run(client, reply, message, locale, targetUser)
    },
    async Iexecute(client, reply, interaction, options, locale) {
        let targetUser = options.getUser(`user`) || interaction.member.user
        return await this.run(client, reply, interaction, locale, targetUser)
    },
    async run(client, reply, messageRef, locale, user) {
        const userLib = new User(client, messageRef)
        const userData = await userLib.requestMetadata(user, 2, locale)
        //  Fetch cards type in user's inventory and sort by rarity descendantly
        let filteredInventory = userData.inventory.raw.filter(prop => prop.type_name.toUpperCase() === `CARDS`).sort((a, b) => (b.rarity_level - a.rarity_level))
        this.shouldSplitResult = true
        this.splittedInventory = []
        let box = []
        let checkpoint = 0
        for (let i = 0; i < filteredInventory.length; i++) {
            checkpoint++
            box.push(filteredInventory[i])
            if (checkpoint === this.upperLimit || i == filteredInventory.length - 1) {
                this.splittedInventory.push(box)
                box = []
                checkpoint = 0
            }
        }
        const isSelf = userLib.isSelf(user.id)
        const INVALID_INVENTORY = isSelf ? locale.CARDCOLLECTION_AUTHOR_EMPTY : locale.CARDCOLLECTION_OTHERUSER_EMPTY
        if (!filteredInventory.length) {
            return await reply.send(INVALID_INVENTORY, {
                image: `banner_collection`,
                socket: {
                    prefix: client.prefix,
                    emoji: await client.getEmoji(`692428578683617331`),
                    user: user.username
                },
                footer: isSelf ? locale.CARDCOLLECTION_EMPTY_TIPS : null
            })
        }
        await reply.send(locale.COMMAND.FETCHING, { simplified: true, socket: { command: `cards collection`, user: user.id, emoji: await client.getEmoji(`790994076257353779`) } })
            .then(async loading => {
                await reply.send(this.prettifiedCardInventory(), {
                    paging: true,
                    cardPreviews: this.splittedInventory,
                    thumbnail: user.displayAvatarURL(),
                    header: `${user.username}'s Card Collections`
                })
                loading.delete()
            })
    },
    prettifiedCardInventory() {
        let arr = []
        for (let i = 0; i < this.splittedInventory.length; i++) arr.push(this.displayDetailedCardCollection(this.splittedInventory[i]))
        return arr
    },

    /**
     * 	Prettify result from `this.user.inventory.raw`
     * 	@param {array} [inventory=[]] user's raw inventory metadata
     *  @returns {string}
     */
    displayDetailedCardCollection(inventory = []) {
        let str = `\`\`\`\n`
        for (let i = 0; i < inventory.length; i++) {
            const item = inventory[i]
            str += `- [${item.quantity}x](${`★`.repeat(item.rarity_level)}) ${item.name}\n`

        }
        str += `\`\`\``
        return str
    }
}