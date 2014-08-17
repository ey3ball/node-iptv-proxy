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

ProviderPool.prototype._try_provider = function(chan_id, provider, cb) {
        var self = this;

        console.log("try_provider " + util.inspect(provider));

        if (!provider.available()) {
                cb("Not available anymore, next");
                return;
        }

        this._current_provider = provider;
        return provider._startAsync(chan_id, function(err, data) {
                if (err) {
                        self._stop_event();
                        cb(err);
                        return;
                }

                provider.once('stopped', self._stop_event.bind(self));

                cb(null, data);
        }, true);
}

ProviderPool.prototype._startAsync = function(chan_id, cb, async) {
        console.log("pool start" + util.inspect(this));
        if (this._current_provider || this._up()._started)
                cb("InUse " + this._current_provider + " - " + this._up()._started);

        this._up()._started = true;

        if (!async)
                streams.createChan(chan_id);

        console.log("start");
        var candidates = this.providers.filter(function(el) {
                var ok = el.available();
                console.log("check " + ok);
                return ok;
        }).reverse();

        if (!candidates.length) {
                console.log("noprovider");
                this._up()._started = false;
                console.log("nope " + util.inspect(this));
                return cb("No slot available")
        }

        function try_next(err, data) {
                if (err && candidates.length) {
                        if (err != "FirstTry")
                                console.log("POOL: provider failed, falling back to next one");

                        this._try_provider(chan_id, candidates.pop(), try_next.bind(this));
                        return;
                } else if (err) {
                        if (async)
                                cb(err, data);
                        else
                                streams.killChan(chan_id);
                }
        };

        try_next.bind(this)("FirstTry", null);

        if (!async)
                cb(null, null);
};

ProviderPool.prototype.start = function(chan_id, cb) {
        this._startAsync(chan_id, cb, false);
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
