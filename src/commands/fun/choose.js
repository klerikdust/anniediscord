"use strict"
const random = require(`../../utils/random`)
const { ApplicationCommandType, ApplicationCommandOptionType } = require(`discord.js`)
/**
 * I'll try to pick any options you give!
 * @author klerikdust
 */
module.exports = {
    name: `choose`,
    name_localizations: {
        fr: `choisir`
    },
    description_localizations: {
        fr: `Je vais essayer de choisir toutes les options que vous proposez !`
    },
    aliases: [`choose`, `pick`],
    description: `I'll try to pick any options you give!`,
    usage: `choose <options>`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    server_specific: false,
    options: [{
        name: `choices`,
        description: `Please give me some options to pick from, seperated by , or "or".`,
        name_localizations: {
            fr: `choix`
        },
        description_localizations: {
            fr: `Veuillez me donner quelques options parmi lesquelles choisir, séparées par "," ou "or".`
        },
        required: true,
        type: ApplicationCommandOptionType.String
    }],
    type: ApplicationCommandType.ChatInput,
    async execute(client, reply, message, arg, locale) {
        if (!arg) return await reply.send(locale.CHOOSE.GUIDE)
        return await this.run(arg, client, reply, locale)
    },
    async Iexecute(client, reply, interaction, options, locale) {
        return await this.run(options.getString(`choices`), client, reply, locale)
    },
    async run(options, client, reply, locale) {
        //  Handle if Annie can't parse options from user's input.
        const opts = this._tokenizedOptions(options)
        if (!opts) return await reply.send(locale.CHOOSE.INVALID_OPTIONS)
        return await reply.send(`${random(locale.CHOOSE.THINKING)} **${random(opts)}!** ${await client.getEmoji(random(locale.CHOOSE.EMOTIONS))}`)
    },

    /**
     * Parse and tokenize user's options
     * @param {string} src Target arg.
     * @return {string|null{
     */
    _tokenizedOptions(src) {
        const source = src.toLowerCase()
        let str = ``
        str = source.replace(`?`, ``)
        if (source.includes(`,`)) {
            if (source.includes(`or`)) str = source.replace(`or`, `,`)
            return str.split(`,`)
        }
        if (source.includes(`or`)) return source.split(`or`)
        return null
    }
}