import time


class Timer:
    def __init__(self):
        self._start_time = None
        self._end_time = None
        
    def start(self):
        self._start_time = time.perf_counter()
        return self
        
    def stop(self):
        self._end_time = time.perf_counter()
        return self
        
    def elapsed_ms(self) -> int:
        end = self._end_time or time.perf_counter()
        if self._start_time is None:
            return 0
        return int((end - self._start_time) * 1000)
