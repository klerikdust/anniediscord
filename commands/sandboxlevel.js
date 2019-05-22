const { Canvas } = require("canvas-constructor"); 
const { resolve, join } = require("path");
const { Attachment } = require("discord.js"); 
const { get } = require("snekfetch");
const palette = require("../colorset.json");
const Color = require('color');
const imageUrlRegex = /\?size=2048$/g; 
const databaseManager = require('../utils/databaseManager.js');
const ranksManager = require('../utils/ranksManager');
const profileManager = require('../utils/profileManager');
const formatManager = require('../utils/formatManager');
const userFinding = require('../utils/userFinding')

Canvas.registerFont(resolve(join(__dirname, "../fonts/Roboto.ttf")), "Roboto");
Canvas.registerFont(resolve(join(__dirname, "../fonts/roboto-medium.ttf")), "RobotoMedium");
Canvas.registerFont(resolve(join(__dirname, "../fonts/roboto-bold.ttf")), "RobotoBold");
Canvas.registerFont(resolve(join(__dirname, "../fonts/roboto-thin.ttf")), "RobotoThin");
Canvas.registerFont(resolve(join(__dirname, "../fonts/Whitney.otf")), "Whitney");
Canvas.registerFont(resolve(join(__dirname, "../fonts/KosugiMaru.ttf")), "KosugiMaru");

module.exports.run = async (bot, command, message, args) => {

const env = require(`../.data/environment.json`);
if(env.dev && !env.administrator_id.includes(message.author.id))return;
  
const configFormat = new formatManager(message);
const configRank = new ranksManager(bot, message);


async function profile(member) {  
  const configProfile = new profileManager();
  const collection = new databaseManager(member.id);
  
  /**
    * id = userid, cur = currentexp, max = maxexp,
    * crv = expcurve, lvl = userlevel, ac = userartcoins,
    * rep = userreputation, des = userdescription, ui = userinterfacemode
    * clr = hex code of user's rank color.
    */
  const userdata = await collection.userdata;
  const keys = collection.storingKey(userdata);
  const user = {
     id: userdata[keys[0]], cur: userdata[keys[1]], max: userdata[keys[2]],
    crv: userdata[keys[3]], lvl: userdata[keys[4]],  ac: userdata[keys[5]],
    rep: userdata[keys[6]], des: userdata[keys[7]],  ui: userdata[keys[8]],
    get clr() { return (Color(configRank.ranksCheck(this.lvl).color).desaturate(0.2)).hex() }
  }

  const switchColor = {

        "Dark": {
            base: palette.nightmode,
            border: palette.deepnight,
            text: palette.white,
            secondaryText: palette.lightgray
        },

        "Light": {
            base: palette.white,
            border: palette.lightgray,
            text: palette.darkmatte,
            secondaryText: palette.blankgray
        }
  }

        let canvas_x = 800;
        let canvas_y = 130;
        let startPos_x = 10;
        let startPos_y = 15;
        let barlength_xp = canvas_x-10;
       
        //PAN's attempt
        let PanCurrent = user.crv === 150 ? user.max - (user.max - user.cur) : ((user.crv - 200) - (user.max - user.cur));
        const { body: avatar } = await get(member.user.displayAvatarURL.replace(imageUrlRegex, "?size=512"));
        const usercolor = configProfile.checkInterface(user.ui, member);
        const calculatedBar = await configProfile.barSize(PanCurrent, user.max, user.crv, barlength_xp);
        const rankTitle = await configRank.ranksCheck(user.lvl).title;

        let canv = new Canvas(canvas_x, canvas_y) // x y
          

        function Analogous() {
          return usercolor === "Dark" ? Color(user.clr).lighten(0.2).saturate(0.5) : Color(user.clr).darken(0.3).desaturate(0.5) 
        }


          /*
                x = starting point from x axis (horizontal)
                y = starting point from y axis (vertical)
          */

          //checkpoint_1
        canv.save()

          //checkpoint_2
        canv.save()
        

        /**
         *      CARD BASE
         *      800 x 130
         */
        canv.setShadowColor("rgba(28, 28, 28, 1)")
            .setShadowOffsetY(7)
            .setShadowBlur(15)
            .setColor(palette.darkmatte)
            .addRect(startPos_x+15, startPos_y+10,canvas_x-45, canvas_y-60) // (x, y, x2, y2)
            .createBeveledClip(startPos_x, startPos_y, canvas_x-20, canvas_y-40, 120)
            .setShadowBlur(0)
            .setShadowOffsetY(0)



       /**
         *      AVATAR BASE
         *      OVERLAY
         */    
            .addImage(avatar, startPos_x-20, startPos_y-310, 800, 564 * (800/564), 250)
            .save()
        canv.context.globalAlpha = 0.9;
        canv.setColor(usercolor === 'Dark' ? palette.black : palette.white )
            .addRect(startPos_x, startPos_y, canvas_x, canvas_y)
            .save()
            .save()
            .restore()
            


       /**
         *      EXP BAR
         *      referenced to @barSize
         */
        canv.context.globalAlpha = 0.6;
        canv.setColor(user.clr)
            .createBeveledClip(startPos_x, startPos_y, calculatedBar, canvas_y-40, 240)    
            .addRect(startPos_x, startPos_y, calculatedBar, canvas_y-40) // (x, y, x2, y2)        
            .restore()




        /**
         *      LEVEL
         *      POS
         */
            .setColor(switchColor[usercolor].secondaryText) 
            .setTextAlign("center")
            .setTextFont(`40pt RobotoBold`)  
            .addText(user.lvl, startPos_x+47, startPos_y+80)


        /**
          *      RANK
          *      TITLE
          */
        const pos_check = user.lvl >= 10 ? startPos_x+85 : startPos_x+75
        canv.setTextAlign("left")
            .setColor(Analogous())
            .setTextFont(`26pt RobotoThin`)  
            .addText(rankTitle, pos_check, startPos_y+73)



         /**
           *      USERNAME
           *      
           */
        const startpoint_name = (pos_check)+(canv.measureText(rankTitle).width+10);
        canv.setTextAlign("left")
            .setColor(Analogous()) 
            .setTextFont(`26pt RobotoBold`)  
            .addText((member.user.username).length >= 15 
            ? `${(member.user.username).substring(0, 14)}...` 
            : member.user.username, startpoint_name, startPos_y+73)
            


        /**
         *      PERCENTAGE
         *      EXP
         */ 
        .setColor(Color(user.clr).desaturate(0.2))
        .setTextFont(`20pt RobotoBold`)
        if(user.crv === 150) {
          canv.addText(`${configFormat.getPercentage(PanCurrent, user.max)}%`, calculatedBar+20, 50)
        }
        else if(configFormat.getPercentage(PanCurrent, user.crv) >= 90) { 
          canv.setColor(Analogous())
              .addText(`${configFormat.getPercentage(PanCurrent, user.crv)}%`, calculatedBar-60, 50)
        }
        else {
          canv.addText(`${configFormat.getPercentage(PanCurrent, user.crv)}%`, calculatedBar+20, 50)
        }
        
        
        
                return canv.toBuffer()


    }            
      


  try {  
const user = await userFinding.resolve(message, message.content.substring(command.length+2))
      const caption = '<:Annie_Smug:523686816545636352> | Level card for ';
        if(!args[0]) {
          message.channel.startTyping();
          return message.channel.send(`**${caption + message.author.username}.**`,
                          new Attachment(await profile(message.member),`levelcard-${message.author.username}.jpg`))
                          .then(() => message.channel.stopTyping() )
                          
        }
        else {
          message.channel.startTyping();
          return message.channel.send(`**${caption + user.user.username}.**`,
                          new Attachment(await profile(user),`levelcard-${user.user.username}.jpg`))
                          .then(() => message.channel.stopTyping() )
        }
  
  } catch(e) {
      console.log(e)
      message.channel.stopTyping()
      return configFormat.embedWrapper(palette.darkmatte, `Sorry, I couldn't find that user. :(`);
    }


}

module.exports.help = {
  name: "l",
        aliases:[]
}