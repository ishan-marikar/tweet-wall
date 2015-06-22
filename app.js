var express = require('express')
  , app = express()
  , http = require('http')
  , server = http.createServer(app)
  , Twit = require('twit')
  , io = require('socket.io').listen(server);

var port = process.env.PORT || 8080;
server.listen(port, function() {
    console.log('Our app is running on http://localhost:' + port);
});;

// Load the index page when the browser requests for the root directory
app.get('/', function (req, res) {
    console.log("Responding with index.html");
    res.sendFile(__dirname + "/index.html");
});

// Send the CSS when requested
app.get('/styles.css', function (req, res) {
    res.sendFile(__dirname + "/styles.css");
});

var twitter = new Twit({
    consumer_key        : "HQmu65XzfymaQJARIyIPZZcrm",
    consumer_secret     : "a6E5xMPpzRtvWtgXFymhv9oPZXxguqoKjjAZd6z4iaDU2kWkGL",
    access_token        : "3008318582-ojFc5pPIlwZlUqyMFdn41x2YQmaDBlSR24HUVC6",
    access_token_secret : "paGHQ4nB5sBxywWHRlgXBQe3Iez0mAnoN0jbxyBJvqC4G"
});

var watchList = ['#mnfh'];
var filter = {
    track: watchList,
    language: 'en',
}
io.sockets.on('connection', function (socket){
    var stream = twitter.stream('statuses/filter', filter);
    //var stream = twitter.stream('statuses/sample', {language: 'en'});

    stream.on('tweet', onTweet);
});

function onTweet (tweet) {
    // Makes a link the Tweet clickable
    var turl = tweet.text.match( /(http|https|ftp):\/\/[^\s]*/i )
    if ( turl != null ) {
      turl = tweet.text.replace( turl[0], '<a href="'+turl[0]+'" target="new">'+turl[0]+'</a>' );
    } else {
      turl = tweet.text;
    }

    var mediaUrl;
    // Does the Tweet have an image attached?

    if ( tweet.entities['media'] ) {
      if ( tweet.entities['media'][0].type == "photo" ) {
        mediaUrl = tweet.entities['media'][0].media_url;
      } else {
        mediaUrl = null;
      }
    }

    // Send the Tweet to the browser
    io.sockets.emit('stream',turl, tweet.user.screen_name, tweet.user.profile_image_url, mediaUrl);
}
