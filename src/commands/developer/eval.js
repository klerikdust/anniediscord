"use strict"
 
 
/**
 * 	Evaluate line of code on air
 * 	@author klerikdust
 */
module.exports = {
    name: `eval`,
    name_localizations:{},
    description_localizations:{},
    aliases: [`ev`, `evl`, `exec`],
    description: `Evaluate line of code on air`,
    usage: `eval <LineOfCode>`,
    permissionLevel: 4,
    multiUser: false,
    applicationCommand: false,
    messageCommand: true,
    server_specific: true,
    servers: [`577121315480272908`],
    async execute(client, reply, message, arg, locale) {
        const initTime = process.hrtime()
        try {
            let evaled = await eval(arg)
            if (typeof evaled !== `string`) evaled = require(`util`).inspect(evaled)
            return reply.send(locale.EXEC_CODE, {
                socket: {
                    time: client.getBenchmark(initTime),
                    result: evaled.slice(0, 2000)
                }
            })
        } catch (err) {
            return reply.send(locale.ERROR, { socket: { error: err } })
        }
    }
}