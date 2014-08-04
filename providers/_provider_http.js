module.exports = HttpProvider;

var IptvProvider = require('./iptv_provider');
var util = require('util');
var http = require('http');

util.inherits(HttpProvider, IptvProvider);

function HttpProvider(opts) {
        HttpProvider.super_.call(this, opts);
}

HttpProvider.prototype._get_stream = function(stream_cb, err_cb) {
        function stream_url(url) {
                var req = http.request(url, function(res) {
                        console.log("CHAN_GET: " + url + " " + res.statusCode);

                        stream_cb(res);
                });

                req.on('error', function(e) {
                        console.log("CHAN: " + chan + " failed to start - " + e.message);

                        /* config.channels[chan].stop() */;
                        err_cb();
                });

                req.end();
        };

        if (!this._fixed_url) {
                this._get_url(function(url) {
                        stream_url(url);
                }, function () {
                        err_cb();
                });
        } else {
                stream_url(this._fixed_url);
        }
};

HttpProvider.prototype._end_stream = function(stream_ref) {
        if (!this._fixed_url)
                this._release();

        return stream_ref.req.abort();
};

HttpProvider.prototype._get_url = function(url_callback) {
        console.log("_get_url undefined");

        throw "Meh";
};

HttpProvider.prototype._release = function() {
        console.log("_release undefined");

        throw "Meh";
};
