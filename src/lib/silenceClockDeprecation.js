/* three.js r183+ logs "THREE.Clock: ... deprecated" on EVERY Clock
   construction. React Three Fiber 9.x still constructs one THREE.Clock
   per <Canvas> internally (we cannot patch that from app code), so the
   line would spam the console on any page that mounts a Canvas.

   Our own animation code does not use the deprecated Clock — it
   accumulates time from useFrame deltas (see ArcadeScene.jsx and
   JoinBackground.jsx). This module only suppresses that one exact,
   dependency-generated deprecation line; every other console message is
   forwarded untouched. */

const CLOCK_DEPRECATED_PREFIX = "THREE.Clock: This module has been deprecated";

const originalWarn = console.warn;

export function installClockDeprecationFilter() {
  console.warn = (...args) => {
    const first = args[0];
    if (typeof first === "string" && first.startsWith(CLOCK_DEPRECATED_PREFIX)) {
      return;
    }
    originalWarn(...args);
  };
}