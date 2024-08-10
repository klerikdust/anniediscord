"use strict"
const {
  ApplicationCommandType,
  ApplicationCommandOptionType
} = require(`discord.js`)
/**
 * User's language switcher.
 * @author klerikdust
 */
module.exports = {
  name: `setlanguage`,
  name_localizations: {
    fr: ``
  },
  description_localizations: {
    fr: ``
  },
  aliases: [`setlang`, `setlanguage`, `setlocale`],
  description: `User's language switcher`,
  usage: `setlang <language name/code>`,
  permissionLevel: 0,
  multiUser: false,
  applicationCommand: true,
  messageCommand: true,
  server_specific: false,
  options: [{
    name: `language`,
    description: `Available Annie's languages you can set`,
    name_localizations: {
      fr: ``
    },
    description_localizations: {
      fr: ``
    },
    type: ApplicationCommandOptionType.String,
    required: true,
    autocomplete: true
  }],
  type: ApplicationCommandType.ChatInput,
  async execute(client, reply, message, arg, locale, prefix) {
    if (!arg) return await reply.send(locale.SETLANGUAGE.GUIDE, {
      image: `banner_setlanguage`,
      socket: {
        prefix: message.guild.configs.get(`PREFIX`).value,
        languages: `<${client.availableLocales.join(`/`)}>`,
        currentLanguage: locale.lang
      }
    })
    return await this.run(client, reply, message, arg, locale)
  },
  async Iexecute(client, reply, interaction, options, locale) {
    const arg = options.getString(`language`)
    if (!arg) return await reply.send(locale.SETLANGUAGE.GUIDE, {
      image: `banner_setlanguage`,
      socket: {
        prefix: interaction.guild.configs.get(`PREFIX`).value,
        languages: `<${client.availableLocales.join(`/`)}>`,
        currentLanguage: locale.lang
      }
    })
    return await this.run(client, reply, interaction, arg, locale)
  },
  async autocomplete(client, interaction) {
    /**
     * Fill choices with the available packages found in DB
     */
    const focusedValue = interaction.options.getFocused()
    const choices = Object.keys(client.availableLocales)
    const filtered = choices.filter(choice => choice.startsWith(focusedValue))

    function capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1)
    }
    await interaction.respond(
      filtered.map(choice => ({ name: capitalizeFirstLetter(choice), value: client.availableLocales[choice] })),
    )
  },
  async run(client, reply, messageRef, arg, locale) {
    const availableLocales = Object.values(client.availableLocales)
    const targetLocale = arg.toLowerCase()
    if (!availableLocales.includes(targetLocale)) {
      return reply.send(locale.SETLANGUAGE.INVALID_LANG, {
        socket: {
          languages: `<${availableLocales.join(`/`)}>`
        }
      })
    }
    locale = client.getTargetLocales(targetLocale)
    await client.db.userUtils.updateUserLocale(targetLocale, messageRef.member.id)
    return reply.send(locale.SETLANGUAGE.SUCCESSFUL, {
      status: `success`,
      socket: {
        language: targetLocale.toUpperCase()
      }
    })
  }
}