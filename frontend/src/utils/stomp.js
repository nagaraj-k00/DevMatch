// Native browser STOMP over WebSocket client with zero external dependencies
export class SimpleStompClient {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.subscriptions = new Map(); // destination -> Map(subId, callback)
    this.connected = false;
  }

  connect(headers, onConnected, onError) {
    try {
      // Connect to port 8080 backend directly or through proxy
      let wsUrl = this.url;
      if (!wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://')) {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // Check if dev server with backend on 8080
        const host = window.location.port === '5173' ? `${window.location.hostname}:8080` : window.location.host;
        wsUrl = `${protocol}//${host}${this.url}`;
      }

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.ws.send('CONNECT\naccept-version:1.1,1.2\nheart-beat:10000,10000\n\n\0');
      };

      this.ws.onmessage = (event) => {
        const raw = event.data;
        if (typeof raw !== 'string') return;

        // A single WebSocket frame may contain multiple STOMP frames separated by \0
        const frames = raw.split('\0');
        for (const frame of frames) {
          const trimmed = frame.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith('CONNECTED')) {
            this.connected = true;
            if (onConnected) onConnected();
            // Re-subscribe any pending subscriptions
            this.subscriptions.forEach((subs, destination) => {
              subs.forEach((cb, subId) => {
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                  this.ws.send(`SUBSCRIBE\nid:${subId}\ndestination:${destination}\n\n\0`);
                }
              });
            });
          } else if (trimmed.startsWith('MESSAGE')) {
            const lines = trimmed.split('\n');
            let dest = '';
            let bodyStartIndex = trimmed.indexOf('\n\n');
            if (bodyStartIndex === -1) {
              bodyStartIndex = trimmed.indexOf('\r\n\r\n');
            }

            for (const line of lines) {
              if (line.toLowerCase().startsWith('destination:')) {
                dest = line.substring(line.indexOf(':') + 1).trim();
                break;
              }
            }

            const body = bodyStartIndex !== -1 ? trimmed.substring(bodyStartIndex).trim() : '';

            if (dest && this.subscriptions.has(dest)) {
              const subs = this.subscriptions.get(dest);
              subs.forEach((cb) => {
                try {
                  cb({ body, destination: dest });
                } catch (e) {
                  console.error('Error in STOMP callback', e);
                }
              });
            } else {
              // Dispatch to any subscriber matching prefix or all
              this.subscriptions.forEach((subs, subDest) => {
                if (!dest || dest === subDest) {
                  subs.forEach((cb) => {
                    try {
                      cb({ body, destination: dest });
                    } catch (e) {
                      console.error('Error in STOMP callback', e);
                    }
                  });
                }
              });
            }
          }
        }
      };

      this.ws.onerror = (e) => {
        if (onError) onError(e);
      };

      this.ws.onclose = () => {
        this.connected = false;
      };
    } catch (e) {
      if (onError) onError(e);
    }
  }

  subscribe(destination, callback) {
    const subId = 'sub-' + Math.random().toString(36).substring(2, 9);
    if (!this.subscriptions.has(destination)) {
      this.subscriptions.set(destination, new Map());
    }
    this.subscriptions.get(destination).set(subId, callback);

    if (this.ws && this.connected && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(`SUBSCRIBE\nid:${subId}\ndestination:${destination}\n\n\0`);
    }

    return {
      unsubscribe: () => {
        if (this.subscriptions.has(destination)) {
          this.subscriptions.get(destination).delete(subId);
        }
        if (this.ws && this.connected && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(`UNSUBSCRIBE\nid:${subId}\n\n\0`);
        }
      }
    };
  }

  send(destination, headers = {}, body = '') {
    if (!this.ws || !this.connected || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }
    let msg = `SEND\ndestination:${destination}\n`;
    for (const [k, v] of Object.entries(headers)) {
      msg += `${k}:${v}\n`;
    }
    msg += `\n${body}\0`;
    this.ws.send(msg);
    return true;
  }

  disconnect() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
    }
    this.connected = false;
    this.subscriptions.clear();
  }
}
