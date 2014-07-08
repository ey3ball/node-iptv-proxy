channels = require('../channels_config');
streams = require('../lib/stream-manager');

/*
 * FIRE: grab a channel from a config and light it up !
 * This is an useful glue between providers and the stream
 * manager.
 *
 *  chan: channel name/id
 *  ok_cb: success callback
 *  err_cb: error callback
 */
function fire(chan, ok_cb, err_cb) {
        function addHTTPChan(id, http_req) {
                streams.addChan(id, http_req.res, http_req.res.headers,
                                function() { http_req.abort() });
        }

        channels[chan].start(function(stream) {
                console.log("STREAM: " + stream);

                if (!stream) {
                        err_cb();
                        return;
                }

                var req = http.request(stream, function(res) {
                        console.log("STREAM: " + stream + " got: " + res.statusCode);

                        addHTTPChan(chan, this);

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

                        ok_cb(res);
                });

                req.on('error', function(e) {
                        console.log("STREAM: failed to start - " + e.message);

                        /* cleanup */
                        channels[chan].stop();
                });

                req.end();
        });
}

module.exports = {
        fire: fire
}
