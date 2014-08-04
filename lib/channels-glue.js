streams = require(__base + 'lib/stream-manager');

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
                        config.channels[chan].start(function(httpStream) {
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
        try_chan: try_chan,
        get_chan: get_chan
}
