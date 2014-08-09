var http = require('http');
var libxmljs = require('libxmljs');

require('array.prototype.find');

module.exports = VlcProvider;

var IptvProvider = require('./iptv_provider');

util.inherits(VlcProvider, IptvProvider.Http);

function VlcProvider(control_url, stream_url, opts) {
        VlcProvider.super_.call(this, opts);

        this._control_url = control_url;
        this._stream_url = stream_url;
}

/* VLC channel control helper: find channel in playlist */
VlcProvider.prototype._get_chanid = function(control_url, channel, cb) {
        var xml = "";

        var req = http.request(control_url + "/requests/playlist.xml", function (res) {
                res.on('data', function(chunk) {
                        xml += chunk;
                });

                res.on('end', function () {
                        var xmlDoc = libxmljs.parseXmlString(xml);

                        /* eg: leaf[@name="FBX: France 2 HD (TNT)"]/@id' */
                        var res = xmlDoc.get("//leaf[@name=\"" + channel + "\"]");

                        if (!res) {
                                console.log("VLC_GET_CHANID: " + channel + " not found !");
                        } else {
                                var id = res.attr("id").value();
                                console.log("VLC_GET_CHANID: " + id); 
                                cb(id);
                        }
                });
        });
        
        req.end();
}

VlcProvider.prototype._get_url = function(url_callback) {
        var control_url = this._control_url;
        var stream_url = this._stream_url;

        this._get_chanid(control_url, this._channel, function(id) {
                var req = http.request(control_url +
                                       "/requests/status.xml?command=pl_play&id=" + id,
                                       function(res)
                        {
                                console.log("PROVIDER: VLC server returned " + res.statusCode);
                                if (res.statusCode == 200)
                                        url_callback(stream_url);
                                else
                                        url_callback(undefined);
                        });

                req.end();
        });
};


VlcProvider.prototype._release = function() {
        var req = http.request(this._control_url + "/requests/status.xml?command=pl_stop", function(res) {
                console.log("PROVIDER: stopped " + this._control_url);
        }.bind(this));

        req.end();
};
