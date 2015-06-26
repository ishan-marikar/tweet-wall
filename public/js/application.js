var hashtag;
$(function() {
  var socket = io.connect();
  jQuery(window).load(function() {
    jQuery(".loader").fadeOut("slow");
  });

  jQuery(function() {
    jQuery("img").imgPreload();
  });

  jQuery(document).ready(function() {
    socket.on("tweets", newTweet);
    socket.on("hashtag", function(serverHashtag) {
      hashtag = serverHashtag.hashtag[0];
      jQuery('.background .smaller').text(hashtag);
      jQuery('.message .hash').text(hashtag);
    });
    if (!hasTweets()) {
      jQuery(".background").fadeIn();
    }
  });
});

function newTweet(tweets) {
  var context = {
    "avatar": tweets.user.image,
    "user": tweets.user.name,
    "screenname": tweets.user.screenname,
    "status": tweets.text,
    "image": tweets.media,
    "created": tweets.created_time
  };
  context.status = highlightHashtag(context.status, hashtag);
  jQuery('.background').fadeOut();
  if (hasTweets()) {
    jQuery(".container div:first").before(render(context));
    console.log(".. has tweets.")
  } else {
    jQuery(".container").append(render(context));
    console.log(".. no tweets")
  }
  new Audio("../etc/bell.mp3").play();
}

function render(context) {
  var theTemplateScript = jQuery("#tweet-template").html();
  var theTemplate = Handlebars.compile(theTemplateScript);
  var theCompiledHtml = theTemplate(context);
  console.log("Rendering content from template.")
  return theCompiledHtml;
}

function hasTweets() {
  if (jQuery(".container").children().length > 0) {
    return true;
  } else {
    return false;
  }
}

function highlightHashtag(tweet, hashtag) {
  var regEx = new RegExp(hashtag, "ig");
  var replaceMask = "<span class=\"highlight\">" + hashtag + "</span>";
  return tweet.replace(regEx, replaceMask);
}