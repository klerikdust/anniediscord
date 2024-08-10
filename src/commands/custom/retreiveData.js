"use strict"
const { ApplicationCommandType, ApplicationCommandOptionType, PermissionFlagsBits } = require(`discord.js`)
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
    name: `retrievedata`,
    name_localizations: {
        fr: `récupérer des données
`},
    description_localizations: {
        fr: `Créez un fichier csv.`
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
    description: `Create a csv file.`,
    /**
     * Define how to use the command. Include optional arguments/flags if needed
     * @required
     * @type {string}
     */
    usage: `retrievedata`,
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
        return this.run(client, reply, message, locale)
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
        return this.run(client, reply, interaction, locale)
    },
    async run(client, reply, messageRef, locale) {
        const itemConfigId = `CUSTOM_LB_ITEM`
        if (!messageRef.guild.configs.get(itemConfigId)) return await reply.send(`Please run \`setitem\` first.`)
        const itemId = messageRef.guild.configs.get(itemConfigId).value
        const item = await client.db.shop.getItem(Number(itemId), messageRef.guild.id)
        if (!item) return await reply.send(`Please run \`setitem\` first.`)
        const filename = `${messageRef.guild.id}_${item.name}_data.csv`
        const filepath = `./.logs/${filename}`

        await client.db.databaseUtils.exportData({ itemId: itemId, guildId: messageRef.guild.id, filepath: filepath })

        return await messageRef.channel.send({
            files: [{
                attachment: filepath,
                name: filename
            }],
            content: `Here is the data from the database`
        })
    }
}