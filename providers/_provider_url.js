module.exports = UrlProvider;

var IptvProvider = require('./iptv_provider');

util.inherits(UrlProvider, IptvProvider.Http);

function UrlProvider(url, opts) {
        /* hardcode channel = url, relaxing the need to manually
         * set a name using .chan */
        if (!opts)
                opts = {};
        if (!opts.channel)
                opts.channel = url;

        UrlProvider.super_.call(this, opts);

        this._fixed_url = url;
}
