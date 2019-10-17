const Heart = require(`../utils/artFeaturingManager`)
const BoosterColor = require(`../utils/BoosterColorManager`)

module.exports = async(Components) => {
    new Heart(Components).Add()


    //  Extracting required vars for BoosterPerk check
    let messageID = Components.reaction.message.id
    let isBoosterPerkMessage = (messageID === `634414837426028584`) || (messageID === `634414682245169182`)


    if (isBoosterPerkMessage) new BoosterColor(Components).Add()
}