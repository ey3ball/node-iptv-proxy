streams = require(__base + 'lib/stream-manager');

/*
 * Attempt to get an already streaming channel
 */
function try_subscribe(chan) {
        /* check channel existence */
        if (!streams.hasChan(chan) && !config.channels[chan]) {
                console.log("CHECK_CHAN: channel " + chan + " not found");

                throw "NotFound";
        }

        /* subscribe already started channel stream */
        if (streams.hasChan(chan)) {
                console.log("CHECK_CHAN: channel " + chan + " ready, stream");

                return;
        }

        throw "NotStarted";
}

function start_chan(chan) {
        var ret = config.channels[chan].start(chan);

        console.log("fire: " + ret);
}

/*
 * Similar to try_chan, but try harder : is the channel isn't there,
 * start it up
 */
function do_subscribe(chan) {
        try {
                return try_subscribe(chan);
        } catch (e) {
                if (e == "NotStarted") {
                        return config.channels[chan].start(chan);
                }

                throw e;
        }
}

module.exports = {
        try_subscribe: try_subscribe,
        do_subscribe: do_subscribe
}
