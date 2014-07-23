streams = require(__base + 'lib/stream-manager');

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
                                function() {
                                        http_req.abort();
                                        config.channels[chan].stop();
                                });
        }

        config.channels[chan].start(function(stream_url) {
                console.log("CHAN_START: " + stream_url);

                if (!stream_url) {
                        err_cb();
                        return;
                }

                var req = http.request(stream_url, function(res) {
                        console.log("CHAN_GET: " + stream_url + " " + res.statusCode);

                        addHTTPChan(chan, this);
                        ok_cb(streams.findChan(chan).obj);
                });

                req.on('error', function(e) {
                        console.log("CHAN: " + chan + " failed to start - " + e.message);

                        config.channels[chan].stop();
                        err_cb();
                });

                req.end();
        });
}

/*
 * Attempt to get an already streaming channel
 */
function try_chan(chan, ok_cb, err_cb) {
        /* check channel existence */
        if (!streams.hasChan(chan) && !config.channels[chan]) {
                console.log("CHECK_CHAN: channel " + chan + " not found");

                err_cb("NotFound");
                return;
        }

        /* subscribe already started channel stream */
        if (streams.hasChan(chan)) {
                console.log("CHECK_CHAN: channel " + chan + " ready, stream");

                var liveStream = streams.findChan(chan).obj;
                ok_cb(liveStream);
                return;
        }

        err_cb("NotStarted");
}

/*
 * Similar to try_chan, but try harder : is the channel isn't there,
 * start it up
 */
function get_chan(chan, ok_cb, err_cb) {
        try_chan(chan, ok_cb, function (err) {
                if (err == "NotStarted") {
                        fire(chan, function(httpStream) {
                                console.log("fire: " + httpStream);
                                ok_cb(httpStream);
                        }, function() {
                                err_cb("StartFailed");
                        });
                } else {
                        err_cb(err);
                }
        });
}

module.exports = {
        fire: fire,
        try_chan: try_chan,
        get_chan: get_chan
}
