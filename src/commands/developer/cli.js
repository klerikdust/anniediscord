"use strict"


const cmd = require(`node-cmd`)
/**
 * 	Running terminal command
 * 	@author klerikdust
 */
module.exports = {
    name: `cli`,
    aliases: [`cmd`, `cli`],
    description: `Running terminal command`,
    usage: `cli <[CommandStatement]> --flag`,
    permissionLevel: 4,
    multiUser: false,
    applicationCommand: false,
    server_specific: true,
    messageCommand: true,
    servers: [`577121315480272908`],
    async execute(client, reply, message, arg, locale) {
        //	Return if user doesn't specify arguments.
        if (!arg) return reply.send(locale.CLI.GUIDE)
        //	Parse statement
        const stmt = arg.match(/\[(.*?)\]/)[1]
        //	Make sure the the stmt is valid
        if (!stmt) return reply.send(locale.CLI.MISSING_STMT)
        reply.send(locale.COMMAND.FETCHING, {
            simplified: true,
            socket: {
                emoji: await client.getEmoji(`790994076257353779`),
                command: `cli`,
                user: message.author.id
            }
        })
            .then(load => {
                const initTime = process.hrtime()
                return cmd.get(stmt, (err, data) => {
                    if (err) {
                        load.delete()
                        return reply.send(locale.ERROR, { socket: { error: err } })
                    }
                    const parsedResult = JSON.stringify(data).replace(/\\n/g, ` \n`)
                    load.delete()
                    return reply.send(locale.EXEC_CODE, {
                        socket: {
                            time: client.getBenchmark(initTime),
                            result: parsedResult.slice(0, 2000)
                        }
                    })
                })
            })
    }
}