vlc = require('./providers/vlc-chan');

function make_host(host) {
        return {
                control_url: "http://" + host,
                stream_url: "http://" + host + "/stream"
        };
}

/*
 * Basic example (one VLC server, two channels)
 *
 * Each channel is registered using a setup function that
 * returns a live stream url.
 */
var basic_config = {
        "fr2_hd": vlc.chan("FBX: France 2 HD (TNT)", make_host("localhost")),
        "fr5_hd": vlc.chan("FBX: France 5 (HD)", make_host("localhost"))
};

/*
 * Load-balancing example
 *
 * Two VLC instances are started, enabling the playback of two
 * channels in parralel
 *
 */

var vlc1 = vlc.server(make_host("localhost:80"));
var vlc2 = vlc.server(make_host("localhost:81"));

var vlc_pool = [ vlc1, vlc2 ];

var multichan_config = {
        "fr2_hd": vlc.chan("FBX: France 2 HD (TNT)").pool(vlc_pool),
        "fr4_hd": vlc.chan("FBX: France 4 (HD)").pool(vlc_pool),
        "fr5_hd": vlc.chan("FBX: France 5 (HD)").pool(vlc_pool)
};

/* use basic config example */
module.exports = basic_config;
