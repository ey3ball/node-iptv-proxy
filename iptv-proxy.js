http = require('http');
url = require('url');
require('array.prototype.findindex');
util = require('util');
express = require('express');

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
         */
        addChan: function (id, handle, head) {
                this.current.push({
                        "id": id,
                        "handle": handle,
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

                stream = this.findChan(id);

                if (!stream)
                        return;

                stream.obj.handle.abort();

                channels[id].stop();

                this.current.splice(stream.idx, 1);
        },

        addClient: function(chan_id, client_handle) {
                stream = this.findChan(chan_id).obj;

                if (!stream)
                        return;

                var idx = stream.clients.push(client_handle);

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

        sendData: function(id, chunk) {
                stream = this.findChan(id);

                if (!stream) {
                        console.log("DATA: stream not found");
                        return;
                }

                stream.obj.clients.map(function(el) {
                        el.write(chunk, 'binary');
                });
        }
};

var app = express();

app.get('/', function (req, res) {
        res.send("node-iptv-proxy");
});

app.get('/list', function(req, res) {
        res.send({ channels: Object.keys(channels) });
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
                                                 remoteAddr: el.socket.remoteAddress,
                                                 remotePort: el.socket.remotePort,
                                                 username: decode_authdata(el.req.headers)
                                        };
                                }) };
                })
        });
});

app.get('/stream/:chan', function(req, res) {
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

                        streams.addChan(chan, this, res.headers);
                        streams.addClient(chan, stream_res);

                        res.on('end', function() {
                                console.log("KILL " + chan + " stream done");
                                streams.killChan(chan);
                        });

                        res.on('data', function(chunk) {
                                streams.sendData(chan, chunk);
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
