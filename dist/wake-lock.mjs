export function bindWakeLock(button, { document, navigator, notify }) {
  let enabled = false, lock = null, pending = false;
  function update() {
    button.setAttribute('aria-pressed', String(enabled));
    button.textContent = lock && !lock.released ? 'กันจอดับ ✓' : enabled ? 'กันจอดับ รอ' : 'กันจอดับ';
    button.title = enabled ? 'ปิดการกันจอดับ' : 'เปิดหน้าจอค้างขณะอยู่ในเกม';
    button.disabled = pending;
  }
  async function acquire() {
    if (!enabled || document.hidden || pending || (lock && !lock.released)) return;
    pending = true; update();
    try {
      const next = await navigator.wakeLock.request('screen');
      if (!enabled || document.hidden) { await next.release(); return; }
      lock = next;
      next.addEventListener('release', () => { if (lock === next) { lock = null; update(); } });
    } catch {
      enabled = false;
      notify('เปิดกันจอดับไม่ได้ · ลองใช้ HTTPS หรือปิดโหมดประหยัดพลังงาน');
    } finally { pending = false; update(); }
  }
  button.onclick = async () => {
    enabled = !enabled;
    if (enabled) await acquire();
    else if (lock) {
      try { await lock.release(); }
      catch { enabled = true; notify('ปิดกันจอดับไม่สำเร็จ ลองอีกครั้ง'); }
    }
    update();
  };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) acquire(); });
  update();
  if (!navigator.wakeLock?.request) {
    button.disabled = true;
    button.textContent = 'กันจอดับไม่ได้';
    button.title = 'เบราว์เซอร์นี้ไม่รองรับกันจอดับ · ต้องเปิดผ่าน HTTPS';
  }
}
