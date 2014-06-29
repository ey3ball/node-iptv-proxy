vlc = require('./providers/vlc-chan');

/*
 * Basic example (one VLC server, two channels)
 *
 * Each channel is registered using a setup function that
 * returns a live stream url.
 */
var basic_config = {
        "fr2_hd": vlc.chan("FBX: France 2 HD (TNT)", "localhost"),
        "fr5_hd": vlc.chan("FBX: France 5 (HD)", "localhost")
};

/*
 * Load-balancing example
 *
 * Two VLC instances are started, enabling the playback of two
 * channels in parralel
 *
 */

var vlc1 = vlc.server("localhost:80");
var vlc2 = vlc.server("localhost:81");

var vlc_pool = [ vlc1, vlc2 ];

var multichan_config = {
        "fr2_hd": vlc.chan("FBX: France 2 HD (TNT)").pool(vlc_pool),
        "fr4_hd": vlc.chan("FBX: France 4 (HD)").pool(vlc_pool),
        "fr5_hd": vlc.chan("FBX: France 5 (HD)").pool(vlc_pool)
};

/* use basic config example */
module.exports = basic_config;
