class commandStructureChecker {

    // Declare private variables
    #baseLevel = [`name`, `aliases`, `description`, `usage`, `permissionLevel`, `multiUser`, `applicationCommand`, `messageCommand`, `server_specific`, `name_localizations`, `description_localizations`]
    #langSupported = [`en-US`, `fr`] // https://discord.com/developers/docs/reference#locales
    #errorMessage
    #commandLoaderPath = `../../../src/commands/loader.js`
    #commandFiles

    constructor(file) {
        this.#setCommandFiles = file
    }

    set #setCommandFiles(a) {
        const commandsLoader = require(this.#getCommandLoaderPath)
        this.#commandFiles = commandsLoader(a)
    }

    get #getCommandLoaderPath() {
        return this.#commandLoaderPath
    }

    get #getCommandFiles() {
        return this.#commandFiles
    }

    get #getBaseLevel() {
        return this.#baseLevel
    }

    set #setErrorMessage(e) {
        this.#errorMessage = e
    }

    get getErrorMessage() {
        return this.#errorMessage
    }

    get #getLangSupported() {
        return this.#langSupported
    }
    /**
     * Return a Boolean if a object has a property or not
     * @param {object} object 
     * @param {string} prop 
     * @returns {boolean}
     */
    #hasProp(object, prop) {
        return Object.hasOwn(object, prop)
    }

    checkBaseProps() {
        for (const value of this.#getCommandFiles.ALL_COMMANDS.values()) {
            for (let index = 0; index < this.#getBaseLevel.length; index++) {
                const baseKey = this.#getBaseLevel[index];
                const result = this.#hasProp(value, baseKey)
                if (!result) {
                    this.#setErrorMessage = `Command file "${value?.name}" has an error, The file is missing ${baseKey} from its properties`
                    return false
                } else if (value?.applicationCommand === true && (baseKey === `name_localizations` || baseKey === `description_localizations`)) {
                    const langs = this.#getLangSupported
                    var errorMsg = ``
                    for (const l of langs) {
                        if (l === `en-US`) continue
                        if (!this.#hasProp(value?.[baseKey], l)) {
                            errorMsg += `Needs Lang ${l} added\n`
                        } else if (baseKey === `name_localizations` && value?.[baseKey]?.[l] != value?.[baseKey]?.[l].toLowerCase()) {
                            console.log(`test`)
                            errorMsg += `Lang ${l} > Needs to be all lowercased`
                        } else if (baseKey === `name_localizations` && value?.[baseKey]?.[l] === ``) {
                            console.warn(`Command file "${value?.name}": [WARNING] > The key: ${baseKey} > Needs to be filled as it is not populated`)
                        }
                    }
                    this.#setErrorMessage = `Command file "${value?.name}" has an error(s), The key: ${baseKey} >\n${errorMsg}`
                    return errorMsg === `` ? true : false
                }

                if (value?.name != value?.name.toLowerCase()) {
                    this.#setErrorMessage = `Command file "${value?.name}" has an error, The key: ${baseKey} > Needs to be all lowercased`
                    return false
                }
            }
        }
        return true
    }

    checkPrefixImmune() {
        const setPrefixCmd = this.#getCommandFiles.ALL_COMMANDS.get(`setprefix`)
        return this.#hasProp(setPrefixCmd, `prefixImmune`)
    }

    checkServerSpecificCmds() {
        for (const value of this.#getCommandFiles.ALL_COMMANDS.values()) {
            for (let index = 0; index < this.#getBaseLevel.length; index++) {
                const baseKey = `server_specific`
                const secondaryKey = `servers`
                const result = this.#hasProp(value, baseKey)
                if (!result) continue
                if (!value[baseKey]) continue
                const secondaryResult = this.#hasProp(value, secondaryKey)
                if (!secondaryResult) {
                    this.#setErrorMessage = `Command file "${value?.name}" has an error, The file is missing ${secondaryKey} from its properties`
                    return false
                }
            }
        }
        return true
    }

    checkAppCmds() {
        for (const value of this.#getCommandFiles.ALL_COMMANDS.values()) {
            for (let index = 0; index < this.#getBaseLevel.length; index++) {
                const baseKey = `applicationCommand`
                const typeKey = `type`
                const result = this.#hasProp(value, baseKey)
                if (!result) continue
                if (!value[baseKey]) continue
                const appTypeResult = this.#hasProp(value, typeKey)
                if (!appTypeResult) {
                    this.#setErrorMessage = `Command file "${value?.name}" has an error, The file is missing ${typeKey} from its properties`
                    return false
                }
            }
        }
        return true
    }

    checkAppCmdsOpt(key) {
        for (const value of this.#getCommandFiles.ALL_COMMANDS.values()) {
            const baseKey = `applicationCommand`
            const secondaryKey = `options`
            const result = this.#hasProp(value, baseKey)
            if (!result) continue
            if (!value[baseKey]) continue
            const secondaryResult = this.#hasProp(value, secondaryKey)
            if (secondaryResult) {
                const arr = value[secondaryKey]
                for (const o of arr) {
                    const res = this.checkOpt(o, key, value)
                    if (!res) return false
                }
            }
        }
        return true
    }

    checkOpt(parent, key, value) {
        const secondaryKey = `options`
        const res = this.check(parent, key, value)
        if (!res) return false
        if (this.#hasProp(parent, secondaryKey)) {
            const inner = parent[secondaryKey]
            for (const o of inner) {
                return this.checkOpt(o, key, value)
            }
        }
        return true
    }

    check(obj, k, value) {
        if (!this.#hasProp(obj, k)) {
            this.#setErrorMessage = `Command file "${value?.name}" has an error, The file is missing additional key: ${k}`
            return false
        }
        if (k === `name`) {
            if (obj[k] != obj[k].toLowerCase()) {
                this.#setErrorMessage = `Command file "${value?.name}" has an error, The key: ${k} > Needs to be all lowercased`
                return false
            }
        } else if (k === `name_localizations` || k === `description_localizations`) {
            const langs = this.#getLangSupported
            var errorMsg = ``
            for (const l of langs) {
                if (l === `en-US`) continue
                if (!this.#hasProp(value?.[k], l)) {
                    errorMsg += `Needs Lang ${l} added\n`
                } else if (k === `name_localizations` && value?.[k]?.[l] != value?.[k]?.[l].toLowerCase()) {
                    errorMsg += `Lang ${l} > Needs to be all lowercased`
                } else if (k === `name_localizations` && value?.[k]?.[l] === ``) {
                    console.warn(`Command file "${value?.name}": [WARNING] > The key: ${k} > Needs to be filled as it is not populated`)
                }
            }
            this.#setErrorMessage = `Command file "${value?.name}" has an error(s), The key: ${k} >\n${errorMsg}`
            return errorMsg === `` ? true : false
        }
        return true
    }
}

module.exports = commandStructureChecker