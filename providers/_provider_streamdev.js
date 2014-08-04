http = require('http');

var streamdev = {};

function streamdev_find_chan(base_url, channel, cb) {
        var req = http.request(base_url + "/channels.m3u", function(res) {
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

                        cb(res);
                });
        });

        req.end();
}

function streamdev_declare_channel(channel, url) {
        return {
                "start": function(play_cb) {
                        streamdev_find_chan(url, channel, play_cb);
                },
                "stop": function() {

                }
        }
}

streamdev.chan = streamdev_declare_channel;

module.exports = streamdev;
