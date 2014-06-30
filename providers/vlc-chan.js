http = require('http');
libxmljs = require('libxmljs');
require('array.prototype.find');

var vlc = {};

/*
 * VLC channel control helpers (find channel / play / stop)
 */
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

/*
 * Create channel object
 */
function vlc_declare_channel(channel, host) {
        var vlc_channel = {
                /* public playback routines : start/stop VLC channel */
                "start": function(play_cb) {
                        if (this.cur_host)
                                throw "Unexpected";

                        this.cur_host = this.getHost();
                        if (!this.cur_host) {
                                play_cb(undefined);
                        } else {
                                console.log("got host : " + this.cur_host.host);

                                vlc_play(this.cur_host.host, channel, play_cb);
                        }
                },
                "stop": function() {
                        vlc_stop(this.cur_host.host);

                        this.cur_host.release();
                        this.cur_host = undefined;
                },

                /* load balancing : attach server pool to channel */
                "pool": function(servers) {
                        this.servers = servers;

                        /* return this when pool is called to enable chaining
                         * with vlc.chan in setup file */
                        return this;
                },

                /* internal use, find free host in pool */
                "getHost": function() {
                        var srv = this.servers.find(function test(el) {
                                if (el.isAvailable())
                                        return true;
                                return false;
                        });

                        if (srv)
                                srv.take();

                        return srv;
                }
        };

        /* if an host was provided register an "always available" singleton */
        if (host) {
                vlc_channel.servers = vlc_declare_server(host);
                vlc_channel.servers.isAvailable = function() { return true; };
        }

        /* return channel object */
        return vlc_channel;
}

/*
 * Create server object
 */
function vlc_declare_server(host) {
        var vlc_server = {
                "host": host,
                "used": 0,
                "isAvailable": function () {
                        return this.used == 0;
                },
                "take": function() {
                        this.used = 1;
                },
                "release": function() {
                        this.used = 0;
                }
        };

        return vlc_server;
}

/* build vlc module */
vlc.chan = function (channel, host) { return vlc_declare_channel(channel, host); };
vlc.server = function (hosts) { return vlc_declare_server(hosts); };

module.exports = vlc;
