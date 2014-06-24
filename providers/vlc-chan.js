http = require('http');
libxmljs = require('libxmljs');

var vlc = {};

function vlc_get_chanid(host, channel, cb) {
        var xml = "";

        var req = http.request("http://" + host + "/requests/playlist.xml", function (res) {
                res.on('data', function(chunk) {
                        xml += chunk;
                });

                res.on('end', function () {
                        var xmlDoc = libxmljs.parseXmlString(xml);

                        /* eg: leaf[@name="FBX: France 2 HD (TNT)"]/@id' */
                        var res = xmlDoc.get("//leaf[@name=\"" + channel + "\"]");

                        if (!res) {
                                console.log("VLC_GET_CHANID: " + channel + " not found !");
                        } else {
                                var id = res.attr("id").value();
                                console.log("VLC_GET_CHANID: " + id); 
                                cb(id);
                        }
                });
        });
        
        req.end();
}

function vlc_play(host, channel, cb) {
        vlc_get_chanid(host, channel, function(id) {
                var req = http.request("http://" + host +
                                       "/requests/status.xml?command=pl_play&id=" + id,
                                       function(res)
                        {
                                console.log("PROVIDER: VLC server returned " + res.statusCode);
                                if (res.statusCode == 200)
                                        cb("http://" + host + "/stream");
                        });

                req.end();
        });
}

function vlc_stop(host)
{
        var req = http.request("http://" + host + "/requests/status.xml?command=pl_stop", function(res) {
                console.log("PROVIDER: stopped " + host);
        });

        req.end();
}

function make_vlc(host, channel) {
        return {
                "start": function(play_cb) {
                        vlc_play(host, channel, play_cb);
                },
                "stop": function() {
                        vlc_stop(host);
                }
        };
}

vlc.chan = function (host, channel) { return make_vlc(host, channel); };

module.exports = vlc;
