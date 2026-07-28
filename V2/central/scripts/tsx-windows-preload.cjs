// Some Windows environments fail while tsx resolves the temporary cache path.
if (process.platform === 'win32') {
  // tsx prefers process.geteuid when available and otherwise calls os.userInfo.
  if (typeof process.geteuid !== 'function') {
    process.geteuid = () => 1000;
  }
  const Module = require('node:module');
  const originalLoad = Module._load;
  Module._load = function loadWithStableUserInfo(request, parent, isMain) {
    const loaded = originalLoad.call(this, request, parent, isMain);
    if (request === 'node:os' || request === 'os') {
      try {
        loaded.userInfo();
      } catch {
        Object.defineProperty(loaded, 'userInfo', {
          configurable: true,
          value: () => ({ username: process.env.USERNAME || 'autohome' }),
        });
      }
    }
    return loaded;
  };
}
