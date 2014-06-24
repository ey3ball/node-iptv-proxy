vlc = require('./providers/vlc-chan');

/*
 * List available channels.
 *
 * Each channel is registered using a setup function that
 * returns a live stream url.
 */
var channels = {
        "fr2_hd": vlc.chan("localhost", "FBX: France 2 HD (TNT)"), 
        "fr5_hd": vlc.chan("localhost", "FBX: France 5 (HD)") 
};

module.exports = channels;
