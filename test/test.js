global.__base = __dirname + '/../';

var assert = require("assert");
var util = require("util");
var express = require('express');
var IptvProvider = require(__base + "providers/iptv_provider");
var UrlProvider = require(__base + "providers/_provider_url");

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
                });
        });

        describe('#start()', function() {
                var dummy = new DummyProvider();

                it('should trigger an error when .chan has not been called', function(done) {
                        dummy._startAsync("fakeid", function (err, data) {
                                if (err)
                                        done();
                                else
                                        throw "FailTest";
                        });
                });
        });
});

describe('UrlProvider', function() {
        describe('#start()', function() {
                it('should return a stream somehow', function(done) {
                        (new UrlProvider("http://www.google.fr"))._startAsync("fakeid", function(err, data) {
                                if (err)
                                        throw "OperationFailed" + err;
                                if (!data.stream)
                                        throw "InvalidStream";
                                if (!data.stream.headers)
                                        throw "InvalidStream2";

                                done();
                        });
                });
        });
});


describe('VlcProvider', function() {
        var app = express();
        var Vlc = new IptvProvider.Vlc("http://127.0.0.1:1234", "http://127.0.0.1:1234");
        var VlcChan = Vlc.bindChan("Mirabelle TV (bas débit)");

        app.get('/requests/playlist.xml', function (req, res) {
                res.sendfile("vlc-playlist.xml", { 'root': __base + "test/" });
        });

        before(function(done) {
                app.listen(1234, "127.0.0.1", undefined, function () {
                        done();
                });
        });

        describe('#_get_chanid()', function() {
                it('should fetch a VLC playlist item properly', function(done) {
                        VlcChan._get_chanid(VlcChan._control_url, VlcChan._channel, function(err, data) {
                                if (!err && data.id == 228)
                                        done();
                                else
                                        throw "ParseError";
                        });
                });
        });

        describe('#_release()', function() {
                it('should send a stop command to VLC', function(done) {
                        app.get("/requests/status.xml", function(req, res) {
                                done();
                        });

                        VlcChan._release();
                });
        });
});
