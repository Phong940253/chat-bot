// # SimpleServer
// A simple chat bot server
const P = require("bluebird");
const fetch = require("node-fetch");
const TelegramBot = require("node-telegram-bot-api");
var logger = require("morgan");
var http = require("http");
var bodyParser = require("body-parser");
var express = require("express");
var request = require("request");
var path = require("path");
require("dotenv").config();
var router = express();
const slcount = require("./modules/sleepCounter/index.js");

// create bot telegram
const token = process.env.token_telegram;
const bot = new TelegramBot(token, { polling: true });

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
    fetch(url)
        .then((rep) => rep.json())
        .then((data) => {
            music_link = data[0].music.data[0].music_link;
            fetch(music_link)
                .then((rep) => rep.text())
                .then((data) => {
                    const rege = /sources: \[([\s\S]*)\],/gm;
                    const match = rege.exec(data);
                    const res = match[1].trim().slice(0, -1);
                    const object = eval("[" + res + "]");
                    const resp = object[0].file;
                    // console.log(object);
                    bot.sendMessage(chatId, resp);
                })
                .catch((e) => {
                    bot.sendMessage(
                        chatId,
                        "Lỗi hệ thống! Bot chỉ có thể search tới đây: "
                    );
                    bot.sendMessage(chatId, music_link);
                    pollinglikeV0(chatId);
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
    regex = /ngủ|ngu|sleep/;
    if (regex.test(text)) {
        const resp = slcount.sleepCounter();
        bot.sendMessage(chatId, resp);
        pollinglike(msg.chat.id);
    }
});

bot.on("polling_error", console.log);
