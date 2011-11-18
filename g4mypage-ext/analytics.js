var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-26977505-3']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

function trackButton(button_id) {
  _gaq.push(['_trackEvent', 'button' + button_id, 'clicked']);
}
