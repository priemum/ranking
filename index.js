const Discord = require('discord.js')
require('dotenv').config()
 
const client = new Discord.Client();
const color = require('chalk');
const fs = require('fs');
const cron = require('cron');
const moment = require('moment');
const sql = require("sqlite");
sql.open('db.sqlite', { Promise, min: 2, max: 10 }).then(sql => {
    sql.run('PRAGMA busy_timeout = 2000');
    sql.configure("busyTimeout", 2000);
});

let options = { month: 'long'};
let date = new Date();
let i = 1;

client.on('ready', async () => {
	console.log(`LE BOT EST ${color.green("EN LIGNE")} !!\n======================`);

	let channel = client.channels.cache.get(process.env.channelSpan);
    let scheduledMessage = new cron.CronJob(`0 0 30 * *`, async() => { // 00 */1 * * * * Toute les minutes
    let profile = await sql.get('SELECT * FROM users');
    let profileAll = await sql.all('SELECT * FROM users ORDER BY votes DESC');
    let result = []

        await profileAll.forEach(async data => {
            let checker;
            if (data.votes > process.env.votesNumber) {
                checker = "✅"
            } else {
                checker = "❌"
            }
            await result.push(`**${data.id}** • ${checker} ` + '`' + data.votes + '`' + ' votes ' + 'de ' + '<@' + data.userId + '> ' + `(\`${data.userName}\`)`)
        })

        if(result.length < 1) {
            await channel.send({
                embed: {
                    color: 0x2F3136,
                    title: `Classement des votes du mois de ${new Intl.DateTimeFormat('fr-FR', options).format(date)}`,
                    description: '`Aucun participant !!`',
                    image: {
                        url: 'https://cdn.discordapp.com/attachments/590892043245584396/861393043995623444/ezgif.com-gif-maker.gif'
                    },
                    footer: {
                        text: `${process.env.votesNumber} votes à atteindre`
                    }
                }
            })
        } else {
            await channel.send({
                embed: {
                    color: 0x2F3136,
                    title: `Classement des votes du mois de ${new Intl.DateTimeFormat('fr-FR', options).format(date)}`,
                    description: result.join('\n'),
                    image: {
                        url: 'https://cdn.discordapp.com/attachments/590892043245584396/861393043995623444/ezgif.com-gif-maker.gif'
                    },
                    footer: {
                        text: `${process.env.votesNumber} votes à atteindre`
                    }
                }
            })
        }

        await sql.run('DROP TABLE users').then(() => {
            sql.run('CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, userId TEXT, userName TEXT, votes INTEGER)')
            console.log("REINITIALISED Database !!")
        });

    });

    scheduledMessage.start();

})

client.on('message', async message => {

    if (message.content.startsWith(process.env.prefix + "rank")) {
        let profileAll = await sql.all('SELECT * FROM users ORDER BY votes DESC')
        let result = []

        await profileAll.forEach(async data => {

            let checker;
            if (data.votes > process.env.votesNumber) {
                checker = "✅"
            } else {
                checker = "❌"
            }

            await result.push(`**${data.id}** • ${checker} ` + '`' + data.votes + '`' + ' votes ' + 'de ' + '<@' + data.userId + '> ' + `(\`${data.userName}\`)`);

        })

        let totalPage = Math.ceil(result.length / 10);
        if (totalPage < 1) totalPage = 1;

        if(result.length < 1) {
            message.channel.send({
                embed: {
                    color: 0x2F3136,
                    title: `Classement des votes du mois de ${new Intl.DateTimeFormat('fr-FR', options).format(date)}`,
                    description: '`Aucun participant`',
                    image: {
                        url: 'https://cdn.discordapp.com/attachments/590892043245584396/861393043995623444/ezgif.com-gif-maker.gif'
                    }
                }
            })
        } else {

            (await async function () {
                let x = 1;
                let p0 = 0;
                let p1 = 10;

                let noOfPages = result.length / 10;
                let p = (0 > 0 && 0 < noOfPages + 1) ? 0 : 1;
                let c = (0 > 0 && 0 < noOfPages + 1) ? 0 : 0;

                const data = await message.channel.send({
                    embed: {
                        color: 0x2F3136,
                        title: `Classement des votes du mois de ${new Intl.DateTimeFormat('fr-FR', options).format(date)}`,
                        description: result.slice(0, 10).join('\n'),
                        image: {
                            url: 'https://cdn.discordapp.com/attachments/590892043245584396/861393043995623444/ezgif.com-gif-maker.gif'
                        },
                        footer: {
                            text: `${x} sur ${totalPage} pages • ${process.env.votesNumber} votes à atteindre`
                        }
                    }
                })

                await data.react("⬅");
                await data.react("➡");
                await data.react("❌");

                const data_res = data.createReactionCollector((reaction, user) => user.id === message.author.id);

                data_res.on("collect", async (reaction, user) => {

                    if (reaction.emoji.name === "⬅") {
                        if (x != 0) x--;

                        p0 = p0 - 10;
                        p1 = p1 - 10;

                        if (p0 < 0) {
                            return data.delete();
                        }
                        if (p0 === undefined || p1 === undefined) {
                            return data.delete();
                        }

                        data.edit({
                            embed: {
                                color: 0x2F3136,
                                title: `Classement des votes du mois de ${new Intl.DateTimeFormat('fr-FR', options).format(date)}`,
                                description: result.slice(p0, p1).join('\n'),
                                image: {
                                    url: 'https://cdn.discordapp.com/attachments/590892043245584396/861393043995623444/ezgif.com-gif-maker.gif'
                                },
                                footer: {
                                    text: `${x} sur ${totalPage} pages • ${process.env.votesNumber} votes à atteindre`
                                }
                            }
                        })
                    }

                    if (reaction.emoji.name === "➡") {
                        x++;

                        p0 = p0 + 10;
                        p1 = p1 + 10;

                        if (p1 > result + 10) {
                            return data.delete();
                        }
                        if (p0 === undefined || p1 === undefined) {
                            return data.delete();
                        }

                        data.edit({
                            embed: {
                                color: 0x2F3136,
                                title: `Classement des votes du mois de ${new Intl.DateTimeFormat('fr-FR', options).format(date)}`,
                                description: result.slice(p0, p1).join('\n'),
                                image: {
                                    url: 'https://cdn.discordapp.com/attachments/590892043245584396/861393043995623444/ezgif.com-gif-maker.gif'
                                },
                                footer: {
                                    text: `${x} sur ${totalPage} pages • ${process.env.votesNumber} votes à atteindre`
                                }
                            }
                        })
                    }

                    if (reaction.emoji.name === "❌") {
                        return data.delete(data);
                    }

                    await reaction.users.remove(user)

                })
            }())
        }
    }

    try {

        if (message.channel.id !== process.env.channelGet) return;

        if (message.embeds.length > 0) {
            let embedContent = message.embeds[0].description;
            let memberId = embedContent.slice(2, 20);
            let memberUsername = embedContent.split('**')[1];
            let numberVotes = embedContent.split('`')[1];
            let profile = await sql.get('SELECT userId FROM users WHERE userId="' + memberId + '"');

            if (!profile) {
                await sql.run('INSERT INTO users (userId, userName, votes) VALUES (?, ?, ?)', [memberId, memberUsername, numberVotes]);
                await console.log(memberId + " INSERT " + numberVotes + " Votes ");
            } else {
                await sql.run('UPDATE users SET votes="' + numberVotes + '"WHERE userId = "' + memberId + '"');
                await console.log(memberId + " UPDATE " + numberVotes + " Votes");
            }
        }
    } catch(e) {
        console.log(e)
    }
})

client.login(process.env.token).catch(() => console.log("TOKEN INVALIDE !!"));
