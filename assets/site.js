// NORPPA — общий скрипт для всех страниц концепта
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];

// страховка: если браузер не проиграл анимацию появления, показываем всё через 2 секунды
setTimeout(() => document.documentElement.classList.add("shown"), 2000);

// ---------- мобильное меню ----------
const hdr = $("#hdr"), burger = $("#burger"), menu = $("#menu");
burger.addEventListener("click", () => {
  const o = menu.classList.toggle("open");
  burger.setAttribute("aria-expanded", o);
  burger.textContent = o ? "Закрыть" : "Меню";
  hdr.classList.toggle("menu-open", o);
});

// ---------- шапка и параллакс ----------
const hasHero = document.body.dataset.hero === "dark";
const hero = $(".hero, .pghero.full"), seal = $("#seal"), layers = $("#layers");
let ticking = false;
function onScroll(){
  hdr.classList.toggle("scrolled", !hasHero || scrollY > innerHeight * .8);
  if (ticking) return; ticking = true;
  requestAnimationFrame(() => {
    const vh = innerHeight;
    if (!reduce){
      if (hero) hero.style.setProperty("--hp", Math.min(1, scrollY / vh).toFixed(3));
      if (seal){ const r = seal.getBoundingClientRect(); seal.style.setProperty("--sp", Math.max(-1, Math.min(1, (vh/2 - (r.top + r.height/2)) / vh)).toFixed(3)); }
      if (layers){ const r = layers.getBoundingClientRect(); layers.style.setProperty("--lp", Math.max(0, Math.min(1, (vh*.85 - r.top) / (r.height*.7))).toFixed(3)); }
    }
    ticking = false;
  });
}
addEventListener("scroll", onScroll, {passive:true}); onScroll();
if (reduce && layers) layers.style.setProperty("--lp", 1);

// подсветка слоя куртки при наведении на подпись
$$(".ly-list li").forEach(li => {
  const plate = $(`.plate[data-i="${li.dataset.i}"]`);
  if (!plate) return;
  li.addEventListener("mouseenter", () => plate.classList.add("hl"));
  li.addEventListener("mouseleave", () => plate.classList.remove("hl"));
});

// ---------- появление блоков ----------
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); } }), {threshold:.15});
$$(".rv").forEach(el => io.observe(el));

// ---------- ленты: перетаскивание мышью ----------
$$(".rail").forEach(rail => {
  let down = false, sx = 0, sl = 0;
  rail.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse") return; down = true; sx = e.clientX; sl = rail.scrollLeft; rail.classList.add("drag"); });
  addEventListener("pointermove", e => { if (down) rail.scrollLeft = sl - (e.clientX - sx); });
  addEventListener("pointerup", () => { down = false; rail.classList.remove("drag"); });
});

// ---------- фирменные магазины ----------
const STORES = [
  {city:"Санкт-Петербург", nm:"ТРК «Жемчужная плаза»", addr:"Петергофское ш., 51А, 2 этаж", hrs:"Ежедневно 10:00–22:00", tel:"+7 (812) 336-87-26", mail:"shopnorppa51@yandex.ru"},
  {city:"Санкт-Петербург", nm:"ТРК «Голливуд»", addr:"Коломяжский пр., 22, 2 этаж", hrs:"Ежедневно 10:00–22:00", tel:"+7 (812) 336-87-46", mail:"shopnorppa22@yandex.ru"},
  {city:"Санкт-Петербург", nm:"ТРЦ «Галерея»", addr:"Лиговский пр., 30А", hrs:"Ежедневно 10:00–23:00", tel:"+7 (812) 336-87-47", mail:"shopnorppa30@yandex.ru"},
  {city:"Санкт-Петербург", nm:"Невский проспект", addr:"Невский пр., 108", hrs:"Ежедневно 10:00–22:00", tel:"+7 (812) 336-87-27", mail:"shopnorppa31@yandex.ru"},
  {city:"Санкт-Петербург", nm:"Ленинский проспект", addr:"Ленинский пр., 120", hrs:"Пн–сб 10:00–21:00, вс 11:00–21:00", tel:"+7 (812) 336-87-13", mail:"shopnorppa120@yandex.ru"},
  {city:"Санкт-Петербург", nm:"Парашютная", addr:"Парашютная ул., 43с1", hrs:"Ежедневно 11:00–21:00", tel:"+7 (812) 336-87-03", mail:"shopnorppa43@yandex.ru", outlet:true},
  {city:"Москва", nm:"ТРК «Европолис»", addr:"пр. Мира, 211 к2, 2 этаж", hrs:"Ежедневно 10:00–22:00", tel:"+7 (495) 230-57-97", mail:"shopnorppa211@yandex.ru"},
  {city:"Москва", nm:"ТРЦ «Коламбус»", addr:"Кировоградская ул., 13А", hrs:"Ежедневно 10:00–22:00", tel:"+7 (495) 191-64-68", mail:"shopnorppa13@yandex.ru"},
  {city:"Самара", nm:"Молл «Парк Хаус»", addr:"Московское ш., 81Б, 2 этаж, секция 2/29", hrs:"Ежедневно 10:00–22:00", tel:"+7 (917) 141-73-10", mail:"parkhaus2@yandex.ru"}
];
const storeList = $("#store-list");
if (storeList){
  const withMail = storeList.dataset.mail === "1";
  const show = city => {
    $$("[data-st]").forEach(b => b.setAttribute("aria-pressed", b.dataset.st === city));
    storeList.innerHTML = STORES.filter(s => s.city === city).map(s => `
      <div class="store">
        <h3>${s.nm}${s.outlet ? '<span class="badge">аутлет</span>' : ""}</h3>
        <span class="addr">${s.addr}</span><span class="hrs">${s.hrs}</span>
        <div class="row"><a href="tel:${s.tel.replace(/[^+\d]/g,"")}">${s.tel}</a>
        <a href="https://yandex.ru/maps/?text=${encodeURIComponent(s.city + ", " + s.addr)}" target="_blank" rel="noopener">Маршрут</a></div>
        ${withMail ? `<a class="mail" href="mailto:${s.mail}">${s.mail}</a>` : ""}
      </div>`).join("");
  };
  $$("[data-st]").forEach(b => b.addEventListener("click", () => show(b.dataset.st)));
  show("Санкт-Петербург");
}

// ---------- cookie ----------
const ck = $("#cookie");
let seen = null; try { seen = localStorage.getItem("norppa-cookie"); } catch(e){}
if (!seen) ck.classList.add("show");
const closeCk = v => { try { localStorage.setItem("norppa-cookie", v); } catch(e){} ck.classList.remove("show"); };
$("#ck-yes").onclick = () => closeCk("all");
$("#ck-no").onclick = () => closeCk("required");

// ---------- панель «Что изменено» ----------
const demo = $("#demo"), openB = $("#demo-open");
const setDemo = o => { demo.classList.toggle("open", o); demo.setAttribute("aria-hidden", !o); openB.setAttribute("aria-expanded", o); (o ? $("#demo-close") : openB).focus(); };
openB.onclick = () => setDemo(true);
$("#demo-close").onclick = () => setDemo(false);
addEventListener("keydown", e => { if (e.key === "Escape" && demo.classList.contains("open")) setDemo(false); });

// ---------- форма заявки: письмо на office@norppa.ru ----------
$$("form[data-mailto]").forEach(f => f.addEventListener("submit", e => {
  e.preventDefault();
  const st = $(".form-status", f), need = $$("[required]", f).filter(x => !x.value.trim());
  if (need.length){ st.className = "form-status err"; st.textContent = "Заполните отмеченные поля — без них мы не сможем связаться с вами."; need[0].focus(); return; }
  const body = $$("input,textarea,select", f).filter(x => x.name && x.value.trim()).map(x => `${x.dataset.label || x.name}: ${x.value.trim()}`).join("\n");
  location.href = `mailto:${f.dataset.mailto}?subject=${encodeURIComponent(f.dataset.subject || "Заявка с сайта")}&body=${encodeURIComponent(body)}`;
  st.className = "form-status"; st.textContent = "Письмо с заявкой открыто в вашей почте. Нажмите «Отправить» — мы ответим в рабочий день.";
}));
