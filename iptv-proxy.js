/* npm deps */
http    = require('http');
url     = require('url');
express = require('express');
git     = require('git-rev');
through = require('through');
ffmpeg  = require('fluent-ffmpeg');
require('array.prototype.findindex');

/* internal deps */
channels = require('./channels_config');
streams = require('./lib/stream-manager');
changlue = require('./lib/channels-glue');

/*
 * express webapp: expose a number of endpoints and APIs
 */
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

        function get_http_stats(client) {
                try {
                        return {
                                sent: client.socket.bytesWritten,
                                remoteAddr: client.req.headers['x-forwarded-for']
                                            || client.req.connection.remoteAddress,
                                remotePort: client.socket.remotePort,
                                username: decode_authdata(client.req.headers)
                        };
                } catch(e) {
                        return {
                                sent: 0,
                                remoteAddr: "127.0.0.1",
                                remotePort: 0,
                                username: "internal"
                        };
                }
        }

        /* reply with some useful info / statistics */
        res.send({
                streams: streams.current.map(function(el) {
                        return { id: el.id,
                                clients: el.clients.map(function(el) {
                                        return get_http_stats(el);
                                })
                        };
                })
        });
});

app.get('/transcode/:chan', function(req, res) {
        var chan = req.params.chan;
        var fakeClient = through();
        var transcodedChan = through();

        console.log("TRANSCODE: " + chan);

        changlue.fire(chan, function(httpStream) {
                /* ok_cb */
                res.writeHead(200, httpStream.headers);

                /* register fake client */
                streams.addClient(chan, fakeClient);

                new ffmpeg({ source: fakeClient })
                        .withVideoCodec('libx264')
                        .withAudioCodec('libmp3lame')
                        .withSize('320x240')
                        .fromFormat('mpegts')
                        .toFormat('mpegts')
                        .writeToStream(transcodedChan, { end: true });

                /* cleanup routines when the source stream completes / errors out */
                transcodedChan.on('end', function() {
                        console.log("END: trans-" + chan + " stream done");
                        streams.killChan("trans-" + chan);
                });

                /* register transcoding channel and attach actual client to it */
                streams.addChan("trans-" + chan, transcodedChan, httpStream.headers,
                                function() { fakeClient.destroy() });
                streams.addClient("trans-" + chan, res);
        }, function() {
                res.send(503, "Failed to start stream");
        });
});

app.get('/stream/:chan', function(req, res) {
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

        changlue.fire(chan, function(httpStream) {
                /* ok_cb */
                stream_res.writeHead(200, httpStream.headers);
                streams.addClient(chan, stream_res);
        }, function() {
                /* err_cb */
                res.send(503, "Failed to start stream");
        });
});

app.listen(1234);
