"use strict"
const moment = require(`moment`)
const { ApplicationCommandType, ApplicationCommandOptionType } = require(`discord.js`)
/**
 * Never forget things. Ask Annie to reminds you anytime!
 * @author klerikdust
 */
module.exports = {
    name: `remind`,
    name_localizations: {
        fr: ``
    },
    description_localizations: {
        fr: ``
    },
    aliases: [`remind`, `rmd`, `reminds`, `reminder`, `remindme`],
    description: `Never forget things. Ask Annie to reminds you anytime!`,
    usage: `remind <message> <time>`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    server_specific: false,
    options: [{
        name: `message`,
        description: `The message to be reminded`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        required: true,
        type: ApplicationCommandOptionType.String
    },
    {
        name: `in_how_long`,
        description: `when to remind`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        required: true,
        type: ApplicationCommandOptionType.Integer
    },
    {
        name: `time_unit`,
        description: `the time unit to be used`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        required: true,
        choices: [
            { name: `seconds`, value: `seconds` },
            { name: `minutes`, value: `minutes` },
            { name: `hours`, value: `hours` },
            { name: `days`, value: `days` }
        ],
        type: ApplicationCommandOptionType.String
    }
    ],
    type: ApplicationCommandType.ChatInput,
    async execute(client, reply, message, arg, locale) {
        //  Displays guide and user's active reminders
        if (!arg) {
            const userReminders = await client.reminders.getReminders(message.author.id)
            return await reply.send(locale.REMINDER.HOME, {
                image: `banner_reminder`,
                socket: {
                    prefix: client.prefix,
                    activeReminders: userReminders.length <= 0 ? `Currently you don't have any active reminders.` : `Currently you have ${userReminders.length} active reminders!`
                }
            })
        }
        //  Handle if the date is not valid
        const context = client.reminders.getContextFrom(arg, message.author.id)
        return await this.run(client, reply, locale, context)
    },
    async Iexecute(client, reply, interaction, options, locale) {
        const reminderMessage = await options.getString(`message`)
        const reminderTimeAmount = await options.getInteger(`in_how_long`)
        const reminderTimeUnit = await options.getString(`time_unit`)
        const context = client.reminders.getContext(reminderMessage, reminderTimeAmount, reminderTimeUnit, interaction.member.id)
        return await this.run(client, reply, locale, context)
    },
    async run(client, reply, locale, context) {
        if (!context.isValidReminder) return await reply.send(locale.REMINDER.INVALID_DATE, {
            socket: {
                emoji: await client.getEmoji(`790338393015713812`),
                prefix: client.prefix
            }
        })
        client.reminders.register(context)
        return await reply.send(locale.REMINDER.SUCCESSFUL, {
            status: `success`,
            socket: {
                emoji: await client.getEmoji(`789212493096026143`),
                time: moment(context.remindAt.timestamp).fromNow()
            }
        })
    }
}