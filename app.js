var Twit    = require("twit");
var Moment  = require("moment");
var express = require("express");
var socket  = require("socket.io");
//require('dotenv').load()
var twitterConnection = require("./secret");

// Global Variables
var tweetsBuffer       = [];
var currentOpenSockets = 0;
var filteredTweets     = true;
var port               = process.env.PORT || 8080;

var app    = express();
var server = app.listen(port);
var io     = socket.listen(server);

app.use('/', express.static('public'));
console.log("[*] Listening on " + port);

// -------------------------------- TWITTER ---------------------------------

// Tweet filter
var watchList = ["#mnfh"];
var filter    = {
    language: "en",
};

// Twitter Streaming API keys
var twitter = twitterConnection.twitter;

var namespace;
if (!filteredTweets) {
    namespace = "statuses/sample";
} else {
    namespace = "statuses/filter";
    filter.track = watchList;
}

var stream = twitter.stream(namespace, filter);

// Twitter Events
stream.on("connect", function(connect) {
    console.log("[*] Connected to the Twitter Streaming API ..");
});

stream.on("disconnect", function(message) {
    console.log("[!] Disconnected from Twitter ..");
    console.log("\tReason: " + message);
});

stream.on("reconnect", function(request, response, connectInterval) {
    console.log("[!] Trying to reconnect ..");
});/**/

stream.on("tweet", onTweet);

/**
 * This method is a callback for whenever a new tweet is recieved.
 */
function onTweet(tweet) {

    // Make the links in the tweet click-able
    text = tweet.text.match(/(http|https|ftp):\/\/[^\s]*/i);
    if (text !== null) {
        tweet.text = tweet.text.replace(
            text[0],
            "<a href=\"" + text[0] + "\" target=\"_blank\">" + text[0] + "</a>"
        );
    }

    // Convert Date/time to ISO 8601 compliant string
    var date = Moment(
        new Date(
            tweet.created_at
        )
    ).format();
    // Extract the first image in a tweet, if it exists
    if (tweet.entities.media) {
        media = tweet.entities.media[0].media_url;
    } else {
        media = null;
    }

    // Remove _normal from the filename of the image to get the hi-res version
    tweet.user.profile_image_url = tweet.user.profile_image_url.replace("_normal", "");
    
    // Create a dictionary with the information that we need to send to the frontend
    var message = {
        text: tweet.text,
        user: {
            name: tweet.user.name,
            screenname: tweet.user.screen_name,
            image: tweet.user.profile_image_url
        },
        media: media,
        created_time: date
    };

    // Trying to "peek()" into the array. Not really all that elegant. I know.
    if( message !== tweetsBuffer[tweetsBuffer.length - tweetsBuffer.length]){
        console.log(message);
        tweetsBuffer.unshift(message);
        io.sockets.emit("tweets", message);
    }
}

// --------------------------------- SOCKET ------------------------------------
// Upoun connection increment the current currentOpenSockets variable and start
// the twitter stream. Upoun disconnection, decrement the currentOpenSockets
// variable and close the stream IF we have no more currently open sockets.
io.sockets.on("connection", function(socket){
    console.log("[*] Client " + socket.id + " has connected");
    if (currentOpenSockets <= 0) {
        currentOpenSockets = 0;
        console.log("\tFirst active client. Start Twitter stream");
        stream.start();
    }

    currentOpenSockets++;

    socket.on("disconnect", function() {
        console.log("[!] Client " + socket.id + " has disconnected");
        currentOpenSockets--;

        if (currentOpenSockets <= 0) {
            currentOpenSockets = 0;
            console.log("[*] No clients connected. Closing Twitter stream.");
            stream.stop();
        }
    });

    // We send the hashtag in our watchlist to the the frontend, so we we have
    // very few places to change the watchlist when we have to.
    io.sockets.connected[socket.id].emit('hashtag', {
        hashtag: watchList
    });
    // Upoun connection, we send all the tweets we've already stored to the
    // client that specifically connected.
    for (var i = tweetsBuffer.length - 1; i >= 0; i--) {
        io.sockets.connected[socket.id].emit('tweets', tweetsBuffer[i]);
    }
});
