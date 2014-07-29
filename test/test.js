global.__base = __dirname + '/../';

var assert = require("assert");
var util = require("util");
var IptvProvider = require(__base + "providers/iptv_provider.js");

describe('DummyProvider', function() {
        function DummyProvider(opts) {
                DummyProvider.super_.call(this, opts);
        };

        util.inherits(DummyProvider, IptvProvider);

        DummyProvider.prototype._make_stream = function(ok) { ok() };
        DummyProvider.prototype._end_stream = function() { };

        describe('#stop()', function() {
                it('should fail if .start has not occured', function() {
                        assert.throws((new DummyProvider()).stop, Error);
                })
        });

        describe('#start()', function() {
                var dummy = new DummyProvider();

                it('should fail when .chan has not been called', function(done) {
                        dummy.start(function () { throw "Err" }, function () { done() });
                })
        });
});
