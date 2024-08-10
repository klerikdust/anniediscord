"use strict"
const { ApplicationCommandType, ApplicationCommandOptionType, PermissionFlagsBits } = require(`discord.js`)
const stringSimilarity = require(`string-similarity`)

const Confirmator = require(`../../libs/confirmator`)
/**
 * Command's Class description
 * @author yourname
 */
module.exports = {
    /**
     * Define the file name (without the extension!)
     * @required
     * @type {string}
     */
    name: `setitem`,
    name_localizations: {
        fr: `article défini`
    },
    description_localizations: {
        fr: `Définissez l'élément que vous souhaitez utiliser pour le classement.`
    },
    /**
     * Define accepted aliases. User will be able to call the command with these alternative names.
     * @required
     * @type {object}
     */
    aliases: [],
    /**
     * Make a short, clear and concise command's description
     * @required
     * @type {string}
     */
    description: `Set the item you want to use for the leaderboard.`,
    /**
     * Define how to use the command. Include optional arguments/flags if needed
     * @required
     * @type {string}
     */
    usage: `setitem <item>`,
    /**
     * Define the minimum permission level to use the command. Refer to ./src/config/permissions.js for more info
     * @required
     * @type {number}
     */
    permissionLevel: 2,
    /**
     * Define if the command allows for a user as an arguement and needs the user metadata.
     * @required
     * @type {boolean}
     */
    multiUser: false,
    /**
     * Define if the command is an application command or not. If it is, it will be available to all guilds. (Application commands are slash commands)
     * @required
     * @type {boolean}
     */
    applicationCommand: true,
    /**
     * Define if the command is a regualr text command or not. If it is, it will be available to all guilds. (message commands are for example '!help')
     * @required
     * @type {boolean}
     */
    messageCommand: false,
    /**
     * Use 'PermissionFlagsBits' to define the command's Permission level. (Most of the time you will not need to define this)
     * By seeting this property only users with the same or higher permission level will be able to use and see the command.
     * @Optional Only if applicationCommand is true and you need specific permissions
     * @type {PermissionFlagsBits}
     */
    default_member_permissions: PermissionFlagsBits.ManageRoles.toString(),
    /**
     * Define the command's options. This is what is used as an argument for the command (Application commands only).
     * @required for ONLY ApplicationCommands
     * @type {Array}
     */
    options: [{
        name: `item`, // Must be all lowercase
        description: `The item name or Id`,
        name_localizations: {
            fr: `article`
        },
        description_localizations: {
            fr: `Le nom ou l'identifiant de l'élément`
        },
        required: true,
        type: ApplicationCommandOptionType.String
    }],
    /**
     * Use 'ApplicationCommandType' to define the command's type. (Most of the time it will always be 'ChatInput')
     * @required Only if applicationCommand is true
     * @type {ApplicationCommandType}
     */
    type: ApplicationCommandType.ChatInput,
    /**
     * Define if the command is to be used in specific servers
     * @required
     * @type {boolean}
     */
    server_specific: true,
    /**
     * Define what servers the command is used in. 
     * @required ONLY if "server_specific" is set to true.
     * @type {Array}
     */
    servers: [`577121315480272908`, `882552960771555359`],
    /**
     * Any other properties you want to add to the command.
     */
    /**
     * The executed function upon command invocation.
     * The standard provided prarameters are writen in sequence below
     * [client, reply, message, arg, locale]
     * @required Only for MessageCommands
     * @type {function}
     */
    async execute(client, reply, message, arg, locale) {
        return this.run(client, reply, message, locale, arg)
        // ... Your command ran here.
    },
    /**
     * The executed function upon command invocation.
     * The standard provided prarameters are writen in sequence below
     * [client, reply, interaction, options, locale]
     * @required Only for ApplicationCommands
     * @type {function}
     */
    async Iexecute(client, reply, interaction, options, locale) {
        const arg = options.getString(`item`)
        return this.run(client, reply, interaction, locale, arg)
    },
    async run(client, reply, messageRef, locale, arg) {
        // ... Your command ran here.
        // Only carry over the arguments you need.
        const availableItems = await client.db.shop.getItem(null, messageRef.guild.id)
        // End phase if there are no items available
        if (!availableItems.length) {
            return await reply.send(`Sorry you dont have any items for me to set try adding one with /setshop add.`, { ephemeral: true })
        }
        //  Find best match
        const searchStringResult = stringSimilarity.findBestMatch(arg, availableItems.map(i => i.name.toLowerCase()))
        const item = searchStringResult.bestMatch.rating >= 0.5
            //  By name
            ?
            availableItems.find(i => i.name.toLowerCase() === searchStringResult.bestMatch.target)
            //  Fallback search by ID
            :
            availableItems.find(i => parseInt(i.item_id) === parseInt(arg))

        if (!item) return await reply.send(`I'm sorry no item under that name or Id, please try again`)

        const confirmation = await reply.send(`Are you sure you want to set \`${item.name}\` as the item for leaderboard?`)

        const c = new Confirmator(messageRef, reply, locale)
        await c.setup(messageRef.member.id, confirmation)
        c.onAccept(async () => {
            const configId = `CUSTOM_LB_ITEM`
            client.db.guildUtils.updateGuildConfiguration({
                configCode: configId,
                customizedParameter: item.item_id,
                guild: messageRef.guild,
                setByUserId: messageRef.member.id,
                cacheTo: messageRef.guild.configs
            })

            return await reply.send(`The item has been set to ${item.name}`)
        })
        return
    }
}