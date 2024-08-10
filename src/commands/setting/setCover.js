"use strict"
const Confirmator = require(`../../libs/confirmator`)
const GUI = require(`../../ui/prebuild/profile`)
const fs = require(`fs`)
const superagent = require(`superagent`)
const stringSimilarity = require(`string-similarity`)
const { v4: uuidv4 } = require(`uuid`)
const commanifier = require(`../../utils/commanifier`)
const User = require(`../../libs/user`)

const {
    ApplicationCommandType,
    ApplicationCommandOptionType
} = require(`discord.js`)
/**
 * Setting up your own custom background! upload or share the image link you want to use.
 * @author klerikdust
 */
module.exports = {
    name: `setcover`,
    name_localizations: {
        fr: ``
    },
    description_localizations: {
        fr: ``
    },
    aliases: [`setcover`, `setcovers`, `setcvr`, `setbg`, `setbackground`],
    description: `Setting up your own custom background! upload or share the image link you want to use.`,
    usage: `setcover <Attachment/URL>`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    server_specific: false,
    options: [{
        name: `attachment`,
        description: `upload a custom image via attachment.`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            name: `set`,
            description: `the attachment to set as the background.`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            required: true,
            type: ApplicationCommandOptionType.Attachment
        }]
    }, {
        name: `url`,
        description: `upload a custom image via URL.`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            name: `set`,
            description: `the url of the image you want to use.`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            required: true,
            type: ApplicationCommandOptionType.String
        }]
    }, {
        name: `cover_id`,
        description: `upload a cover via the cover id; brought from the shop.`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            name: `set`,
            description: `the cover id`,
            name_localizations: {
                fr: ``
            },
            description_localizations: {
                fr: ``
            },
            required: true,
            type: ApplicationCommandOptionType.String
        }]
    }, {
        name: `reset`,
        description: `reset the background to the default one.`,
        name_localizations: {
            fr: ``
        },
        description_localizations: {
            fr: ``
        },
        type: ApplicationCommandOptionType.Subcommand
    }],
    type: ApplicationCommandType.ChatInput,
    uploadCost: 1000,
    FileTypesNotAllowed: [`.apng`, `.avif`, `.gif`, `.webp`],
    async execute(client, reply, message, arg, locale, prefix) {
        const userData = await (new User(client, message)).requestMetadata(message.author, 2, locale)
        //  Handle if user doesn't specify any arg
        const ownedCovers = userData.inventory.raw.filter(item => item.type_id === 1 && item.in_use === 0)
        const displayOwnedCovers = locale.SETCOVER.OWNED_COVERS + this.prettifyList(ownedCovers)
        const { isValidUpload, url } = this.getUserSelfUploadCover(arg, message)
        if (!arg && !isValidUpload) {
            const FOOTER = userData.usedCover.isDefault ?
                `SUGGEST_TO_UPLOAD` :
                userData.usedCover.isSelfUpload ?
                    `DISPLAY_USED_SELF_COVER` :
                    `DISPLAY_USED_REGULAR_COVER`
            return await reply.send(`${locale.SETCOVER.GUIDE}\n${locale.SETCOVER[FOOTER]}\n${ownedCovers.length > 0 ? displayOwnedCovers : ``}`, {
                header: `Hi, ${message.author.username}!`,
                image: `banner_setbackground`,
                socket: {
                    prefix: prefix,
                    emoji: await client.getEmoji(`781504248868634627`),
                    cover: userData.usedCover.name
                }
            })
        }
        this.args = arg.split(` `)
        //  Handle user self-upload cover
        const id = uuidv4()
        if (isValidUpload) {
            const response = await superagent.get(url).catch(async (error) => {
                client.logger.error(`[setCover.js][Superagent] > ${error}`)
                await reply.send(locale.ERROR_UNSUPPORTED_FILE_TYPE, {
                    socket: {
                        emoji: await client.getEmoji(`692428843058724994`)
                    },
                    ephemeral: true
                })
                return null
            })
            if (response === null) return
            const buffer = response.body
            await fs.writeFileSync(`./src/assets/selfupload/${id}.png`, buffer)
            this.cover = {
                isSelfUpload: true,
                item_id: id,
                alias: id,
                name: `My Upload`
            }
            //  Handle if user doesn't have enough artcoins to upload a new cover
            if (userData.inventory.artcoins < this.uploadCost) return await reply.send(locale.SETCOVER.UPLOAD_INSUFFICIENT_COST, {
                socket: {
                    emoji: await client.getEmoji(`758720612087627787`),
                    requiredLeft: commanifier(this.uploadCost - userData.inventory.artcoins)
                }
            })
        }
        //  Handle if user asked to use default cover
        else if (arg === `default`) {
            this.cover = await client.db.shop.getItem(`defaultcover1`)
        }
        //  Otherwise, handle like the usual way
        else {
            //  Handle if user doesn't have any equippable cover
            if (!ownedCovers.length) return await reply.send(locale.SETCOVER.NO_EQUIPPABLE_COVER)
            const searchStringResult = stringSimilarity.findBestMatch(arg, ownedCovers.map(i => i.name))
            this.cover = searchStringResult.bestMatch.rating >= 0.4
                //  If searchstring successfully found the cover from the given string keyword with the accuracy of >= 40%, then pull based on given result.
                ? ownedCovers.filter(i => i.name === searchStringResult.bestMatch.target)[0]
                //  If doesn't work, try searching based on item_id
                : ownedCovers.filter(i => i.item_id === parseInt(this.args[0])).length > 0
                    ? ownedCovers.filter(i => i.item_id === parseInt(this.args[0]))[0]
                    //  Finally if no item's name/ID are match, then return null
                    : null
            //  Handle if dynamic search string doesn't give any result
            if (!this.cover) return await reply.send(locale.SETCOVER.ITEM_DOESNT_EXISTS, { socket: { emoji: await client.getEmoji(`692428969667985458`) } })
            //  Handle if user tries to use cover that currently being used.
            if (userData.usedCover.item_id === this.cover.item_id) return await reply.send(locale.SETCOVER.ALREADY_USED, {
                socket: {
                    emoji: await client.getEmoji(`692428748838010970`),
                    cover: this.cover.name
                }
            })
        }
        userData.usedCover = this.cover
        const fetching = await reply.send(locale.SETCOVER.FETCHING, {
            socket: {
                itemId: this.cover.item_id,
                userId: message.author.id,
                emoji: await client.getEmoji(`790994076257353779`)
            }
        })
        //  Rendering preview for user to see
        const betaFeature = Math.floor(Math.random() * 100) > 50
        let img = await new GUI(userData, client, { width: 320, height: 310 }).build(betaFeature)
        const confirmationMessage = locale.SETCOVER[this.cover.isSelfUpload ? `PREVIEW_SELF_UPLOAD` : `PREVIEW_CONFIRMATION`]
        const confirmation = await reply.send(confirmationMessage, {
            prebuffer: true,
            image: img.png(),
            socket: {
                cover: this.cover.name,
                uploadCost: commanifier(this.uploadCost),
                emoji: await client.getEmoji(this.cover.isSelfUpload ? `758720612087627787` : `692428927620087850`)
            }
        })
        fetching.delete()
        const c = new Confirmator(message, reply, locale)
        await c.setup(message.author.id, confirmation)
        c.onAccept(async () => {
            await client.db.covers.detachCovers(message.author.id, message.guild.id)
            if (this.cover.isSelfUpload) {
                client.db.covers.applySelfUploadCover(this.cover.item_id, message.author.id, message.guild.id)
                client.db.databaseUtils.updateInventory({ itemId: 52, value: this.uploadCost, operation: `-`, userId: message.author.id, guildId: message.guild.id })
            }
            else {
                client.db.covers.deleteSelfUploadCover(message.author.id, message.guild.id)
                client.db.covers.applyCover(this.cover.item_id, message.author.id, message.guild.id)
            }
            const successMessage = this.cover.isSelfUpload ? `SUCCESSFUL_ON_SELF_UPLOAD` : `SUCCESSFUL`
            await reply.send(locale.SETCOVER[successMessage], {
                socket: {
                    cover: this.cover.name,
                    emoji: await client.getEmoji(this.cover.alias)
                }
            })
        })
    },
    async Iexecute(client, reply, interaction, options, locale) {

        let arg = null
        if (options.getSubcommand() == `attachment` && options.getAttachment(`set`)) {
            arg = options.getAttachment(`set`).url
        }
        if (options.getSubcommand() == `url` && options.getString(`set`)) {
            arg = options.getString(`set`)
        }
        if (options.getSubcommand() == `cover_id` && options.getString(`set`)) {
            arg = options.getString(`set`)
        }
        if (options.getSubcommand() == `reset`) {
            return this.reset(client, reply, interaction, options, locale)
        }
        const userData = await (new User(client, interaction)).requestMetadata(interaction.member, 2, locale)
        const OLD_COVER = userData.usedCover
        //  Handle if user doesn't specify any arg
        const ownedCovers = userData.inventory.raw.filter(item => item.type_id === 1 && item.in_use === 0)
        const displayOwnedCovers = locale.SETCOVER.OWNED_COVERS + this.prettifyList(ownedCovers)
        const { isValidUpload, url } = this.getUserSelfUploadCover(arg, interaction)
        if (!arg && !isValidUpload) {
            const FOOTER = userData.usedCover.isDefault ?
                `SUGGEST_TO_UPLOAD` :
                userData.usedCover.isSelfUpload ?
                    `DISPLAY_USED_SELF_COVER` :
                    `DISPLAY_USED_REGULAR_COVER`
            return await reply.send(`${locale.SETCOVER.GUIDE}\n${locale.SETCOVER[FOOTER]}\n${ownedCovers.length > 0 ? displayOwnedCovers : ``}`, {
                header: `Hi, ${interaction.author.username}!`,
                image: `banner_setbackground`,
                socket: {
                    prefix: `/`,
                    emoji: await client.getEmoji(`781504248868634627`),
                    cover: userData.usedCover.name
                }
            })
        }
        this.args = arg.split(` `)
        //  Handle user self-upload cover
        const id = uuidv4()
        if (isValidUpload) {
            if (!url) return await reply.send(`Im sorry but the file type is not supported at this time.\n**Unsupported** file extensions: ${this.FileTypesNotAllowed.join(`, `)}`)
            const response = await superagent.get(url).catch(async (error) => {
                client.logger.error(`[setCover.js][Superagent] > ${error}`)
                await reply.send(locale.ERROR_UNSUPPORTED_FILE_TYPE, {
                    socket: {
                        emoji: await client.getEmoji(`692428843058724994`)
                    },
                    ephemeral: true
                })
                return null
            })
            if (response === null) return
            const buffer = response.body
            fs.writeFileSync(`./src/assets/selfupload/${id}.png`, buffer)
            this.cover = {
                isSelfUpload: true,
                item_id: id,
                alias: id,
                name: `My Upload`
            }
            //  Handle if user doesn't have enough artcoins to upload a new cover
            if (userData.inventory.artcoins < this.uploadCost) return await reply.send(locale.SETCOVER.UPLOAD_INSUFFICIENT_COST, {
                socket: {
                    emoji: await client.getEmoji(`758720612087627787`),
                    requiredLeft: commanifier(this.uploadCost - userData.inventory.artcoins)
                }
            })
        }
        //  Handle if user asked to use default cover
        else if (arg === `default`) {
            this.cover = await client.db.shop.getItem(`defaultcover1`)
        }
        //  Otherwise, handle like the usual way
        else {
            //  Handle if user doesn't have any equippable cover
            if (!ownedCovers.length) return await reply.send(locale.SETCOVER.NO_EQUIPPABLE_COVER)
            const searchStringResult = stringSimilarity.findBestMatch(arg, ownedCovers.map(i => i.name))
            this.cover = searchStringResult.bestMatch.rating >= 0.4
                //  If searchstring successfully found the cover from the given string keyword with the accuracy of >= 40%, then pull based on given result.
                ? ownedCovers.filter(i => i.name === searchStringResult.bestMatch.target)[0]
                //  If doesn't work, try searching based on item_id
                : ownedCovers.filter(i => i.item_id === parseInt(this.args[0])).length > 0
                    ? ownedCovers.filter(i => i.item_id === parseInt(this.args[0]))[0]
                    //  Finally if no item's name/ID are match, then return null
                    : null
            //  Handle if dynamic search string doesn't give any result
            if (!this.cover) return await reply.send(locale.SETCOVER.ITEM_DOESNT_EXISTS, { socket: { emoji: await client.getEmoji(`692428969667985458`) } })
            //  Handle if user tries to use cover that currently being used.
            if (userData.usedCover.item_id === this.cover.item_id) return await reply.send(locale.SETCOVER.ALREADY_USED, {
                socket: {
                    emoji: await client.getEmoji(`692428748838010970`),
                    cover: this.cover.name
                }
            })
        }
        userData.usedCover = this.cover
        const fetching = await reply.send(locale.SETCOVER.FETCHING, {
            socket: {
                itemId: this.cover.item_id,
                userId: interaction.member.id,
                emoji: await client.getEmoji(`790994076257353779`)
            }
        })
        //  Rendering preview for user to see
        const betaFeature = Math.floor(Math.random() * 100) > 50
        let img = await new GUI(userData, client, { width: 320, height: 310 }).build(betaFeature)
        const confirmationMessage = locale.SETCOVER[this.cover.isSelfUpload ? `PREVIEW_SELF_UPLOAD` : `PREVIEW_CONFIRMATION`]
        const confirmation = await reply.send(confirmationMessage, {
            prebuffer: true,
            image: img.png(),
            socket: {
                cover: this.cover.name,
                uploadCost: commanifier(this.uploadCost),
                emoji: await client.getEmoji(this.cover.isSelfUpload ? `758720612087627787` : `692428927620087850`)
            }
        })
        fetching.delete()
        const c = new Confirmator(interaction, reply, locale)
        await c.setup(interaction.member.id, confirmation)
        c.onAccept(async () => {
            await client.db.covers.detachCovers(interaction.member.id, interaction.guild.id)
            if (OLD_COVER.isSelfUpload) {
                fs.unlink(`./src/assets/selfupload/${OLD_COVER.alias}.png`, (error) => {
                    if (error) client.logger.warn(`[setCover.js][Removing Image from filetree] ${error.stack}`)
                })
            }
            if (this.cover.isSelfUpload) {
                client.db.covers.applySelfUploadCover(this.cover.item_id, interaction.member.id, interaction.guild.id)
                client.db.databaseUtils.updateInventory({ itemId: 52, value: this.uploadCost, operation: `-`, userId: interaction.member.id, guildId: interaction.guild.id })
            }
            else {
                client.db.covers.deleteSelfUploadCover(interaction.member.id, interaction.guild.id)
                client.db.covers.applyCover(this.cover.item_id, interaction.member.id, interaction.guild.id)
            }
            const successMessage = this.cover.isSelfUpload ? `SUCCESSFUL_ON_SELF_UPLOAD` : `SUCCESSFUL`
            await reply.send(locale.SETCOVER[successMessage], {
                socket: {
                    cover: this.cover.name,
                    emoji: await client.getEmoji(this.cover.alias)
                }
            })
        })
    },
    async reset(client, reply, interaction, options, locale) {
        this.cover = await client.db.shop.getItem(`defaultcover1`)
        // if (this.cover.alias === `defaultcover1`) return await reply.send(locale.SETCOVER.DEFAULT_ALREADY)
        const userData = await (new User(client, interaction)).requestMetadata(interaction.member, 2, locale)
        if (userData.usedCover.alias === `defaultcover1`) return await reply.send(locale.SETCOVER.DEFAULT_ALREADY)
        const OLD_COVER = userData.usedCover
        userData.usedCover = this.cover
        const fetching = await reply.send(locale.SETCOVER.FETCHING, {
            socket: {
                itemId: this.cover.item_id,
                userId: interaction.member.id,
                emoji: await client.getEmoji(`790994076257353779`)
            }
        })
        //  Rendering preview for user to see
        const betaFeature = Math.floor(Math.random() * 100) > 50
        let img = await new GUI(userData, client, { width: 320, height: 310 }).build(betaFeature)
        const confirmation = await reply.send(locale.SETCOVER[`PREVIEW_CONFIRMATION`], {
            prebuffer: true,
            image: img.png(),
            socket: {
                cover: this.cover.name,
                uploadCost: commanifier(this.uploadCost),
                emoji: await client.getEmoji(`692428927620087850`)
            }
        })
        fetching.delete()
        const c = new Confirmator(interaction, reply, locale)
        await c.setup(interaction.member.id, confirmation)
        c.onAccept(async () => {
            await client.db.covers.detachCovers(interaction.member.id, interaction.guild.id)
            client.db.covers.deleteSelfUploadCover(interaction.member.id, interaction.guild.id)
            client.db.covers.applyCover(this.cover.item_id, interaction.member.id, interaction.guild.id)
            fs.unlink(`./src/assets/selfupload/${OLD_COVER.alias}.png`, (error) => {
                if (error) client.logger.warn(`[setCover.js][Removing Image from filetree] ${error.stack}`)
            })
            await reply.send(locale.SETCOVER[`SUCCESSFUL`], {
                socket: {
                    cover: this.cover.name,
                    emoji: await client.getEmoji(this.cover.alias)
                }
            })
        })
    },
    /** 
     * Check if user has attempted to upload a new cover
     * @param {string} arg
     * @param {Message} message
     * @return {object}
     */
    getUserSelfUploadCover(arg, message) {
        if (message.type == 0) {
            const hasAttachment = message.attachments.first() ? true : false
            const hasImageURL = arg.startsWith(`http`) && arg.length >= 15 ? true : false
            return {
                isValidUpload: hasAttachment || hasImageURL ? true : false,
                url: message.attachments.first()
                    ? message.attachments.first().url
                    : arg.startsWith(`http`) && arg.length >= 15
                        ? arg
                        : null
            }
        } else {
            const hasAttachment = arg ? true : false
            const hasImageURL = arg.startsWith(`http`) && arg.length >= 15 && !this.FileTypesNotAllowed.some(v => arg.endsWith(v)) ? true : false
            return {
                isValidUpload: hasAttachment || hasImageURL ? true : false,
                url: hasImageURL ? arg : null
            }
        }

    },

    /**
     * Properly arrange returned list from `user.inventory.raw`
     * @param {array} [list=[]] this.user.inventory.raw
     * @returns {string}
     */
    prettifyList(list) {
        let str = ``
        for (let i = 0; i < list.length; i++) {
            const item = list[i]
            str += `╰☆～(${item.item_id}) **${item.name}**${list.length === (list.length - 1) ? `` : `\n`}`
        }
        return str
    }
}