"use strict"
const commanifier = require(`../../utils/commanifier`)
const { ApplicationCommandType,SlashCommandBuilder } = require(`discord.js`)
const data = new SlashCommandBuilder()
.setName(`ping`)
.setNameLocalizations({
    fr: `pinger`
})
.setDescription(`Output bot's latency`)
.setDescriptionLocalizations({
    fr: `Latence du bot de sortie`
})
    /**
     * Output bot's latency
     * @author klerikdust
     */
module.exports = {
    name: `ping`,
    name_localizations:{
		fr: `pinger`
	},
    aliases: [`pong`, `p1ng`, `poing`],
    description: `Output bot's latency`,
    description_localizations:{
		fr: `Latence du bot de sortie`
    },
    usage: `ping`,
    permissionLevel: 0,
    server_specific: false,
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    type: ApplicationCommandType.ChatInput,
    async execute(client, reply, message, arg, locale) {
        return await this.run(client,reply,locale)
    },
    async Iexecute(client, reply, interaction, options, locale) {
        return await this.run(client,reply,locale)
    },
    getPing(client){
        return commanifier(Math.floor(client.ws.ping))
    },
    async run(client,reply,locale){
        return await reply.send(locale.REQUEST_PING, {
            status: `success`,
            socket: {
                ping: this.getPing(client),
                emoji: await client.getEmoji(`789212493096026143`)
            }
        })
    }
}