"use strict"
const User = require(`../../libs/user`)
const Confirmator = require(`../../libs/confirmator`)
/**
 * Allows developer to send a private message to reachable user.
 * @author klerikdust
 */
module.exports = {
    name: `mail`,
    name_localizations: {},
    description_localizations: {},
    aliases: [`mail`, `dm`],
    description: `Allows developer to send a private message to reachable user`,
    usage: `<user> <message>`,
    permissionLevel: 4,
    multiUser: true,
    applicationCommand: false,
    messageCommand: true,
    server_specific: true,
    servers: [`577121315480272908`],
    async execute(client, reply, message, arg) {
        const target = await (new User(client, message)).lookFor(arg)
        if (!target) return reply.send(`Sadly, the user is unreachable`)
        const mailContent = arg.replace(target.usedKeyword + ` `, ``) // Trim additioanl whitespace
        if (!mailContent.length) return reply.send(`Where's the message? ${await client.getEmoji(`AnnieThinking`)}`)
        const confirmation = await reply.send(`I'm going to send **${target.master}** the following message.\n\`\`\`\n${mailContent}\n\`\`\``)
        const c = new Confirmator(message, reply)
        await c.setup(message.author.id, confirmation)
        return c.onAccept(async () => {
            try {
                await reply.send(mailContent, {
                    field: target.master,
                    footer: `Sent by Annie's developer`
                })
                return reply.send(`The mail is successfully sent!`)
            }
            catch (e) {
                return reply.send(`Unfortunately I can't forward the email due to locked DM.`)
            }
        })
    }
}