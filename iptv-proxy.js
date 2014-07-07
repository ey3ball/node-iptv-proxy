/* npm deps */
http    = require('http');
url     = require('url');
express = require('express');
git     = require('git-rev');
require('array.prototype.findindex');

/* internal deps */
channels = require('./channels_config');
streams = require('./lib/stream-manager');

var app = express();

app.get('/', function (req, res) {
        res.send("node-iptv-proxy");
});

app.get('/list', function(req, res) {
        /* list available channels */
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

        /* reply with some useful info / statistics */
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

        /* check channel existence */
        if (!channels[chan]) {
                console.log("PROXY: channel " + chan + " not found");

                res.send(404, "not found");
                return;
        }

        /* subscribe already started channel stream */
        if (streams.hasChan(chan)) {
                console.log("STREAM: channel " + chan + " already subscribed");

                var stream = streams.findChan(chan);
                res.set(stream.obj.headers);
                streams.addClient(chan, stream_res);

                return;
        }

        /* channel not streaming yet, fire a new session */
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

                        /* cleanup routines when the source stream completes / errors out */
                        res.on('end', function() {
                                console.log("END: " + chan + " stream done");
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
