"use strict"
const { Collection } = require(`discord.js`)
const User = require(`../../libs/user`)
const fs = require(`fs`)
/**
 * @author Andrew
 */
module.exports = {
    /**
     * Define the file name (without the extension!)
     * @required
     * @type {string}
     */
    name: `userdata`,
    name_localizations:{},
    description_localizations:{},
    /**
     * Define accepted aliases. User will be able to call the command with these alternative names.
     * @required
     * @type {object}
     */
    aliases: [],
    /**
     * Make a short, clear and concise command`s description
     * @required
     * @type {string}
     */
    description: `This is developer only command to retrieve or delete userdata`,
    /**
     * Define how to use the command. Include optional argu/flags if needed
     * @required
     * @type {string}
     */
    usage: `userdata retrieve @user`,
    /**
     * Define the minimum permission level to use the command. Refer to ./src/config/permissions.js for more info
     * @required
     * @type {number}
     */
    permissionLevel: 4,
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
    applicationCommand: false,
    /**
     * Define if the command is a regualr text command or not. If it is, it will be available to all guilds. (message commands are for example `!help`)
     * @required
     * @type {boolean}
     */
    messageCommand: true,
    /**
     * Define if the command is to be used in specific servers
     * @required
     * @type {boolean}
     */
    server_specific: false,
    /**
     * Define what servers the command is used in. 
     * @required ONLY if "server_specific" is set to true.
     * @type {Array}
     */
    servers: [`577121315480272908`],
    /**
     * The executed function upon command invocation.
     * The standard provided prarameters are writen in sequence below
     * [client, reply, message, arg, locale]
     * @required Only for MessageCommands
     * @type {function}
     */
    async execute(client, reply, message, arg, locale) {
        let argu = arg.split(` `) // Split into action and target user argu[0] = action | argu[1] = user 

        async function getUser(client, reply, message, argu, locale) {
            const userLib = new User(client, message)
            // Check if user is using on themselves
            if (userLib.isSelf(argu[1])) {
                await reply.send(`I'm sorry but you can not do this command on yourself`)
                return false
            }
            const userDataParent = await client.db.userUtils.getUser(argu[1].trim())
            // Check if user exists
            if (userDataParent === null) {
                await reply.send(`I'm sorry but I dont have a user with that id in my storage`)
                return false
            }
            return true
        }
        switch (argu[0].trim()) {
            case `retrieve`:
                if (getUser(client, reply, message, argu, locale) === false) return
                this.retrieveUserdata(client, reply, message, argu, locale)
                break
            case `remove`:
                if (getUser(client, reply, message, argu, locale) === false) return
                this.removeUserdata(client, reply, message, argu, locale)
                break
            case `tables`:
                this.getAvailableTables(client, reply, message, argu, locale)
            default:
                this.defaultAction(client, reply, message, argu, locale)
        }
    },
    async getMetadata(client, reply, message, argu, locale) {
        let sqlAllTablesForTableNames = `SELECT f.table_name AS foreign_key_table, r.constraint_name AS constraint_name
        FROM information_schema.table_constraints f
        INNER JOIN information_schema.referential_constraints r
        ON f.constraint_name = r.constraint_name
        INNER JOIN information_schema.table_constraints p
        ON r.unique_constraint_name = p.constraint_name
        WHERE p.table_name = 'users'`

        let getAllTablesForData = await client.db.databaseUtils._query(sqlAllTablesForTableNames
            , `all`
            , {}
            , `[userdata.js] retrieving Table names`)

        getAllTablesForData = getAllTablesForData.map(a => {
            let foreignColKey = a.constraint_name.substring(0, a.constraint_name.indexOf(`_fkey`))
            foreignColKey = foreignColKey.replace(`${a.foreign_key_table}_`, ``) // Reduce down to just the foreign Col Keys
            return ({ table: a.foreign_key_table, foreignColKey: foreignColKey })  // Reduce down to just the table names
        })

        const SQLS = new Collection()
        SQLS.set(`users`, `SELECT * FROM users WHERE users.user_id=$userId`)

        for (let index = 0; index < getAllTablesForData.length; index++) {
            const element = getAllTablesForData[index]
            let key = element.table
            let sql = `SELECT * FROM ${element.table} WHERE ${element.table}.${element.foreignColKey}=$userId`
            if (SQLS.has(key)) {
                sql = SQLS.get(key)
                sql = sql + ` OR ${element.table}.${element.foreignColKey}=$userId`
            }
            SQLS.set(key, sql)
        }
        return { tables: Array.from(SQLS.keys()), sqlStmts: SQLS }
    },
    async getAvailableTables(client, reply, message, argu, locale) {
        let { tables } = await this.getMetadata(client, reply, message, argu, locale)
        return await reply.send(this.formatTables(tables), { paging: true })
    },
    async retrieveUserdata(client, reply, message, argu, locale) {
        let userId = argu[1]
        let { tables, sqlStmts } = await this.getMetadata(client, reply, message, argu, locale)
        const availableGroups = [`usermetadata`, `userItems`, `userLog`, `userSettingsOrConfig`].map(w => w.toLowerCase()) // Must match the items in variable "groups"
        /**
         * Return a map based on inputed array values
         * @param {Array} values 
         * @returns {Map}
         */
        function makeNewCollectionFromValues(values) {
            let newSQLs = new Collection()
            values.forEach((key) => {
                newSQLs.set(key, sqlStmts.get(key))
            })
            return newSQLs
        }
        // Group names must be lowercase
        let groups = {
            usermetadata: makeNewCollectionFromValues([`users`, `user_reputations`, `user_relationships`, `user_dailies`, `user_quests`, `user_exp`]),
            useritems: makeNewCollectionFromValues([`user_inventories`, `user_self_covers`]),
            userlog: makeNewCollectionFromValues([`quest_log`, `commands_log`]),
            usersettingsorconfig: makeNewCollectionFromValues([`user_gender`, `guild_configurations`, `user_reminders`, `user_durational_buffs`, `autoresponders`, `custom_rewards`]),
        }
        const collector = message.channel.createMessageCollector({
            filter: m => m.author.id === message.author.id,
            max: 1,
            time: 120000
        })
        await reply.send(`You may choose to retrieve any data by a specific table or one of my predifined groupings, by typing them after this message (1 per command)\nGroupings:\nAll\n${availableGroups.join(`\n`)}`)
        collector.on(`collect`, async msg => {
            let input = msg.content.toLowerCase()
            if (availableGroups.includes(input)) {
                let filename = `${userId}-${input}.txt`
                let filepath = `./.logs/${filename}`
                try {
                    if (fs.existsSync(filepath)) {
                        fs.unlinkSync(filepath)
                    }
                } catch (error) {
                    client.logger.error(error)
                }
                let file = fs.createWriteStream(filepath)
                file.on(`error`, function (err) { client.logger.error(err)/* error handling */ })
                for (const table of groups[input]) {
                    let sql = table[1]
                    let res = await client.db.databaseUtils._query(sql
                        , `all`
                        , { userId: userId }
                        , `[userdata.js] Retrieving user_id:${userId} from Table:${table[0]}`)
                    let border = `===========================================================\n`
                    file.write(`\n${border}The follow data is from ${table[0]}\n${border}\n`)
                    res.forEach(function (v) { file.write(JSON.stringify(v, null, 4) + `\n`) })
                }
                file.end()
                await reply.send(`Here is the data from \`${input}\` group for user with id: ${userId}`, {
                    file: filepath,
                    fileName: filename,
                    fileDescription: `user requested data`
                })
                return setTimeout(() => {
                    try {
                        if (fs.existsSync(filepath)) {
                            fs.unlinkSync(filepath)
                        }
                    } catch (error) {
                        client.logger.error(error)
                    }
                }, 60000)
            } else if (tables.includes(input)) {
                let filename = `${userId}-${input}.txt`
                let filepath = `./.logs/${filename}`

                let sql = sqlStmts.get(input)
                let res = await client.db.databaseUtils._query(sql
                    , `all`
                    , { userId: userId }
                    , `[userdata.js] Retrieving user_id:${userId} from Table:${input}`)

                try {
                    if (fs.existsSync(filepath)) {
                        fs.unlinkSync(filepath)
                    }
                } catch (error) {
                    client.logger.error(error)
                }

                var file = fs.createWriteStream(filepath)
                file.on(`error`, function (err) { client.logger.error(err)/* error handling */ })
                let border = `===========================================================\n`
                file.write(`\n${border}The follow data is from ${input}\n${border}\n`)
                res.forEach(function (v) { file.write(JSON.stringify(v, null, 4) + `\n`) })
                file.end()
                await reply.send(`Here is the data from \`${input}\` table for user with id: ${userId}`, {
                    file: filepath,
                    fileName: filename,
                    fileDescription: `user requested data`
                })
                return setTimeout(() => {
                    try {
                        if (fs.existsSync(filepath)) {
                            fs.unlinkSync(filepath)
                        }
                    } catch (error) {
                        client.logger.error(error)
                    }
                }, 60000)
            } else if (input === `all`) {
                let filename = `${userId}-${input}data.txt`
                let filepath = `./.logs/${filename}`
                try {
                    if (fs.existsSync(filepath)) {
                        fs.unlinkSync(filepath)
                    }
                } catch (error) {
                    client.logger.error(error)
                }
                let file = fs.createWriteStream(filepath)
                file.on(`error`, function (err) { client.logger.error(err)/* error handling */ })
                for (const table of sqlStmts) {
                    let sql = table[1]
                    let res = await client.db.databaseUtils._query(sql
                        , `all`
                        , { userId: userId }
                        , `[userdata.js] Retrieving user_id:${userId} from Table:${table[0]}`)
                    let border = `===========================================================\n`
                    file.write(`\n${border}The follow data is from ${table[0]}\n${border}\n`)
                    res.forEach(function (v) { file.write(JSON.stringify(v, null, 4) + `\n`) })
                }
                file.end()
                await reply.send(`Here is the all data for user with id: ${userId}`, {
                    file: filepath,
                    fileName: filename,
                    fileDescription: `user requested data`
                })
                return setTimeout(() => {
                    try {
                        if (fs.existsSync(filepath)) {
                            fs.unlinkSync(filepath)
                        }
                    } catch (error) {
                        client.logger.error(error)
                    }
                }, 60000)
            } else {
                return await reply.send(`I'm sorry that is not a vaild option`)
            }
        })
    },
    async removeUserdata(client, reply, message, argu, locale) {
        const userId = argu[1]
        const sql = `DELETE FROM users WHERE user_id=$userID`
        const updateConfig = `UPDATE guild_configurations SET setByUserId=$bot, updated_at = CURRENT_TIMESTAMP WHERE setByUserId=$userID`
        await client.db.databaseUtils._query(updateConfig
            , `run`
            , { bot: client.user.id, userId: userId }
            , `[userdata.js] Updating "guild_configurations" user to ${userId}`)

        await client.db.databaseUtils._query(sql
            , `run`
            , { userId: userId }
            , `[userdata.js] Deleting user ${userId}`)
        await reply.send(`All data tied to user:${userId} has been deleted`)
        return
    },
    async defaultAction(client, reply, message, argu, locale) {
        return await reply.send(`I'm sorry but my only options are to tables, retrieve, or remove.`)
    },
    formatTables(tables) {
        function chunkify(a, n) {
            if (n < 2) return [a]

            var len = a.length, out = [], i = 0, size

            if (len % n === 0) {
                size = Math.floor(len / n)
                while (i < len) {
                    out.push(a.slice(i, i += size))
                }
            } else {
                n--
                size = Math.floor(len / n)
                if (len % size === 0)
                    size--
                while (i < size * n) {
                    out.push(a.slice(i, i += size))
                }
                out.push(a.slice(size * n))
            }
            return out
        }
        let firstMsg = `**Your available tables are**\n\n`
        let additionalFirstMsg = `**Your available tables (continued) are**\n\n`
        let finalRes = []
        let chunkedArrays = chunkify(tables, 12)
        for (let index = 0; index < chunkedArrays.length; index++) {
            const element = chunkedArrays[index]
            let raw = ``
            if (index === 0) {
                raw = firstMsg + element.join(`\n`)
            } else {
                raw = additionalFirstMsg + element.join(`\n`)
            }
            finalRes.push(raw)
        }
        return finalRes
    }
}
