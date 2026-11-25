(function (root) {
  const retryDelays = [2000, 4000, 8000, 16000, 32000];
  const policy = Object.freeze({
    nextDelay(attempt, status) {
      if ([401, 403, 409].includes(status)) return null;
      return retryDelays[attempt - 1] ?? null;
    },
    changed(remoteVersion, localVersion) {
      return Boolean(remoteVersion && remoteVersion !== localVersion);
    },
  });
  root.ContainerSyncPolicy = policy;
  if (typeof module !== "undefined") module.exports = policy;
})(typeof window !== "undefined" ? window : globalThis);
