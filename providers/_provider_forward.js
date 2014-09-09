module.exports = ForwardProvider;

var streams = require(__base + 'lib/stream-manager');
var IptvProvider = require('./iptv_provider');

util.inherits(ForwardProvider, IptvProvider);

function ForwardProvider(chan) {
        this._channel = chan;

        ForwardProvider.super_.call(this, null);
}

ForwardProvider.prototype._get_stream = function(cb) {
        if (!streams.hasChan(this._channel)) {
                config.channels[this._channel].start(this._channel);
        }

        this._fake_client = new (stream.PassThrough)({allowHalfOpen: false});
        streams.addClient(this._channel, this._fake_client, "forwarder");

        cb(null, { stream: this._fake_client });
};

ForwardProvider.prototype._end_stream = function(current_stream) {
        if (this._fake_client) {
                this._fake_client.end();
                streams.killClient(this._channel, this._fake_client);
        }
};

