// 宣告全域變數
songList = [];
// 初始化播放器
const ap = new APlayer({
    container: document.getElementById('aplayer'),
    fixed: true
});
ap.on("play", function() {
    //沒歌就隨機播放
    if (ap.list.audios.length == 0) play_random();
    updateMediaSession()
})
ap.on("timeupdate", function() {
    var name = ap.list.audios[ap.list.index].name || ""
    var artist = ap.list.audios[ap.list.index].artist || ""

    var img = window.localStorage["imgRes"] != "true" ? ap.list.audios[ap.list.index].cover : "/og/og.png" //一定會有圖片
    $('#player button.play[onclick="ap.toggle()"] i').text("pause")
    if (name != $('#player .song-info .name').text()) { //歌名有變才更新
        $('#player .song-info .name').text(name)
        $('#player .song-info .artist').text(artist)
        $('#player img').attr('src', img)
    }
    updateMediaSession()
})
ap.on("pause", function() {
    $('#player button.play[onclick="ap.toggle()"] i').text("play_arrow")
})

function updateMediaSession() {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: $('#player .song-info .name').text(),
            artist: $('#player .song-info .artist').text(),
            artwork: [{ src: $('#player img').attr('src'), type: 'image/png' }]
        });
        navigator.mediaSession.setActionHandler('play', function() { ap.toggle() });
        navigator.mediaSession.setActionHandler('pause', function() { ap.pause() });
        navigator.mediaSession.setActionHandler('seekbackward', function() { ap.seek(ap.audio.currentTime - 10) });
        navigator.mediaSession.setActionHandler('seekforward', function() { ap.seek(ap.audio.currentTime + 10) });
        navigator.mediaSession.setActionHandler('previoustrack', function() { ap.skipBack() });
        navigator.mediaSession.setActionHandler('nexttrack', function() { ap.skipForward() });
    }
}
// 初始化網頁
$(function() {
    show_home()
    $('[data-link]').click(function() {
        $('[data-link]').removeClass('mdui-list-item-active')
        $(this).addClass('mdui-list-item-active')
        $("#player").removeClass('hide')
    })
    if ($(window).width() < 1024) {
        $('[data-link]').attr("mdui-drawer", "{target: '#drawer', swipe: true}")
        mdui.mutation()
    }

    $('[data-link="home"]').click(function() { show_home() })
    $('[data-link="search"]').click(function() { show_search() })
    $('[data-link="album"]').click(function() { show_album() })
    $('[data-link="recentlyAlbum"]').click(function() { show_recentlyAlbum() })
    $('[data-link="folder"]').click(function() { show_folder() })
    $('[data-link="artist"]').click(function() { show_artist() })
    $('[data-link="composer"]').click(function() { show_composer() })
    $('[data-link="random"]').click(function() { show_random() })
    $('[data-link="now"]').click(function() { show_now() })
    $('[data-link="lrc"]').click(function() { show_lrc() })
    $('[data-link="settings"]').click(function() { show_settings() })

    $('#player>*:not(.ctrl)').click(function() {
        show_now()
    });
    //圖片讀取錯誤
    $("img").on('error', function() { tryRelogin() }).attr('src', "/img/PokaPlayer.png");
    //返回攔截
    /* window.history.pushState(null, null, "#");
     window.addEventListener("popstate", function(e) {
         //show_album()
         window.history.pushState(null, null, "#");
         mdui.snackbar({
             message: "點擊返回"
         });
     })*/
    // 初始化 MediaSession
    updateMediaSession()
});

var count = 0

function tryRelogin() {
    if (window.localStorage["userPASS"] || count <= 10) { //如果有存到密碼或是嘗試次數少於 10 次就嘗試登入
        $.post("/login/", { userPASS: window.localStorage["userPASS"] }, function(data) {
            if (data == 'success') {
                count = 0
                    //mdui.snackbar({ message: 'Session 過期，重新登入成功', timeout: 1000 });
            } else {
                mdui.snackbar({ message: 'Session 過期，請重新登入', timeout: 1000 });
                document.location.href = "/login/";
            }
        });
    } else if (count > 10) {
        mdui.snackbar({ message: '發生了未知錯誤', timeout: 1000 });
    }
}
//-- 加解密
function pp_encode(str) {
    return encodeURIComponent(base64.encode(str))
}

function pp_decode(str) {
    return decodeURIComponent(base64.decode(str))
}
//-- 秒數轉時間
function secondToTime(second) {
    let MM = Math.floor(second / 60)
    let SS = Math.floor(second % 60)
    SS = SS < 10 ? '0' + SS : SS
    return MM + ":" + SS
}

//-- 常用 HTML
function HTML_getHeader(title) {
    return `<div class="mdui-container-fluid mdui-valign mdui-typo mdui-color-theme" style="padding: 0 30px;min-height: 150px;background-image:url(/og/og.png);background-size: cover;" id="header-wrapper">
    <h1 class="mdui-center mdui-text-color-white" style="
    text-shadow: 0 1px 8px #000000ad;">${title}</h1>
</div>`
}

function HTML_getSpinner() {
    return `<div class="mdui-spinner mdui-spinner-colorful mdui-center" style="margin-top:80px"></div>`
}

function HTML_showPins(items) {
    //var album = '<div class="mdui-row-md-4 mdui-row-sm-3 mdui-row-xs-2">'
    var html = '<div class="albums">'
    for (i = 0; i < items.length; i++) {　
        let pin = items[i]
        var title = pin.name
        var type = pin.type
        switch (type) {
            case "artist":
                //演出者
                var img = getCover(type, pin.criteria.artist)
                var title = pin.name
                var subtitle = '演出者'
                var onclickActions = `show_artist('${pin.criteria.artist}')`
                break;
            case "composer":
                //作曲者
                var img = getCover(type, pin.criteria.composer)
                var title = pin.name
                var subtitle = '作曲者'
                var onclickActions = `show_composer('${pin.criteria.composer}')`
                break;
            case "genre":
                //作曲者
                var img = getCover(type, pin.criteria.genre)
                var title = pin.name
                var subtitle = '類型'
                var onclickActions = `mdui.snackbar({message: '沒打算做喔，不過資料都給了就給你看一下啦',position:'top',timeout:500});`
                break;
            case "folder":
                //資料夾
                var img = getCover(type, pin.criteria.folder)
                var title = pin.name
                var subtitle = '資料夾'
                var onclickActions = `show_folder('${pin.criteria.folder}')`
                break;
            case "album":
                //專輯
                var artist = pin.criteria.artist || pin.criteria.album_artist || ''
                var album_artist = pin.criteria.album_artist || ''
                var name = pin.criteria.album || '';
                // 輸出資料
                var img = getAlbumCover(name, album_artist, artist)
                var title = name
                var subtitle = artist
                var onclickActions = `show_album_songs('${artist}','${name}','${album_artist}')`
                break;
        }
        //await getAlbumSong(albumData.criteria.album, albumData.criteria.album_artist, albumData.criteria.artist)
        html += `<div class="mdui-card mdui-ripple mdui-hoverable album" onclick="${onclickActions}" style="background-image:url(${img});" title="${title} - ${subtitle}">
                <div class="mdui-card-media">
                    <div class="mdui-card-media-covered mdui-card-media-covered-gradient">
                        <div class="mdui-card-primary">
                        <div class="mdui-card-primary-title">${title}</div>
                        <div class="mdui-card-primary-subtitle">${subtitle}</div>
                        </div>
                    </div>
                </div>
            </div>`
    }
    html += "</div>"
    return html
}

function HTML_showFolder(items) {
    songList = items;
    var html = `<ul class="mdui-list">`
    for (i = 0; i < items.length; i++) {　
        let item = items[i]
        let type = item.type
        let title = item.title
        let id = item.id
        let icon = type == "folder" ? "folder" : type == "file" ? "music_note" : "help"
        if (type == "file") {
            let codec = item.additional.song_audio.codec.toUpperCase()
            let bitrate = item.additional.song_audio.bitrate / 1000 + 'K'
            let size = Math.round(item.additional.song_audio.filesize / 100000) / 10 + 'MB'
            let filedetail = codec + " " + bitrate + " " + size
            let artist = item.additional.song_tag.artist
            let album_artist = item.additional.song_tag.album_artist
            let album_album = item.additional.song_tag.album
            let img = window.localStorage["imgRes"] == "true" ? '' : `<div class="mdui-list-item-avatar"><img src="${getCover("song", item.id)}"/></div>`
            let subtitle = ''
            subtitle += artist ? artist : ''
            subtitle += album_album ? (artist ? ' / ' + album_album : album_album) : ''

            html += `<li class="mdui-list-item mdui-ripple">
            ${img}
            <div class="mdui-list-item-content" onclick="playSongs(songList,'${id}')">
                <div class="mdui-list-item-title">${title}</div>
                <div class="mdui-list-item-text">${subtitle}</div>
                <div class="mdui-list-item-text">${filedetail}</div>
            </div>
            <button class="mdui-btn mdui-btn-icon mdui-ripple add" onclick="addSong(songList,'${id}')"><i class="mdui-icon material-icons">add</i></button>
        </li>`
        } else {
            html += `<li class="mdui-list-item mdui-ripple" onclick="show_folder('${id}')">
            <i class="mdui-list-item-avatar mdui-icon material-icons">${icon}</i>
            <div class="mdui-list-item-content">${title}</div>
        </li>`
        }
    }
    html += `</ul>`
    return html
}

function HTML_showAlbums(items) {
    //var album = '<div class="mdui-row-md-4 mdui-row-sm-3 mdui-row-xs-2">'
    var album = '<div class="albums">'
    for (i = 0; i < items.length; i++) {　
        let albumData = items[i]
        var artist = albumData.album_artist || albumData.display_artist || ''
        var album_artist = albumData.album_artist || ''
        var name = albumData.name || ''
        var img = getAlbumCover(name, album_artist, artist)
        if (albumData.criteria) {
            var artist = artist || albumData.criteria.artist || albumData.criteria.album_artist || '未知'
            var album_artist = album_artist || albumData.criteria.album_artist || ''
            var name = name || albumData.criteria.album || ''
        }
        //await getAlbumSong(albumData.criteria.album, albumData.criteria.album_artist, albumData.criteria.artist)
        album += `<div  class="mdui-card mdui-ripple mdui-hoverable album" 
                        onclick="show_album_songs('${artist}','${name}','${album_artist}')"  
                        style="background-image:url(${img});"
                        title="${name}${artist ? ' / ' + artist : ''}">
                <div class="mdui-card-media">
                    <div class="mdui-card-media-covered mdui-card-media-covered-gradient">
                        <div class="mdui-card-primary">
                        <div class="mdui-card-primary-title mdui-text-truncate">${name}</div>
                        <div class="mdui-card-primary-subtitle mdui-text-truncate">${artist}</div>
                        </div>
                    </div>
                </div>
            </div>`
    }
    album += "</div>"
    return album
}

function HTML_showSongs(songs) {
    songList = songs
    var html = `<div class="songs"><div class="mdui-row-xs-1 mdui-row-sm-2 mdui-row-md-3 mdui-row-lg-4">`
    for (i = 0; i < songs.length; i++) {
        let song = songs[i]
        let title = song.title
        let artist = song.additional.song_tag.artist
        let album_artist = song.additional.song_tag.album_artist
        let album = song.additional.song_tag.album
        let img = window.localStorage["imgRes"] == "true" ? '' : `<div class="mdui-list-item-avatar"><img src="${ getAlbumCover(album, album_artist, artist)}"/></div>`
        html += `<div class="mdui-col"><li class="mdui-list-item mdui-ripple">
            ${img}
            <div class="mdui-list-item-content" onclick="playSongs(songList,'${song.id}');show_now()" title="${title}${artist?' / '+artist:''}">
                <div class="mdui-list-item-title mdui-list-item-one-line">${title}</div>
                <div class="mdui-list-item-text mdui-list-item-one-line">${artist}</div>
            </div>
            <button class="mdui-btn mdui-btn-icon mdui-ripple add" onclick="addSong(songList,'${song.id}')" title="加入這首歌曲到現正播放">
                <i class="mdui-icon material-icons">add</i>
            </button>
        </li></div>`　
    }
    html += '</div>'
    return html
}


function HTML_showArtist(artists) {
    var html = `<ul class="mdui-list">`
    for (i = 0; i < artists.length; i++) {
        let artist = artists[i]
        let name = artist.name ? artist.name : "未知"
        let img = window.localStorage["imgRes"] == "true" ? '' : `<div class="mdui-list-item-avatar"><img src="${getCover("artist", name)}"/></div>`
        html += `<li class="mdui-list-item mdui-ripple" onclick="show_artist('${name}')">
            ${img}
            <div class="mdui-list-item-content">
               ${name}
            </div>
        </li>`　
    }
    html += '</ul>'
    return html
}

function HTML_showComposer(composers) {
    var html = `<ul class="mdui-list">`
    for (i = 0; i < composers.length; i++) {
        let composer = composers[i]
        let name = composer.name ? composer.name : "未知"
        let img = window.localStorage["imgRes"] == "true" ? '' : `<div class="mdui-list-item-avatar"><img src="${getCover("composer", name)}"/></div>`
        html += `<li class="mdui-list-item mdui-ripple" onclick="show_composer('${name}')">
            ${img}
            <div class="mdui-list-item-content">
               ${name}
            </div>
        </li>`　
    }
    html += '</ul>'
    return html
}
// 首頁
async function show_home() {
    // 展示讀取中
    var header = HTML_getHeader("PokaPlayer")
    $("#content").html(header + HTML_getSpinner())
    mdui.mutation()

    var data = await getAPI("entry.cgi", "SYNO.AudioStation.Pin", "list", [{ key: "limit", "value": -1 }, { key: "offset", "value": 0 }]),
        album = HTML_showPins(data.data.items)
    $("#content").html(header + album)
    $("#content>:not(#header-wrapper)").animateCss("fadeIn")
}
//- 列出專輯
async function show_search(keyword) {
    var html = `<div class="mdui-row">
        <div class="mdui-col-md-6 mdui-col-offset-md-3">
            <div class="mdui-textfield">
                <i class="mdui-icon material-icons">search</i>
                <input class="mdui-textfield-input" id="search" type="text" placeholder="搜尋" value="${$('#search').val()||''}" required/>
                <div class="mdui-textfield-error">尚未輸入關鍵字</div>
                <div class="mdui-textfield-helper">輸入完後按下 Enter 開始搜尋音樂</div>
            </div>
        </div>
    </div>`
    var noResultText = [
        '嘿，我們沒聽說過那首歌！',
        '也許試試其他關鍵字',
        '找不到啦QQQ',
        '找不到，也許搜尋結果幻化成泡影了也說不定。',
        '找不到，就讓搜尋結果隨風飄揚吧。',
        '茫茫歌海，就是找不到你要的歌'
    ]
    var noResult = `<div class="mdui-valign" style="height:150px"><p class="mdui-center">${noResultText[Math.floor(Math.random() * noResultText.length)]}</p></div>`
    if (keyword) {
        var result = await searchSong(keyword)
        if (result.length == 0)
            $("#content").html(html + noResult)
        else {
            var resultHTML = HTML_showSongs(result)
            $("#content").html(html + resultHTML)
        }
    } else
        $("#content").html(html)
    mdui.mutation() //初始化

    $('#search').change(async function() {
        show_search($(this).val())
    });
}
//- 列出專輯
async function show_album() {
    // 展示讀取中
    var header = HTML_getHeader("專輯")
    $("#content").html(header + HTML_getSpinner())
    mdui.mutation()
    var PARAMS_JSON = [
        { key: "additional", "value": "avg_rating" },
        { key: "library", "value": "shared" },
        { key: "limit", "value": 1000 },
        { key: "sort_by", "value": "display_artist" },
        { key: "sort_direction", "value": "ASC" },
    ]
    var data = await getAPI("AudioStation/album.cgi", "SYNO.AudioStation.Album", "list", PARAMS_JSON, 3),
        album = HTML_showAlbums(data.data.albums)
    $("#content").html(header + album)
    $("#content>:not(#header-wrapper)").animateCss("fadeIn")
}
// 最近加入ㄉ專輯
async function show_recentlyAlbum() {
    // 展示讀取中
    var header = HTML_getHeader("最近加入的專輯")
    $("#content").html(header + HTML_getSpinner())
    mdui.mutation()
    var PARAMS_JSON = [
        { key: "additional", "value": "avg_rating" },
        { key: "library", "value": "shared" },
        { key: "limit", "value": 100 },
        { key: "method", "value": 'list' },
        { key: "sort_by", "value": "time" },
        { key: "sort_direction", "value": "desc" },
    ]
    var data = await getAPI("AudioStation/album.cgi", "SYNO.AudioStation.Album", "list", PARAMS_JSON, 3),
        album = HTML_showAlbums(data.data.albums)
    $("#content").html(header + album)
    $("#content>:not(#header-wrapper)").animateCss("fadeIn")
}
//- 展示專輯歌曲
async function show_album_songs(artist, album, album_artist) {
    //如果從首頁按進去頁籤沒切換
    $('[data-link]').removeClass('mdui-list-item-active')
    $('[data-link="album"]').addClass('mdui-list-item-active')
    var albumInfo = `<div class="album-info">
        <div class="cover mdui-shadow-1" 
             style="background-image:url(${getAlbumCover(album, album_artist, artist)})"></div>
        <div class="info">
            <div class="album-name mdui-text-truncate mdui-text-color-theme-text" 
                 title="${album}">${album}</div>
            <div class="artist-name mdui-text-truncate mdui-text-color-theme-secondary" 
                 title="${artist}">${artist}</div>
            <div class="grow"></div>
            <div class="footer">
                <div class="time mdui-text-color-theme-disabled mdui-text-truncate"></div>
                <div class="actions">
                </div>
            </div>
        </div>
    </div>
    <div class="mdui-divider" style="margin: 10px 0"></div>`
    var actions = `
    <button class="mdui-btn mdui-btn-icon mdui-ripple" 
            onclick="addSong(songList)" 
            title="將此頁面歌曲全部加入到現正播放">
        <i class="mdui-icon material-icons">add</i>
    </button>
    <button class="mdui-btn mdui-btn-icon mdui-ripple mdui-color-theme-accent" 
            onclick="playSongs(songList,false,true);show_now();"
            title="將現正播放以此頁面歌曲">
        <i class="mdui-icon material-icons">play_arrow</i>
    </button>`

    // 展示讀取中
    $("#content").html(albumInfo + HTML_getSpinner())
    mdui.mutation()

    //抓資料
    var data = await getAlbumSong(album, album_artist, artist),
        html = HTML_showSongs(data.data.songs)
    $("#content").html(albumInfo + html)
    $("#content>:not(.album-info):not(.mdui-divider)").animateCss("fadeIn")

    // 獲取總時間
    var time = 0
    for (i = 0; i < data.data.songs.length; i++) time += data.data.songs[i].additional.song_audio.duration
    $("#content .album-info .time").html(`共 ${data.data.songs.length} 首歌曲 / ${secondToTime(time)}`).animateCss("fadeIn")
    $("#content .album-info .actions").html(actions).animateCss("fadeIn")

}
// 資料夾
async function show_folder(folder) {
    $('[data-link]').removeClass('mdui-list-item-active')
    $('[data-link="folder"]').addClass('mdui-list-item-active')
        // 展示讀取中
    var header = HTML_getHeader("資料夾")
    $("#content").html(header + HTML_getSpinner())
    mdui.mutation()
    var PARAMS_JSON = [
        { key: "additional", "value": "song_tag,song_audio,song_rating" },
        { key: "library", "value": "shared" },
        { key: "limit", "value": 1000 },
        { key: "method", "value": 'list' },
        { key: "sort_by", "value": "title" },
        { key: "sort_direction", "value": "ASC" },
    ]
    if (folder) {
        PARAMS_JSON.push({ key: "id", "value": folder })
    }
    var data = await getAPI("AudioStation/folder.cgi", "SYNO.AudioStation.Folder", "list", PARAMS_JSON, 2),
        folderHTML = HTML_showFolder(data.data.items)
    $("#content").html(header + folderHTML)
    $("#content>:not(#header-wrapper)").animateCss("fadeIn")
}
async function show_artist(artist) {
    var header = HTML_getHeader("演出者")
    $('[data-link]').removeClass('mdui-list-item-active')
    $('[data-link="artist"]').addClass('mdui-list-item-active')
    $("#content").html(header + HTML_getSpinner())
    mdui.mutation()
    if (artist) {
        var header = HTML_getHeader("演出者 / " + artist)
        var PARAMS_JSON = [
            { key: "additional", "value": "avg_rating" },
            { key: "library", "value": "shared" },
            { key: "limit", "value": 1000 },
            { key: "method", "value": 'list' },
            { key: "sort_by", "value": "display_artist" },
            { key: "sort_direction", "value": "ASC" },
            { key: "artist", "value": artist != "未知" ? artist : '' },
        ]
        var data = await getAPI("AudioStation/album.cgi", "SYNO.AudioStation.Album", "list", PARAMS_JSON, 3),
            albumHTML = HTML_showAlbums(data.data.albums)
        $("#content").html(header + albumHTML)
    } else {
        //請求資料囉
        var PARAMS_JSON = [
            { key: "limit", "value": 1000 },
            { key: "library", "value": "shared" },
            { key: "additional", "value": "avg_rating" },
            { key: "sort_by", "value": "name" },
            { key: "sort_direction", "value": "ASC" }
        ]
        var data = await getAPI("AudioStation/artist.cgi", "SYNO.AudioStation.Artist", "list", PARAMS_JSON, 4),
            artistsHTML = HTML_showArtist(data.data.artists)
        $("#content").html(header + artistsHTML)
    }
    $("#content>:not(#header-wrapper)").animateCss("fadeIn")
}
async function show_composer(composer) {
    var header = HTML_getHeader("作曲者")
    $('[data-link]').removeClass('mdui-list-item-active')
    $('[data-link="composer"]').addClass('mdui-list-item-active')
    $("#content").html(header + HTML_getSpinner())
    mdui.mutation()
    if (composer) {
        var header = HTML_getHeader("作曲者 / " + composer)
        var PARAMS_JSON = [
            { key: "additional", "value": "avg_rating" },
            { key: "library", "value": "shared" },
            { key: "limit", "value": 1000 },
            { key: "method", "value": 'list' },
            { key: "sort_by", "value": "display_artist" },
            { key: "sort_direction", "value": "ASC" },
            { key: "composer", "value": composer != "未知" ? composer : '' },
        ]
        var data = await getAPI("AudioStation/album.cgi", "SYNO.AudioStation.Album", "list", PARAMS_JSON, 3),
            albumHTML = HTML_showAlbums(data.data.albums)
        $("#content").html(header + albumHTML)
    } else {
        //請求資料囉
        var PARAMS_JSON = [
            { key: "limit", "value": 1000 },
            { key: "library", "value": "shared" },
            { key: "additional", "value": "avg_rating" },
            { key: "sort_by", "value": "name" },
            { key: "sort_direction", "value": "ASC" }
        ]
        var data = await getAPI("AudioStation/composer.cgi", "SYNO.AudioStation.Composer", "list", PARAMS_JSON, 2),
            composersHTML = HTML_showComposer(data.data.composers)
        $("#content").html(header + composersHTML)
    }
    $("#content>:not(#header-wrapper)").animateCss("fadeIn")
}
//- 隨機播放
async function show_random() {
    // 展示讀取中
    var header = HTML_getHeader("隨機播放")
    $("#content").html(header + HTML_getSpinner())
    mdui.mutation()

    var PARAMS_JSON = [
        { key: "additional", "value": "song_tag,song_audio,song_rating" },
        { key: "library", "value": "shared" },
        { key: "limit", "value": 100 },
        { key: "sort_by", "value": "random" }
    ]
    var data = await getAPI("AudioStation/song.cgi", "SYNO.AudioStation.Song", "list", PARAMS_JSON, 1),
        album = HTML_showSongs(data.data.songs)
    $("#content").html(header + album)
    $("#content>:not(#header-wrapper)").animateCss("fadeIn")
}
async function play_random() {
    var PARAMS_JSON = [
        { key: "additional", "value": "song_tag,song_audio,song_rating" },
        { key: "library", "value": "shared" },
        { key: "limit", "value": 100 },
        { key: "sort_by", "value": "random" }
    ]
    var data = await getAPI("AudioStation/song.cgi", "SYNO.AudioStation.Song", "list", PARAMS_JSON, 1)
    playSongs(data.data.songs, false, false)
    show_now()
}
//- 現正播放
async function show_now() {
    $('[data-link]').removeClass('mdui-list-item-active')
    $('[data-link="now"]').addClass('mdui-list-item-active')
    var html = `<ul class="mdui-list songs">`
    for (i = 0; i < ap.list.audios.length; i++) {
        let focus = ap.list.index == i ? 'mdui-list-item-active' : ''
        let title = ap.list.audios[i].name
        let artist = ap.list.audios[i].artist
        let album_artist = ap.list.audios[i].album_artist
        let album = ap.list.audios[i].album
        let img = window.localStorage["imgRes"] == "true" ? '' : `<div class="mdui-list-item-avatar"><img src="${ap.list.audios[i].cover}"/></div>`
        html += `<li class="mdui-list-item mdui-ripple song ${focus}" >
            ${img}
            <div class="mdui-list-item-content songinfo" data-now-play-id="${i}">
                <div class="mdui-list-item-title mdui-list-item-one-line">${title}</div>
                <div class="mdui-list-item-text mdui-list-item-one-line">${artist}</div>
            </div>
            <button class="mdui-btn mdui-btn-icon mdui-ripple close" data-now-play-id="${i}">
                <i class="mdui-icon material-icons">close</i>
            </button>
        </li>`　
    }
    html += `</ul>`

    var nowPlaying = ap.list.audios[ap.list.index]
    var name = nowPlaying ? nowPlaying.name : "PokaPlayer"
    var artist = nowPlaying ? nowPlaying.artist || "未知的歌手" : "點擊播放鍵開始隨機播放"
    var album = nowPlaying ? `</br>${nowPlaying.album}` || "" : "</br>"
    var img = (nowPlaying && window.localStorage["imgRes"] != "true") ? nowPlaying.cover : "/og/og.png" //一定會有圖片

    var currentTime = ap.audio.currentTime ? secondToTime(ap.audio.currentTime) : "0:00"
    var duration = ap.audio.currentTime ? secondToTime(ap.audio.duration) : "0:00"
    var timer = currentTime + '/' + duration
    var info = `
    <div data-player>
        <div class="mdui-card" style="background-image:url(${img});">
        </div>
        <div class="info">
            <div class="title  mdui-text-truncate mdui-text-color-theme-accent">${name}</div>
            <div class="artist mdui-text-truncate mdui-text-color-theme-text">${artist+album}</div>
            <!--<div data-lrc>
                <p>作詞：佐香智久・天月-あまつき-</p>
                <p>作曲：佐香智久</p>
                <p>獨りよがりじゃなくて</p>
                <p class="mdui-text-color-theme-accent">自分より大切なあなたに宿るもの</p>
                <p>あぁもしも僕たちがあの映畫の</p>
                <p>主人公とヒロインなら</p>
                <p>どんな起承転結もフィナーレには</p>
                <p>ドラマティックなキスをして</p>
                <p>なんて言ってもうまくはいかない</p>
            </div>-->
            <div class="ctrl">
                <button class="mdui-btn mdui-btn-icon mdui-ripple random"><i class="mdui-icon material-icons">skip_previous</i></button>
                <button class="mdui-btn mdui-btn-icon mdui-ripple" onclick="ap.skipBack()"><i class="mdui-icon material-icons">skip_previous</i></button>
                <button class="mdui-btn mdui-btn-icon mdui-ripple mdui-color-theme-accent play" onclick="ap.toggle()"><i class="mdui-icon material-icons">play_arrow</i></button>
                <button class="mdui-btn mdui-btn-icon mdui-ripple" onclick="ap.skipForward()"><i class="mdui-icon material-icons">skip_next</i></button>
                <button class="mdui-btn mdui-btn-icon mdui-ripple loop"><i class="mdui-icon material-icons">skip_previous</i></button>
            </div>
            <div class="player-bar">
                <label class="mdui-slider">
                    <input type="range" step="0.000001" min="0" max="100" value="${ap.audio.currentTime / ap.audio.duration * 100||0}"/>
                </label>
                <div class="timer mdui-typo-body-1-opacity mdui-text-right">${timer}</div>
            </div>
        </div>
    </div>`;
    // 輸出
    $("#content").html(`<div data-player-container>${info+html}</div>`);
    // 隱藏原本ㄉ播放器
    $("#player").addClass('hide');
    // random＆loop
    $("[data-player]>.info>.ctrl>.random").html($('.aplayer-icon.aplayer-icon-order').html())
    $("[data-player]>.info>.ctrl>.loop").html($('.aplayer-icon.aplayer-icon-loop').html())
    $("[data-player]>.info>.ctrl>.random").click(function() {
        $('#aplayer .aplayer-icon.aplayer-icon-order').click()
        $(this).html($('.aplayer-icon.aplayer-icon-order').html())
    })
    $("[data-player]>.info>.ctrl>.loop").click(function() {
        $('#aplayer .aplayer-icon.aplayer-icon-loop').click()
        $(this).html($('.aplayer-icon.aplayer-icon-loop').html())
    });
    //初始化滑塊
    mdui.mutation();
    // 確認播放鈕狀態
    if (ap.audio.paused)
        $('[data-player] button.play[onclick="ap.toggle()"] i').text("play_arrow");
    else
        $('[data-player] button.play[onclick="ap.toggle()"] i').text("pause");
    //捲動清單
    if ($(window).width() > 850 && $(window).height() > 560) {
        $('.mdui-list.songs').scrollTop(72 * ap.list.index - 100);
    }
    ap.on("pause", function() {
        $('[data-player] button.play[onclick="ap.toggle()"] i').text("play_arrow")
    })
    ap.on("play", async function() {
        //卷軸轉轉
        if ($(window).width() > 850 && $(window).height() > 560) {
            $('.mdui-list.songs').animate({ scrollTop: 72 * ap.list.index - 100 }, 400);
        }
        //- list 切換 active
        $(".songs>li.song").removeClass('mdui-list-item-active')
        $(".songs>li.song").eq(ap.list.index).addClass('mdui-list-item-active');
        //- 播放器
        $('[data-player] button.play[onclick="ap.toggle()"] i').text("pause")
        var nowPlaying = ap.list.audios[ap.list.index]
        var name = nowPlaying ? nowPlaying.name : "PokaPlayer"
        var artist = nowPlaying ? nowPlaying.artist || "未知的歌手" : "點擊播放鍵開始隨機播放"
        var album = nowPlaying ? `</br>${nowPlaying.album}` || "" : "</br>"
        var img = (nowPlaying && window.localStorage["imgRes"] != "true") ? nowPlaying.cover : "/og/og.png" //一定會有圖片
        $('[data-player]>.mdui-card').attr('style', `background-image:url(${img});`)
        $('[data-player]>.info .title').text(name)
        $('[data-player]>.info .artist').html(artist + album)

        // 更新 timer
        $("[data-player]>.info>.player-bar input[type=range]").val(0);
        mdui.updateSliders()
            // 找找看歌詞
            //ap.list.audios[ap.list.index].lrc 
            //lyrics = await getLrc(artist, name)
    })
    ap.on("timeupdate", function() {
        currentTime = ap.audio.currentTime ? secondToTime(ap.audio.currentTime) : "0:00"
        duration = ap.audio.currentTime ? secondToTime(ap.audio.duration) : "0:00"
        var cent = ap.audio.currentTime / ap.audio.duration * 100
        $('[data-player]>.info>.player-bar>.timer').text(currentTime + '/' + duration);
        // 更新 timer
        $("[data-player]>.info>.player-bar input[type=range]").val(cent);
        mdui.updateSliders()
    });

    $("[data-player]>.info>.player-bar input[type=range]").on("input", function() {
        var time = $("[data-player]>.info>.player-bar input[type=range]").val() / 100 * ap.audio.duration
        ap.seek(time);
    })

    $(".songs [data-now-play-id].songinfo").click(function() {
        $(".songs>li.song").removeClass('mdui-list-item-active')
        $(this).parent().eq(0).addClass('mdui-list-item-active')
        var song = $(this).attr('data-now-play-id')
        ap.list.switch(song)
        ap.play()
    })
    $(".songs [data-now-play-id].close").click(function() {
        var song = $(this).attr('data-now-play-id')
        ap.list.remove(song)
        if (song == ap.list.index) ap.skipForward()
        show_now()
    })
}
//- 歌詞
function show_lrc() {
    var header = HTML_getHeader("歌詞")
    var lyricHTML = `
    <!--<div data-lrc>
        <p>作詞：佐香智久・天月-あまつき-</p>
        <p>作曲：佐香智久</p>
        <p>獨りよがりじゃなくて</p>
        <p class="mdui-text-color-theme-accent">自分より大切なあなたに宿るもの</p>
        <p>あぁもしも僕たちがあの映畫の</p>
        <p>主人公とヒロインなら</p>
        <p>どんな起承転結もフィナーレには</p>
        <p>ドラマティックなキスをして</p>
        <p>なんて言ってもうまくはいかない</p>
    </div>-->`
    $("#content").html(header + lyricHTML)
}
//- 設定
async function show_settings() {
    ///給定預設值
    if (!window.localStorage["musicRes"]) window.localStorage["musicRes"] = "wav"
        ///
    var header = HTML_getHeader("設定")
    var title = (title) => `<h2 class="mdui-text-color-theme">${title}</h2>`
    var subtitle = (subtitle) => `<h4>${subtitle}</h4>`
    var colors = [
        'red',
        'pink',
        'purple',
        'deep-purple',
        'indigo',
        'blue',
        'light-blue',
        'cyan',
        'teal',
        'green',
        'light-green',
        'lime',
        'yellow',
        'amber',
        'orange',
        'deep-orange',
        'brown',
        'grey',
        'blue-grey'
    ]
    var colorOption = (colors, accent = false) => {
        var option = ''
        for (i = 0; i < colors.length; i++) {
            let color = colors[i]
            if (accent)
                var checked = window.localStorage["mdui-theme-accent"] == color ? " checked" : ''
            else
                var checked = window.localStorage["mdui-theme-primary"] == color ? " checked" : ''
            if (i <= (colors.length - 3 - 1) && accent || !accent)
                option += `<div class="mdui-col"><label class="mdui-radio mdui-text-color-${color}${accent?"-accent":''}">
            <input type="radio" name="group${accent?"1":"2"}" value="${color}"${checked}/>
            <i class="mdui-radio-icon"></i>${color.replace("-"," ")}</label></div>`
        }
        return option
    }
    var themecolor = (s) => { return `<div class="mdui-col"><label class="mdui-radio"><input type="radio" name="themecolor" value="false" ${s=="true"?"":"checked"}/><i class="mdui-radio-icon"></i>Light</label></div>
  <div class="mdui-col"><label class="mdui-radio"><input type="radio" name="themecolor" value="true" ${s=="true"?"checked":""}/><i class="mdui-radio-icon"></i>Dark</label></div>` }
    var musicRes = (s) => { return `<div class="mdui-col">
        <label class="mdui-radio">
            <input type="radio" name="musicres" value="mp3" ${s=="mp3"?"checked":""}/>
            <i class="mdui-radio-icon"></i>
            MP3
        </label>
        <div class="mdui-typo-caption-opacity">128K，夭壽靠北，在網路夭壽慢的情況下請選擇此選項</div>
    </div>
    <div class="mdui-col">
        <label class="mdui-radio">
            <input type="radio" name="musicres" value="wav" ${s=="wav"?"checked":""}/>
            <i class="mdui-radio-icon"></i>
            WAV
        </label>
        <div class="mdui-typo-caption-opacity">較高音質，音質較原始音質略差，可在 4G 網路下流暢的串流</div>
    </div>
    <div class="mdui-col">
        <label class="mdui-radio">
            <input type="radio" name="musicres" value="original" ${s=="original"?"checked":""}/>
            <i class="mdui-radio-icon"></i>
            Original
        </label>
        <div class="mdui-typo-caption-opacity">原始音質，在網路狀況許可下，建議選擇此選項聆聽高音質音樂</div>
    </div>` }
    var imgRes = (s) => { return `<div class="mdui-col">
        <label class="mdui-radio">
            <input type="radio" name="musicres" value="true" ${s=="true"?"checked":""}/>
            <i class="mdui-radio-icon"></i>
            開啟
        </label>
        <div class="mdui-typo-caption-opacity">停止載入所有圖片，以節省流量及讀取時間，音樂仍會按照您所設定的音質播放</div>
    </div>
    <div class="mdui-col">
        <label class="mdui-radio">
            <input type="radio" name="musicres" value="false" ${s=="true"?"":"checked"}/>
            <i class="mdui-radio-icon"></i>
            關閉
        </label>
        <div class="mdui-typo-caption-opacity">載入所有圖片，就像平常那樣</div>
    </div>` }

    var setting_theme = title("主題") +
        subtitle("主題色") + `<form class="mdui-row-xs-2 mdui-row-sm-3 mdui-row-md-5 mdui-row-lg-6" id="PP_Theme">${themecolor(window.localStorage["mdui-theme-color"])}</form>` +
        subtitle("主色") + `<form class="mdui-row-xs-2 mdui-row-sm-3 mdui-row-md-5 mdui-row-lg-6" id="PP_Primary" style="text-transform:capitalize;">${colorOption(colors)}</form>` +
        subtitle("強調色") + `<form class="mdui-row-xs-2 mdui-row-sm-3 mdui-row-md-5 mdui-row-lg-6" id="PP_Accent" style="text-transform:capitalize;">${colorOption(colors,true)}</form>`

    var musicRes = title("音質") + `<form class="mdui-row-xs-1 mdui-row-sm-2 mdui-row-md-3 mdui-row-lg-4" id="PP_Res">${musicRes(window.localStorage["musicRes"])}</form>`

    var imgRes = title("圖片流量節省") + `<form class="mdui-row-xs-1 mdui-row-sm-2 mdui-row-md-3 mdui-row-lg-4" id="PP_imgRes">${imgRes(window.localStorage["imgRes"])}</form>`

    var info = title("Audio Station 狀態") + `<div id="DSMinfo">讀取中</div>`

    var about = title("關於") + `<p>PokaPlayer by gnehs</p>`

    var html = header + setting_theme + musicRes + imgRes + info + about
    $("#content").html(html)

    $("#PP_Res input").change(function() {
        window.localStorage["musicRes"] = $(this).val()
        mdui.snackbar({ message: `音質已設定為 ${$(this).val().toUpperCase()}，該設定並不會在現正播放中生效，請重新加入歌曲`, position: getSnackbarPosition(), timeout: 1500 });
    })
    $("#PP_imgRes input").change(function() {
        window.localStorage["imgRes"] = $(this).val()
        mdui.snackbar({ message: `圖片流量節省已${$(this).val()=="true"?"開啟":"關閉"}`, position: getSnackbarPosition(), timeout: 1500 });
    })
    $("#PP_Theme input").change(function() {
        window.localStorage["mdui-theme-color"] = $(this).val()
        if ($(this).val() == "true")
            $('body').addClass("mdui-theme-layout-dark")
        else
            $('body').removeClass("mdui-theme-layout-dark")
            //設定顏色
        var metaThemeColor = document.querySelector("meta[name=theme-color]");
        metaThemeColor.setAttribute("content", $('header>div:first-child').css("background-color"));
    })
    $("#PP_Primary input").change(function() {
        var classStr = $('body').attr('class');
        var classs = classStr.split(' ');
        for (i = 0, len = classs.length; i < len; i++) {
            if (classs[i].indexOf('mdui-theme-primary-') === 0) {
                $('body').removeClass(classs[i])
            }
        }
        $('body').addClass(`mdui-theme-primary-${$(this).val()}`)
        window.localStorage["mdui-theme-primary"] = $(this).val()
            //設定顏色
        var metaThemeColor = document.querySelector("meta[name=theme-color]");
        metaThemeColor.setAttribute("content", $('header>div:first-child').css("background-color"));
    })
    $("#PP_Accent input").change(function() {
        var classStr = $('body').attr('class');
        var classs = classStr.split(' ');
        for (i = 0, len = classs.length; i < len; i++) {
            if (classs[i].indexOf('mdui-theme-accent-') === 0) {
                $('body').removeClass(classs[i])
            }
        }
        window.localStorage["mdui-theme-accent"] = $(this).val()
        $('body').addClass(`mdui-theme-accent-${$(this).val()}`)
    })
    var getinfo = await getAPI("AudioStation/info.cgi", "SYNO.AudioStation.Info", "getinfo", [], 4)
    $("#DSMinfo").html(`<p>${getinfo.success?"狀態：正常":"狀態：錯誤"}</p>
    <p>${getinfo.data.version_string?`版本：${getinfo.data.version_string}`:"版本：未知"}</p>`)
}


function playSongs(songlist, song = false, clear = true) {
    if (clear) ap.list.clear()
    var playlist = []
    for (i = 0; i < songlist.length; i++) {
        let nowsong = songlist[i]
        if (nowsong.id.match(/dir_/)) continue; //這是資料夾
        let src = getSong(nowsong)
        let name = nowsong.title
        let artist = nowsong.additional.song_tag.artist
        let album = nowsong.additional.song_tag.album
        let album_artist = nowsong.additional.song_tag.album_artist
        let poster =  getAlbumCover(album, album_artist, artist)
        playlist.push({
            url: src,
            cover: poster,
            name: name,
            artist: artist,
            album: album,
            id: nowsong.id,
            album_artist: album_artist
        })
        if (nowsong.id == song) { songtoplay = i }
    }
    ap.list.add(playlist)
    if (song)
        for (i = 0; i < ap.list.audios.length; i++)
            if (ap.list.audios[i].id == song) ap.list.switch(i)
    if (clear) ap.play()
}

function addSong(songlist, songID=0) {
    var playlist = []
    for (i = 0; i < songlist.length; i++) {
        let nowsong = songlist[i]
        if (nowsong.id == songID||songID==0) {
            let src = getSong(nowsong)
            let name = nowsong.title
            let artist = nowsong.additional.song_tag.artist
            let album = nowsong.additional.song_tag.album
            let album_artist = nowsong.additional.song_tag.album_artist
            let poster = getAlbumCover(album, album_artist, artist)
            playlist.push({
                url: src,
                cover: poster,
                name: name,
                artist: artist,
                album: album,
                id: nowsong.id,
                album_artist: album_artist
            })
        }
    }if(songID==0){mdui.snackbar({
        message: `已添加 ${songlist.length} 首歌`,
        timeout: 400,
        position: getSnackbarPosition()
      });}else{
    mdui.snackbar({
        message: `已添加 ${playlist[0].name}`,
        timeout: 400,
        position: getSnackbarPosition()
      });}
    ap.list.add(playlist)
    if (ap.list.audios.length == 1) ap.play() //如果只有一首直接開播
}

function getCover(type, info) {
    var url = "cover.cgi?api=SYNO.AudioStation.Cover&output_default=true&is_hr=false&version=3&library=shared&method=getcover&view=default"
    switch (type) {
        case "artist":
            //演出者
            url += info ? `&artist_name=${encodeURIComponent(info)}` : ``
            break;
        case "composer":
            //作曲者
            url += info ? `&composer_name=${encodeURIComponent(info)}` : ``
            break;
        case "genre":
            //作曲者
            url += info ? `&genre_name=${encodeURIComponent(info)}` : ``
            break;
        case "song":
            //歌曲
            url = "cover.cgi?api=SYNO.AudioStation.Cover&output_default=true&is_hr=false&version=3&library=shared&method=getsongcover&view=large&id=" + info
            url += info ? `&id=${encodeURIComponent(info)}` : ``
            break;
        case "folder":
            //資料夾
            url = "cover.cgi?api=SYNO.AudioStation.Cover&output_default=true&is_hr=false&version=3&library=shared&method=getfoldercover&view=default"
            url += info ? `&id=${encodeURIComponent(info)}` : ``
            break;
        case "album":
            //專輯
            url += info.album_name ? `&album_name=${encodeURIComponent(album_name)}` : ``
            url += info.artist_name ? `&artist_name=${encodeURIComponent(artist_name)}` : ``
            url += info.album_artist_name ? `&album_artist_name=${encodeURIComponent(album_artist_name)}` : `&album_artist_name=`
            break;
    }
    if (window.localStorage["imgRes"] == "true")
        return "/og/og.png"
    else 
        return '/nas/' + pp_encode(url)
}

function getAlbumCover(album_name, album_artist_name, artist_name) {
    var url = "cover.cgi?api=SYNO.AudioStation.Cover&output_default=true&is_hr=false&version=3&library=shared&method=getcover&view=album"
    url += album_name ? `&album_name=${encodeURIComponent(album_name)}` : ``
    url += artist_name ? `&artist_name=${encodeURIComponent(artist_name)}` : ``
    url += album_artist_name ? `&album_artist_name=${encodeURIComponent(album_artist_name)}` : `&album_artist_name=`
    if (window.localStorage["imgRes"] == "true")
        return "/og/og.png"
    else 
        return '/nas/' + pp_encode(url)
}

async function getLrc(artist, title) {
    /*
    DSM 請求
    */
    var PARAMS_JSON = [
        { key: "additional", "value": "full_lyrics" },
        { key: "limit", "value": 1 }
    ]
    if (artist) PARAMS_JSON.push({ key: "artist", "value": artist })
    if (title) PARAMS_JSON.push({ key: "title", "value": title })
    var lrc = await getAPI("AudioStation/lyrics_search.cgi", "SYNO.AudioStation.LyricsSearch", "searchlyrics", PARAMS_JSON, 2)
    return lrc.data

}

function getSong(song) {
    var id = song.id
    var res = window.localStorage["musicRes"]
    var bitrate = song.additional.song_audio.bitrate / 1000
    if (res == "wav"&& bitrate > 320) 
        res = "wav"
    else 
        res = "original"
    return '/song/' + res + '/' + id
}
async function getAlbumSong(album_name, album_artist_name, artist_name) {
    var PARAMS_JSON = [
        { key: "additional", "value": "song_tag,song_audio,song_rating" },
        { key: "library", "value": "shared" },
        { key: "limit", "value": 100000 },
        { key: "sort_by", "value": "title" },
        { key: "sort_direction", "value": "ASC" },
    ]
    if (album_name) PARAMS_JSON.push({ key: "album", "value": album_name })
    if (album_artist_name) PARAMS_JSON.push({ key: "album_artist", "value": album_artist_name })
    if (artist_name) PARAMS_JSON.push({ key: "artist", "value": artist_name })
    var info = await getAPI("AudioStation/song.cgi", "SYNO.AudioStation.Song", "list", PARAMS_JSON, 3)
    return info
}
async function searchSong(keyword) {
    /*
        title=a keyword=a
    
        */
    var PARAMS_JSON = [
        { key: "additional", "value": "song_tag,song_audio,song_rating" },
        { key: "library", "value": "shared" },
        { key: "limit", "value": 1000 },
        { key: "sort_by", "value": "track" },
        { key: "sort_direction", "value": "ASC" },
        { key: "title", "value": keyword },
        { key: "keyword", "value": keyword },
    ]
    var result = await getAPI("AudioStation/song.cgi", "SYNO.AudioStation.Song", "search", PARAMS_JSON, 3)
    return result.data.songs
}

async function getAPI(CGI_PATH, API_NAME, METHOD, PARAMS_JSON = [], VERSION = 1) {
    var PARAMS = ''
    for (i = 0; i < PARAMS_JSON.length; i++) {　
        var PARAMS = PARAMS + '&' + PARAMS_JSON[i].key + '=' + encodeURIComponent(PARAMS_JSON[i].value)
    }
    var req_json = {
        "CGI_PATH": CGI_PATH,
        "API_NAME": API_NAME,
        "METHOD": METHOD,
        "VERSION": VERSION,
        "PARAMS": PARAMS
    }
    req_json = JSON.stringify(req_json)
    const response = await axios.get('/api/' + pp_encode(req_json));
    return response.data
}
function getSnackbarPosition(){
    if ($(window).width() < 768) 
        return "left-top"
    else 
        return "left-bottom"
}
$.fn.extend({
    animateCss: function(animationName, callback) {
      var animationEnd = (function(el) {
        var animations = {
          animation: 'animationend',
          OAnimation: 'oAnimationEnd',
          MozAnimation: 'mozAnimationEnd',
          WebkitAnimation: 'webkitAnimationEnd',
        };
  
        for (var t in animations) {
          if (el.style[t] !== undefined) {
            return animations[t];
          }
        }
      })(document.createElement('div'));
  
      this.addClass('animated ' + animationName).one(animationEnd, function() {
        $(this).removeClass('animated ' + animationName);
  
        if (typeof callback === 'function') callback();
      });
  
      return this;
    },
  });