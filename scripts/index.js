/*
 * Simple getter that parses URL.prototype.search.
 * Caution: Does not protect against non-escaped characters in values.
 */
URL.prototype.__defineGetter__('query', function () {
    var parsed = this.search.substr(1).split('&');

    parsed.forEach(function (elem, iter, arr) {
        var vals = arr[iter].split('=');
        arr[iter] = {
            key: vals[0],
            value: vals[1]
        };
    });

    return parsed;
});

var gapiKey = 'AIzaSyDY-mJQlm2q0phHYI2IKSdfsd9DgLmd0zA';
var defaultPlaylist = 'http://youtube.com/playlist?list=PLJ3mf0rLtWzWRMImCWvzt4K9ppGbb70Y2';
var currentPlaylist = null;
var seededChance = null;
var playListItemsUrl = 'https://www.googleapis.com/youtube/v3/playlistItems';
var playListItemsOptions = {
    part: 'snippet',
    maxResults: 50,
    playlistId: '',
    fields: 'pageInfo,items/snippet/title,items/snippet/resourceId/videoId,nextPageToken,prevPageToken',
    key: gapiKey
};
toastr.options = {
    closeButton: false,
    debug: false,
    newestOnTop: false,
    progressBar: false,
    positionClass: 'toast-top-right',
    preventDuplicates: false,
    onclick: null,
    showDuration: '300',
    ideDuration: '1000',
    timeOut: '2000',
    extendedTimeOut: '1000',
    showEasing: 'swing',
    hideEasing: 'linear',
    showMethod: 'fadeIn',
    hideMethod: 'fadeOut'
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
}

function handlePlaylistResponseAutoPlay(resp) {
    handlePlaylistResponse(resp);

    if (playListItemsOptions.pageToken) {
        $.get(playListItemsUrl, playListItemsOptions)
            .done(handlePlaylistResponseAutoPlay);
    }
    else {
        var firstToBePlayed = seededChance.pick(items);
        $('#title').text(firstToBePlayed.vidTitle);
        player.loadVideoById(firstToBePlayed.vidId, 0, 'medium');
        player.playVideo();
    }
}

function handlePlaylistResponsePaused(resp) {
    handlePlaylistResponse(resp);

    if (playListItemsOptions.pageToken) {
        $.get(playListItemsUrl, playListItemsOptions)
            .done(handlePlaylistResponsePaused);
    }
    else {
        var firstToBePlayed = seededChance.pick(items);
        $('#title').text(firstToBePlayed.vidTitle);
        player.loadVideoById(firstToBePlayed.vidId, 0, 'medium');
        player.pauseVideo();
    }
}

function loadDefaultPlaylist() {
    $('#playlistUrl').val(defaultPlaylist);
}

function playVideo(playlistId, responseHandler) {
    playListItemsOptions.playlistId = playlistId;
    $.get(playListItemsUrl, playListItemsOptions)
        .done(responseHandler);
}

function findPlaylistId(element, index, array) {
    return element.key === 'list';
}

function changePlayButtonToPaused($button) {
    $button.find('i').attr('class', 'fa fa-pause-circle fa-2x fa-fw');
    $button.data('state', 'playing');
}

function changePlayButtonToPlaying($button) {
    $button.find('i').attr('class', 'fa fa-play-circle fa-2x fa-fw');
    $button.data('state', 'paused');
}
function playerOnErrorHandler(event) {
    toastr["error"]("Video cannot be played as embedded! Shuffling!");
        playNext();
}

function playerOnStateChangeHandler(state) {
    if (state == YT.PlayerState.ENDED) {
        playNext();
    }
}

function playNext() {
    $('#playpause>i').attr('class', 'fa fa-pause-circle fa-2x fa-fw');
    $('#playpause').data('state', 'playing');

    var nextVideo = seededChance.pick(items);

    player.loadVideoById(nextVideo.vidId, 0, 'medium');
    $('#title').text(nextVideo.vidTitle);
}

function debugMode(flag) {
    if (flag) {
        $('#compress').show();
        $('#expand').show();
    }
    else {
        $('#compress').hide();
        $('#expand').hide();
    }
}

$(function () {
    var mySeed;
    $.get("https://www.random.org/integers/", { num: "1", col: "1", min: "1", max: "1000000000", base: "10", format: "plain", rnd: "new" }, function (randNum) {
        mySeed = randNum;

        // Instantiate Chance with this truly random number as the seed
        seededChance = new Chance(mySeed);
    });

    $("#playlistUrl").focus(function () { $(this).select(); });

    $('#playpause').click(function () {
        var state = $(this).data('state');
        var playlistUrl = new URL($('#playlistUrl').val());
        if (state == 'playing') {
            changePlayButtonToPlaying($(this));
            player.pauseVideo();
        }
        else if (playlistUrl.hostname.toLowerCase().endsWith('youtube.com') &&
            playlistUrl.pathname.toLowerCase().endsWith('playlist')) {

            var playlistId = playlistUrl.query.find(findPlaylistId).value;

            if (playlistId &&
                playListItemsOptions.playlistId != playlistId) {
                playListItemsOptions.playlistId = playlistId;

                items.length = 0; // clear the list of videos
                playVideo(playlistId, handlePlaylistResponseAutoPlay);
                changePlayButtonToPaused($(this));
            }
            else {
                if (state == 'paused') {
                    changePlayButtonToPaused($(this));
                    player.playVideo();
                }
                else {
                    changePlayButtonToPlaying($(this));
                    player.pauseVideo();
                }
            }
        }
        else {
            toastr["error"]("Youtube Playlist URL invalid!");
        }
    });

    $('#next').click(function () {
        playNext();
    });

    $('#expand').click(function () {
        $('#player').attr('width', 320);
        $('#player').attr('height', 180);
    });

    $('#compress').click(function () {
        $('#player').attr('width', 0);
        $('#player').attr('height', 0);
    });

});