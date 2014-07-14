module.exports = {
        /* default profile must be defined and point to an existing profile */
        "default": "medium",

        /* low profile, 320x- resolution with strict 200k overall bitrate */
        "low": function(ffmpeg) {
                return ffmpeg
                        .withVideoCodec('libx264')
                        .withVideoBitrate('196k', true)
                        .withAudioCodec('libmp3lame')
                        .withAudioBitrate('32k')
                        .withAudioChannels(2)
                        .withSize('320x?');
        },

        /* medium, 576x- resolution with strict 600k overall bitrate */
        "medium": function (ffmpeg) {
                return ffmpeg
                        .withVideoCodec('libx264')
                        .withVideoBitrate('500k', true)
                        .withAudioCodec('libmp3lame')
                        .withAudioBitrate('96k')
                        .withAudioChannels(2)
                        .withSize('576x?');
        },

        /* high, 720x- resolution with 900k overall bitrate */
        "high": function(ffmpeg) {
                return ffmpeg
                        .withVideoCodec('libx264')
                        .withVideoBitrate('800k', false)
                        .withAudioCodec('libmp3lame')
                        .withAudioBitrate('96k')
                        .withAudioChannels(2)
                        .withSize('720x?');
        },

        /* use this method to restrict the list of exposed profile */
        "disable": function(profile) {
                this[profile] = null;

                return this;
        }
};
