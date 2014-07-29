/*
 * Stream dispatcher:
 * Keeps track of current video streams and clients.
 *
 * Video stream data is forwarded to the dispatcher, and then
 * to all subscribed clients. 
 */

Leaky = require(__base + 'lib/leaky-duplex');
uuid = require('node-uuid');

module.exports = {
        current: [], 

        /* Register a new channel with the stream dispatcher
         *
         * Channels are held in the "current" array for later
         * reference
         *
         * id: identifier (eg: channel name)
         * inputStream: readable data stream
         * headers: http headers (including content-type)
         * stop: callback stop function, trigerred when all clients
         *       have disconnected
         *
         * // FIXME: remove clients ? Dupes the list of piped streams
         * clients: initially empty, contains the list of connected
         *          clients.
         */
        addChan: function (id, readableStream, head, stop) {
                var idx = this.current.push({
                        "id": id,
                        "inputStream": readableStream,
                        "stop": stop,
                        "headers": head,
                        "clients": []
                });

                /* register cleanup routines on stream completion */
                readableStream.on('end', function() {
                        console.log("CHAN_END: " + id);
                        this.killChan(id);
                }.bind(this));

                readableStream.on('error', function(e) {
                        console.log("CHAN_ERROR: " + e.message);
                        if (!this.killChan(id))
                                stop();
                }.bind(this));

                return this.current[idx-1];
        },

        /*
         * Stop a channel stream
         */
        killChan: function(id) {
                console.log("CHAN_KILL: " + id);

                /* find chan and terminate it */
                chan = this.findChan(id);
                if (!chan)
                        return false;

                /* kill any remaining client first */
                if (chan.obj.clients.length) {
                        var tokill = [];

                        tokill = chan.obj.clients.map(function (el) {
                                return { id: id, handle: el };
                        });

                        tokill.map(function(e) {
                                this.killClient(e.id, e.handle);
                        }.bind(this));

                        /* return, in that case the last client will kill the channel */
                        return true;
                }

                this.current.splice(chan.idx, 1);

                if (chan.obj.stop)
                        chan.obj.stop();

                return true;
        },

        /*
         * Subscribe a client to a running channel stream
         */
        addClient: function(chan_id, client_handle, type) {
                try {
                        chan = this.findChan(chan_id).obj;
                } catch(e) {
                        return;
                }

                if (!type)
                        type = "unspecified"
                client_handle.client_type = type;
                client_handle.uuid = uuid.v4();
                client_handle.client_added = Date.now();

                var idx = chan.clients.push(client_handle);
                console.log("ADD_CLIENT: " + chan_id + " id " + idx);

                chan.inputStream.pipe(new Leaky()).pipe(client_handle);

                client_handle.on('close', function() {
                        console.log("CLIENT_CLOSE: " + chan_id + " " + idx);

                        this.killClient(chan_id, client_handle);
                }.bind(this));
        },

        /*
         * Unsubscribe client from channel stream.
         * Stops channel when there is no remaining client
         */
        killClient: function(chan_id, handle) {
                var chan = this.findChan(chan_id);

                /* an hanged client might close its connexion
                 * after the channel has been killed */
                if (!chan)
                        return;

                chan = chan.obj;

                var found = chan.clients.findIndex(function (el) {
                        if (el == handle)
                                return true;
                        return false;
                });

                if (found == -1)
                        return;

                if (handle.end)
                        handle.end();

                chan.clients.splice(found, 1);

                console.log("CLOSED: " + found);

                if (!chan.clients.length)
                        this.killChan(chan_id);
        },

        /* internal routines */
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
        }
};
