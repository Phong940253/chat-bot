// # SimpleServer
// A simple chat bot server
const P = require("bluebird");
const fetch = require("node-fetch");
const fs = require("fs");
const TelegramBot = require("node-telegram-bot-api");
var logger = require("morgan");
var http = require("http");
var bodyParser = require("body-parser");
var express = require("express");
var request = require("request");
var path = require("path");
var router = express();
const slcount = require("./modules/sleepCounter/index.js");
const embed = require("./discord/embed.js");
const pokemonModel = require("./model");
const csv = require("fast-csv");
const schedule = require("node-schedule");

require("dotenv").config();

// lib discord
const Discord = require("discord.js");
const client = new Discord.Client({
    intents: [
        "GUILDS",
        "GUILD_MESSAGES",
        "GUILD_MEMBERS",
        "GUILD_MESSAGE_REACTIONS",
    ],
});

//BOT FACEBOOK
var app = express();
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: false,
    })
);
var server = http.createServer(app);
app.listen(process.env.PORT || 3000);

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname + "/index.html"));
});

app.use(express.static("public"));

// verify webhook facebook
app.get("/webhook", (req, res) => {
    // Your verify token. Should be a random string.
    let VERIFY_TOKEN = process.env.verify_token;

    // Parse the query params
    let mode = req.query["hub.mode"];
    let token = req.query["hub.verify_token"];
    let challenge = req.query["hub.challenge"];

    // Checks if a token and mode is in the query string of the request
    if (mode && token) {
        // Checks the mode and token sent is correct
        if (mode === "subscribe" && token === VERIFY_TOKEN) {
            // Responds with the challenge token from the request
            console.log("WEBHOOK_VERIFIED");
            res.status(200).send(challenge);
        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            // console.log(token, VERIFY_TOKEN);
            res.sendStatus(403);
        }
    }
});

// Đoạn code xử lý khi có người nhắn tin cho bot
app.post("/webhook", function (req, res) {
    var entries = req.body.entry;
    for (var entry of entries) {
        var messaging = entry.messaging;
        for (var message of messaging) {
            var senderId = message.sender.id;
            if (message.message) {
                // Nếu người dùng gửi tin nhắn đến
                if (message.message.text) {
                    var text = message.message.text.toLowerCase();
                    if (text == "hi" || text == "hello") {
                        sendMessage(senderId, "Xin Chào");
                    } else if (text == "ngủ") {
                        let res = slcount.sleepCounter();
                        sendMessage(senderId, res);
                        // console.log("sended", " ", senderId, " ", res);
                    } else {
                        sendMessage(
                            senderId,
                            "Xin lỗi, câu hỏi của bạn chưa có trong hệ thống, bot sẽ cập nhật sớm nhất."
                        );
                    }
                }
            }
        }
    }

    res.status(200).send("OK");
});

// Gửi thông tin tới REST API để Bot tự trả lời
function sendMessage(senderId, message) {
    request({
        url: "https://graph.facebook.com/v2.6/me/messages",
        qs: {
            access_token: process.env.access_token_mess,
        },
        method: "POST",
        json: {
            recipient: {
                id: senderId,
            },
            message: {
                text: message,
            },
        },
    });
}
//------------------------------------------------------------------

// BOT TELEGRAM
const token = process.env.token_telegram;
const url = process.env.APP_URL;
const bot = new TelegramBot(token, { polling: true });
bot.setWebHook(url + "/bot" + token);

pollinglike = (id) => {
    const question = "Bạn cảm thấy thích tui chứ?!";
    const answers = ["Thích ơi là thích", "Chẳng thèm"];
    const opts = {
        is_anonymous: true,
    };
    bot.sendPoll(id, question, answers, opts);
};

pollinglikeV0 = (id) => {
    const question = "Hãy cho BOT biết cảm nhận của bạn nha!";
    const answers = ["Hài lòng", "Chưa vừa ý"];
    const opts = {
        is_anonymous: true,
    };
    bot.sendPoll(id, question, answers, opts);
};

// Main command

// echo
bot.onText(/\/echo (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const resp = match[1];
    bot.sendMessage(chatId, resp);
});

//audio
bot.onText(/\/audio (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const search = match[1];
    let url = new URL("https://chiasenhac.vn/search/real?");
    let params = {
        q: search,
        type: "json",
        rows: 1,
        view_all: true,
    };
    url.search = new URLSearchParams(params).toString();
    // console.log(url);
    let music_link;
    let html;
    let match_rege;
    fetch(url, { method: "GET", credentials: "same-origin" })
        .then((rep) => rep.json())
        .then((data) => {
            music_link = data[0].music.data[0].music_link;
            fetch(music_link, { method: "GET", credentials: "same-origin" })
                .then((rep) => rep.text())
                .then((data) => {
                    html = data;
                    const rege = /sources: \[([\s\S]*)\],/gm;
                    const match = rege.exec(data);
                    match_rege = match;
                    const res = match[1].trim().slice(0, -1);
                    const object = eval("[" + res + "]");
                    const resp = object[1].file;
                    // console.log(object);
                    bot.sendMessage(chatId, resp).then(() => {
                        pollinglikeV0(chatId);
                    });
                })
                .catch((e) => {
                    console.log(html);
                    bot.sendMessage(
                        chatId,
                        "Lỗi hệ thống! BOT chỉ có thể search tới đây: "
                    ).then(() => {
                        bot.sendMessage(chatId, music_link).then(() => {
                            pollinglikeV0(chatId);
                        });
                    });
                });
        });
});

bot.onText(
    /(?:(?:wake)|(?:day)|(?:dậy)) ([01]?\d|2[0-3])(?:[:h]([0-5]\d)){1,2}/gi,
    (msg, match) => {
        const chatId = msg.chat.id;
        const resp = slcount.wakeCounter(match);
        bot.sendMessage(chatId, resp);
        pollinglike(chatId);
    }
);

bot.on("message", (msg) => {
    const chatId = msg.chat.id;
    text = msg.text.toLowerCase();
    regex = /^ngủ|ngu|sleep/;
    if (regex.test(text)) {
        const resp = slcount.sleepCounter();
        bot.sendMessage(chatId, resp);
        pollinglike(msg.chat.id);
    }
});

bot.on("polling_error", console.log);
//-----------------------------------------------------------------------

client.on("ready", () => {
    console.log(`Logged in bot discord...`);
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;
    const { commandName } = interaction;
    if (commandName === "ping") {
        await interaction.reply("Pong!");
    } else if (commandName === "server") {
        await interaction.reply(
            `Server name: ${interaction.guild.name}\nTotal members: ${interaction.guild.memberCount}`
        );
    } else if (commandName === "user") {
        await interaction.reply(
            `Your tag: ${interaction.user.tag}\nYour id: ${interaction.user.id}`
        );
    }
});

const prefix = process.env.PREFIX;
const model = pokemonModel.model;

//common commands
client.on("messageCreate", async (message) => {
    console.log(message.author.id);
    if (message.author.id == "716390085896962058") {
        // console.log("get message");
        if (
            typeof message.embeds[0] != "undefined" &&
            typeof message.embeds[0].image != "undefined" &&
            message.embeds[0].image != null
        ) {
            message.channel.send("Predicting pokemon...");
            imgUrl = message.embeds[0].image.url;
            let imagebase64 = await pokemonModel.getBase64(imgUrl);
            let imageBuffer = await pokemonModel.convertDataURIToBinary(
                imagebase64
            );
            // console.log(imageBuffer);
            let tensor = await pokemonModel.convertImage(imageBuffer);
            model.then((model) => {
                // console.log(tensor.print());
                let predict = model.predict(tensor);
                const top3 = pokemonModel.topk(predict, 3);
                const topV = top3["values"].arraySync()[0];
                const topI = top3["indices"].arraySync()[0];
                let name = [
                    className[topI[0]]["name.en"],
                    className[topI[1]]["name.en"],
                    className[topI[2]]["name.en"],
                ];
                message.channel.send(
                    `This is pokemon ${name[0]}: ${
                        Math.round(topV[0] * 10000) / 100
                    }%, or ${name[1]}: ${
                        Math.round(topV[1] * 10000) / 100
                    }%, or ${name[2]}: ${Math.round(topV[2] * 10000) / 100}%`
                );
                topV.map((u, v) => {
                    message.channel.send(`%c ${name[v]}`);
                });
            });
        }
    }
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;
    // get channel id and command out of message
    const commandBody = message.content.slice(prefix.length);
    const args = commandBody.split(" ");
    const command = args.shift().toLowerCase();
    let wakeCommand = /([01]+\d|2[0-3]|\d)(?:[:h]([0-5]\d)){0,2}/i;
    // ping command
    if (command === "ping")
        await message.channel.send(`Pong! ${message.client.ws.ping}ms.`);
    // server command
    else if (command === "server")
        await message.channel.send(
            `Server name: ${message.guild.name}\nTotal members: ${message.guild.memberCount}`
        );
    // user command
    else if (command === "user")
        await message.channel.send(
            `Your tag: ${message.author.tag}\nYour id: ${message.author.id}`
        );
    // help command
    else if (command === "help")
        await message.channel.send({ embeds: [embed.helpEmbed] });
    // sleep command
    else if (command === "sleep" || command === "ngủ") {
        await message.channel.send(slcount.sleepCounter());
    }
    //wake command
    else if (command === "wake" || command === "dậy" || command === "thức") {
        if (
            wakeCommand.test(args.join("")) &&
            parseInt(args[0].substring(0, 2)) < 24
        ) {
            // console.log(args);
            match = args.join("").match(wakeCommand);
            // console.log(match);
            await message.channel.send(slcount.wakeCounter(match));
        } else {
            // console.log(args);
            await message.channel.send("Lỗi cú pháp!");
        }
        // await message.channel.send(args);
        // match = wakeCommand.match(command);
        // await message.channel.send(slcount.wakeCounter(match));
    }
});

client.login(process.env.TOKEN_BOT_DISCORD);

const className = [];
fs.createReadStream(path.resolve(__dirname, "pokemon.csv"))
    .pipe(csv.parse({ headers: true }))
    .on("error", (error) => console.error(error))
    .on("data", (row) => className.push(row))
    .on("end", (rowCount) => {
        className.sort((a, b) => (a.id > b.id && 1) || -1);
    });

const job = schedule.scheduleJob("0 7 * * *", async () => {
    channel = guild.channels.get("854362046262411279");
    await message.channel.send(`Dậy sớm để thành công!`);
});
