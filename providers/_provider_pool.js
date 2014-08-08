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
        this._g._started = false;
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
                this.providers = free_pool.map(function(el) {
                        return el.bindChan(channel);
                });
        }

        _bound.prototype = this;

        return new _bound();
};

ProviderPool.prototype.start = function(chan_id, ok_cb, err_cb) {
        console.log("pool " + util.inspect(this));
        if (this._current_provider || this._g._started)
                throw new Error("InUse");

        this._g._started = true;

        console.log("start");
        var provider = this.providers.find(function(el) {
                console.log("check " + util.inspect(el._g._started));
                return (el._g._started == false);
        });

        console.log("found " + util.inspect(provider));

        if (!provider) {
                console.log("noprovider");
                this._g._started = false;
                console.log(util.inspect(this));
                return err_cb("No slot available")
        } else {
                var self = this;

                console.log("gotprovider");
                this._current_provider = provider;
                return provider.start(chan_id, function(stream) {
                        provider.once('stopped', function() {
                                console.log(self + " got stopped");
                                self._current_provider = undefined;
                                self._g._started = false;
                                self.emit('stopped');
                        });
                        ok_cb(stream);
                }, err_cb);
        }
};

ProviderPool.prototype.stop = function() {
        if (!this._current_provider)
                throw new Error();

        this._current_provider.stop();

        /* this._current_provider = undefined;
        this._g._started = false;*/
};
