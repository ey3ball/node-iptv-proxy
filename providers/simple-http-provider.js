module.exports = {
        chan: function(url) {
                return {
                        "start": function(play_cb) {
                                play_cb(url);
                        },
                        "stop": function() {
                                return;
                        }
                };
        }
}
