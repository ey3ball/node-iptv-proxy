module.exports = IptvProvider;

streams = require(__base + 'lib/stream-manager');

IptvProvider.Http = require('./_provider_http');

function IptvProvider(opts) {
        if (!opts)
                return;

        if (opts.channel)
                this._channel = opts.channel;
}

IptvProvider.prototype.start = function(ok_cb, err_cb) {
        var chan = this._channel;

        if (!this._channel) {
                return err_cb("No channel selected");
        }

        if (this._started) {
                throw new Error("InUse");
        }

        this._started = true;

        /* function addHTTPChan(id, http_req) {
                streams.addChan(id, http_req.res, http_req.res.headers,
                                function() {
                                        http_req.abort();
                                        config.channels[chan].stop();
                                });
        } */

        this._get_stream(function (stream) {
                this._cur_stream = stream;

                var added = streams.addChan(chan, stream, stream.headers, function() {
                        this._end_stream(stream);
                        this.stop();
                }.bind(this));

                ok_cb(added);
        }, function(e) {
                this._started = false;
                err_cb(e);
        });
};

IptvProvider.prototype.stop = function() {
        if (!this._started)
                throw new Error();

        this._end_stream(this._cur_stream);

        this._cur_stream = undefined;
        this._started = false;
};

IptvProvider.prototype.chan = function (channel) {
        if (!IptvProvider.prototype.chan_warned)
                IptvProvider.prototype.chan_warned = true;

        console.log(".chan() is deprecated, please use .bindChan()");

        this.bindChan(channel);
};

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

IptvProvider.prototype.toString = function() {
        return this._channel;
};

/*
 * Any IptvProvider must implement all methods below
 *      - _make_stream: create a stream and pass it down to stream_db
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
