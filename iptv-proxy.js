/* npm deps */
stream  = require('stream');
http    = require('http');
url     = require('url');
express = require('express');
git     = require('git-rev');
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

        console.log("TRANSCODE: " + chan);

        /* check wether the channel is already being transcoded*/
        changlue.try_chan("trans-" + chan, function(liveStream) {
                res.set(liveStream.headers);
                streams.addClient("trans-" + chan, res);
        }, function() {
                /* if not, grab the corresponding (uncompressed) source stream
                 * and fire up ffmpeg */
                changlue.get_chan(chan, function(sourceStream) {
                        var fakeClient = new (stream.PassThrough)({allowHalfOpen: false});
                        var transcodedChan = new (stream.PassThrough)();

                        res.writeHead(200, sourceStream.headers);

                        /* register fake (internal) client on source stream */
                        streams.addClient(chan, fakeClient);

                        /* register new transcoding channel and attach actual client to it */
                        streams.addChan("trans-" + chan, transcodedChan, sourceStream.headers,
                                        function() {
                                                fakeClient.end();

                                                /* FIXME: hackish, for some reason end
                                                 *  doesn't always trigger this */
                                                streams.killClient(chan, fakeClient);
                                        });
                        streams.addClient("trans-" + chan, res);

                        /* start encoding */
                        new ffmpeg({ source: fakeClient })
                                .withVideoCodec('libx264')
                                .withAudioCodec('libmp3lame')
                                .withSize('320x240')
                                .fromFormat('mpegts')
                                .toFormat('mpegts')
                                .writeToStream(transcodedChan);
                }, function() {
                        res.send(503, "Failed to start stream");
                });
        });
});

app.get('/stream/:chan', function(req, res) {
        var chan = req.params.chan;

        changlue.get_chan(chan, function(liveStream) {
                res.set(liveStream.headers);
                streams.addClient(chan, res);
        }, function(err) {
                if (err == "NotFound")
                        res.send(404, "not found");
                else
                        res.send(503, "Failed to start stream");
        });
});

app.listen(1234);
