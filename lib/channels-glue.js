streams = require(__base + 'lib/stream-manager');

/*
 * Attempt to get an already streaming channel
 */
function try_chan(chan, cb) {
        /* check channel existence */
        if (!streams.hasChan(chan) && !config.channels[chan]) {
                console.log("CHECK_CHAN: channel " + chan + " not found");

                cb("NotFound", null);
                return;
        }

        /* subscribe already started channel stream */
        if (streams.hasChan(chan)) {
                console.log("CHECK_CHAN: channel " + chan + " ready, stream");

                var liveStream = null;
                // var liveStream = streams.findChan(chan).obj;
                cb(null, { stream: liveStream } );
                return;
        }

        cb("NotStarted", null);
}

/*
 * Similar to try_chan, but try harder : is the channel isn't there,
 * start it up
 */
function get_chan(chan, cb) {
        try_chan(chan, function (err, data) {
                if (err == "NotStarted") {
                        config.channels[chan].start(chan, function(err, data) {
                                if (err) {
                                        cb("StartFailed:" + err, data);
                                        return;
                                }

                                console.log("fire: " + data);
                                cb(null, data);
                        });
                } else if (err) {
                        cb(err, null);
                } else {
                        cb(null, data);
                }
        });
}

module.exports = {
        try_chan: try_chan,
        get_chan: get_chan
}
