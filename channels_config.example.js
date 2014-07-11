vlc = require('./providers/vlc-provider');
streamdev = require('./providers/streamdev-provider');

function make_host(host) {
        return {
                control_url: "http://" + host,
                stream_url: "http://" + host + "/stream"
        };
}

/*
 * Two VLC instances are started, enabling the playback of two
 * channels in parralel
 */

var vlc1 = vlc.server(make_host("localhost:80"));
var vlc2 = vlc.server(make_host("localhost:81"));

var vlc_pool = [ vlc1, vlc2 ];

/*
 * Local DVB tunners are also added through VDR+Streamdev
 */
var stm_host = "http://localhost:3000"

var config = {
        "fr2_hd": vlc.chan("FBX: France 2 HD (TNT)").pool(vlc_pool),
        "fr4_hd": vlc.chan("FBX: France 4 (HD)").pool(vlc_pool),
        "fr5_hd": vlc.chan("FBX: France 5 (HD)").pool(vlc_pool),
        "tf1hd": streamdev.chan("TF1 HD", stm_host),
        "m6hd": streamdev.chan("M6 HD", stm_host)
};

/* use basic config example */
module.exports = config;
