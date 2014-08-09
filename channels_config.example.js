default_profiles = require(__base + 'lib/transcoding-profiles');
channels = require(__base + 'lib/chanlist-builder');

IptvProvider = require(__base + 'providers/iptv_provider');

function vlc_host(host) {
        return new IptvProvider.Vlc("http://" + host,
                                    "http://" + host + "/stream");
}

var vlc1 = vlc_host("localhost:80");
var vlc2 = vlc_host("localhost:81");
var VlcPool = new IptvProvider.Pool().add(vlc1).add(vlc2);

var streamdev_host = "http://localhost:3000";

/*
 * List available channels.
 *
 * Each channel is registered using a setup function that
 * returns a live stream url.
 */

channels
        /* Streamdev source */
        .addStreamdev   ("tf1hd", streamdev_host, "TF1 HD")
        /* Simple Vlc source */
        .addVlc         ("fr5hd", vlc1, "FBX: FRANCE5 5 (HD)")
        /* Pooled Vlc source */
        .addProvider    ("arte", VlcPool.bindChan("FBX: Arte (HD)"))
        .addProvider    ("nrj12", VlcPool.bindChan("FBX: NRJ 12 (HD)"))
        /* Multi-source channel ! */
        .addProvider    ("fr2hd", VlcPool.bindChan("FBX: FRANCE 2 (HD)"))
        .addStreamdev   ("fr2hd", streamdev_host, "FRANCE2 HD")
        /* Simple URL example (here with a loopback to another local channel */
        .addUrl         ("fr2_loop", "http://localhost:1234/stream/fr2hd");

/* basic config example */
module.exports = {
        /* define listening port */
        server: {
                port: 1234
        },

        /* attach channel list */
        channels: channels.genList(),

        /* enable transcoding with default profiles
         * we ship 3 default profiles :
         *      - low: 200k, 320xY
         *      - medium: 600k, 576xY
         *      - high: 900k, 720xY
         *
         * Use .disable('profile-name') if you want to load the default profile
         * list but wish to disable some variants
         *
         * see ./lib/transcoding-profiles.js if you need custom profiles
         */
        transcode: default_profiles.disable("high"),
};
