"use strict"
const fs = require(`fs`)
const PixivApi = require(`pixiv-api-client`)
const PixImg = require(`pixiv-img`)
const pixiv = new PixivApi()
const { ApplicationCommandType, ApplicationCommandOptionType } = require(`discord.js`)
/**
 * Note:
 * This module requires pixiv account (verified username and pw) in order to get acccess to the API.
 * So, make sure to put your pixiv account details inside the .env file
 * 
 *  PIXIV_USERNAME = email
 *  PIXIV_PASS = account password
 * 
 * Pixiv API
 * @author klerikdust
 */
module.exports = {
    name: `pixiv`,
    name_localizations: {
        fr: `pixiv`
    },
    description_localizations: {
        fr: `Récupération de l'image depuis pixiv.`
    },
    aliases: [`pix`, `pxv`, `pixiv`],
    description: `Fetching image from pixiv.`,
    usage: `pixiv <SearchKeyword>(Optional)`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    server_specific: false,
    options: [{
        name: `tag`,
        name_localizations: {
            fr: `étiqueter`
        },
        description: `Search by tag`,
        description_localizations: {
            fr: `Rechercher par balise`
        },
        required: true,
        type: ApplicationCommandOptionType.String
    }],
    type: ApplicationCommandType.ChatInput,
    /** Make sure to add the other supported lang for each forbidden words */
    forbiddenKeywords: [
        `lewd`,
        `r18`,
        `porn`,
        `dick`,
        `ass`,
        `vagina`,
        `anal`,
        `blowjob`,
        `bdsm`,
        `furry`,
        `anus`,
        `porno`,
        `boobs`,
        `boob`,
        `nipple`,
        `handjob`,
        `sex`,
        `obscène`,
        `porno`,
        `queue`,
        `cul`,
        `vagin`,
        `anale`,
        `pipe`,
        `velue`,
        `velu`,
        `seins`,
        `mamelon`,
        `branlette`,
        `sexe`
    ],
    cachePath: `./.pixivcaches/`,
    async fetchPixivResult(client, reply, arg, locale) {
        //  Logging in to get access to the Pixiv API
        await pixiv.refreshAccessToken(process.env.PIXIV_REFRESH_TOKEN)
        reply.send(locale.PIXIV[arg ? `DISPLAY_CUSTOM_SEARCH` : `DISPLAY_RECOMMENDED_WORK`], {
            socket: {
                keyword: arg,
                emoji: await client.getEmoji(`790994076257353779`)
            }
        }).then(async loadmsg => {
            //  Dynamically choose recommended/custom search based on input
            let data = arg ? await this.fetchCustomSearch(arg) : await this.fetchRecommendedWork()
            //  Prevent forbidden search
            const usedForbiddenKeyword = this.forbiddenKeywords.filter(k => arg.includes(k))
            if (usedForbiddenKeyword.length > 0) data = null
            //  Handle if no returned result from the query
            if (!data) {
                loadmsg.delete()
                return await reply.send(locale.PIXIV.NO_RESULT)
            }
            const img = await this.getImage(data.image_urls.medium, data.id)
            //  Handle if no returned result from given img path
            if (!img) {
                loadmsg.delete()
                return await reply.send(locale.PIXIV.FAIL_TO_LOAD)
            }
            loadmsg.delete()
            return await reply.send(`${this.getTools(data.tools)}\n${this.getHashtags(data.tags)}`, {
                customHeader: [`by ${data.user.name}`, client.user.displayAvatarURL()],
                image: img,
                prebuffer: true
            })
        })
    },
    async execute(client, reply, message, arg, locale) {
        return await this.fetchPixivResult(client, reply, arg, locale)
    },

    async Iexecute(client, reply, interaction, options, locale) {
        let arg = options.getString(`tag`)
        return await this.fetchPixivResult(client, reply, arg, locale)
    },

    /**
     * Fetch artworks by custom search/filter. Returns object of choosen index.
     * @param {String} keyword 
     * @returns {?object}
     */
    async fetchCustomSearch(keyword = ``) {
        const res = await pixiv.searchIllust(keyword)
        const postData = res.illusts[Math.floor(Math.random() * res.illusts.length)]
        return postData
    },

    /**
     * Fetch artworks by popularity ranking. Returns object of choosen index.
     * @returns {?object}
     */
    async fetchRecommendedWork() {
        const res = await pixiv.illustRanking()
        const postData = res.illusts[Math.floor(Math.random() * res.illusts.length)]
        return postData
    },

    /**
     * Loading image from pixiv cache directory. (downloaded pixiv's image)
     * @param {string} url 
     * @param {string} filename 
     * @param {function} loaderMethod supply with Pistachio's loadCache.
     * @returns {buffer}
     */
    async getImage(url = ``, filename = ``) {
        const id = await PixImg(url, `${this.cachePath + filename}.jpg`)
        return this.getImageCache(id)
    },

    /**
     * Fetch cached pixiv's image. Return as buffer. If error occured, fallback with a Boolean.
     * @param {string} id image filename 
     * @returns {buffer}
     */
    async getImageCache(id = ``) {
        const res = await fs.readFileSync(`./${id}`)
        if (!res) throw new Error(`Failed to fetch image with ID ${id}`)
        return res
    },

    /**
     * Map `name` prop from Pixiv's tags object. Returns a proper string of hashtags.
     * @param {array} tags 
     * @returns {string}
     */
    getHashtags(tags = Array) {
        let arr = tags.map(key => `#${key.name}`)
        let str = ``
        for (let el of arr) {
            str += `${el} `
        }
        return str
    },

    /**
     * Parse "tools" property from Pixiv's Post Data. Omitted if no tools are found.
     * @param {object} [tools=[]]
     * @returns {string}
     */
    getTools(tools = []) {
        if (tools.length < 1) return ``
        return `**Made with ${tools[0]}**`
    }
}