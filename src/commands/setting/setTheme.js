"use strict"
const User = require(`../../libs/user`)
const {
    ApplicationCommandType,
    ApplicationCommandOptionType
} = require(`discord.js`)
/**
 * Switch your profile theme to Light or Dark.
 * @author Andrew
 */
module.exports = {
    name: `settheme`,
    name_localizations: {
        fr: ``
    },
    description_localizations: {
        fr: ``
    },
    aliases: [`theme`, `themeswitch`, `switchtheme`, `settheme`],
    description: `Switch your profile theme to Light or Dark.`,
    usage: `theme <Light/Dark>`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    server_specific: false,
    options: [{
        name: `theme`,
        description: `choose your theme`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: [{ name: `light`, value: `light` }, { name: `dark`, value: `dark` }]
    }],
    type: ApplicationCommandType.ChatInput,
    async execute(client, reply, message, arg, locale, prefix) {
        const darkThemeStrings = [`dark`, `black`, `darktheme`, `dark_profileskin`, `nightmode`, `night`]
        const lightThemeStrings = [`light`, `white`, `lighttheme`, `light_profileskin`, `lightmode`, `day`]
        const userData = await (new User(client, message)).requestMetadata(message.author, 2, locale)
        //  Returns if user didn't specify any keyword
        if (!arg) return await reply.send(locale.SWITCH_THEME.MISSING_KEYWORD, {
            image: `banner_settheme`,
            socket: { prefix: prefix }
        })
        /**
         * Returns a boolean for if the user has the choosen theme and gives theme to user if they dont have it
         * @param {string} theme 
         * @returns {boolean} boolean
         */
        const userHasTheme = async theme => {
            let res = await client.db.userUtils.checkIfThemeOwned(theme, message.author.id, message.guild.id)
            let resAnswer = Object.values(res)[0] == 1 ? true : false
            if (resAnswer) return true
            // Give item to user
            await client.db.userUtils.GiveThemeToUser(theme, message.author.id, message.guild.id)
            return true
        }
        let currentTheme = await client.db.userUtils.findCurrentTheme(message.author.id, message.guild.id)
        if (darkThemeStrings.includes(arg)) {
            if (currentTheme == `dark`) return await reply.send(locale.SWITCH_THEME.ALREADY_THAT_THEME, { socket: { emoji: await client.getEmoji(`790338393015713812`) } })
            let hasTheme = await userHasTheme(`dark`)
            if (!hasTheme) return await reply.send(locale.SWITCH_THEME.NO_THEME_OWNED)
            client.db.userUtils.setTheme(`dark`, message.author.id, message.guild.id)
            return await reply.send(locale.SWITCH_THEME.SET_NIGHTMODE, { status: `success` })
        }
        if (lightThemeStrings.includes(arg)) {
            if (currentTheme == `light`) return await reply.send(locale.SWITCH_THEME.ALREADY_THAT_THEME, { socket: { emoji: await client.getEmoji(`790338393015713812`) } })
            let hasTheme = await userHasTheme(`light`)
            if (!hasTheme) return await reply.send(locale.SWITCH_THEME.NO_THEME_OWNED)
            client.db.userUtils.setTheme(`light`, message.author.id, message.guild.id)
            return await reply.send(locale.SWITCH_THEME.SET_LIGHTMODE, { status: `success` })
        }
        //  Handle if no theme match with the keyword
        return await reply.send(locale.SWITCH_THEME.NO_MATCHING_KEYWORD, { socket: { emoji: await client.getEmoji(`692428578683617331`) } })
    },
    async Iexecute(client, reply, interaction, options, locale) {
        /**
         * Returns a boolean for if the user has the choosen theme and gives theme to user if they dont have it
         * @param {string} theme 
         * @returns {boolean} boolean
         */
        const userHasTheme = async theme => {
            let res = await client.db.userUtils.checkIfThemeOwned(theme, interaction.member.id, interaction.member.id)
            let resAnswer = Object.values(res)[0] == 1 ? true : false
            if (resAnswer) return true
            // Give item to user
            await client.db.userUtils.GiveThemeToUser(theme, interaction.member.id, interaction.guild.id)
            return true
        }
        let theme = options.getString(`theme`)
        let currentTheme = await client.db.userUtils.findCurrentTheme(interaction.member.id, interaction.guild.id)
        if ((theme == `dark` && currentTheme == `dark`) || (theme == `light` && currentTheme == `light`)) return await reply.send(locale.SWITCH_THEME.ALREADY_THAT_THEME, { socket: { emoji: await client.getEmoji(`790338393015713812`) } })
        let hasTheme = null
        if (theme == `dark`) hasTheme = await userHasTheme(`dark`)
        if (theme == `light`) hasTheme = await userHasTheme(`light`)
        if (!hasTheme) return await reply.send(locale.SWITCH_THEME.NO_THEME_OWNED)
        client.db.userUtils.setTheme(theme, interaction.member.id, interaction.guild.id)
        return await reply.send(theme == `light` ? locale.SWITCH_THEME.SET_LIGHTMODE : locale.SWITCH_THEME.SET_NIGHTMODE, { status: `success` })
    },
}