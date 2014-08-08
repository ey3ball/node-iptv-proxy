module.exports = ProviderMultiSrc;

var IptvProvider = require('./iptv_provider');

util.inherits(ProviderMultiSrc, IptvProvider.Pool);

function ProviderMultiSrc(providers, opts) {
        ProviderMultiSrc.super_.call(this, providers, opts);
}

ProviderMultiSrc.prototype.bindChan = function(channel) {
        throw new "bindChan not allowed on MultiSource provider";
}
