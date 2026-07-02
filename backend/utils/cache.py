import time
import threading

class SimpleCache:
    def __init__(self, default_timeout=300): # 300 seconds = 5 minutes
        self.cache = {}
        self.default_timeout = default_timeout
        self.lock = threading.Lock()

    def get(self, key):
        """
        Retrieves a value from the cache. Returns None if key is missing or expired.
        """
        with self.lock:
            if key not in self.cache:
                return None
            data = self.cache[key]
            if time.time() > data['expires']:
                del self.cache[key]
                return None
            return data['value']

    def set(self, key, value, timeout=None):
        """
        Pushes a key-value pair into the cache with an expiration window.
        """
        if timeout is None:
            timeout = self.default_timeout
        with self.lock:
            self.cache[key] = {
                'value': value,
                'expires': time.time() + timeout
            }

    def delete(self, key):
        """
        Removes a key from cache.
        """
        with self.lock:
            if key in self.cache:
                del self.cache[key]

    def clear(self):
        """
        Wipes all cache keys.
        """
        with self.lock:
            self.cache.clear()

# Global cache instance
mandi_cache = SimpleCache(default_timeout=300)
