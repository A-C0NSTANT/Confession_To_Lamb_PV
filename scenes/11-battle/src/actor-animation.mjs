// Expression exposures and rigid movement use separate timelines. Switching
// float heads never restarts the shared body's position, scale or rotation.
function sampleKeys(keys, frame) {
  if (frame <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [end, b] = keys[i], [start, a] = keys[i - 1];
    if (frame <= end) {
      const u = (frame - start) / (end - start);
      const t = u * u * u * (u * (u * 6 - 15) + 10);
      return a + (b - a) * t;
    }
  }
  return keys.at(-1)[1];
}

function sampleLaugh(track, exposure, frame) {
  const [start, end] = exposure.motionFrom;
  const u = (frame - exposure.start) / Math.max(1, exposure.end - exposure.start - 1);
  const sourceFrame = start + u * (end - start - 1);
  const lo = Math.floor(sourceFrame), hi = Math.min(lo + 1, end - 1);
  const a = track[lo], b = track[hi], t = sourceFrame - lo;
  if (a?.kind !== 'laugh' || b?.kind !== 'laugh') throw new Error('Laugh motion must sample the laugh pose');
  const p = {kind: 'laugh', pivot: a.pivot, segment: exposure.start};
  for (const key of ['x', 'y', 'scale', 'angle']) p[key] = a[key] + (b[key] - a[key]) * t;
  return p;
}

export function createActorAnimation(data, config) {
  const poses = Array(data.frames).fill(null), motion = config.float;
  let next = data.cuts.battle;
  for (const exposure of config.exposures) {
    if (exposure.start !== next || exposure.end <= next || exposure.end > data.cuts.black) {
      throw new Error('Actor exposures must cover the battle without gaps or overlaps');
    }
    if (!['laugh', 'open', 'closed', 'threat'].includes(exposure.kind)) throw new Error('Unknown actor expression');
    for (let n = exposure.start; n < exposure.end; n++) {
      if (exposure.kind === 'threat' && data.effects[n].blocks < 1) {
        throw new Error(`Threat expression is restricted to battle glitch frames: ${n}`);
      }
      poses[n] = exposure.kind === 'laugh' ? sampleLaugh(data.tracks.actor, exposure, n) : {
        kind: exposure.kind,
        x: motion.x,
        y: sampleKeys(motion.yKeys, n),
        scale: motion.scale * sampleKeys(motion.zoomKeys, n),
        angle: motion.angleDegrees * Math.PI / 180,
        pivot: motion.pivot,
        segment: exposure.start
      };
    }
    next = exposure.end;
  }
  if (next !== data.cuts.black) throw new Error('Actor exposures must reach the final black frame');
  return poses;
}
