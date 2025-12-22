const getWsUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}/ws`;
};

const WS_URL = getWsUrl();
console.log('WebSocket URL:', WS_URL);

class WebSocketClient {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000;
  }

  connect(token) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    console.log('Connecting to WebSocket:', WS_URL);
    this.ws = new WebSocket(WS_URL);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.send({ type: 'auth', token });
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.notifyListeners(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.attemptReconnect(token);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  attemptReconnect(token) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
      setTimeout(() => this.connect(token), this.reconnectDelay);
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  addListener(id, callback) {
    this.listeners.set(id, callback);
  }

  removeListener(id) {
    this.listeners.delete(id);
  }

  notifyListeners(data) {
    this.listeners.forEach((callback) => callback(data));
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const wsClient = new WebSocketClient();