// NORPPA — каталог, карточка товара и корзина (данные: assets/catalog-data.js)
(() => {
const IMG = "https://shop.norppa.ru/upload/iblock/";
const C = window.CATALOG || [];
const byId = Object.fromEntries(C.map(p => [p.id, p]));
const CAT = {women:"Женщинам", men:"Мужчинам", teen:"Подросткам", kids:"Детям", outlet:"Аутлет"};
const rub = n => n.toLocaleString("ru-RU") + " ₽";
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const kind = p => p.t.split(" ")[0];
const title = p => (p.m.replace(/\s*\([^)]*\)\s*/g, " ").trim().toLowerCase().replace(/^./, c => c.toUpperCase()));
const qs = new URLSearchParams(location.search);
const $ = (s, r = document) => r.querySelector(s);

// ---------- корзина (localStorage) ----------
const Cart = {
  get(){ try { return JSON.parse(localStorage.getItem("norppa-cart") || "[]"); } catch(e){ return []; } },
  set(v){ try { localStorage.setItem("norppa-cart", JSON.stringify(v)); } catch(e){} Cart.badge(); },
  add(id, color, size){ const c = Cart.get(); const f = c.find(x => x.id === id && x.color === color && x.size === size); f ? f.q++ : c.push({id, color, size, q:1}); Cart.set(c); },
  count(){ return Cart.get().reduce((s, x) => s + x.q, 0); },
  badge(){ document.querySelectorAll("[data-cart-count]").forEach(el => { const n = Cart.count(); el.textContent = n ? `Корзина (${n})` : "Корзина"; }); }
};
window.NorppaCart = Cart;
Cart.badge();

const card = p => {
  const c = p.cl[0], i1 = IMG + c.i[0], i2 = c.i[1] ? IMG + c.i[1] : i1;
  const disc = p.o ? Math.round((1 - p.p / p.o) * 100) : 0;
  return `<a class="pcard" href="product.html?id=${p.id}">
    <div class="pimg"><img src="${i1}" alt="${esc(p.t + " " + title(p))}" loading="lazy"><img class="alt" src="${i2}" alt="" loading="lazy">
      ${disc ? `<span class="pbadge">−${disc} %</span>` : ""}</div>
    <span class="ptype">${esc(p.t)}</span>
    <span class="pname">${esc(title(p))}</span>
    <span class="pprice">${p.o ? `<b>${rub(p.p)}</b><s>${rub(p.o)}</s>` : rub(p.p)}</span>
    ${p.cl.length > 1 ? `<span class="pcol">${p.cl.length} цвета</span>` : ""}
  </a>`;
};
window.NorppaCard = card;

// ---------- страница каталога ----------
const grid = $("#cat-grid");
if (grid){
  let cat = qs.get("cat") || "all", type = qs.get("type") || "all", sale = false, sort = "pop", shown = 24;
  const tabs = $("#cat-tabs"), types = $("#cat-types"), count = $("#cat-count"), more = $("#cat-more"), h1 = $("#cat-title");
  const inCat = p => cat === "all" ? true : cat === "outlet" ? p.out : p.c.includes(cat);
  const list = () => {
    let L = C.filter(p => inCat(p) && (type === "all" || kind(p) === type) && (!sale || p.o));
    if (sort === "asc") L = [...L].sort((a, b) => a.p - b.p);
    if (sort === "desc") L = [...L].sort((a, b) => b.p - a.p);
    if (sort === "sale") L = [...L].sort((a, b) => ((b.o ? 1 - b.p / b.o : 0) - (a.o ? 1 - a.p / a.o : 0)));
    return L;
  };
  const renderTypes = () => {
    const kinds = {}; C.filter(inCat).forEach(p => kinds[kind(p)] = (kinds[kind(p)] || 0) + 1);
    const ks = Object.entries(kinds).sort((a, b) => b[1] - a[1]);
    if (type !== "all" && !kinds[type]) type = "all";
    types.innerHTML = `<button type="button" class="chip" data-type="all" aria-pressed="${type === "all"}">Все изделия</button>` +
      ks.map(([k, n]) => `<button type="button" class="chip" data-type="${esc(k)}" aria-pressed="${type === k}">${esc(k)} <small>${n}</small></button>`).join("");
  };
  const render = (reset) => {
    if (reset) shown = 24;
    const L = list();
    h1.textContent = cat === "all" ? "Каталог" : CAT[cat];
    count.textContent = `${L.length} ${L.length % 10 === 1 && L.length % 100 !== 11 ? "модель" : (L.length % 10 >= 2 && L.length % 10 <= 4 && (L.length % 100 < 10 || L.length % 100 >= 20)) ? "модели" : "моделей"}`;
    grid.innerHTML = L.slice(0, shown).map(card).join("") || `<p class="empty">В этом разделе нет моделей с такими условиями. Сбросьте фильтр, чтобы увидеть всё.</p>`;
    more.hidden = shown >= L.length;
    tabs.querySelectorAll("[data-cat]").forEach(b => b.setAttribute("aria-pressed", b.dataset.cat === cat));
    const u = new URL(location); cat === "all" ? u.searchParams.delete("cat") : u.searchParams.set("cat", cat); type === "all" ? u.searchParams.delete("type") : u.searchParams.set("type", type); history.replaceState(null, "", u);
  };
  tabs.addEventListener("click", e => { const b = e.target.closest("[data-cat]"); if (!b) return; cat = b.dataset.cat; type = "all"; renderTypes(); render(true); });
  types.addEventListener("click", e => { const b = e.target.closest("[data-type]"); if (!b) return; type = b.dataset.type; renderTypes(); render(true); });
  $("#cat-sale").addEventListener("change", e => { sale = e.target.checked; render(true); });
  $("#cat-sort").addEventListener("change", e => { sort = e.target.value; render(true); });
  more.addEventListener("click", () => { shown += 24; render(false); });
  renderTypes(); render(true);
}

// ---------- карточка товара ----------
const pv = $("#product");
if (pv){
  const p = byId[qs.get("id")] || C[0];
  let ci = 0, size = null;
  document.title = `${p.t} ${title(p)} — NORPPA`;
  const firstCat = p.out ? "outlet" : p.c[0];
  $("#crumbs").innerHTML = `<a href="catalog.html">Каталог</a><span>/</span><a href="catalog.html?cat=${firstCat}">${CAT[firstCat]}</a><span>/</span><span>${esc(title(p))}</span>`;
  const draw = () => {
    const c = p.cl[ci];
    $("#gallery").innerHTML = c.i.map((u, k) => `<figure class="gimg${k === 0 ? " big" : ""}"><img src="${IMG + u}" alt="${esc(p.t + " " + title(p) + ", " + c.n + ", фото " + (k + 1))}" ${k > 1 ? 'loading="lazy"' : ""}></figure>`).join("");
    $("#p-colors").innerHTML = p.cl.map((x, k) => `<button type="button" class="chip" data-ci="${k}" aria-pressed="${k === ci}">${esc(x.n)}</button>`).join("");
    $("#p-color-name").textContent = c.n;
    $("#p-sizes").innerHTML = c.s.map(s => `<button type="button" class="size" data-size="${esc(s[0])}" ${s[2] ? "" : "disabled"} aria-pressed="${size === s[0]}">${esc(s[0])}${s[1] ? `<small>${esc(s[1])}</small>` : ""}</button>`).join("");
    const any = c.s.some(s => s[2]);
    $("#p-add").disabled = !any;
    $("#p-add").textContent = any ? "Добавить в корзину" : "Нет в наличии";
  };
  $("#p-type").textContent = p.t;
  $("#p-name").textContent = title(p);
  $("#p-art").textContent = p.a ? `Артикул ${p.a}` : "";
  $("#p-price").innerHTML = p.o ? `<b>${rub(p.p)}</b><s>${rub(p.o)}</s><span class="pbadge static">−${Math.round((1 - p.p / p.o) * 100)} %</span>` : `<b>${rub(p.p)}</b>`;
  $("#p-preview").textContent = p.pv;
  $("#p-model").textContent = p.om.replace(/:\s*·\s*/g, ": ").replace(/\s*·\s*/g, ", ");
  $("#p-model").hidden = !p.om;
  // характеристики: пары «название — значение — пояснение»
  const rows = []; p.d.forEach(r => { if (!r[0] && rows.length && !rows[rows.length - 1][2]) rows[rows.length - 1][2] = r[1]; else rows.push([...r]); });
  $("#p-details").innerHTML = rows.map(r => r[0] ? `<div class="drow"><dt>${esc(r[0])}</dt><dd>${esc(r[1])}${r[2] ? `<small>${esc(r[2])}</small>` : ""}</dd></div>` : `<p>${esc(r[1])}</p>`).join("");
  $("#p-comp").textContent = p.cm || "Состав указан на вшивном ярлыке изделия.";
  draw();
  $("#p-colors").addEventListener("click", e => { const b = e.target.closest("[data-ci]"); if (!b) return; ci = +b.dataset.ci; size = null; draw(); });
  $("#p-sizes").addEventListener("click", e => { const b = e.target.closest("[data-size]"); if (!b || b.disabled) return; size = b.dataset.size; $("#p-msg").textContent = ""; draw(); });
  $("#p-add").addEventListener("click", () => {
    const msg = $("#p-msg");
    if (!size){ msg.className = "p-msg err"; msg.textContent = "Выберите размер — после этого модель можно добавить в корзину."; return; }
    Cart.add(p.id, p.cl[ci].n, size);
    msg.className = "p-msg"; msg.innerHTML = `Добавлено в корзину: ${esc(title(p))}, ${esc(p.cl[ci].n)}, размер ${esc(size)}. <a class="link" href="cart.html">Перейти в корзину</a>`;
  });
  const sim = C.filter(x => x.id !== p.id && kind(x) === kind(p) && x.c.some(c => p.c.includes(c))).slice(0, 4);
  $("#similar").innerHTML = sim.map(card).join("");
  $("#similar-wrap").hidden = !sim.length;
}

// ---------- корзина ----------
const cv = $("#cart");
if (cv){
  const draw = () => {
    const items = Cart.get().filter(x => byId[x.id]);
    const total = items.reduce((s, x) => s + byId[x.id].p * x.q, 0);
    $("#cart-empty").hidden = !!items.length;
    $("#cart-full").hidden = !items.length;
    $("#cart-list").innerHTML = items.map((x, k) => { const p = byId[x.id], c = p.cl.find(c => c.n === x.color) || p.cl[0]; return `
      <div class="citem">
        <a href="product.html?id=${p.id}" class="cimg"><img src="${IMG + c.i[0]}" alt="${esc(p.t + " " + title(p))}"></a>
        <div class="cinfo"><a href="product.html?id=${p.id}"><b>${esc(title(p))}</b></a><span>${esc(p.t)}</span><span>${esc(x.color)}, размер ${esc(x.size)}</span></div>
        <div class="cqty"><button type="button" data-k="${k}" data-d="-1" aria-label="Меньше">−</button><span>${x.q}</span><button type="button" data-k="${k}" data-d="1" aria-label="Больше">+</button></div>
        <b class="csum">${rub(p.p * x.q)}</b>
        <button type="button" class="cdel" data-del="${k}">Удалить</button>
      </div>`; }).join("");
    $("#cart-total").textContent = rub(total);
    const left = 5000 - total;
    $("#cart-free").textContent = left > 0 ? `До бесплатной доставки СДЭК или Почтой России — ${rub(left)}` : "Доставка СДЭК и Почтой России — бесплатно";
    window.__cartItems = items; window.__cartTotal = total;
  };
  $("#cart-list").addEventListener("click", e => {
    const c = Cart.get().filter(x => byId[x.id]);
    const q = e.target.closest("[data-d]"), d = e.target.closest("[data-del]");
    if (q){ const it = c[+q.dataset.k]; it.q = Math.max(1, it.q + +q.dataset.d); Cart.set(c); draw(); }
    if (d){ c.splice(+d.dataset.del, 1); Cart.set(c); draw(); }
  });
  $("#cart-form").addEventListener("submit", e => {
    e.preventDefault();
    const f = e.target, st = $(".form-status", f);
    const need = [...f.querySelectorAll("[required]")].filter(x => !x.value.trim());
    if (need.length){ st.className = "form-status err"; st.textContent = "Заполните имя, телефон и адрес — без них заказ не оформить."; need[0].focus(); return; }
    const lines = window.__cartItems.map(x => { const p = byId[x.id]; return `• ${p.t} ${title(p)} (арт. ${p.a}), ${x.color}, размер ${x.size} × ${x.q} = ${rub(p.p * x.q)}`; });
    const body = [`Заказ с сайта NORPPA`, ...lines, `Итого: ${rub(window.__cartTotal)}`, "",
      `Имя: ${f.name.value}`, `Телефон: ${f.phone.value}`, `Получение: ${f.delivery.value}`, `Адрес или магазин: ${f.addr.value}`, f.comment.value.trim() ? `Комментарий: ${f.comment.value.trim()}` : ""].join("\n");
    location.href = `mailto:office@norppa.ru?subject=${encodeURIComponent("Заказ с сайта NORPPA")}&body=${encodeURIComponent(body)}`;
    st.className = "form-status"; st.textContent = "Письмо с заказом открыто в вашей почте. Нажмите «Отправить» — менеджер подтвердит заказ в рабочий день.";
  });
  draw();
}
})();
