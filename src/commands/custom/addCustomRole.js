"use strict"
const { ApplicationCommandType, ApplicationCommandOptionType } = require(`discord.js`)
/**
 * Command's Class description
 * ONLY for custom communities
 * @author Andrew
 * @module 
 */
module.exports = {
    /**
     * Define the file name (without the extension!)
     * @required
     * @type {string}
     */
    name: `addcustomrole`,
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
    description: `Configure role to give based on other function`,
    /**
     * Define how to use the command. Include optional arguments/flags if needed
     * @required
     * @type {string}
     */
    usage: `addcustomrole <role>`,
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
     * Define the command's options. This is what is used as an argument for the command (Application commands only).
     * @required for ONLY ApplicationCommands
     * @type {Array}
     */
    options: [{
        name: `remove`, // Must be all lowercase
        description: `remove role`,
        type: ApplicationCommandOptionType.Subcommand
    }, {
        name: `set`, // Must be all lowercase
        description: `set role to give`,
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            name: `role`,
            description: `select the role.`,
            required: true,
            type: ApplicationCommandOptionType.Role
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
    servers: [`577121315480272908`/* , `1242130891363454996` */],

    /**
     * Current instance's config code
     * @type {string}
     */
    primaryConfigID: `CUSTOM_ROLE`,
    default_member_permissions: PermissionFlagsBits.ManageRoles.toString(),
    /**
     * Any other properties you want to add to the command.
     */
    /**
     * The executed function upon command invocation.
     * The standard provided prarameters are writen in sequence below
     * [client, reply, message, arg, locale]
     * @param {import("../../annie")} client 
     * @param {import("../../libs/response")} reply 
     * @param {import("../../../node_modules/discord.js/typings/index").Message} message 
     * @param {string} arg 
     * @param {*} locale 
     * @required Only for MessageCommands
     */
    async execute(client, reply, message, arg, locale) {
        return
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
        if (options.getSubcommand() === `set`) {
            const arg = options.getRole(`role`)
            this.guildConfigurations = interaction.guild.configs
            return this.run(client, reply, interaction, arg)
        }
    },
    async run(client, reply, messageRef, arg) {
        client.db.guildUtils.updateGuildConfiguration({
            configCode: this.primaryConfigID,
            customizedParameter: arg.id,
            guild: messageRef.guild,
            setByUserId: messageRef.member.id,
            cacheTo: this.guildConfigurations
        })
        return await reply.send(`Role has been set to ${arg}`, { ephemeral: true })
    },
    async delete(client, reply, messageRef) {

        client.db.guildUtils.updateGuildConfiguration({
            configCode: this.primaryConfigID,
            customizedParameter: ``,
            guild: messageRef.guild,
            setByUserId: messageRef.member.id,
            cacheTo: this.guildConfigurations
        })

        return await reply.send(`Role has been reset`, { ephemeral: true })
    }
}