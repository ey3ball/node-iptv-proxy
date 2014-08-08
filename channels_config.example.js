default_profiles = require(__base + 'lib/transcoding-profiles');
IptvProvider = require(__base + 'providers/iptv_provider');

var channels = {
        list: [],
        add_url: function(name, url) {
                this.list[name] = new IptvProvider.Url(url, { channel: name });
                return this;
        },
        add_streamdev: function(name, host, channel) {
                this.list[name] = new IptvProvider.StreamDev(host, {channel: channel});
                return this;
        },
        add_vlc: function(name, host, channel) {
                this.list[name] = new IptvProvider.Vlc(host.control_url, host.stream_url, {channel: channel});
                return this;
        },
        add_provider: function(name, provider) {
                this.list[name] = provider;
                return this;
        },
        make_config: function() {
                return this.list;
        }
};

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

channels.add_streamdev("tf1hd", streamdev_host, "TF1 HD")
        .add_streamdev("fr2hd", streamdev_host, "FRANCE2 HD")
        .add_vlc("fr5hd", vlc1, "FBX: FRANCE5 5 (HD)")
        .add_url("fr2_loop", "http://localhost:1234/stream/fr2hd")
        .add_provider("arte", VlcPool.bindChan("FBX: Arte (HD)")),
        .add_provider("nrj12", VlcPool.bindChan("FBX: NRJ 12 (HD)"));

/* basic config example */
module.exports = {
        /* define listening port */
        server: {
                port: 1234
        },

        /* attach channel list */
        channels: channels.make_config(),

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
