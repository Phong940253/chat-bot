// # SimpleServer
// A simple chat bot server

var logger = require("morgan");
var http = require("http");
var bodyParser = require("body-parser");
var express = require("express");
var request = require("request");
var router = express();

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
    res.send("Server chạy ngon lành.");
});

app.get("/webhook", (req, res) => {
    // Your verify token. Should be a random string.
    let VERIFY_TOKEN = "phong";

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
                    var text = message.message.text;
                    if (text == "hi" || text == "hello") {
                        sendMessage(senderId, "Phong's Bot: " + "Xin Chào");
                    } else {
                        sendMessage(
                            senderId,
                            "Phong's Bot: " +
                                "Xin lỗi, câu hỏi của bạn chưa có trong hệ thống, chúng tôi sẽ cập nhật sớm nhất."
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
            access_token:
                "EAAQSBpkubYEBABlMFfHHMSnGLkvRyPTLw0GpQgfPIsLMNkpmeRz6SZAZAQFSZB5oTUvGGwVOr1MBPJfPZAYaXSbDq0mVBgZBWsZB2jKovYwStS1GrjdaTA23d2QfX3OjflPdEZCrxWXnuO3x045xtYxKSEn0vBmBjhGpUhRmECYHvbDm5XY2QxI",
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
