A simple proxy for live IPTV streams written in NodeJS

## Initial goal

This proxy was originally written as a frontend for VLC's HTTP Streaming
interface. The initial goal was to play elements from a VLC instance converting
IPTV RTSP streams to HTTP and grabing the requested channel depending on the
incoming url.
As soon as a client disconnected, we would send a "stop command" to VLC in
order to avoid reading the IPTV source uselessly.

For instance accessing "http://localhost:1234/stream/france2" would :
  * Access VLC's control interface and locate the "France2" channel in the playlist
  * Start playing this channel
  * Forward the stream to the client
  * When the client disconnects, send a "Stop" command to VLC

## Current features

This has evolved to a more generic IPTV proxy able to read from several
backends. Currently we support the following IPTV sources :

  * VLC (for instance used as an HTTP<->RTSP relay)
  * VDR + StreamDev
  * Simple HTTP urls

Our proxy will restream video from any of these sources while enabling :

  * Load balancing
  * On-the-fly Transcoding
  * "Live"-Caching : if two clients request the same stream, only one upstream
    connection will be used
  * Precise client statistics

See README.fbx.md for an example setup involving VLC and "Freebox" (French IPTV
provider) channels.

One typical use case is to restream channels offered by your IPTV provider to a
mobile device outside of your home. For instance to watch sport events while in
transit ;)

## License

See LICENSE.md
