// var paceOptions = {
//   ajax: true, // disabled
//   document: true, // disabled
//   eventLag: false // disabled
// };

var gapiKey = 'AIzaSyDY-mJQlm2q0phHYI2IKSdfsd9DgLmd0zA';
var playListItemsUrl = 'https://www.googleapis.com/youtube/v3/playlistItems';
var playListItemsOptions = {
    part: 'snippet',
    maxResults: 50,
    playlistId: '',
    fields: 'pageInfo,items/snippet/title,items/snippet/resourceId/videoId,nextPageToken,prevPageToken',
    key: gapiKey
};

var items = [];

function handlePlaylistResponse(resp) {
    resp.items.forEach(function (element, index, array) {
        var videoId = element.snippet.resourceId.videoId;
        var title = element.snippet.title;

        var songItem = {
            vidId: videoId,
            vidTitle: title
        }

        items.push(songItem);
    });

    playListItemsOptions.pageToken = resp.nextPageToken;

    if (playListItemsOptions.pageToken) {
        $.get(playListItemsUrl, playListItemsOptions)
            .done(handlePlaylistResponse);
    }
    else {
        
        var firstToBePlayed = chance.pick(items);
        $('#title').text(firstToBePlayed.vidTitle);
        player.loadVideoById(firstToBePlayed.vidId, 10, 'medium');
        player.pauseVideo();
    }
}


$(function () {
    $('#loadButton').click(function () {
        var playlistId = $('#playlistId').val();
        playListItemsOptions.playlistId = playlistId;
        // gapi.client.youtube.playlistItems.list(playListItemsOptions)
        //     .then(function (resp) {

        //     });
        
        $.get(playListItemsUrl, playListItemsOptions)
            .done(handlePlaylistResponse);
    });

    $('#playpause').click(function () {
        var state = $(this).data('state');
        if (state == 'paused') {
            $(this).find('i').attr('class', 'fa fa-pause-circle fa-2x fa-fw');
            $(this).data('state', 'playing');

            player.playVideo();
        }
        else {
            $(this).find('i').attr('class', 'fa fa-play-circle fa-2x fa-fw');
            $(this).data('state', 'paused');

            player.pauseVideo();
        }
    });

    $('#next').click(function () {
        $('#playpause>i').attr('class', 'fa fa-pause-circle fa-2x fa-fw');
        $('#playpause').data('state', 'playing');
        
        var nextVideo = chance.pick(items);
        
        player.loadVideoById(nextVideo.vidId, 10, 'medium');
        $('#title').text(nextVideo.vidTitle);
    });

});

// function handleClientLoad() {
//     gapi.client.setApiKey(apiKey);
//     gapi.client.load('youtube', 'v3')
//         .then(function () {
//             console.log('Youtube API loaded.');
//         });
// }

// function 