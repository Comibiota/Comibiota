
/*! Comibiota Menu Engine v1
   - Semiautomatic weekly planner for IBS-friendly menus
   - No dependencies. Tailwind CSS recommended for styles already present.
   - Paste <script src="comibiota-menu-engine-v1.js"></script> before </body> in your landing.
   - Global API: window.ComibiotaMenu.generate(options?) -> { plan, meta }
     options: {
       strictFODMAP?: boolean,     // true = low-FODMAP estricto
       noDairy?: boolean,          // sin lácteos
       noGluten?: boolean,         // sin gluten
       noSpicy?: boolean,          // sin picante
       vegetarian?: boolean,       // opcional
       quickBias?: boolean,        // prioriza recetas rápidas
       batch?: boolean             // habilita batch-cooking (recomendado)
     }
   - Also injects an optional demo UI (bottom-right button) if ?menu=1 in URL or on localhost.
   - Disclaimer: This is not medical advice. Always consult a qualified professional.
*/
(function(){
  const NAMESPACE = 'ComibiotaMenu';
  if (window[NAMESPACE]) return; // avoid double load
  const rnd = (min, max) => Math.floor(Math.random()*(max-min+1))+min;
  const pick = (arr) => arr.length ? arr[rnd(0, arr.length-1)] : null;

  /** ------------------------------
   * Recipe model
   * id, name, meal ('breakfast'|'lunch'|'dinner'),
   * tags: ['low-fodmap','strict-ok','gluten-free','dairy-free','spicy-free','quick','vegetarian'],
   * protein?: 'fish'|'chicken'|'turkey'|'beef'|'pork'|'eggs'|'legumes'|'tofu'|'tempeh'|'mixed'|'none',
   * batch?: 'base'|'uses', baseId?: string, usesNote?: string,
   * family?: { user: string, family: string },
   * notes?: string
  ------------------------------ */
  const R = [];
  let idc=0; const add = (x)=>{ x.id = x.id || ('r'+(++idc)); R.push(x); };

  // --------- BREAKFAST (≈22) ---------
  [
    {name:'Overnight oats de avena sin gluten con leche sin lactosa y fresas', meal:'breakfast', tags:['low-fodmap','gluten-free','dairy-free','quick'], protein:'none', notes:'Usar avena certificada GF y leche sin lactosa.'},
    {name:'Yogur sin lactosa con kiwi (ración baja FODMAP) y semillas', meal:'breakfast', tags:['low-fodmap','gluten-free','quick'], protein:'none'},
    {name:'Huevos revueltos con espinacas y tomate cherry (ración baja)', meal:'breakfast', tags:['low-fodmap','gluten-free','dairy-free','quick'], protein:'eggs'},
    {name:'Tostadas de pan sin gluten con aceite de oliva y pavo', meal:'breakfast', tags:['low-fodmap','gluten-free','dairy-free','quick'], protein:'turkey'},
    {name:'Chía pudding con bebida vegetal sin FODMAP añadidos', meal:'breakfast', tags:['low-fodmap','gluten-free','dairy-free'], protein:'none'},
    {name:'Tortitas de arroz con crema de cacahuete y plátano (1/2)', meal:'breakfast', tags:['low-fodmap','gluten-free','dairy-free','quick'], protein:'none'},
    {name:'Avena cocida sin gluten con canela y arándanos', meal:'breakfast', tags:['low-fodmap','gluten-free'], protein:'none'},
    {name:'Omelette francesa con queso curado sin lactosa', meal:'breakfast', tags:['low-fodmap','gluten-free','quick'], protein:'eggs'},
    {name:'Batido suave: fresas + yogur sin lactosa + agua', meal:'breakfast', tags:['low-fodmap','gluten-free','quick'], protein:'none'},
    {name:'Gachas de maíz (polenta dulce) con canela', meal:'breakfast', tags:['low-fodmap','gluten-free','dairy-free'], protein:'none'},
    {name:'Tortilla de patata fina (al horno)', meal:'breakfast', tags:['low-fodmap','gluten-free','dairy-free'], protein:'eggs'},
    {name:'Arepa de maíz con queso sin lactosa', meal:'breakfast', tags:['low-fodmap','gluten-free'], protein:'none'},
    {name:'Pan sin gluten con mermelada sin fructosa añadida', meal:'breakfast', tags:['low-fodmap','gluten-free','quick'], protein:'none'},
    {name:'Fruta baja FODMAP (fresas/kiwi) + puñado de nueces', meal:'breakfast', tags:['low-fodmap','gluten-free','dairy-free','quick'], protein:'none'},
    {name:'Huevos duros con aceite de oliva y pimienta', meal:'breakfast', tags:['low-fodmap','gluten-free','dairy-free','quick'], protein:'eggs'},
    {name:'Tortitas de avena GF y huevo (2-3) con sirope de arce', meal:'breakfast', tags:['low-fodmap','gluten-free'], protein:'eggs'},
    {name:'Porridge de quinoa con leche sin lactosa', meal:'breakfast', tags:['low-fodmap','gluten-free'], protein:'none'},
    {name:'Requesón sin lactosa con uvas (ración baja)', meal:'breakfast', tags:['low-fodmap','gluten-free','quick'], protein:'none'},
    {name:'Arepa de maíz con aguacate (30 g) y lima', meal:'breakfast', tags:['low-fodmap','gluten-free','dairy-free'], protein:'none', notes:'Controlar ración de aguacate.'},
    {name:'Pan sin gluten con tortilla francesa y espinacas', meal:'breakfast', tags:['low-fodmap','gluten-free'], protein:'eggs'},
    {name:'Yuca cocida con aceite de oliva y sal', meal:'breakfast', tags:['low-fodmap','gluten-free','dairy-free'], protein:'none'},
    {name:'Tapioca/Beiju con queso sin lactosa', meal:'breakfast', tags:['low-fodmap','gluten-free'], protein:'none'},
  ].forEach(add);

  // --------- LUNCH & DINNER library (≈48) ---------
  // Batch base(s)
  add({name:'Crema de calabaza base (batch)', meal:'dinner', tags:['low-fodmap','gluten-free','dairy-free','spicy-free'], protein:'none', batch:'base', notes:'Rinde 4 porciones. Usar parte como base para dos cenas y una comida.'});
  add({name:'Quinoa cocida base (batch)', meal:'lunch', tags:['low-fodmap','gluten-free','dairy-free','spicy-free','vegetarian'], protein:'none', batch:'base', notes:'Rinde 6 tazas cocidas para varias comidas.'});
  add({name:'Pollo asado simple (batch)', meal:'dinner', tags:['low-fodmap','gluten-free','dairy-free','spicy-free'], protein:'chicken', batch:'base', notes:'Rinde para 2 cenas + 1 comida.'});

  // Uses of batch base(s) — base IDs resolved after insertion
  // (we'll map by name to avoid relying on autogenerated IDs)
  function getByName(n){ return R.find(x=>x.name===n); }
  function baseId(n){ const b=getByName(n); return b?b.id:null; }

  const BASE1='Crema de calabaza base (batch)';
  const BASE2='Quinoa cocida base (batch)';
  const BASE3='Pollo asado simple (batch)';

  add({name:'Crema de calabaza + topping de pollo', meal:'dinner', tags:['low-fodmap','gluten-free','spicy-free'], protein:'chicken', batch:'uses', baseId: null, usesNote:'Usar 1 porción de base + pollo desmenuzado.', family:{user:'sin picante', family:'añadir croutons comunes si toleran gluten'}});
  add({name:'Crema de calabaza + huevo poché', meal:'dinner', tags:['low-fodmap','gluten-free','spicy-free'], protein:'eggs', batch:'uses', baseId: null, usesNote:'Usar 1 porción base + 1 huevo/px.'});
  add({name:'Bowl de quinoa con salmón y pepino', meal:'lunch', tags:['low-fodmap','gluten-free','dairy-free','spicy-free'], protein:'fish', batch:'uses', baseId: null, usesNote:'Usar 1 taza de quinoa base.'});
  add({name:'Bowl de quinoa con tofu y zanahoria', meal:'lunch', tags:['low-fodmap','gluten-free','dairy-free','vegetarian','spicy-free'], protein:'tofu', batch:'uses', baseId: null, usesNote:'Usar 1 taza de quinoa base.'});
  add({name:'Ensalada templada de pollo asado y calabacín', meal:'lunch', tags:['low-fodmap','gluten-free','dairy-free','spicy-free'], protein:'chicken', batch:'uses', baseId: null, usesNote:'Usar pechuga de pollo asado.'});

  // Standard mains
  [
    {name:'Merluza al horno con patata y zanahoria', meal:'dinner', tags:['low-fodmap','gluten-free','dairy-free','spicy-free','quick'], protein:'fish', family:{user:'sin ajo', family:'añadir alioli a parte'}},
    {name:'Arroz blanco con tortillas de maíz y pollo salteado', meal:'lunch', tags:['low-fodmap','gluten-free','dairy-free'], protein:'chicken'},
    {name:'Pechuga de pavo a la plancha con calabacín', meal:'dinner', tags:['low-fodmap','gluten-free','dairy-free','quick'], protein:'turkey'},
    {name:'Pasta sin gluten con pesto sin ajo', meal:'dinner', tags:['low-fodmap','gluten-free','quick','vegetarian'], protein:'none', family:{user:'pesto sin ajo', family:'pesto normal para familia'}},
    {name:'Ensalada de arroz con atún, aceitunas y huevo', meal:'lunch', tags:['low-fodmap','gluten-free','spicy-free'], protein:'fish'},
    {name:'Tacos de maíz con carne magra y lechuga', meal:'dinner', tags:['low-fodmap','gluten-free','dairy-free'], protein:'beef', family:{user:'sin picante', family:'añadir salsa picante aparte'}},
    {name:'Sartén de patata, zanahoria y huevos', meal:'dinner', tags:['low-fodmap','gluten-free','dairy-free','vegetarian'], protein:'eggs'},
    {name:'Salmón a la plancha con arroz y pepino', meal:'dinner', tags:['low-fodmap','gluten-free','dairy-free','spicy-free','quick'], protein:'fish'},
    {name:'Pechuga de pollo al limón con quinoa', meal:'lunch', tags:['low-fodmap','gluten-free','dairy-free','spicy-free'], protein:'chicken'},
    {name:'Arroz frito suave con huevo y zanahoria', meal:'lunch', tags:['low-fodmap','gluten-free','dairy-free','quick','vegetarian'], protein:'eggs'},
    {name:'Lomo de cerdo con puré de patata', meal:'dinner', tags:['low-fodmap','gluten-free','spicy-free'], protein:'pork'},
    {name:'Tofu a la plancha con arroz y calabacín', meal:'lunch', tags:['low-fodmap','gluten-free','dairy-free','vegetarian'], protein:'tofu'},
    {name:'Tortilla de maíz con queso sin lactosa y tomate', meal:'lunch', tags:['low-fodmap','gluten-free'], protein:'none', family:{user:'sin ajo', family:'añadir pico de gallo a parte'}},
    {name:'Arroz con pavo y zanahoria', meal:'dinner', tags:['low-fodmap','gluten-free','dairy-free'], protein:'turkey'},
    {name:'Fideos de arroz con verduras permitidas', meal:'dinner', tags:['low-fodmap','gluten-free','dairy-free','vegetarian'], protein:'none'},
    {name:'Hamburguesa casera (sin pan) con patata al horno', meal:'dinner', tags:['low-fodmap','gluten-free','dairy-free'], protein:'beef'},
    {name:'Ensalada de pepino, aceitunas, queso sin lactosa', meal:'lunch', tags:['low-fodmap','gluten-free'], protein:'none'},
    {name:'Poke bowl low-FODMAP con salmón', meal:'lunch', tags:['low-fodmap','gluten-free','dairy-free'], protein:'fish'},
    {name:'Crepes sin gluten rellenos de pavo y queso sin lactosa', meal:'lunch', tags:['low-fodmap','gluten-free'], protein:'turkey'},
    {name:'Pechuga de pollo al horno con zanahoria y calabaza', meal:'dinner', tags:['low-fodmap','gluten-free','dairy-free','spicy-free'], protein:'chicken'},
    {name:'Ternera guisada suave (sin ajo/cebolla) con arroz', meal:'dinner', tags:['low-fodmap','gluten-free','dairy-free','spicy-free'], protein:'beef'},
    {name:'Gnocchi de patata (GF) con salsa de tomate suave', meal:'dinner', tags:['low-fodmap','gluten-free','vegetarian'], protein:'none', family:{user:'salsa suave sin ajo', family:'salsa normal aparte'}},
    {name:'Albóndigas de pavo con arroz', meal:'dinner', tags:['low-fodmap','gluten-free'], protein:'turkey'},
    {name:'Berenjena asada con queso sin lactosa', meal:'dinner', tags:['low-fodmap','gluten-free','vegetarian'], protein:'none'},
    {name:'Tortilla de patata con ensalada', meal:'lunch', tags:['low-fodmap','gluten-free','vegetarian'], protein:'eggs'},
    {name:'Arroz con atún y huevo', meal:'lunch', tags:['low-fodmap','gluten-free'], protein:'fish'},
    {name:'Pescado blanco en papillote con limón', meal:'dinner', tags:['low-fodmap','gluten-free','dairy-free','spicy-free','quick'], protein:'fish'},
    {name:'Pechuga de pollo salteada con calabacín', meal:'lunch', tags:['low-fodmap','gluten-free','dairy-free','quick'], protein:'chicken'},
    {name:'Quinoa con zanahoria y huevo', meal:'lunch', tags:['low-fodmap','gluten-free','vegetarian'], protein:'eggs'},
    {name:'Arroz con gambas (ración baja)', meal:'dinner', tags:['low-fodmap','gluten-free','dairy-free'], protein:'mixed'},
    {name:'Pasta GF con atún y aceitunas', meal:'dinner', tags:['low-fodmap','gluten-free','quick'], protein:'fish'},
    {name:'Crema de zanahoria sin lácteos', meal:'dinner', tags:['low-fodmap','gluten-free','dairy-free','vegetarian'], protein:'none'},
    {name:'Tortitas de maíz con pollo desmenuzado', meal:'lunch', tags:['low-fodmap','gluten-free','dairy-free'], protein:'chicken'},
    {name:'Ensalada templada de quinoa y verduras', meal:'lunch', tags:['low-fodmap','gluten-free','vegetarian'], protein:'none'},
    {name:'Lasaña GF de calabacín y pavo', meal:'dinner', tags:['low-fodmap','gluten-free'], protein:'turkey'},
    {name:'Pechuga de pavo al curry suave (sin picante)', meal:'dinner', tags:['low-fodmap','gluten-free','spicy-free'], protein:'turkey'},
    {name:'Sopa de pollo con fideos de arroz', meal:'dinner', tags:['low-fodmap','gluten-free','spicy-free'], protein:'chicken'},
    {name:'Arroz con tofu marinado suave', meal:'lunch', tags:['low-fodmap','gluten-free','vegetarian'], protein:'tofu'},
    {name:'Patata asada con atún y mayonesa sin lactosa', meal:'lunch', tags:['low-fodmap','gluten-free'], protein:'fish'},
    {name:'Arroz caldoso suave con pavo', meal:'dinner', tags:['low-fodmap','gluten-free'], protein:'turkey'},
    {name:'Ensalada de patata con huevo y pepino', meal:'lunch', tags:['low-fodmap','gluten-free','vegetarian','quick'], protein:'eggs'},
    {name:'Pechuga de pollo con salsa de tomate suave', meal:'dinner', tags:['low-fodmap','gluten-free'], protein:'chicken', family:{user:'salsa suave sin ajo', family:'salsa con ajo para familia aparte'}},
    {name:'Bowl de arroz con salmón y calabacín', meal:'lunch', tags:['low-fodmap','gluten-free','dairy-free'], protein:'fish'},
    {name:'Frittata de calabacín y queso sin lactosa', meal:'lunch', tags:['low-fodmap','gluten-free','vegetarian'], protein:'eggs'},
    {name:'Quinoa con pollo y zanahoria', meal:'lunch', tags:['low-fodmap','gluten-free'], protein:'chicken'},
    {name:'Pechuga de pollo con puré de patata', meal:'dinner', tags:['low-fodmap','gluten-free'], protein:'chicken'},
    {name:'Filete de ternera a la plancha con arroz', meal:'dinner', tags:['low-fodmap','gluten-free'], protein:'beef'},
    {name:'Tofu crujiente al horno con patata', meal:'dinner', tags:['low-fodmap','gluten-free','vegetarian'], protein:'tofu'},
    {name:'Arroz con huevo y pavo', meal:'lunch', tags:['low-fodmap','gluten-free'], protein:'eggs'},
  ].forEach(add);

  // now map baseId for the 'uses'
  R.forEach(x=>{
    if (x.batch==='uses' && !x.baseId){
      if (/calabaza/.test(x.name)) x.baseId = baseId(BASE1);
      else if (/quinoa/.test(x.name)) x.baseId = baseId(BASE2);
      else if (/pollo asado/.test(x.name)) x.baseId = baseId(BASE3);
    }
  });

  // ---- Helper filters ----
  function fitsOptions(rec, opt){
    if (!opt) return true;
    if (opt.strictFODMAP && !rec.tags.includes('low-fodmap')) return false;
    if (opt.noDairy && !rec.tags.includes('dairy-free')) return false;
    if (opt.noGluten && !rec.tags.includes('gluten-free')) return false;
    if (opt.noSpicy && !rec.tags.includes('spicy-free')) return false;
    if (opt.vegetarian && !rec.tags.includes('vegetarian') && rec.protein!=='eggs' && rec.protein!=='none') return false;
    if (opt.quickBias && Math.random()<0.35 && !rec.tags.includes('quick')) return false;
    return true;
  }

  // Balance protein distribution for lunch/dinner
  function scoreProteinBalance(planProteins, p){
    const count = planProteins[p] || 0;
    return 1/(1+count); // lower frequency -> higher score
  }

  function pickMeals(meal, n, opt){
    const pool = R.filter(r => r.meal===meal && fitsOptions(r,opt) && r.batch!=='uses');
    const chosen = [];
    const usedNames = new Set();
    const protCount = {};

    while (chosen.length < n && pool.length){
      const weighted = pool
        .filter(r => !usedNames.has(r.name))
        .map(r => {
          let w = 1;
          if (meal!=='breakfast') w *= scoreProteinBalance(protCount, r.protein||'none');
          if (opt?.quickBias && r.tags.includes('quick')) w *= 1.2;
          return {r, w};
        });
      if (!weighted.length) break;
      const total = weighted.reduce((s,x)=>s+x.w,0);
      let acc = Math.random()*total;
      let chosenItem = weighted[0].r;
      for (const x of weighted){
        acc -= x.w; if (acc<=0){ chosenItem = x.r; break; }
      }
      chosen.push(chosenItem);
      usedNames.add(chosenItem.name);
      if (meal!=='breakfast'){
        const p = chosenItem.protein||'none';
        protCount[p] = (protCount[p]||0)+1;
      }
      const idx = pool.indexOf(chosenItem);
      if (idx>=0) pool.splice(idx,1);
    }
    return chosen;
  }

  function withBatch(plan, opt){
    if (opt && opt.batch===false) return {plan, batches:[]};
    const bases = R.filter(r => r.batch==='base' && fitsOptions(r,opt));
    if (!bases.length) return {plan, batches:[]};
    const base = pick(bases);
    const uses = R.filter(r => r.batch==='uses' && r.baseId===base.id && fitsOptions(r,opt));
    if (uses.length<2) return {plan, batches:[]};

    const d = plan.days;
    if (d[0]) d[0].dinner = base;
    if (d[2]) d[2].dinner = uses[0];
    if (d[4]) d[4].lunch  = uses[1] || d[4].lunch;

    const note = {
      base: base.name,
      schedule: 'Cocina el día 1 (domingo/lunes). Usa de nuevo en días 3 y 5.',
      uses: uses.map(u => u.name)
    };
    return {plan, batches:[note]};
  }

  function addFamilyHints(plan){
    const hints = [];
    plan.days.forEach((day, i)=>{
      ['breakfast','lunch','dinner'].forEach(meal=>{
        const r = day[meal];
        if (r && r.family) hints.push({day:i+1, meal, user:r.family.user, family:r.family.family, name:r.name});
      });
    });
    return hints;
  }

  function buildPlan(opt){
    const breakfasts = pickMeals('breakfast', 7, opt);
    const lunches    = pickMeals('lunch', 7, opt);
    const dinners    = pickMeals('dinner', 7, opt);

    const days = [];
    for (let i=0;i<7;i++){
      days.push({ breakfast: breakfasts[i%breakfasts.length], lunch: lunches[i%lunches.length], dinner: dinners[i%dinners.length] });
    }
    let plan = { days };
    const {batches} = withBatch(plan, opt);
    const family = addFamilyHints(plan);
    return { plan, meta: { batches, family } };
  }

  function el(tag, cls, txt){ const e = document.createElement(tag); if (cls) e.className=cls; if (txt) e.textContent=txt; return e; }

  function render({plan, meta}, mount){
    const root = mount || (function (){
      const s = document.createElement('section');
      s.id = 'cmb-auto-menu';
      s.className = 'mx-auto max-w-7xl px-4 py-12';
      document.body.appendChild(s);
      return s;
    })();

    root.innerHTML = '';
    const h2 = el('h2','text-3xl font-extrabold tracking-tight sm:text-4xl','Menú semanal generado (beta)');
    const p = el('p','mt-2 text-gray-700','Propuesta semiautomática basada en reglas IBS-friendly. Esto no es consejo médico.');
    root.appendChild(h2); root.appendChild(p);

    const grid = el('div','mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4');
    plan.days.forEach((day, i)=>{
      const card = el('div','rounded-2xl border border-gray-100 bg-white p-4 shadow-soft');
      const title = el('h3','font-semibold mb-2','Día '+(i+1));
      const b = el('div','text-sm');
      b.innerHTML = `<div><strong>Desayuno:</strong> ${day.breakfast.name}</div>
                     <div class="mt-1"><strong>Comida:</strong> ${day.lunch.name}</div>
                     <div class="mt-1"><strong>Cena:</strong> ${day.dinner.name}</div>`;
      card.appendChild(title); card.appendChild(b);
      grid.appendChild(card);
    });
    root.appendChild(grid);

    if (meta.batches?.length){
      const box = el('div','mt-6 rounded-xl border border-brand-200 bg-brand-50 p-4');
      box.innerHTML = `<div class="font-semibold text-brand-800">Batch-cooking</div>
                       <ul class="list-disc pl-6 mt-2 text-sm text-brand-900">
                         ${meta.batches.map(b=>`<li><strong>${b.base}</strong> → ${b.uses.join(' + ')}. <em>${b.schedule}</em></li>`).join('')}
                       </ul>`;
      root.appendChild(box);
    }
    if (meta.family?.length){
      const box2 = el('div','mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4');
      box2.innerHTML = `<div class="font-semibold text-gray-800">Variaciones para familia</div>
                        <ul class="list-disc pl-6 mt-2 text-sm text-gray-700">
                          ${meta.family.map(h=>`<li>Día ${h.day} (${h.meal}): <strong>${h.name}</strong> — Tú: ${h.user}. Familia: ${h.family}.</li>`).join('')}
                        </ul>`;
      root.appendChild(box2);
    }
  }

  const API = {
    generate: (options={}) => buildPlan(options),
    render
  };
  window[NAMESPACE] = API;

  (function autoDemo(){
    const qs = new URLSearchParams(location.search);
    const should = qs.get('menu')==='1' || ['localhost','127.0.0.1'].includes(location.hostname);
    if (!should) return;
    const btn = document.createElement('button');
    btn.textContent = 'Generar menú demo';
    btn.className = 'fixed z-50 bottom-4 right-4 rounded-xl bg-brand-600 text-white px-4 py-2 text-sm shadow-soft hover:bg-brand-700';
    btn.onclick = ()=>{
      const {plan, meta} = API.generate({ strictFODMAP:true, noGluten:true, noDairy:true, noSpicy:true, batch:true, quickBias:true });
      API.render({plan, meta});
      btn.textContent = 'Regenerar menú';
    };
    document.body.appendChild(btn);
  })();

})();
