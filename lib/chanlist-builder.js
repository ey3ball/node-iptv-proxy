IptvProvider = require(__base + 'providers/iptv_provider');

module.exports = {
        _list: [],
        addUrl: function(name, url) {
                var prov = new IptvProvider.Url(url, { channel: name });

                return this.addProvider(name, prov);
        },
        addStreamdev: function(name, host, channel) {
                var prov = new IptvProvider.StreamDev(host, {channel: channel});

                return this.addProvider(name, prov);
        },
        addVlc: function(name, host, channel) {
                var prov = new IptvProvider.Vlc(host.control_url, host.stream_url, {channel: channel});

                return this.addProvider(name, prov);
        },
        forward: function(name, to_name) {
                var prov = new IptvProvider.Forward(to_name);

                return this.addProvider(name, prov);
        },
        addProvider: function(name, provider) {
                if (this._list[name]) {
                        if (this._list[name] instanceof IptvProvider.MultiSrc) {
                                console.log(name + " -multi-add");
                                this._list[name].add(provider);
                        } else {
                                console.log(name + " -multi-create");
                                var orig = this._list[name];
                                this._list[name] = new IptvProvider.MultiSrc()
                                                        .add(orig)
                                                        .add(provider);
                        }
                } else {
                        console.log(name + " -single");
                        this._list[name] = provider;
                }
                return this;
        },
        genList: function() {
                return this._list;
        }
};
