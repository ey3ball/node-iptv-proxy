module.exports = ProviderPool;

var IptvProvider = require('./iptv_provider');

util.inherits(ProviderPool, IptvProvider);

/*
 * A ProviderPool is a provider implementing load balancing of multiple
 * channels on a set of existing, *homogen* providers. By Homogen we mean that
 * underlying providers must:
 *      - All be of the same type
 *      - All provider the same set of channels
 *
 * In order to serve a channel from multiple heterogen providers a more generic
 * MultiSource balancing provider must be used
 */
function ProviderPool(providers, opts) {
        this.providers = providers;

        this._g = {};
        this._up()._started = false;
}

ProviderPool.prototype.add = function(provider) {
        if (!this.providers || !this.providers.length) {
                this.providers = [ provider ];
        } else {
                this.providers.push(provider);
        }

        console.log("add");
        console.log(util.inspect(this.providers));

        return this;
};

ProviderPool.prototype.bindChan = function(channel) {
        var free_pool = this.providers;

        function _bound() {
                var i = 1;
                this.providers = free_pool.map(function(el) {
                        var newp = el.bindChan(channel);
                        newp.id = i++;
                        return newp;
                });
        }

        /* The generic Pooled provider does not hold
         * any state, its rather is in fact a composite
         * state comprised of the state of any member
         * provider plus the state of the particular
         * bound instance related to the current channel
         * Hence _g should stay empty, the state lies
         * elsewhere */
        this._up = function() {
                return this;
        };

        _bound.prototype = this;

        return new _bound();
};

ProviderPool.prototype._stop_event = function() {
        console.log(this + " stop event received");

        this._current_provider = undefined;
        this._up()._started = false;
        this.emit('stopped');
};

ProviderPool.prototype.start = function(chan_id, cb) {
        console.log("pool " + util.inspect(this));
        if (this._current_provider || this._up()._started)
                cb("InUse");

        this._up()._started = true;

        console.log("start");
        var provider = this.providers.find(function(el) {
                var ok = el.available();
                console.log("check " + ok);
                return ok;
        });

        console.log("found " + util.inspect(provider));

        if (!provider) {
                console.log("noprovider");
                this._up()._started = false;
                console.log("nope " + util.inspect(this));
                return cb("No slot available")
        } else {
                var self = this;

                console.log("gotprovider");
                this._current_provider = provider;
                return provider.start(chan_id, function(err, data) {
                        if (err) {
                                self._stop_event();
                                cb(e);
                                return;
                        }

                        provider.once('stopped', self._stop_event.bind(self));

                        cb(null, data);
                });
        }
};

ProviderPool.prototype.stop = function() {
        if (!this._current_provider)
                throw new "NotStarted";

        this._current_provider.stop();
};

ProviderPool.prototype.available = function() {
        return this.providers.some(function(el) {
                return (el.available());
        });
};
