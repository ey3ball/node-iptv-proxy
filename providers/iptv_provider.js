streams = require(__base + 'lib/stream-manager');

module.exports = IptvProvider;

function IptvProvider(options) {
        if (!options)
                return;

        if (options.channel)
                this.channel = channel;
}

IptvProvider.prototype.start = function(ok_cb, err_cb) {
        if (!this.channel) {
                return err_cb("No channel selected");
        }

        function addHTTPChan(id, http_req) {
                streams.addChan(id, http_req.res, http_req.res.headers,
                                function() {
                                        http_req.abort();
                                        config.channels[chan].stop();
                                });
        }


        this._make_stream(function (stream) {
                addHTTPChan(this.channel, stream);
                ok_cb(streams.findChan(chan).obj);
        }, err_cb);
};

IptvProvider.prototype.stop = function() {
        if (!this.started)
                throw new Error();

        return;
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
                this.channel = channel;
        }

        _bound.prototype = this;

        return new _bound(channel);
};

IptvProvider.prototype.toString = function() {
        return this.channel;
};

/*
 * Any IptvProvider must implement all methods below
 *      - _make_stream: create a stream and pass it down to stream_db
 *      - _end_stream: stop a running stream
 */
IptvProvider.prototype._make_stream = function(stream_cb, err_cb) {
        console.log("_make_stream undefined");

        throw "Meh";
};

IptvProvider.prototype._end_stream = function(current_stream) {
        console.log("_end_stream undefined");

        throw "Meh";
};
