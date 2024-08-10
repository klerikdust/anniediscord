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
    name: `removeitem`,
    name_localizations: {
        fr: `supprimer un élément`
    },
    description_localizations: {
        fr: `supprimer des éléments d'un utilisateur ou de tous les utilisateurs.`
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
    description: `remove items from a user or all users.`,
    /**
     * Define how to use the command. Include optional arguments/flags if needed
     * @required
     * @type {string}
     */
    usage: `removeitem amount`,
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
        name: `amount`, // Must be all lowercase
        name_localizations: {
            fr: `montant`
        },
        description_localizations: {
            fr: `Le montant auquel définir les éléments`
        },
        description: `The amount to set the items to`,
        required: true,
        type: ApplicationCommandOptionType.Integer,
        min_value: 0
    }, {
        name: `allusers`, // Must be all lowercase
        description: `Toggle for all users`,
        name_localizations: {
            fr: `tous les utilisateurs`
        },
        description_localizations: {
            fr: `Basculer pour tous les utilisateurs`
        },
        required: true,
        type: ApplicationCommandOptionType.Boolean
    }, {
        name: `user`, // Must be all lowercase
        description: `The user you wish to edit`,
        name_localizations: {
            fr: `utilisateur`
        },
        description_localizations: {
            fr: `L'utilisateur que vous souhaitez modifier`
        },
        required: false,
        type: ApplicationCommandOptionType.User
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
        const args = [options.getInteger(`amount`), options.getBoolean(`allusers`), options.getUser(`user`)]
        return this.run(client, reply, interaction, locale, args)
    },
    async run(client, reply, messageRef, locale, args) {
        // ... Your command ran here.
        // Only carry over the arguments you need.
        const itemConfigId = `CUSTOM_LB_ITEM`
        if (!messageRef.guild.configs.get(itemConfigId)) return await reply.send(`Please run \`setitem\` first.`)
        const itemId = messageRef.guild.configs.get(itemConfigId).value
        const item = await client.db.shop.getItem(Number(itemId), messageRef.guild.id)
        if (!item) return await reply.send(`Please run \`setitem\` first.`)

        const amount = args[0]
        const allUsers = args[1]
        const user = args[2]

        if (allUsers) {
            const confirmation = await reply.send(`Are you sure you want to remove \`${amount}\` \`${item.name}\`(s) for all users?`)
            const c = new Confirmator(messageRef, reply, locale)
            await c.setup(messageRef.member.id, confirmation)
            c.onAccept(async () => {
                client.db.guildUtils.editInventoryOfWholeGuild({
                    operation: `-`,
                    guildId: messageRef.guild.id,
                    itemId: itemId,
                    value: amount
                })
                return await reply.send(`Removed \`${amount}\` \`${item.name}\`(s) from all users`)
            })
        } else {
            const confirmation = await reply.send(`Are you sure you want to remove \`${amount}\` \`${item.name}\`(s) for ${user}?`)
            const c = new Confirmator(messageRef, reply, locale)
            await c.setup(messageRef.member.id, confirmation)
            c.onAccept(async () => {
                client.db.databaseUtils.updateInventory({
                    operation: `-`,
                    userId: user.id,
                    guildId: messageRef.guild.id,
                    itemId: itemId,
                    value: amount
                })
                return await reply.send(`Removed \`${amount}\` \`${item.name}\`(s) from ${user}`)
            })
        }


        return
    }
}