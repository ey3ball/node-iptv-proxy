module.exports = HttpProvider;

var IptvProvider = require('./iptv_provider');
var util = require('util');
var http = require('http');

util.inherits(HttpProvider, IptvProvider);

/*
 * The HttpProvider cannot be used directly. It is a base class that enables
 * implenting an IptvProvider by simply providing a means to determine a stream
 * url (_get_url and _release).
 *
 * It implements all the necessary http legwork (handling http errors, etc) and
 * lets the actual provider with the simple task of returning an URL
 * corresponding to the desired channel.
 */
function HttpProvider(opts) {
        HttpProvider.super_.call(this, opts);
}

HttpProvider.prototype._get_stream = function(cb) {
        function stream_url(url) {
                var req = http.request(url, function(res) {
                        console.log("CHAN_GET: " + url + " " + res.statusCode);

                        cb(null, { stream: res });
                });

                req.on('error', function(e) {
                        console.log("CHAN: " + url + " failed to stream - " + e.message);

                        cb("GetStream failed");
                });

                req.end();
        };

        if (!this._fixed_url) {
                this._get_url(function(err, data) {
                        if (err) {
                                cb("Could not GetUrl");
                                return;
                        }

                        stream_url(data.url);
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
