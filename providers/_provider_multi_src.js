module.exports = ProviderMultiSrc;

var IptvProvider = require('./iptv_provider');

util.inherits(ProviderMultiSrc, IptvProvider.Pool);

function ProviderMultiSrc(providers, opts) {
        ProviderMultiSrc.super_.call(this, providers, opts);
}

ProviderMultiSrc.prototype.bindChan = function(channel) {
        throw new "bindChan not allowed on MultiSource provider";
};

/*
 * The MultiSrc provider wraps a list of providers which have previously
 * been bindChan()'ed. This is in contrast with a Pool which wraps a list
 * of unbound providers and must eventually get bindChann()'ed itself.
 */

ProviderMultiSrc.prototype.available = function() {
        return (!this._up()._started
                        && this.super_.available.call(this));
};
