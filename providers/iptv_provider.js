module.exports = IptvProvider;

streams = require(__base + 'lib/stream-manager');

IptvProvider.Http = require('./_provider_http');
IptvProvider.Url = require('./_provider_url');
IptvProvider.StreamDev = require('./_provider_streamdev');
IptvProvider.Vlc = require('./_provider_vlc');

/*
 * IptvProvider base class for all iptv stream sources
 *
 * opts:
 *   opts.channel: channel name as set by bindChan(),
 *     this can be used to bind at initialization time.
 *
 * public methods:
 *   start(id, ok_cb, err_cb): attempt to start channel. Callback with a node
 *     stream if successfull.
 *   stop(): stop current stream
 */
function IptvProvider(opts) {
        /* the _g is for "global". this is used to store private
         * properties that remain shared between shallow copies
         * of IptvProvider objects.
         * This is the reason why bindChan can work properly and
         * specialize a single provider into child channel providers */
        this._g = { };
        this._g._started = false;

        if (!opts)
                return;

        if (opts.channel)
                this._channel = opts.channel;
}

IptvProvider.prototype.start = function(chan_id, ok_cb, err_cb) {
        if (!this._channel) {
                return err_cb("No channel selected");
        }

        if (this._g._started) {
                throw new Error("InUse");
        }

        this._g._started = true;

        this._get_stream(function (stream) {
                this._g._cur_stream = stream;

                var added = streams.addChan(chan_id, stream, stream.headers, function() {
                        this._end_stream(stream);
                        this.stop();
                }.bind(this));

                ok_cb(added.inputStream);
        }.bind(this), function(e) {
                this._g._started = false;
                err_cb(e);
        }.bind(this));
};

IptvProvider.prototype.stop = function() {
        if (!this._g._started)
                throw new Error();

        this._end_stream(this._g._cur_stream);

        this._g._cur_stream = undefined;
        this._g._started = false;
};

IptvProvider.prototype.chan = function (channel) {
        if (!IptvProvider.prototype.chan_warned)
                IptvProvider.prototype.chan_warned = true;

        console.log(".chan() is deprecated, please use .bindChan()");

        this.bindChan(channel);
};

/*
 * Bind provider to a specific channel.
 *
 * The channel parameter is an identifier that will be used by the underlying
 * provider to select the appropriate source channel. For instance with a VLC
 * provider, it will be the name of the channel as found in the current
 * playlist.
 *
 * The advantage of selecting a channel with this method is that a single
 * stream provider can used to support multiple channels (each call to bind
 * returns a object specialized for a given channel, but still bound to the
 * original provider). This is particularly useful with sources that don't
 * support load balancing. You can expose all channels and get a "lock" for
 * free that will prevent any attempt to overuse the source.
 */
IptvProvider.prototype.bindChan = function(channel) {
        /*
         * wrap the current provider and bind it to a specific
         * channel. the underlying provider remains unique and
         * will be shared between all bound channels.
         */
        function _bound(channel) {
                this._channel = channel;
        }

        _bound.prototype = this;

        return new _bound(channel);
};

/*
 * Provide an user-friendly channel name for playlist generation
 */
IptvProvider.prototype.toString = function() {
        return this._channel;
};

/*
 * Any IptvProvider must implement all methods below
 *      - _make_stream: create a stream and pass it down to stream_cb
 *      - _end_stream: stop a running stream
 */
IptvProvider.prototype._get_stream = function(stream_cb, err_cb) {
        console.log("_make_stream undefined");

        throw "Meh";
};

IptvProvider.prototype._end_stream = function(current_stream) {
        console.log("_end_stream undefined");

        throw "Meh";
};
