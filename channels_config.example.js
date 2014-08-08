default_profiles = require(__base + 'lib/transcoding-profiles');
IptvProvider = require(__base + 'providers/iptv_provider');

var channels = {
        list: [],
        add_url: function(name, url) {
                var prov = new IptvProvider.Url(url, { channel: name });

                return this.add_provider(name, prov);
        },
        add_streamdev: function(name, host, channel) {
                var prov = new IptvProvider.StreamDev(host, {channel: channel});

                return this.add_provider(name, prov);
        },
        add_vlc: function(name, host, channel) {
                var prov = new IptvProvider.Vlc(host.control_url, host.stream_url, {channel: channel});

                return this.add_provider(name, prov);
        },
        add_provider: function(name, provider) {
                if (this.list[name]) {
                        if (this.list[name] instanceof IptvProvider.MultiSrc) {
                                this.list[name].add(provider);
                        } else {
                                this.list[name] = new IptvProvider.MultiSrc();
                        }
                } else {
                        this.list[name] = provider;
                }
                return provider;
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

channels
        /* Streamdev source */
        .add_streamdev  ("tf1hd", streamdev_host, "TF1 HD")
        /* Simple Vlc source */
        .add_vlc        ("fr5hd", vlc1, "FBX: FRANCE5 5 (HD)")
        /* Pooled Vlc source */
        .add_provider   ("arte", VlcPool.bindChan("FBX: Arte (HD)")),
        .add_provider   ("nrj12", VlcPool.bindChan("FBX: NRJ 12 (HD)"))
        /* Multi-source channel ! */
        .add_provider   ("fr2hd", VlcPool.bindChan("FBX: FRANCE 2 (HD)"))
        .add_streamdev  ("fr2hd", streamdev_host, "FRANCE2 HD")
        /* Simple URL example (here with a loopback to another local channel */
        .add_url        ("fr2_loop", "http://localhost:1234/stream/fr2hd");

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
