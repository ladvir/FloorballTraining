window.loadJavaScriptFile =(file) =>{
    var script = document.createElement('script');
    script.src = file;
    document.head.appendChild(script);
}


window.loadYoutubePlayerAPI = () => {
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
};

window.initYoutubePlayer = (id, videoId) => {
    let player = new YT.Player(id, {
        height: '360',
        width: '640',
        videoId: videoId,
        events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange
      }
    });
};

function loadVideo() {
  window.YT.ready(function() {
    new window.YT.Player("video", {
      height: "390",
      width: "640",
      videoId: "M7lc1UVf-VE",
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange
      }
    });
  });

  function onPlayerReady(event) {
    event.target.playVideo();
  }

  function onPlayerStateChange(event) {
    var videoStatuses = Object.entries(window.YT.PlayerState)
    console.log(videoStatuses.find(status => status[1] === event.data)[0])
  }
}

$(document).ready(function() {
  $.getScript("https://www.youtube.com/iframe_api", function() {
    loadVideo();
  });
});