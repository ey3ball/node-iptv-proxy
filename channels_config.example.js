vlc = require('./providers/vlc-chan');

/*
 * List available channels.
 *
 * Each channel is registered using a setup function that
 * returns a live stream url.
 */
var channels = {
        "fr2_hd": vlc.chan("FBX: France 2 HD (TNT)", "localhost"),
        "fr5_hd": vlc.chan("FBX: France 5 (HD)", "localhost")
};

module.exports = channels;
