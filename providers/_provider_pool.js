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
}

ProviderPool.prototype.add = function(provider) {
        if (!this.providers || !this.providers.length) {
                this.providers = [ provider ];
        } else {
                this.providers.push(provider);
        }

        return this;
};

ProviderPool.prototype.bindChan = function(channel) {
        var new_pool = new ProviderPool(this.providers.map(function(el) {
                return el.bindChan(channel);
        }));
        return new_pool;
};

ProviderPool.prototype.start = function(chan_id, ok_cb, err_cb) {
        if (this._current_provider)
                throw new Error("InUse");

        var provider = this.providers.find(function(el) {
                console.log(util.inspect(el.__proto__));
                return (el._g._started == false);
        });

        if (!provider) {
                return err_cb("No slot available")
        } else {
                this._current_provider = provider;
                return provider.start(chan_id, ok_cb, err_cb);
        }
};

ProviderPool.prototype.stop = function() {
        if (!this._current_provider)
                throw new Error();

        this._current_provider.stop();
        this._current_provider = false;
};
