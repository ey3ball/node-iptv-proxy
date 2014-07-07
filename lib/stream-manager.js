/*
 * Stream dispatcher:
 * Keeps track of current video streams and clients.
 *
 * Video stream data is forwarded to the dispatcher, and then
 * to all subscribed clients. 
 */

module.exports = {
        current: [], 

        /* Register a new channel with the stream dispatcher
         *
         * Channels are held in the "current" array for later
         * reference
         *
         * id: identifier (eg: channel name)
         * stream: readable data stream
         * head: http headers (including content-type)
         * stop: callback stop function, trigerred when all clients
         *       have disconnected
         */
        addChan: function (id, readableStream, head, stop) {
                this.current.push({
                        "id": id,
                        "inputStream": readableStream,
                        "stop": stop,
                        "headers": head,
                        "clients": []
                });
        },

        /*
         * Stop a channel stream
         */
        killChan: function(id) {
                console.log("KILLCHAN: " + id);

                stream = this.findChan(id);
                if (!stream)
                        return;

                this.current.splice(stream.idx, 1);

                if (stream.obj.stop)
                        stream.obj.stop();

                channels[id].stop();
        },

        /*
         * Subscribe a client to a running channel stream
         */
        addClient: function(chan_id, client_handle) {
                try {
                        stream = this.findChan(chan_id).obj;
                } catch(e) {
                        return;
                }

                var idx = stream.clients.push(client_handle);

                stream.inputStream.pipe(client_handle);

                client_handle.on('close', function() {
                        console.log("CLOSE: " + chan_id + " " + idx);

                        this.killClient(chan_id, client_handle);
                }.bind(this));
        },

        /*
         * Unsubscribe client from channel stream.
         * Stops channel when there is no remaining client
         */
        killClient: function(chan_id, handle) {
                var stream = this.findChan(chan_id);

                /* an hanged client might close its connexion
                 * after the channel has been killed */
                if (!stream)
                        return;

                stream = stream.obj;

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
