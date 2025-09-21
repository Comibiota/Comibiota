
/*! Comibiota Menu Hook v1
   - Wires ComibiotaMenu.generate to existing forms (heroForm & contactForm)
   - Adds a live preview below the Contact form
   - Injects a concise text version of the weekly plan into the submission payload
   Usage: include AFTER comibiota-menu-engine-v1.js and AFTER your existing scripts
   <script src="comibiota-menu-engine-v1.js"></script>
   <script src="comibiota-menu-hook-v1.js"></script>
*/
(function(){
  if (window.__cmbHookInstalled) return;
  window.__cmbHookInstalled = true;

  function hasEngine(){ return typeof window.ComibiotaMenu === 'object' && window.ComibiotaMenu.generate; }

  function computeOptions(formEl){
    const opts = { strictFODMAP:false, noDairy:false, noGluten:false, noSpicy:false, vegetarian:false, quickBias:true, batch:true };
    if (!formEl) return opts;

    const prefs = Array.from(formEl.querySelectorAll('input[name="prefs"]:checked')).map(x=>x.value.toLowerCase());
    if (prefs.some(v=>/fodmap/.test(v))) opts.strictFODMAP = true;
    if (prefs.some(v=>/lacteos|lácteos/.test(v))) opts.noDairy = true;
    if (prefs.some(v=>/gluten/.test(v))) opts.noGluten = true;
    if (prefs.some(v=>/picante/.test(v))) opts.noSpicy = true;

    const persona = (formEl.querySelector('#persona')?.value || '').toLowerCase();
    if (/reci[eé]n/.test(persona)) opts.strictFODMAP = true;

    return opts;
  }

  function serializePlanText({plan, meta}){
    const lines = [];
    lines.push('COMIBIOTA - Menú semanal generado');
    for (let i=0; i<plan.days.length; i++){
      const d = plan.days[i];
      lines.push(`Día ${i+1}:`);
      lines.push(`  Desayuno: ${d.breakfast.name}`);
      lines.push(`  Comida:   ${d.lunch.name}`);
      lines.push(`  Cena:     ${d.dinner.name}`);
    }
    if (meta?.batches?.length){
      lines.push('Batch-cooking:');
      meta.batches.forEach(b => {
        lines.push(`  Base: ${b.base}`);
        lines.push(`  Reutiliza: ${b.uses.join(' + ')}`);
        lines.push(`  Agenda: ${b.schedule}`);
      });
    }
    if (meta?.family?.length){
      lines.push('Variaciones familia:');
      meta.family.forEach(h => {
        lines.push(`  Día ${h.day} ${h.meal}: ${h.name} — Tú: ${h.user} | Familia: ${h.family}`);
      });
    }
    return lines.join('\n');
  }

  function ensureHiddenField(formEl, name, value){
    let el = formEl.querySelector(`input[name="${name}"]`);
    if (!el){
      el = document.createElement('input');
      el.type = 'hidden';
      el.name = name;
      formEl.appendChild(el);
    }
    el.value = value;
  }

  function mountPreviewContainer(){
    const contactSection = document.getElementById('contacto') || document.body;
    let mount = document.getElementById('cmb-preview');
    if (!mount){
      mount = document.createElement('section');
      mount.id = 'cmb-preview';
      mount.className = 'mx-auto max-w-7xl px-4 py-10';
      const title = document.createElement('h2');
      title.className = 'text-2xl font-extrabold tracking-tight sm:text-3xl';
      title.textContent = 'Vista previa — Menú semanal';
      const info = document.createElement('p');
      info.className = 'mt-1 text-sm text-gray-600';
      info.textContent = 'Propuesta generada automáticamente según tus preferencias. No es consejo médico.';
      mount.appendChild(title);
      mount.appendChild(info);
      contactSection.parentNode.insertBefore(mount, contactSection.nextSibling);
    }
    return mount;
  }

  function installWrapper(){
    const oldSend = window.sendForm;
    if (typeof oldSend === 'function'){
      window.sendForm = async function(formEl, messageEl, submitBtn){
        try {
          if (hasEngine() && formEl){
            const opts = computeOptions(formEl);
            const out = ComibiotaMenu.generate(opts);
            const mount = mountPreviewContainer();
            ComibiotaMenu.render(out, mount);
            const txt = serializePlanText(out);
            ensureHiddenField(formEl, 'menu_preview', txt);
          }
        } catch(e){ console.warn('Menu hook error (pre):', e); }
        return oldSend.apply(this, arguments);
      };
    } else {
      const attach = (formId)=>{
        const form = document.getElementById(formId);
        if (!form) return;
        form.addEventListener('submit', (e)=>{
          try {
            if (hasEngine()){
              const opts = computeOptions(form);
              const out = ComibiotaMenu.generate(opts);
              const mount = mountPreviewContainer();
              ComibiotaMenu.render(out, mount);
              const txt = serializePlanText(out);
              ensureHiddenField(form, 'menu_preview', txt);
            }
          } catch(err){ console.warn('Menu hook error:', err); }
        }, { capture:true });
      };
      attach('contactForm');
      attach('heroForm');
    }
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', installWrapper);
  } else {
    installWrapper();
  }
})();
