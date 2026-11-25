// One wiggle per complete gesture, regardless of pointermove event count.
// Taps and keyboard activation are equivalent to a swipe; direction never matters.
export function bindRescueInput(world, canRescue, rescue) {
  let gesture = null;
  let suppressPointerClick = false;
  const targetFor = event => event.target.closest?.('[data-bear-id]');
  const apply = () => {
    if (!gesture || gesture.applied) return;
    gesture.applied = true;
    suppressPointerClick = true;
    rescue(gesture.bearId);
  };
  // Mobile browsers can retarget a tap's compatibility click onto a newly
  // opened celebration button. Consume that click, not the next real tap.
  world.addEventListener('pointerdown', () => {
    if (!gesture) suppressPointerClick = false;
  }, true);
  world.addEventListener('click', event => {
    if (suppressPointerClick && event.detail > 0) {
      event.preventDefault();
      event.stopImmediatePropagation();
      suppressPointerClick = false;
    }
  }, true);
  world.addEventListener('pointerdown', event => {
    const target = targetFor(event);
    if (gesture || !target || (event.pointerType === 'mouse' && event.button !== 0)) return;
    const bearId = Number(target.dataset.bearId);
    if (!canRescue(bearId)) return;
    event.preventDefault();
    gesture = { pointerId: event.pointerId, bearId, x: event.clientX, y: event.clientY, target, applied: false };
    target.setPointerCapture(event.pointerId);
  });
  world.addEventListener('pointermove', event => {
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    event.preventDefault();
    if (Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) >= 20) apply();
  });
  world.addEventListener('pointerup', event => {
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    event.preventDefault();
    const bounds = gesture.target.getBoundingClientRect();
    const moved = Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) >= 20;
    const inside = event.clientX >= bounds.left - 16 && event.clientX <= bounds.right + 16 && event.clientY >= bounds.top - 16 && event.clientY <= bounds.bottom + 16;
    if (moved || inside) apply();
    gesture = null;
  });
  const cancel = event => { if (gesture?.pointerId === event.pointerId) gesture = null; };
  world.addEventListener('pointercancel', cancel);
  world.addEventListener('lostpointercapture', cancel);
  world.addEventListener('click', event => {
    const target = targetFor(event);
    // Native keyboard/assistive-tech clicks have detail 0. Pointer clicks are
    // already handled above, so must not count a second time.
    if (target && event.detail === 0 && canRescue(Number(target.dataset.bearId))) rescue(Number(target.dataset.bearId));
  });
  world.addEventListener('contextmenu', event => event.preventDefault());
  return () => { gesture = null; };
}
