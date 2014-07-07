http = require('http');
url = require('url');
require('array.prototype.findindex');
util = require('util');
express = require('express');
git = require('git-rev');

channels = require('./channels_config');

/*
 * Stream dispatcher:
 * Keeps track of current video streams and clients.
 *
 * Video stream data is forwarded to the dispather, and then
 * to all subscribed clients. 
 */
streams = {
        current: [], 

        /* Register a new channel with the stream dispatcher
         *
         * Channels are held in the "current" array for later
         * reference
         *
         * id: identifier (eg: channel name)
         * stream: readable data stream
         * head: http headers (including content-type)
         * stop: callback stop function, trigerred when all clients
         *       have disconnected
         */
        addChan: function (id, readableStream, head, stop) {
                this.current.push({
                        "id": id,
                        "inputStream": readableStream,
                        "stop": stop,
                        "headers": head,
                        "clients": []
                });
        },

        findChan: function(id) {
                found = this.current.findIndex(function (el) {
                        if (el.id == id)
                                return true;
                        return false;
                });

                if (found == -1)
                        return undefined;
                else return { idx: found, obj: this.current[found] };
        },

        hasChan: function(id) {
                return (this.findChan(id) != undefined);
        },

        killChan: function(id) {
                console.log("KILLCHAN: " + id);

                try {
                        stream = this.findChan(id).obj;
                } catch(e) {
                        return;
                }

                if (stream.stop)
                        stream.stop();

                channels[id].stop();

                this.current.splice(stream.idx, 1);
        },

        addClient: function(chan_id, client_handle) {
                try {
                        stream = this.findChan(chan_id).obj;
                } catch(e) {
                        return;
                }

                var idx = stream.clients.push(client_handle);

                stream.inputStream.pipe(client_handle);

                client_handle.on('close', function() {
                        console.log("CLOSE: " + chan_id + " " + idx);

                        this.killClient(chan_id, client_handle);
                }.bind(this));
        },

        killClient: function(chan_id, handle) {
                var stream = this.findChan(chan_id);

                /* an hanged client might close its connexion
                 * after the channel has been killed */
                if (!stream)
                        return;

                stream = stream.obj;

                var found = stream.clients.findIndex(function (el) {
                        if (el == handle)
                                return true;
                        return false;
                });

                if (found == -1)
                        return;

                console.log("CLOSED: " + found);
                stream.clients.splice(found, 1);

                if (!stream.clients.length)
                        this.killChan(chan_id);
        },
};

var app = express();

app.get('/', function (req, res) {
        res.send("node-iptv-proxy");
});

app.get('/list', function(req, res) {
        res.send({ channels: Object.keys(channels) });
});

app.get('/version', function(req, res) {
        git.short(function(commit) {
                res.send({ version: commit });
        });
});

app.get('/status', function(req, res){
        function decode_authdata(headers) {
                var username = "";
                try {
                        username = new Buffer(headers['authorization'].replace("Basic ",""), 'base64')
                                .toString().split(':')[0];
                } catch(e) {
                        username = "none";
                }

                return username;
        }

        res.send({
                streams: streams.current.map(function(el) {
                        return { id: el.id,
                                clients: el.clients.map(function(el) {
                                        return { sent: el.socket.bytesWritten,
                                                 remoteAddr: el.req.headers['x-forwarded-for'] || el.req.connection.remoteAddress,
                                                 remotePort: el.socket.remotePort,
                                                 username: decode_authdata(el.req.headers)
                                        };
                                }) };
                })
        });
});

app.get('/stream/:chan', function(req, res) {
        function addHTTPChan(id, http_req) {
                streams.addChan(id, http_req.res, http_req.res.headers,
                                function() { http_req.abort() });
        }

        var chan = req.params.chan;

        /* the express response is an instance of HttpServerResponse as well */
        var stream_res = res;

        if (!channels[chan]) {
                console.log("PROXY: channel " + chan + " not found");

                res.send(404, "not found");
                return;
        }

        if (streams.hasChan(chan)) {
                console.log("STREAM: channel " + chan + " already subscribed");

                var stream = streams.findChan(chan);
                res.set(stream.obj.headers);
                streams.addClient(chan, stream_res);

                return;
        }

        console.log("START !!");
        channels[chan].start(function(stream) {
                console.log("STREAM: " + stream);

                if (!stream) {
                        res.send(503, "Failed to start stream");
                        return;
                }

                var req = http.request(stream, function(res) {
                        console.log("STREAM: " + stream + " got: " + res.statusCode);

                        stream_res.writeHead(200, res.headers);

                        addHTTPChan(chan, this);
                        streams.addClient(chan, stream_res);

                        res.on('end', function() {
                                console.log("KILL " + chan + " stream done");
                                streams.killChan(chan);
                        });

			res.on('error', function(e) {
				console.log("STREAM: connexion closed unexpectedly - " + e.message);

				/* cleanup */
				channels[chan].stop();
			});
                });

		req.on('error', function(e) {
			console.log("STREAM: failed to start - " + e.message);

			/* cleanup */
			channels[chan].stop();
		});

                req.end();
        });
});

app.listen(1234);
