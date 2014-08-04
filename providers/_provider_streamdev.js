http = require('http');

module.exports = StreamdevProvider;

var IptvProvider = require('./iptv_provider');

util.inherits(StreamdevProvider, IptvProvider.Http);

function StreamdevProvider(server_url, opts) {
        this._streamdev_url = server_url;

        StreamdevProvider.super_.call(this, opts);
}

StreamdevProvider.prototype._get_url = function(url_callback) {
        var channel = this._channel;
        var base_url = this._streamdev_url;

        var req = http.request(this._streamdev_url + "/channels.m3u", function(res) {
                var pl = "";

                res.on('data', function(chunk) {
                        pl += chunk;
                });

                res.on('end', function() {
                        var match_m3u = new RegExp("EXTINF:-1,\\d* (.*)\r\n.*[/]([\\w-]*)");
                        var res = pl.split('#').reduce(function (prev, el) {
                                if (prev)
                                        return prev;

                                var found = el.match(match_m3u);

                                if (found && found.length > 1 && found[1] == channel)
                                        prev = base_url + "/" + found[2] + ".ts";
                                return prev;
                        }, undefined);

                        url_callback(res);
                });
        });

        req.end();
};

StreamdevProvider.prototype._release = function() {
        return;
};
