vlc = require('./providers/vlc-chan');

function make_host(host) {
        return {
                control_url: "http://" + host,
                stream_url: "http://" + host + "/stream"
        };
}

/*
 * Two VLC instances are started, enabling the playback of two
 * channels in parralel
 *
 */

var vlc1 = vlc.server(make_host("localhost:80"));
var vlc2 = vlc.server(make_host("localhost:81"));

var vlc_pool = [ vlc1, vlc2 ];

var config = {
        "fr2_hd": vlc.chan("FBX: France 2 HD (TNT)").pool(vlc_pool),
        "fr4_hd": vlc.chan("FBX: France 4 (HD)").pool(vlc_pool),
        "fr5_hd": vlc.chan("FBX: France 5 (HD)").pool(vlc_pool)
};

/* use basic config example */
module.exports = config;
