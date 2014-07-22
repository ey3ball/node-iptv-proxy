
function decode_authdata(headers) {
        var username = "";
        try {
                username = new Buffer(headers['authorization'].replace("Basic ",""), 'base64')
                        .toString().split(':')[0];
        } catch(e) {
                username = "none";
        }

        return username;
}

function get_http_stats(client) {
        try {
                return {
                        sent: client.socket.bytesWritten,
                        remoteAddr: client.req.headers['x-forwarded-for']
                                    || client.req.connection.remoteAddress,
                        remotePort: client.socket.remotePort,
                        username: decode_authdata(client.req.headers)
                };
        } catch(e) {
                return {
                        sent: 0,
                        remoteAddr: "127.0.0.1",
                        remotePort: 0,
                        username: "internal"
                };
        }
}

module.exports = {
        get_stream_stats: get_http_stats,
        get_authdata: decode_authdata
};
