var express = require('express')
  , app = express()
  , http = require('http')
  , server = http.createServer(app)
  , Twit = require('twit')
  , io = require('socket.io').listen(server)
  , moment = require('moment');

// GLOBAL VARIABLES
var port = process.env.PORT || 8080;
var watchList = ['#justFishyThings'];
var allTweets = [];
var filter = {
    track: watchList,
    language: 'en',
}

server.listen(port, function() {
    console.log('Our app is running on http://localhost:' + port);
    console.log('Monitoring for ' + watchList);
});

app.use('/', express.static('public'));

io.sockets.on('connect', function (socket){
    console.log('Client '+ socket.id +' has connected');
    io.sockets.connected[socket.id].emit('hashtag', { hashtag: watchList });
    for (var i = allTweets.length - 1; i >= 0; i--) {
        io.sockets.connected[socket.id].emit('stream', allTweets[i]);
    }
    var stream = twitter.stream('statuses/filter', filter);
    //var stream = twitter.stream('statuses/sample', {language: 'en'});
    stream.on('tweet', onTweet);
})

var twitter = new Twit({
    consumer_key        : "HQmu65XzfymaQJARIyIPZZcrm",
    consumer_secret     : "a6E5xMPpzRtvWtgXFymhv9oPZXxguqoKjjAZd6z4iaDU2kWkGL",
    access_token        : "3008318582-ojFc5pPIlwZlUqyMFdn41x2YQmaDBlSR24HUVC6",
    access_token_secret : "paGHQ4nB5sBxywWHRlgXBQe3Iez0mAnoN0jbxyBJvqC4G"
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
    if ( tweet.entities['media'] ) {
        mediaUrl = tweet.entities['media'][0].media_url;
    } else {
        mediaUrl = null;
    }
    // Wed Jun 24 14:03:12 +0000 2015
    var date = moment( new Date(tweet.created_at) ).format();

    var currentTweet = {
      tweet :turl,
      user: tweet.user.screen_name,
      avatar: tweet.user.profile_image_url,
      medias: mediaUrl,
      created_time: date
    }
    console.log(currentTweet);
    if(currentTweet != allTweets[ allTweets.length - 1 ]){
      allTweets.push(currentTweet);
      io.sockets.emit('stream', currentTweet);
    }
}


