
import { Bot } from "grammy";

// Create an instance of the `Bot` class and pass your bot token to it.
const bot = new Bot(""); // <-- put your bot token between the ""




bot.on("message", async (ctx) => {
    const message = ctx.message; // the message object
    console.log("message: " + message.toString());
  });

exports.send


bot.start();