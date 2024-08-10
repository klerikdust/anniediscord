"use strict"
/* eslint-disable no-useless-escape */
/**
 * 	Running database queries on air
 * 	@author klerikdust
 */
module.exports = {
    name: `dbkits`,
    name_localizations:{},
    description_localizations:{},
    aliases: [`db`],
    description: `Running database queries on air`,
    usage: `db <[SqlStatement]> --flag`,
    permissionLevel: 4,
    multiUser: false,
    applicationCommand: false,
    messageCommand: true,
    server_specific: true,
    servers: [`577121315480272908`],
    async execute(client, reply, message, arg, locale) {
        //	Return if user doesn't specify arguments.
        if (!arg) return reply.send(locale.DBKITS.AUTHORIZED, {
            socket: { user: message.author.username }
        })
        try {
            //	Parse statement
            const stmt = arg.match(/\[(.*?)\]/)[1]
                //	Make sure the the stmt is valid
            if (!stmt) return reply.send(locale.DBKITS.MISSING_STMT)
                //	Parse flag
            const flag = arg.match(/[^--]*$/)[0].substring(0, 3)
                //	Flag check as well
            if (!flag) return reply.send(locale.DBKITS.MISSING_FLAG)
            const initTime = process.hrtime()
            const result = await client.db.databaseUtils._query(stmt, flag)
            const parsedResult = JSON.stringify(result).replace(/\,/g, `,\n`)
            return reply.send(locale.EXEC_CODE, {
                socket: {
                    time: client.getBenchmark(initTime),
                    result: parsedResult.slice(0, 2000)
                }
            })
        } catch (e) {
            //	Catching failed query
            return reply.send(locale.ERROR, { socket: { error: e } })
        }
    }
}