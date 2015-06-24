var socket = io.connect();
var hashtag;

jQuery(window).load(function() {
  jQuery(".loader").fadeOut("slow");
});

jQuery(function(){ jQuery("img").imgPreload(); })

jQuery(document).ready(function() {
  socket.on("hashtag", function(serverHashtag){
    hashtag = serverHashtag.hashtag[0];
    jQuery('.background .smaller').html(hashtag);
  });
  socket.on("stream", newTweet);
  if( !hasTweets() ){
    jQuery(".background").fadeIn();
  }
});

function newTweet(tweets) {
    var context={
      "avatar": tweets.avatar,
      "status": tweets.tweet,
      "user"  : tweets.user,
      "image" : tweets.medias, 
      "created": tweets.created_time
    };
    context.status = highlightHashtag(context.status, hashtag);
    jQuery('.background').fadeOut();
    if ( hasTweets() ) {
      jQuery(".container div:first").before(render(context));
    } else {
      jQuery(".container").append(render(context));
    }
    new Audio("/bell.mp3").play();
}

function render(context){
    var theTemplateScript = jQuery("#tweet-template").html();
    var theTemplate = Handlebars.compile(theTemplateScript);
    var theCompiledHtml = theTemplate(context);
   return theCompiledHtml
}

function hasTweets(){
  if ( jQuery(".container").children().length > 0 ) {
    return true;
  } else {
    return false;
  }
}

function highlightHashtag(tweet, hashtag){
  var regEx = new RegExp(hashtag, "ig");
  var replaceMask = "<span class=\"highlight\">" + hashtag + "</span>";
  return tweet.replace(regEx, replaceMask);
}