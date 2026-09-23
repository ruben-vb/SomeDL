// === Spotify ===

var spotify_progress_active = false;
var spotify_playlist_title = "";

function spotify_update_song_count() {
    const titles = document.getElementById("spotify-tracklist").value.split("\n").map(s => s.trim()).filter(s => s.length > 0);
    const song_count_el = document.getElementById("spotify-song-count");

    if (titles.length > 0) {
        song_count_el.textContent = titles.length + " Songs";
        song_count_el.style.display = "block";
    } else {
        song_count_el.style.display = "none";
    }
}

async function spotify_search() {
    const playlist_url = document.getElementById("inp-spotify-search").value.trim();

    if (!playlist_url) {
        return;
    }

    console.log("searching spotify playlist: " + playlist_url)
    var res = await spotify_search_req(playlist_url)

    if (!res || !res.tracks) {
        return;
    }

    document.getElementById("spotify-tracklist").value = res.tracks.join("\n");

    // --- Display the number of songs found
    spotify_update_song_count();

    // --- Display the playlist title
    const playlist_title_el = document.getElementById("spotify-playlist-title");

    if (res.title) {
        spotify_playlist_title = res.title;
        playlist_title_el.textContent = res.title;
        playlist_title_el.style.display = "block";
    } else {
        spotify_playlist_title = "";
        playlist_title_el.style.display = "none";
    }
}


// === Copy tracklist ===
async function spotify_copy_tracklist() {
    const tracklist_field = document.getElementById("spotify-tracklist");
    const tracklist = tracklist_field.value;

    if (!tracklist) {
        return;
    }

    console.log("--- copying spotify tracklist")

    try {
        await navigator.clipboard.writeText(tracklist);
    } catch (e) {
        // --- Fallback for non-secure contexts (e.g. accessing the webui over LAN instead of localhost)
        tracklist_field.focus();
        tracklist_field.select();
        document.execCommand("copy");
        tracklist_field.blur();
    }
}


// === Download playlist ===
async function spotify_download_playlist() {
    const titles = document.getElementById("spotify-tracklist").value.split("\n").map(s => s.trim()).filter(s => s.length > 0);

    if (titles.length == 0) {
        return;
    }

    console.log("--- downloading spotify playlist: " + titles.length + " titles")

    var res = await spotify_download_playlist_req(titles, spotify_playlist_title)

    if (!res) {
        return;
    }

    // --- Show progress bar and start polling
    spotify_progress_active = true;
    document.getElementById("spotify-progress-wrapper").style.display = "block";
    spotify_update_progress(0, res.total);
    spotify_update_progress_loop();
}

async function spotify_update_progress_loop() {
    var data = await spotify_progress_req()

    if (data) {
        spotify_update_progress(data.current, data.total);

        if (!data.running) {
            spotify_progress_active = false;
            return;
        }
    }

    if (spotify_progress_active) {
        setTimeout(spotify_update_progress_loop, 500);
    }
}

function spotify_update_progress(current, total) {
    document.querySelector(".spotify-progress-label").textContent = current + "/" + total;
    document.querySelector(".spotify-progress-bar-fill").style.width = (total > 0 ? (current / total) * 100 : 0) + "%";
}