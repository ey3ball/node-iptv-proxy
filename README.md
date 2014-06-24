A simple proxy for live IPTV streams written in NodeJS

This proxy acts as a frontend for VLC's HTTP Streaming
interface. It will automatically play channels from
an IPTV playlist depending on the query URL, as well as
stop playback as soon as the connexion is killed.

In addition to this, it "caches" livestreams : if several
clients request the same channel, this proxy will only
use one connexion to the VLC streaming server.
In that case playback is only stopped once the last client
disconnects.
