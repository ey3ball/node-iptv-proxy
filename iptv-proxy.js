http = require('http');
url = require('url');
require('array.prototype.findindex');
util = require('util');

channels = require('./channels_config');

/*
 * Stream dispatcher:
 * Keeps track of current video streams and clients.
 *
 * Video stream data is forwarded to the dispather, and then
 * to all subscribed clients. 
 */
streams = {
        current: [], 

        /* Register a new channel with the stream dispatcher
         *
         * Channels are held in the "current" array for later
         * reference
         */
        addChan: function (id, handle, head) {
                this.current.push({
                        "id": id,
                        "handle": handle,
                        "headers": head,
                        "clients": []
                });
        },

        findChan: function(id) {
                found = this.current.findIndex(function (el) {
                        if (el.id == id)
                                return true;
                        return false;
                });

                if (found == -1)
                        return undefined;
                else return { idx: found, obj: this.current[found] };
        },

        hasChan: function(id) {
                return (this.findChan(id) != undefined);
        },

        killChan: function(id) {
                console.log("KILLCHAN: " + id);

                stream = this.findChan(id);

                if (!stream)
                        return;

                stream.obj.handle.abort();

                channels[id].stop();

                this.current.splice(stream.idx, 1);
        },

        addClient: function(chan_id, client_handle) {
                stream = this.findChan(chan_id).obj;

                if (!stream)
                        return;

                var idx = stream.clients.push(client_handle);

                client_handle.on('close', function() {
                        console.log("CLOSE: " + chan_id + " " + idx);

                        this.killClient(chan_id, client_handle);
                }.bind(this));
        },

        killClient: function(chan_id, handle) {
                var stream = this.findChan(chan_id).obj;

                var found = stream.clients.findIndex(function (el) {
                        if (el == handle)
                                return true;
                        return false;
                });

                if (found == -1)
                        return;

                console.log("CLOSED: " + found);
                stream.clients.splice(found, 1);

                if (!stream.clients.length)
                        this.killChan(chan_id);
        },

        sendData: function(id, chunk) {
                stream = this.findChan(id);

                if (!stream) {
                        console.log("DATA: stream not found");
                        return;
                }

                stream.obj.clients.map(function(el) {
                        el.write(chunk, 'binary');
                });
        }
};

srv = http.createServer(function(req, rsp) {
        console.log("PROXY: ready");

        var path = url.parse(req.url).path.split("/");

        path.shift();
        if (path[0] != "stream") {
                console.log("PROXY: " + path[0] + " not found");

                rsp.writeHead(404);
                rsp.end();
                return;
        }

        var chan = path[1]; 
        if (!channels[chan]) {
                console.log("PROXY: channel " + chan + " not found");

                rsp.writeHead(404);
                rsp.end();
                return;
        }

        if (streams.hasChan(chan)) {
                console.log("STREAM: channel " + chan + " already subscribed");

                var stream = streams.findChan(chan);
                rsp.writeHead(200, stream.obj.headers);
                streams.addClient(chan, rsp);

                return;
        }

        console.log("START !!");
        channels[chan].start(function(stream) {
                console.log("STREAM: " + stream);

                if (!stream) {
                        rsp.writeHead(503);
                        rsp.end();

                        return;
                }

                var req = http.request(stream, function(res) {
                        console.log("STREAM: " + stream + " got: " + res.statusCode);

                        rsp.writeHead(200, res.headers);

                        streams.addChan(chan, this, res.headers);
                        streams.addClient(chan, rsp);

                        res.on('end', function() {
                                streams.killChan(chan);
                        });

                        res.on('data', function(chunk) {
                                streams.sendData(chan, chunk);
                        });
                });

                req.end();
        });

        // var req = http.request("http://www.google.com", function(res) {
        //         rsp.writeHead(200, res.headers);
        //         console.log(res.headers);
        //         res.on('end', function() {
        //                 console.log('end');
        //                 rsp.end();
        //         });

        //         res.on('data', function(chunk) {
        //                 console.log('data');
        //                 rsp.write(chunk, 'binary');
        //         });
        // });

        // req.end();
}).listen(1234);
