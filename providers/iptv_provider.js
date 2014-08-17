module.exports = IptvProvider;

var EventEmitter = require('events').EventEmitter;

streams = require(__base + 'lib/stream-manager');

util.inherits(IptvProvider, EventEmitter);

/*
 * There are two types of providers :
 *   1) stream providers: these focuses on getting some live media from a
 *   backend, the media is produced in the form of a node stream. This kind of
 *   provider implements the _get_stream and _end_stream internal methods
 */
IptvProvider.Http = require('./_provider_http');
IptvProvider.Url = require('./_provider_url');
IptvProvider.StreamDev = require('./_provider_streamdev');
IptvProvider.Vlc = require('./_provider_vlc');

/*
 *  2) virtual providers: those focuses on implementing higher level features
 *  (such as load balacing). They re-implement the public API of the
 *  IptvProvider class. Such providers are mostly expected to ultimately act as
 *  proxies for actual stream providers.
 */
IptvProvider.Pool = require('./_provider_pool');
IptvProvider.MultiSrc = require('./_provider_multi_src');

/*
 * IptvProvider base class for all iptv stream sources
 *
 * opts:
 *   opts.channel: channel name as set by bindChan(),
 *     this can be used to bind at initialization time.
 *
 * public methods:
 *   start(id): attempt to start channel.
 *   stop(): stop current stream
 */
function IptvProvider(opts) {
        /* the _g is for "global". this is used to store private
         * properties that remain shared between shallow copies
         * of IptvProvider objects.
         * This is the reason why bindChan can work properly and
         * specialize a single provider into child channel providers
         *
         * _g must not be accessed directly but through .up() which
         * will direct calls to the correct context (channel local
         * or global)
         */
        this._g = { };
        // IptvProvider._up().call(this)._started = false;
        this._up()._started = false;

        if (!opts)
                return;

        if (opts.channel)
                this._channel = opts.channel;
}

IptvProvider.prototype._startAsync = function(chan_id, cb) {
        console.log("iptv start");
        if (!this._channel) {
                return cb("No channel selected", null);
        }

        if (this._up()._started) {
                return cb("InUse", null);
        }

        this._up()._started = true;

        if (!cb)
                streams.createChan(chan_id);

        this._get_stream(function (err, data) {
                if (err) {
                        this._up()._started = false;

                        if (cb) {
                                cb(err, data);
                        } else {
                                streams.killChan(chan_id);
                        }

                        return;
                }

                this._up()._cur_stream = data.stream;

                var added = streams.addChan(chan_id, data.stream, data.stream.headers, function() {
                        this._end_stream(data.stream);
                        this.stop();
                }.bind(this));

                if (cb)
                        cb(null, { stream: null });
        }.bind(this));

        return;
};

IptvProvider.prototype.start = function(chan_id) {
        this._startAsync(chan_id, undefined);
};

IptvProvider.prototype.stop = function() {
        if (!this._up()._started)
                throw new "NotStarted";

        this._end_stream(this._up()._cur_stream);

        this._up()._cur_stream = undefined;
        this._up()._started = false;

        this.emit('stopped');
};

/*
 * Available vs this.(_g).started:
 *
 * this.(_g).started keeps track of the current internal state for
 * a given (provider, chan) tuple. Its role is to prevent the same
 * channel from being started twice and hence starting an unecessary
 * stream
 *
 * available() on the other gives an indication regarding the readiness of the
 * provider backend. for simple providers such as http this is equivalent to
 * this.(_g).started, however for load balancing extensions, beeing available
 * means that we are able to find an available provider instance in the pool.
 * With a pooled channel, these concepts relate as follows :
 *
 * channel _started ?
 *      => available() instance in pool
 *              => underlying simple provider available() = not _started
 */
IptvProvider.prototype.available = function() {
        console.log("available ?");
        console.log(util.inspect(this));
        return !this._up()._started;
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
IptvProvider.prototype._get_stream = function(cb) {
        console.log("_make_stream undefined");

        throw "Meh";
};

IptvProvider.prototype._end_stream = function(current_stream) {
        console.log("_end_stream undefined");

        throw "Meh";
};

IptvProvider.prototype._up = function() {
        return this._g;
};
