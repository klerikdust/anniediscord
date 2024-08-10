"use strict"
const { ApplicationCommandType, ApplicationCommandOptionType } = require(`discord.js`)
/**
 * Command's Class description
 * ONLY for Avarik Saga
 * @author Andrew
 */
module.exports = {
    /**
     * Define the file name (without the extension!)
     * @required
     * @type {string}
     */
    name: `setwallet`,
    name_localizations: {
        fr: `définir le portefeuille`
    },
    description_localizations: {
        fr: `Associer le portefeuille à votre utilisateur`
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
    description: `Link wallet to you user`,
    /**
     * Define how to use the command. Include optional arguments/flags if needed
     * @required
     * @type {string}
     */
    usage: `setwallet <address>`,
    /**
     * Define the minimum permission level to use the command. Refer to ./src/config/permissions.js for more info
     * @required
     * @type {number}
     */
    permissionLevel: 0,
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
     * Define the command's options. This is what is used as an argument for the command (Application commands only).
     * @required for ONLY ApplicationCommands
     * @type {Array}
     */
    options: [{
        name: `remove`, // Must be all lowercase
        description: `Remove your address`,
        name_localizations: {
            fr: `retirer`
        },
        description_localizations: {
            fr: `Supprimez votre adresse`
        },
        type: ApplicationCommandOptionType.Subcommand
    }, {
        name: `address`, // Must be all lowercase
        description: `Your address you would like to link`,
        name_localizations: {
            fr: `adresse`
        },
        description_localizations: {
            fr: `Votre adresse à laquelle vous souhaitez lier`
        },
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            name: `set`,
            description: `Set a wallet address.`,
            name_localizations: {
                fr: `ensemble`
            },
            description_localizations: {
                fr: `Définissez une adresse de portefeuille.`
            },
            required: true,
            type: ApplicationCommandOptionType.String
        }]
    },
    ],
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
        if (options.getSubcommand() === `remove`) return this.delete(client, reply, interaction)
        if (options.getSubcommand() === `address`) {
            const arg = options.getString(`set`)
            return this.run(client, reply, interaction, arg)
        }
    },
    async run(client, reply, messageRef, arg) {
        client.db.custom.setWalletAddress(messageRef.member.user.id, arg)
        return await reply.send(`Your address has been set`, { ephemeral: true })
    },
    async delete(client, reply, messageRef) {
        client.db.custom.deleteWalletAddress(messageRef.member.user.id)
        return await reply.send(`Your address has been removed`, { ephemeral: true })
    }
}