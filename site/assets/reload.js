// Development only: reload the page when `kit site serve` rebuilds.
new EventSource('/_kit/events').addEventListener('rebuilt', () => location.reload());
