// at the top of your file
const { MessageEmbed } = require("discord.js");

exports.helpEmbed = {
    color: 0x0099ff,
    title: "Command Categories",
    // description: "Some description here",
    fields: [
        {
            name: "Server",
            value: "Cho server. `server`",
        },
        {
            name: "User",
            value: "Cho user. `user`",
        },
        {
            name: "Time",
            value: "Liên quan đến thời gian. `sleep`",
        },
        {
            name: "\u200b",
            value: "\u200b",
            inline: false,
        },
    ],
    timestamp: new Date(),
};
