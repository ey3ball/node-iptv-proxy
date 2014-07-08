# Stream Free/Freebox channels with VLC

Freebox Multiposte is using RTSP on the local network.
VLC is a straight-forward solution to convert these RTSP streams to the more
friendly HTTP protocol.

1. Getting the freebox RTSP *channels list*
    * `curl http://mafreebox.freebox.fr/freeboxtv/playlist.m3u > channels.m3u`

2. *Starting VLC*
  
  In this example, we use the following parameters:
    * port 8080 to control the VLC interface
    * port 8090 to get the http stream
    * A password (mandatory starting from VLC 2.1) 'mypassword'

  `vlc ./channels.m3u --sout '#http{mux=ts,dst=:8090/}' -I http --http-port 8080 --http-password mypassword --no-playlist-autostart`

3. *Expanding channels.m3u*
  
  By default, VLC does not expand the playlists, so node-iptv-proxy will only see
  1 stream: channels.m3u So you need to do it yourself like this:

  `curl -u:mypassword "http://[VLC SERVER IP]:8080/requests/status.xml?command=pl_play&id=4" > /dev/null`

4. *node-iptv-proxy configuration*
  
  Here is an example configuration file, with 2 VLC servers running on localhost
  with ports 8080/8090 and 8081/8091:

```JavaScript
function make_host(index) {
        return {
                control_url: "http://:mypassword@localhost:808" + index,
                stream_url: "http://:mypassword@localhost:809" + index
        };
}

var vlc1 = vlc.server(make_host(1));
var vlc2 = vlc.server(make_host(2));

var vlc_pool = [ vlc1, vlc2 ];

var multichan_config = {
        "france2hd": vlc.chan("2 - France 2 (HD)").pool(vlc_pool),
        "france3hd": vlc.chan("3 - France 3 (HD)").pool(vlc_pool)
};

module.exports = multichan_config;
```
