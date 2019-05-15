const clock = require("node-emoji-clock");
const momentTime = require("moment-timezone");
const formatManager = require('../utils/formatManager');
const palette = require('../colorset.json');
const sql = require("sqlite"),
      utils = require(`../utils/utils.js`);

module.exports = bot => {


startup();

  //sql.run(`CREATE TABLE IF NOT EXISTS clans (clanTag TEXT, clanName TEXT, clanDesc TEXT, clanLeader TEXT, clanMember1 TEXT, clanMember2 TEXT, clanMember3 TEXT, clanMember4 TEXT, clanMember5 TEXT, clanMember6 TEXT, clanMember7 TEXT, clanMember8 TEXT, clanMember9 TEXT, clanMember10 TEXT, clanMember11 TEXT, clanMember12 TEXT, clanMember13 TEXT, clanMember14 TEXT, clanMember15 TEXT)`);
  //sql.run(`DROP TABLE clans`)
  //sql.run(`UPDATE usercheck SET InClan=false WHERE userID=277266191540551680`)
  //sql.run(`ALTER TABLE usercheck ADD COLUMN clanName TEXT;`)
    /**
      * 
      * Fired processes on startup.
      * @startup
      */
    function startup() {

            console.log(`${bot.user.username} is up.`)
            bot.user.setStatus('dnd');

            sql.open(`.data/database.sqlite`);
            sql.run(`UPDATE usercheck SET expcooldown = "False"`);

            setInterval(() => {
                    let activityArr = [
                        "maintenance"
                        ];
                    let activityArrIndex = Math.floor(Math.random() * (activityArr.length - 1) + 1);
                    bot.user.setActivity(activityArr[0],{type:"PLAYING"})
            }, 3000 );
    }

    /**
      * 
      * Update Time channels in server stats
      * 
      */
  
    function serverTime() {
        
        setInterval(() => {
            let channelESTTimeUpdate = bot.channels.get(`514668748612042763`);
            let channelMSTTimeUpdate = bot.channels.get(`514673767583318037`);
            let channelGMT08TimeUpdate = bot.channels.get(`514676732247408641`);
                var est = momentTime().tz("America/New_York");
                var mst = momentTime().tz("America/Boise");
                var gmt08 = momentTime().tz("Asia/Kuala_Lumpur");
                var esttime = clock.timeToEmoji(est) + " " + est.format("h:mm A");
                var msttime = clock.timeToEmoji(mst) + " " + mst.format("h:mm A");
                var gmt08time = clock.timeToEmoji(gmt08) + " " + gmt08.format("h:mm A");

                channelESTTimeUpdate.setName(`${esttime} EST`);
                channelMSTTimeUpdate.setName(`${msttime} MST`);
                channelGMT08TimeUpdate.setName(`${gmt08time} GMT+8`);
            
        }, 6*1000);
    }


    /**
     * 
     *      Event loot boxes.
     *      12/20/18
     */
    function eventLootBoxes() { 
      let num = 6;
      let num2 = 8;
      const numfields = [
            '7',
            '6',
            '9',
            '11',
            '8',
            '9',
            '10',
            ];
      const num2fields = [
            '7',
            '6',
            '9',
            '11',
            '8',
            '9',
            '10',
            ];
      
            sql.open(".data/database.sqlite");
            const format = new formatManager();
            /** 
             * 
             *      Randomize the channels it sends to:
             *      @fields[0] : #trashcan
             *      @fields[1] : #general
             *      @fields[2] : #artistic-hall
             *      @fields[3] : #vidya-gaemz
             * 
             */
            const fields = [
            '459893209875611649',
            '459891664182312982',
            '520716400097099777',
            '459893209875611649',
            '500916948197179394',
            '459891664182312982',
            ];
            
            
            setInterval(()=>{
                setTimeout(()=>{
                  let numfieldsArrIndex = Math.floor(Math.random() * (numfields.length - 1) + 1);
                  num = numfields[numfieldsArrIndex];
                  console.log(`NUM: ${num}`);
                  let fieldsArrIndex = Math.floor(Math.random() * (fields.length - 1) + 1);
                  let generalchat = bot.channels.get(fields[fieldsArrIndex]);
                generalchat.send(format.baseEmbedWrapper(palette.darkmatte,'A Christmas Loot Box has appeared, react to the 🎁 to claim it!'))
                    .then(msg => {
                    msg.react('🎁')
                    console.log(`The loot box appears in ${msg.channel.name} !`)
                    let reactiondone = false;
                    const lootboxFilter = (reaction, user) => (reaction.emoji.name === '🎁') && (user.id != bot.user.id);
                    const lootbox = msg.createReactionCollector(lootboxFilter, { max: 1, time: 60000 } );

                    let count = 1;
                    lootbox.on('collect', r => {
                    count--
                    if(count == 0) { 
                        let user_id = r.users.last().id;
                        console.log(`user_id:
                            The box was claimed by ${user_id}.`
                        );

                        sql.get(`SELECT * FROM usereventsdata WHERE userId ="${user_id}"`)
                            .then(async currentdata => {
                                sql.run(`UPDATE usereventsdata SET collectedboxes = ${currentdata.collectedboxes + 1} WHERE userId = ${user_id}`)
                                sql.run(`UPDATE usereventsdata SET totalboxes = ${currentdata.totalboxes + 1} WHERE userId = ${user_id}`)
                            })
                        sql.get(`SELECT * FROM messagelog`)
                            .then(() => {
                                sql.run(`INSERT INTO christmasevent_log (userId, timestamp, box_location) VALUES (?, ?, ?)`,
                                [user_id, Date.now(), msg.channel.name])
                            })    

                        msg.edit(format.baseEmbedWrapper(palette.halloween, `Congratulation!! <@${user_id}>, you have received a christmas box!! :tada:!`))
                        .then( msg.clearReactions() )
                        .then( reactiondone=true )
                            .then( msg.delete(10000) );
                                
                        console.log(`REACT:
                            The box was claimed by ${r.users.last().username}.`
                        );
                        timeout();
                    }
                    });


                    lootbox.on('end',() => {
                    if(!reactiondone){
                        sql.get(`SELECT * FROM christmasevent_log`)
                            .then(() => {
                                sql.run(`INSERT INTO christmasevent_log (userId, timestamp, box_location) VALUES (?, ?, ?)`,
                                [null, Date.now(), msg.channel.name])
                            })  
                        msg.edit(format.baseEmbedWrapper(palette.darkmatte,
                            `Hmm, so quiet ..`))
                            .then( msg.clearReactions() )
                                .then( msg.delete(5000) );
                    } 
                    else {
                        reactiondone = false;
                    }
                    });
                    function timeout(){
                    setTimeout( () => {
                        count++;
                    }, 1000 * 3 )
                    }
                })
                }, 60000 );
            }, ( 1000 * 60 * num) );//controls how long between each box spawn: 1000*60 = base minute the last number is how long: 15mins = 1000*60*14
      
      
      
      setInterval(()=>{
                setTimeout(()=>{
                  let num2fieldsArrIndex = Math.floor(Math.random() * (num2fields.length - 1) + 1);
                  num2 = num2fields[num2fieldsArrIndex];
                  console.log(`NUM2: ${num2}`);
                  let fieldsArrIndex = Math.floor(Math.random() * (fields.length - 1) + 1);
                  let general2chat = bot.channels.get(fields[fieldsArrIndex]);
                general2chat.send(format.baseEmbedWrapper(palette.darkmatte,'A Christmas Loot Box has appeared, react to the 🎁 to claim it!'))
                    .then(msg => {
                    msg.react('🎁')
                    console.log(`The loot box appears in ${msg.channel.name} !`)
                    let reactiondone = false;
                    const lootbox2Filter = (reaction, user) => (reaction.emoji.name === '🎁') && (user.id != bot.user.id);
                    const lootbox2 = msg.createReactionCollector(lootbox2Filter, { max: 1, time: 60000 } );

                    let count = 1;
                    lootbox2.on('collect', r => {
                    count--
                    if(count == 0) { 
                        let user_id = r.users.last().id;
                        console.log(`user_id:
                            The box was claimed by ${user_id}.`
                        );

                        sql.get(`SELECT * FROM usereventsdata WHERE userId ="${user_id}"`)
                            .then(async currentdata => {
                                sql.run(`UPDATE usereventsdata SET collectedboxes = ${currentdata.collectedboxes + 1} WHERE userId = ${user_id}`)
                                sql.run(`UPDATE usereventsdata SET totalboxes = ${currentdata.totalboxes + 1} WHERE userId = ${user_id}`)
                            })
                        sql.get(`SELECT * FROM messagelog`)
                            .then(() => {
                                sql.run(`INSERT INTO christmasevent_log (userId, timestamp, box_location) VALUES (?, ?, ?)`,
                                [user_id, Date.now(), msg.channel.name])
                            })    

                        msg.edit(format.baseEmbedWrapper(palette.halloween, `Congratulation!! <@${user_id}>, you have received a christmas box!! :tada:!`))
                        .then( msg.clearReactions() )
                        .then( reactiondone=true )
                            .then( msg.delete(5000) );
                                
                        console.log(`REACT:
                            The box was claimed by ${r.users.last().username}.`
                        );
                        timeout();
                    }
                    });


                    lootbox2.on('end',() => {
                    if(!reactiondone){
                        sql.get(`SELECT * FROM christmasevent_log`)
                            .then(() => {
                                sql.run(`INSERT INTO christmasevent_log (userId, timestamp, box_location) VALUES (?, ?, ?)`,
                                [null, Date.now(), msg.channel.name])
                            })  
                        msg.edit(format.baseEmbedWrapper(palette.darkmatte,
                            `Hmm, so quiet ..`))
                            .then( msg.clearReactions() )
                                .then( msg.delete(5000) );
                    } 
                    else {
                        reactiondone = false;
                    }
                    });
                    function timeout(){
                    setTimeout( () => {
                        count++;
                    }, 1000 * 3 )
                    }
                })
                }, 60000 );
            }, ( 1000 * 60 * num2) );//controls how long between each box spawn: 1000*60 = base minute the last number is how long: 15mins = 1000*60*14
    }
}
