Ringbuffer = new require('ringbufferjs');
Duplex = new require('stream').Duplex;

util = require('util');

util.inherits(Leaky, Duplex);

function Leaky(opt) {
        Duplex.call(this, opt);

        this._rb = new Ringbuffer(10);
        this._wants_data = false;
}

Leaky.prototype._write = function(chunk, encoding, done) {
        this._rb.enq(chunk);

        if (this._wants_data)
                this._wants_data = this.push(this._rb.deq());

        done();
}

Leaky.prototype._read = function (size) {
        var go = true;

        while (!this._rb.isEmpty() && go) {
                go = this.push(this._rb.deq());
        }

        this._wants_data = true;
}

module.exports = Leaky;
