// Player-facing release notes, newest first. The first entry must match package.json.
export const CHANGELOG = [
  { version: '1.0.20', date: '2026-10-28', changes: [
    { type: 'improved', text: 'ลดส่วนตกแต่งที่ไม่ช่วยเล่น: หัวเรื่องซ้ำ พิกัดและสถานะจำลอง ข้อมูลกล้อง การ์ดวิทยุ และข้อความท้ายหน้า พร้อมใช้หัวข้อเตรียมภารกิจที่กระชับ' },
    { type: 'improved', text: 'พับปุ่มลองเสียงในการ์ดปืนไว้ใต้หัวข้อลองเสียง จัดลำดับให้การซื้อและสลับอาวุธเด่นขึ้น' },
    { type: 'improved', text: 'ย่อหน้าพักระลอกและข้อความร้าน ใช้ป้ายสถิติภาษาไทย พร้อมลดการตกแต่งและการขยับของการ์ดอัปเกรด' },
  ] },
  { version: '1.0.19', date: '2026-10-28', changes: [
    { type: 'improved', text: 'แยกจอยซ้ายเดินออกจากทิศปืน กดปุ่มยิงค้างแล้วยิงทันทีตามทิศเล็งล่าสุด ขยับนิ้วขวาเพื่อปรับทิศได้ โดยไม่มีเล็งหรือล็อกเป้าอัตโนมัติ' },
    { type: 'improved', text: 'ปล่อยปุ่มยิงแล้วจำทิศเล็งสำหรับการยิงครั้งถัดไป นิ้วขยับเล็กน้อยไม่เปลี่ยนทิศหรือหยุดยิง พร้อมอัปเดตบทสอนและคู่มือ' },
  ] },
  { version: '1.0.18', date: '2026-10-28', changes: [
    { type: 'improved', text: 'ลดไอคอนการ์ดอัปเกรดเป็น 20 พิกเซลทั้งมือถือและเดสก์ท็อป พร้อมลดช่องว่างเหนือชื่ออัปเกรด' },
  ] },
  { version: '1.0.17', date: '2026-10-28', changes: [
    { type: 'improved', text: 'ย่อหน้าเริ่มเกม ใช้ไอคอนเลือด ความเร็ว การควบคุม และหูฟังแทนข้อความรอง พร้อมรวมค่าตัวละครเป็นแถวเดียว' },
    { type: 'improved', text: 'ลดหัวเรื่องและช่องไฟบนมือถือ ซ่อนข้อมูลตกแต่งท้ายหน้า ให้เข้าถึงปุ่มเริ่มเล่นได้เร็วขึ้น โดยคงคำอธิบายสำหรับโปรแกรมอ่านหน้าจอ' },
  ] },
  { version: '1.0.16', date: '2026-10-28', changes: [
    { type: 'improved', text: 'หน้าเริ่มเกมใช้พื้นที่เต็มขึ้น เลิกจำกัดคอลัมน์เลือกตัวละครและความยากไว้แค่ 460 พิกเซล พร้อมปุ่มเริ่มเต็มความกว้าง' },
    { type: 'improved', text: 'จัดหน้าเตรียมภารกิจบนมือถือและแท็บเล็ตใหม่ ลดเนื้อหาซ้ำ ปรับการ์ดตัวละคร ช่องไฟ และพื้นหลังให้อ่านง่ายขึ้น' },
  ] },
  { version: '1.0.15', date: '2026-10-28', changes: [
    { type: 'improved', text: 'ขยับจอยและชุดปุ่มมือถือเข้าจากขอบด้านข้าง 28–48 พิกเซล และยกจากขอบล่าง 32 พิกเซล เพิ่มระยะเผื่อนิ้วรวมกับพื้นที่ปลอดภัยของเครื่อง ทั้งแนวตั้ง แนวนอน และเต็มจอ' },
    { type: 'improved', text: 'ขยับปุ่มพักเกมและข้อความแจ้งเตือนตามชุดควบคุม เพื่อรักษาระยะห่างจากปุ่มต่อสู้' },
  ] },
  { version: '1.0.14', date: '2026-10-28', changes: [
    { type: 'improved', text: 'มือถือใช้จอยซ้ายเดินและหันทิศ กดปุ่มยิงค้างได้ทันที หยุดเดินแล้วยิงตามทิศล่าสุด ไม่มีเล็งหรือล็อกเป้าอัตโนมัติ' },
    { type: 'improved', text: 'จัดระยะปุ่มสัมผัสและปุ่มพักเกมใหม่ พร้อมชื่อไทยสำหรับวิ่งและรีโหลด และเว้นขอบจอมือถือ' },
    { type: 'improved', text: 'หน้าพักเวฟแสดงรายละเอียดและคำสั่งเลือกอัปเกรดชัดขึ้น ร้านอาวุธมีปุ่มกลับเต็มความกว้างบนมือถือ' },
    { type: 'improved', text: 'ปรับป้ายสถานะและพื้นที่เล่นแนวนอนบนจอเตี้ยให้ใช้พื้นที่หน้าจอได้มากขึ้น' },
  ] },
  { version: '1.0.13', date: '2026-10-27', changes: [
    { type: 'fixed', text: 'เมื่อกระสุนหมด ใช้อาวุธประชิดที่ติดตั้งไว้ต่อเนื่อง ไม่กลับเป็นมีดหลังตีจบ ทั้งภาพ ดาเมจ ชื่อ และวงระยะตรงกับอาวุธที่เลือก' },
    { type: 'fixed', text: 'เก็บกระสุนแล้วกลับไปรีโหลดปืนเดิมได้ตามปกติ โดยยังจำอาวุธประชิดที่ติดตั้งไว้' },
  ] },
  { version: '1.0.12', date: '2026-10-27', changes: [
    { type: 'fixed', text: 'รวมมีดฉุกเฉินเมื่อกระสุนหมดกับระบบร้านประชิด และป้องกันโจมตีซ้อนระหว่างสองระบบ' },
  ] },
  { version: '1.0.11', date: '2026-10-27', changes: [
    { type: 'improved', text: 'ท่าตีประชิดมีจังหวะง้าง เร่งฟาด และคืนท่า พร้อมแขนจับอาวุธและลำตัวบิดตามแรง มีดใช้ท่าแทงและอาวุธหนักใช้สองมือ' },
    { type: 'improved', text: 'ภาพอาวุธผ่านทิศเล็งตรงจังหวะทำดาเมจ พร้อมรอยฟาดเฉพาะช่วงเหวี่ยง และรูปทรงแยกตามอาวุธทั้ง 6 ชิ้น' },
  ] },
  { version: '1.0.10', date: '2026-10-27', changes: [
    { type: 'improved', text: 'ท่าแทงมีดขยับแขน ง้างมือ แทงเร็ว และดึงกลับ พร้อมใบมีดมีมิติและวงระยะที่จางลง' },
    { type: 'new', text: 'กระสุนในแมกและสำรองหมดจะเปลี่ยนเป็นมีดอัตโนมัติ ใช้ปุ่มโจมตีเดิมเพื่อฟันระยะประชิด พร้อมวงแสดงระยะ' },
    { type: 'improved', text: 'เก็บกระสุนขณะถือมีดแล้วกลับไปถือปืนเดิมและเริ่มรีโหลดอัตโนมัติ' },

    { type: 'new', text: 'เริ่มทุกภารกิจพร้อมมีดสนามฟรี ตีประชิดด้วย F หรือปุ่มตีบนมือถือ' },
    { type: 'new', text: 'ร้านเพิ่มหมวดประชิด ซื้อชะแลง ไม้เบสบอล ขวานดับเพลิง ค้อนปอนด์ และดาบคาตานะ ติดตั้งคู่กับปืนได้ 1 ชิ้น' },
    { type: 'new', text: 'อาวุธประชิดมีระยะ มุมกวาด จังหวะง้างและแรงผลักต่างกัน พร้อมภาพฟาด เสียง และสถานะคูลดาวน์' },
    { type: 'improved', text: 'คู่มืออธิบายการตีและซื้อประชิด การตีไม่ใช้กระสุน แต่ยกเลิกรีโหลดและหยุดยิงระหว่างท่า' },
  ] },
  { version: '1.0.9', date: '2026-10-27', changes: [
    { type: 'new', text: 'กดป้ายเวอร์ชันมุมขวาบนเพื่อดูบันทึกการอัปเดต และมีจุดเตือนเมื่อมีเวอร์ชันใหม่' },
    { type: 'new', text: 'ปุ่ม “กันจอดับ” ให้หน้าจอมือถือไม่ดับระหว่างเล่น' },
    { type: 'new', text: 'ถามยืนยันก่อนออกจากรอบที่ยังไม่จบ เพื่อไม่ให้เสียเงิน ปืน และอัปเกรดโดยไม่ตั้งใจ' },
    { type: 'improved', text: 'เลือกตัวละครและความยากในหน้าเดียวก่อนเริ่ม และสอนวิธีลากยิงก่อนเล่นครั้งแรกบนจอสัมผัส' },
    { type: 'improved', text: 'ข้อความในเกมสั้นลงให้พอดีจอมือถือ และใช้ฟอนต์ชุดเดียวกันทั้งไทยและอังกฤษ' },
    { type: 'improved', text: 'ป้ายเตือนบอสเป็นสีแดงและสั่นให้สังเกตง่าย' },
    { type: 'fixed', text: 'ปุ่มเต็มจอบนมือถือใช้ได้แม้เบราว์เซอร์ไม่รองรับ และมีปุ่มออกให้เห็นตลอด' },
  ] },
  { version: '1.0.8', date: '2026-10-26', changes: [
    { type: 'improved', text: 'บนมือถือ สนามขยายเต็มความกว้างจอ เห็นรอบตัวได้กว้างขึ้น และซ่อนแถบข้างระหว่างเล่น' },
    { type: 'improved', text: 'จอย ปุ่มสัมผัส และแถบสถานะใช้สีโปร่งนุ่มตาขึ้น ตัวเลขและเป้าเล็งยังอ่านชัด' },
  ] },
  { version: '1.0.7', date: '2026-10-26', changes: [
    { type: 'improved', text: 'คอมพิวเตอร์ที่มีทั้งเมาส์และจอสัมผัสเริ่มด้วยเมาส์และคีย์บอร์ด' },
    { type: 'improved', text: 'สลับโหมดตามการใช้งานจริง แตะจอเพื่อเปิดปุ่มสัมผัส คลิกเมาส์ในสนามเพื่อกลับมาและยิงได้ทันที' },
  ] },
  { version: '1.0.6', date: '2026-10-26', changes: [
    { type: 'improved', text: 'ต้องลากนิ้วออกจากจุดเริ่มให้ชัดก่อนจึงจะยิง กันยิงพลาดจากนิ้วขยับเล็กน้อย' },
    { type: 'improved', text: 'ลากนิ้วกลับมากลางปุ่มยิงเพื่อหยุดยิง' },
  ] },
  { version: '1.0.5', date: '2026-10-26', changes: [
    { type: 'improved', text: 'เป้าเล็งบนมือถือเป็นศูนย์เล็งสีฟ้า วงรอบบอกความแม่นยำ และเปลี่ยนเป็นสีอำพันขณะรีโหลด' },
    { type: 'improved', text: 'ปุ่มยิงมีศูนย์เล็งเลื่อนตามนิ้วและป้าย “ลากยิง”' },
  ] },
  { version: '1.0.4', date: '2026-10-26', changes: [
    { type: 'improved', text: 'เลิกล็อกเป้าอัตโนมัติบนมือถือ ต้องลากเลือกทิศก่อนจึงจะยิง' },
  ] },
  { version: '1.0.3', date: '2026-10-26', changes: [
    { type: 'new', text: 'บนมือถือ กดปุ่มยิงค้างแล้วลากเพื่อเล็งและยิงไปทิศนั้น พร้อมลูกศรและกรวยบอกทิศยิง' },
  ] },
  { version: '1.0.2', date: '2026-10-26', changes: [
    { type: 'improved', text: 'ปุ่มบนจอสัมผัสกดง่ายขึ้นและใช้หลายนิ้วพร้อมกันได้ เดินไปยิงไปได้' },
    { type: 'improved', text: 'เริ่มด้วยกระสุน 18 นัดและสำรอง 54 นัด กล่องกระสุนเพิ่ม 12 นัด สำรองได้สูงสุด 120 นัด' },
    { type: 'improved', text: 'ยืนนิ่งยิงแม่นที่สุด เดิน วิ่ง หรือยิงรัวทำให้กระสุนกระจาย' },
  ] },
  { version: '1.0.1', date: '2026-10-26', changes: [
    { type: 'new', text: 'แสดงเลขเวอร์ชันของเกมที่มุมขวาบน' },
    { type: 'improved', text: 'RANGER R8, JUDGE 44, BASTION M60 และ LONGWATCH 50 ใช้เสียงยิงที่บันทึกจากของจริงชุดใหม่' },
    { type: 'improved', text: 'เพิ่มเสียงบรรยากาศสยองขวัญแบบบันทึกจริง และคุมระดับเสียงที่ดังเกินไม่ให้แตก' },
  ] },
  { version: '1.0.0', date: '2026-10-23', changes: [
    { type: 'new', text: 'เอาตัวรอดจากซอมบี้ให้ครบ 10 เวฟเพื่อไปถึงจุดอพยพ เลือกความยากได้ 3 ระดับ' },
    { type: 'new', text: 'เลือกตัวละครได้ ผู้หญิง (SCOUT) เร็วแต่เลือดน้อย หรือผู้ชาย (GUARD) ถึกแต่ช้า' },
    { type: 'new', text: 'บอสประจำทุกเวฟ หน้าตาต่างกันทั้ง 10 ตัว มีวงเตือนก่อนทุบพื้น พ่นกรด และพุ่งชน' },
    { type: 'new', text: 'ร้านปืนระหว่างเวฟ ซื้อปืน 8 กระบอกด้วยเงินจากการกำจัดซอมบี้' },
    { type: 'new', text: 'ซอมบี้ 3 แบบ ตัวทั่วไป ตัววิ่ง และตัวถึก รูปร่างและเสียงต่างกัน' },
    { type: 'new', text: 'ฉาก 10 แบบพร้อมสภาพอากาศ สุ่มลำดับทุกรอบ และสุ่มที่กำบังใหม่ทุกเวฟ' },
    { type: 'new', text: 'เสียงยิงจริงแยกตามปืน เสียงรีโหลด และเสียงหัวใจเต้นเมื่อเลือดน้อยหรือสู้บอส' },
    { type: 'new', text: 'ปุ่มควบคุมอิงตำแหน่งบนคีย์บอร์ด เล่นได้แม้เปิดแป้นภาษาไทยอยู่' },
  ] },
];

export const CHANGE_TYPES = { new: 'ใหม่', improved: 'ปรับ', fixed: 'แก้' };
export const SEEN_VERSION_KEY = 'dead-frequency-seen-version';
const MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

export function releaseDate(date) {
  const [year, month, day] = date.split('-').map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

function releaseNotes(document, { version, date, changes }, latest) {
  const release = document.createElement('details'), summary = document.createElement('summary'), list = document.createElement('ul');
  const name = document.createElement('strong'), time = document.createElement('time');
  release.className = 'release'; release.open = latest;
  name.textContent = `V${version}`;
  time.dateTime = date; time.textContent = releaseDate(date);
  summary.append(name, time);
  if (latest) { const tag = document.createElement('span'); tag.className = 'release-latest'; tag.textContent = 'ล่าสุด'; summary.append(tag); }
  for (const { type, text } of changes) {
    const item = document.createElement('li'), label = document.createElement('b'), copy = document.createElement('span');
    label.className = `change-type change-${type}`; label.textContent = CHANGE_TYPES[type];
    copy.textContent = text;
    item.append(label, copy); list.append(item);
  }
  release.append(summary, list);
  return release;
}

// getStorage may throw when the browser blocks site data; the notes still open.
export function bindChangelog(button, list, { document, getStorage, open }) {
  const latest = CHANGELOG[0].version;
  let seen = null;
  try { seen = getStorage().getItem(SEEN_VERSION_KEY); } catch {}
  function update() {
    const unseen = seen !== latest;
    button.classList.toggle('has-update', unseen);
    button.setAttribute('aria-label', unseen ? `V${latest} · มีอัปเดตใหม่ · ดูบันทึกการอัปเดต` : `V${latest} · ดูบันทึกการอัปเดต`);
  }
  list.replaceChildren(...CHANGELOG.map((release, index) => releaseNotes(document, release, index === 0)));
  button.onclick = () => {
    seen = latest;
    try { getStorage().setItem(SEEN_VERSION_KEY, latest); } catch {}
    update(); open();
  };
  update();
}
