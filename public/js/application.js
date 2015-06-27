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

/**
 * Runs everytime a new tweet is recieved
 * @param  {[type]} tweets The tweet
 */
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
    console.log(".. has tweets.");
  } else {
    jQuery(".container").append(render(context));
    console.log(".. no tweets");
  }
  new Audio("../etc/bell.mp3").play();
}
/**
 * Abstract function to render Handlebars templates
 * @param  {array} context Dictionary of values to be passed to the template
 * @return {string}        Returns the template with the provided values
 */
function render(context) {
  var theTemplateScript = jQuery("#tweet-template").html();
  var theTemplate = Handlebars.compile(theTemplateScript);
  var theCompiledHtml = theTemplate(context);
  console.log("Rendering content from template.");
  return theCompiledHtml;
}
/**
 * Check to see if the container element has children
 * @return {Boolean} True if yes, and False if no. But you should already know that.
 */
function hasTweets() {
  if (jQuery(".container").children().length > 0) {
    return true;
  } else {
    return false;
  }
}

/**
 * Appends class to every instance of a string
 * @param  {string} tweet   The text you want to input
 * @param  {string} hashtag The text you want to scan in the input
 * @return {string}         The modified output with the classes appened
 */
function highlightHashtag(tweet, hashtag) {
  var regEx = new RegExp(hashtag, "ig");
  var replaceMask = "<span class=\"highlight\">" + hashtag + "</span>";
  return tweet.replace(regEx, replaceMask);
}
