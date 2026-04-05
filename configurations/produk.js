// ============================================================
// pages/produk.js — Modul Produk
// Dimuatkan oleh pages/produk.html
// ============================================================

// ── 17. PRODUK ───────────────────────────────────────────────
let produkLogoUrl='',produkGambarUrl='',produkEditId=null,produkTabAktif='semua';

function initProduk(){
    if(_listenersInit.produk)return;
    _listenersInit.produk=true;

    // [BUTTON: btnProdukBaru]
    document.getElementById('btnProdukBaru').addEventListener('click',()=>bukaFormProduk(null));
    // [BUTTON: modalProdukClose]
    document.getElementById('modalProdukClose').addEventListener('click',()=>tutupModal('modalProduk'));
    // [BUTTON: modalProdukPreviewClose]
    document.getElementById('modalProdukPreviewClose').addEventListener('click',()=>tutupModal('modalProdukPreview'));

    // Tab produk
    document.querySelectorAll('[data-tab-produk]').forEach(btn=>btn.addEventListener('click',function(){document.querySelectorAll('[data-tab-produk]').forEach(b=>b.classList.remove('active'));this.classList.add('active');produkTabAktif=this.dataset.tabProduk;renderProdukGrid();}));
    document.getElementById('produkSearch').addEventListener('input',function(){renderProdukGrid(this.value);});

    // [BUTTON: btnProdukBulkDelete]
    document.getElementById('btnProdukBulkDelete').addEventListener('click',()=>{const cbs=[...document.querySelectorAll('.produk-card-check:checked')];if(!cbs.length)return;if(!confirm(`Padam ${cbs.length} produk?`))return;const ids=cbs.map(c=>c.dataset.id);let list=JSON.parse(localStorage.getItem('weo_produk_list')||'[]');list=list.filter(p=>!ids.includes(p._id));localStorage.setItem('weo_produk_list',JSON.stringify(list));tunjukToast(`${cbs.length} produk dipadam`,'info');renderProdukGrid();});

    // Logo upload — [BUTTON: produkLogoArea]
    document.getElementById('produkLogoArea').onclick=e=>{e.stopPropagation();document.getElementById('produkLogoInput').click();};
    document.getElementById('produkLogoInput').addEventListener('change',function(){const f=this.files[0];if(!f)return;const r=new FileReader();r.onload=e=>{produkLogoUrl=e.target.result;document.getElementById('produkLogoPreview').src=produkLogoUrl;document.getElementById('produkLogoPreview').style.display='block';document.getElementById('produkLogoPlaceholder').style.display='none';document.getElementById('btnDeleteProdukLogo').style.display='flex';autoIsiBizDlmProduk();renderProdukPreview();};r.readAsDataURL(f);});
    // [BUTTON: btnDeleteProdukLogo]
    document.getElementById('btnDeleteProdukLogo').addEventListener('click',e=>{e.stopPropagation();produkLogoUrl='';document.getElementById('produkLogoPreview').src='';document.getElementById('produkLogoPreview').style.display='none';document.getElementById('produkLogoPlaceholder').style.display='flex';document.getElementById('btnDeleteProdukLogo').style.display='none';document.getElementById('produkLogoInput').value='';renderProdukPreview();});

    // Gambar upload — [BUTTON: produkGambarArea]
    document.getElementById('produkGambarArea').onclick=e=>{e.stopPropagation();document.getElementById('produkGambarInput').click();};
    document.getElementById('produkGambarInput').addEventListener('change',function(){const f=this.files[0];if(!f)return;const r=new FileReader();r.onload=e=>{produkGambarUrl=e.target.result;document.getElementById('produkGambarPreview').src=produkGambarUrl;document.getElementById('produkGambarPreview').style.display='block';document.getElementById('produkGambarPlaceholder').style.display='none';document.getElementById('btnDeleteProdukGambar').style.display='flex';renderProdukPreview();};r.readAsDataURL(f);});
    // [BUTTON: btnDeleteProdukGambar]
    document.getElementById('btnDeleteProdukGambar').addEventListener('click',e=>{e.stopPropagation();produkGambarUrl='';document.getElementById('produkGambarPreview').src='';document.getElementById('produkGambarPreview').style.display='none';document.getElementById('produkGambarPlaceholder').style.display='flex';document.getElementById('btnDeleteProdukGambar').style.display='none';document.getElementById('produkGambarInput').value='';renderProdukPreview();});

    // Auto preview semua input
    document.querySelectorAll('#modalProduk .form-input,#modalProduk textarea').forEach(inp=>{inp.addEventListener('input',renderProdukPreview);inp.addEventListener('change',renderProdukPreview);});

    // ── Auto kira diskaun: hargaPromo ↔ label tawaran ──
    const _hargaAsalEl  = document.getElementById('produkHargaAsal');
    const _hargaPromoEl = document.getElementById('produkHargaPromo');
    const _labelEl      = document.getElementById('produkLabel');

    function _kiraLabel() {
        const ha = parseFloat(_hargaAsalEl?.value)||0;
        const hp = parseFloat(_hargaPromoEl?.value)||0;
        if (!_labelEl || _labelEl._manualEdit) return;
        if (ha > 0 && hp > 0 && hp < ha) {
            const pct = Math.round((1 - hp/ha) * 100);
            _labelEl.value = 'JIMAT ' + pct + '%';
        } else {
            _labelEl.value = '';
        }
        renderProdukPreview();
    }

    function _kiraHargaFromLabel() {
        const ha    = parseFloat(_hargaAsalEl?.value)||0;
        const label = _labelEl?.value||'';
        const m     = label.match(/(\d+(?:\.\d+)?)\s*%/);
        if (ha > 0 && m && _hargaPromoEl) {
            const pct = parseFloat(m[1]);
            if (pct > 0 && pct < 100) {
                _hargaPromoEl.value = (ha*(1-pct/100)).toFixed(2);
            }
        }
        renderProdukPreview();
    }

    if (_hargaPromoEl) _hargaPromoEl.addEventListener('input', () => {
        if (_labelEl) _labelEl._manualEdit = false;
        _kiraLabel();
    });
    if (_hargaAsalEl)  _hargaAsalEl.addEventListener('input',  () => {
        if (_labelEl) _labelEl._manualEdit = false;
        _kiraLabel();
    });
    if (_labelEl) {
        _labelEl.addEventListener('focus', () => { _labelEl._manualEdit = true; });
        _labelEl.addEventListener('input', () => { _labelEl._manualEdit = true; _kiraHargaFromLabel(); });
        _labelEl.addEventListener('blur',  () => {
            // Bila blur, semak format — jika tiada %, reset ke auto
            if (!_labelEl.value.includes('%')) _labelEl._manualEdit = false;
        });
    }

    // ── Auto-suggest syarikat dalam form produk ──
    const _pSyrEl    = document.getElementById('produkSyarikat');
    const _pSyrBox   = document.getElementById('produkSyarikatSuggest');
    if (_pSyrEl && _pSyrBox) {
        function _tunjukSuggestProduk() {
            const q   = (_pSyrEl.value||'').toLowerCase().trim();
            const sl  = JSON.parse(localStorage.getItem('weo_syarikat_list')||'[]');
            const biz = JSON.parse(localStorage.getItem('weo_biz')||'{}');
            // Gabungkan senarai dari weo_syarikat_list dan weo_biz
            const all = [...sl.map(s=>({nama:s.companyName,tel:s.companyPhone||'',link:''}))];
            if (biz.nama && !all.find(x=>x.nama===biz.nama))
                all.unshift({nama:biz.nama,tel:biz.tel||'',link:biz.link||''});
            const f = q.length > 0
                ? all.filter(s=>s.nama.toLowerCase().includes(q))
                : all.slice(0,5);
            if (!f.length) { _pSyrBox.style.display='none'; return; }
            _pSyrBox.style.display = 'block';
            _pSyrBox.innerHTML = f.map(s=>`<div class="suggest-item" data-nama="${s.nama}" data-tel="${s.tel}" data-link="${s.link}">${s.nama}</div>`).join('');
            _pSyrBox.querySelectorAll('.suggest-item').forEach(it => it.addEventListener('click', function(){
                setVal('produkSyarikat', this.dataset.nama);
                if (this.dataset.tel && !getProdukVal('produkTel'))   setVal('produkTel',  this.dataset.tel);
                if (this.dataset.link && !getProdukVal('produkLink'))  setVal('produkLink', this.dataset.link);
                _pSyrBox.style.display = 'none';
                renderProdukPreview();
            }));
        }
        _pSyrEl.addEventListener('input', _tunjukSuggestProduk);
        _pSyrEl.addEventListener('focus', _tunjukSuggestProduk);
        _pSyrEl.addEventListener('blur',  () => setTimeout(()=>{_pSyrBox.style.display='none';}, 200));
    }

    // [BUTTON: btnProdukSave]
    document.getElementById('btnProdukSave').addEventListener('click',()=>{const nama=getProdukVal('produkNama');if(!nama){tunjukToast('Sila isi Nama Produk','error');return;}if(!confirm(`Simpan produk "${nama}"?`))return;simpanProdukKeList();tutupModal('modalProduk');});
    // [BUTTON: btnProdukDownload — PDF A4]
    document.getElementById('btnProdukDownload').addEventListener('click',downloadFlyerA4);
    // [BUTTON: btnProdukReset]
    document.getElementById('btnProdukReset').addEventListener('click',()=>{if(!confirm('Reset?'))return;resetFormProduk(true);});
    // [BUTTON: btnProdukPreviewDownload]
    document.getElementById('btnProdukPreviewDownload').addEventListener('click',function(){if(this._produkId)downloadFlyerByIdA4(this._produkId);});
}

function getProdukVal(id){return document.getElementById(id)?.value?.trim()||'';}

// Auto-isi biz ke produk
function autoIsiBizDlmProduk(){
    const biz=JSON.parse(localStorage.getItem('weo_biz')||'{}');
    if(!biz.nama)return;
    if(!getProdukVal('produkSyarikat'))setVal('produkSyarikat',biz.nama);
    if(!getProdukVal('produkTel'))setVal('produkTel',biz.tel||'');
    if(!getProdukVal('produkLink')&&biz.link)setVal('produkLink',biz.link);
}

function bukaFormProduk(rekod){
    produkEditId=rekod?rekod._id:null;
    document.getElementById('modalProdukTitle').textContent=rekod?`Edit: ${rekod.nama}`:'Produk Baru';
    resetFormProduk(true);
    if(rekod){const map={produkSyarikat:'syarikat',produkSlogan:'slogan',produkNama:'nama',produkDesc:'desc',produkHargaAsal:'hargaAsal',produkHargaPromo:'hargaPromo',produkLabel:'label',produkStok:'stok',produkTel:'tel',produkLink:'link',produkNota:'nota'};Object.entries(map).forEach(([id,k])=>setVal(id,rekod[k]));document.getElementById('produkWarna').value=rekod.warna||'#003543';produkLogoUrl=rekod.logoUrl||'';produkGambarUrl=rekod.gambarUrl||'';if(produkLogoUrl){document.getElementById('produkLogoPreview').src=produkLogoUrl;document.getElementById('produkLogoPreview').style.display='block';document.getElementById('produkLogoPlaceholder').style.display='none';document.getElementById('btnDeleteProdukLogo').style.display='flex';}if(produkGambarUrl){document.getElementById('produkGambarPreview').src=produkGambarUrl;document.getElementById('produkGambarPreview').style.display='block';document.getElementById('produkGambarPlaceholder').style.display='none';document.getElementById('btnDeleteProdukGambar').style.display='flex';}}
    else{autoIsiBizDlmProduk();}
    bukaModal('modalProduk');setTimeout(renderProdukPreview,150);
}

function resetFormProduk(senyap){['produkSyarikat','produkSlogan','produkNama','produkDesc','produkHargaAsal','produkHargaPromo','produkLabel','produkTel','produkLink','produkNota'].forEach(id=>setVal(id,''));document.getElementById('produkWarna').value='#003543';document.getElementById('produkStok').value='ada';produkLogoUrl='';produkGambarUrl='';['produkLogoPreview','produkGambarPreview'].forEach(id=>{const el=document.getElementById(id);if(el){el.src='';el.style.display='none';}});['produkLogoPlaceholder','produkGambarPlaceholder'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='flex';});['btnDeleteProdukLogo','btnDeleteProdukGambar','produkLogoInput','produkGambarInput'].forEach(id=>{const el=document.getElementById(id);if(!el)return;if(id.startsWith('btn'))el.style.display='none';else el.value='';});if(!senyap)renderProdukPreview();}

function simpanProdukKeList(){
    const listSedia=JSON.parse(localStorage.getItem('weo_produk_list')||'[]');
    const n=listSedia.length+1;
    // Auto ID — 3 huruf dari nama produk + 3 digit
    const nama=getProdukVal('produkNama');
    const prefix=(nama.replace(/[^a-zA-Z]/g,'').substring(0,3)||'ITM').toUpperCase();
    const autoId=prefix+String(n).padStart(3,'0');
    const rekod={_id:produkEditId||('P'+Date.now()),produkId:autoId,syarikat:getProdukVal('produkSyarikat'),slogan:getProdukVal('produkSlogan'),warna:getProdukVal('produkWarna')||'#003543',nama,desc:getProdukVal('produkDesc'),hargaAsal:parseFloat(getProdukVal('produkHargaAsal'))||0,hargaPromo:parseFloat(getProdukVal('produkHargaPromo'))||0,label:getProdukVal('produkLabel'),stok:getProdukVal('produkStok')||'ada',tel:getProdukVal('produkTel'),link:getProdukVal('produkLink'),nota:getProdukVal('produkNota'),logoUrl:produkLogoUrl,gambarUrl:produkGambarUrl,tarikhCipta:new Date().toLocaleDateString('ms-MY',{day:'numeric',month:'long',year:'numeric'})};
    if(produkEditId){const idx=listSedia.findIndex(p=>p._id===produkEditId);if(idx>=0)listSedia[idx]=rekod;else listSedia.unshift(rekod);}else listSedia.unshift(rekod);
    localStorage.setItem('weo_produk_list',JSON.stringify(listSedia));
    tunjukToast(`Produk "${rekod.nama}" (${rekod.produkId}) disimpan!`,'success');
    tambahNotif(`Produk "${rekod.nama}" disimpan`,'produk','iwwa:package');
    renderProdukGrid();isiDropdownResitProduk();
}

function renderProdukGrid(filter){
    const grid=document.getElementById('produkGrid'),empty=document.getElementById('produkEmpty'),count=document.getElementById('produkCount');if(!grid)return;
    let list=JSON.parse(localStorage.getItem('weo_produk_list')||'[]');
    if(produkTabAktif!=='semua')list=list.filter(p=>p.stok===produkTabAktif);
    if(filter){const q=filter.toLowerCase();list=list.filter(p=>(p.nama||'').toLowerCase().includes(q)||(p.syarikat||'').toLowerCase().includes(q)||(p.produkId||'').toLowerCase().includes(q));}
    count.textContent=`${list.length} produk`;
    if(!list.length){grid.innerHTML='';grid.style.display='none';empty.style.display='flex';return;}
    empty.style.display='none';grid.style.display='grid';
    const isDraf=p=>!p.nama||!p.nama.trim();
    const h=p=>p.hargaPromo>0?p.hargaPromo:p.hargaAsal;
    grid.innerHTML=list.map(p=>`<div class="produk-card ${p.stok==='habis'?'habis':''}" data-pid="${p._id}">
        ${isDraf(p)?'<div class="produk-draft-badge">Draf</div>':''}
        <div class="produk-card-menu" onclick="event.stopPropagation()">
            <button class="produk-card-menu-btn" onclick="toggleProdukMenu('menu_${p._id}')">⋯</button>
            <div class="produk-card-dropdown" id="menu_${p._id}">
                <button onclick="editProduk('${p._id}')"><iconify-icon icon="material-symbols:edit-sharp" width="15"></iconify-icon> Edit</button>
                <button onclick="downloadFlyerByIdA4('${p._id}')"><iconify-icon icon="iwwa:download" width="14"></iconify-icon> Muat Turun (A4)</button>
                <button onclick="muat_turunPNG('${p._id}')"><iconify-icon icon="iwwa:image" width="14"></iconify-icon> Eksport PNG</button>
                <button class="danger" onclick="padamProduk('${p._id}')"><iconify-icon icon="iwwa:trash" width="14"></iconify-icon> Padam</button>
            </div>
        </div>
        <div class="produk-card-check-wrap" onclick="event.stopPropagation()">
            <input type="checkbox" class="produk-card-check" data-id="${p._id}" onchange="kemaskiniProdukBulkBtn()">
        </div>
        ${p.gambarUrl?`<div class="produk-card-img"><img src="${p.gambarUrl}" alt="${p.nama}"></div>`:`<div class="produk-card-img-placeholder"><iconify-icon icon="iwwa:image" width="40"></iconify-icon></div>`}
        <div class="produk-card-body">
            <div style="display:flex;align-items:center;gap:5px;margin-bottom:2px">
                <div class="produk-card-nama">${p.nama||'Tanpa Nama'}</div>
                ${p.produkId?`<span style="font-size:0.65rem;background:rgba(99,102,241,0.12);color:var(--accent);padding:1px 5px;border-radius:4px;font-weight:600;flex-shrink:0">${p.produkId}</span>`:''}
            </div>
            <div class="produk-card-syarikat">${p.syarikat||''}</div>
            <div>${h(p)>0&&p.hargaPromo>0&&p.hargaAsal>0?`<span class="produk-card-harga-asal">RM ${parseFloat(p.hargaAsal).toFixed(2)}</span> `:''} ${h(p)>0?`<span class="produk-card-harga">RM ${parseFloat(h(p)).toFixed(2)}</span>`:`<span class="produk-harga-percuma">Percuma</span>`}</div>
        </div>
        <div class="produk-card-footer">
            <span class="produk-stok-badge ${p.stok==='habis'?'habis':'ada'}">${p.stok==='habis'?'Habis Stok':'Tersedia'}</span>
            <span style="font-size:0.7rem;color:var(--text-muted)">${p.tarikhCipta||''}</span>
        </div>
    </div>`).join('');
    grid.querySelectorAll('.produk-card').forEach(card=>card.addEventListener('click',function(){tunjukProdukPreview(this.dataset.pid);}));
}

function kemaskiniProdukBulkBtn(){const n=document.querySelectorAll('.produk-card-check:checked').length;const btn=document.getElementById('btnProdukBulkDelete');if(btn)btn.style.display=n>0?'inline-flex':'none';}
function toggleProdukMenu(id){document.querySelectorAll('.produk-card-dropdown.open').forEach(d=>{if(d.id!==id)d.classList.remove('open');});const m=document.getElementById(id);if(m)m.classList.toggle('open');}
document.addEventListener('click',()=>{document.querySelectorAll('.produk-card-dropdown.open').forEach(d=>d.classList.remove('open'));});

// Pratonton produk — postcard 3:2
function tunjukProdukPreview(id){
    const list=JSON.parse(localStorage.getItem('weo_produk_list')||'[]'),p=list.find(x=>x._id===id);if(!p)return;
    document.getElementById('modalProdukPreviewTitle').textContent=p.nama||'Produk';
    const qrId='prevQR_'+id,w=p.warna||'#003543',ha=parseFloat(p.hargaAsal)||0,hp=parseFloat(p.hargaPromo)||0;
    document.getElementById('modalProdukPreviewBody').innerHTML=bunaFlyerHTML(p,qrId,true);
    if(p.link){const qrEl=document.getElementById(qrId);if(qrEl){qrEl.innerHTML='';new QRCode(qrEl,{text:p.link,width:60,height:60,colorDark:w,colorLight:'#ffffff'});}}
    document.getElementById('btnProdukPreviewDownload')._produkId=id;
    bukaModal('modalProdukPreview');
}

// Bina HTML flyer (postcard 3:2)
function bunaFlyerHTML(p,qrId,isPreview){
    const w=p.warna||'#003543',ha=parseFloat(p.hargaAsal)||0,hp=parseFloat(p.hargaPromo)||0;
    const sizeStyle=isPreview?'max-width:420px;margin:0 auto':'width:480px';
    return `<div id="produkFlyerEl" style="${sizeStyle};background:white;border-radius:10px;overflow:hidden;font-family:'Segoe UI',Arial,sans-serif;color:#1a1a1a">
        <div style="background:${w};display:flex;align-items:center;justify-content:space-between;padding:0.75rem 1.1rem;-webkit-print-color-adjust:exact;print-color-adjust:exact">
            ${p.logoUrl?`<img src="${p.logoUrl}" style="max-height:36px;max-width:80px;object-fit:contain">`:`<div style="font-size:0.9rem;font-weight:800;color:white">${p.syarikat||''}</div>`}
            <div style="text-align:right">${p.syarikat?`<div style="font-size:0.82rem;font-weight:800;color:white">${p.syarikat}</div>`:''}${p.slogan?`<div style="font-size:0.6rem;color:rgba(255,255,255,0.82)">${p.slogan}</div>`:''}</div>
        </div>
        <div style="display:flex;min-height:140px">
            ${p.gambarUrl?`<img src="${p.gambarUrl}" style="width:42%;object-fit:cover;flex-shrink:0">`:''}
            <div style="flex:1;padding:0.9rem;display:flex;flex-direction:column;justify-content:center">
                ${p.label?`<span style="background:#ef4444;color:white;font-size:0.62rem;font-weight:700;padding:2px 8px;border-radius:12px;display:inline-block;margin-bottom:5px;width:fit-content;-webkit-print-color-adjust:exact;print-color-adjust:exact">${p.label}</span>`:''}
                <div style="font-size:1rem;font-weight:800;color:#1a1a2e;margin-bottom:3px">${p.nama||'Nama Produk'}</div>
                ${p.desc?`<div style="font-size:0.7rem;color:#64748b;line-height:1.4;margin-bottom:5px">${p.desc}</div>`:''}
                <div style="display:flex;align-items:center;gap:6px">
                    ${ha>0&&hp>0?`<span style="font-size:0.78rem;color:#94a3b8;text-decoration:line-through">RM ${ha.toFixed(2)}</span>`:''}
                    ${hp>0?`<span style="font-size:1.15rem;font-weight:900;color:#1a1a2e">RM ${hp.toFixed(2)}</span>`:ha>0?`<span style="font-size:1.15rem;font-weight:900;color:#1a1a2e">RM ${ha.toFixed(2)}</span>`:`<span style="font-size:0.8rem;color:#6366f1;background:rgba(99,102,241,0.1);padding:2px 8px;border-radius:10px;font-weight:600">Percuma</span>`}
                </div>
                ${p.tel||p.link?`<div style="display:flex;align-items:center;gap:0.6rem;margin-top:0.5rem;background:#f8fafc;border-radius:6px;padding:0.45rem 0.6rem;-webkit-print-color-adjust:exact;print-color-adjust:exact">
                    <div style="flex:1">${p.tel?`<div style="font-size:0.62rem;color:#94a3b8;text-transform:uppercase;letter-spacing:1px">Hubungi</div><div style="font-size:0.78rem;font-weight:700;color:#1a1a2e">${p.tel}</div>`:''}${p.nota?`<div style="font-size:0.65rem;color:#64748b;margin-top:2px">${p.nota}</div>`:''}</div>
                    ${p.link?`<div id="${qrId}"></div>`:''}
                </div>`:''}
            </div>
        </div>
        <div style="text-align:center;padding:0.4rem;font-size:0.62rem;color:#94a3b8;border-top:1px solid #e2e8f0;background:white">Powered by Weo • ${p.syarikat||''}</div>
    </div>`;
}

function renderProdukPreview(){
    const c=document.getElementById('produkPreview');if(!c)return;
    const sy=getProdukVal('produkSyarikat'),sl=getProdukVal('produkSlogan'),w=getProdukVal('produkWarna')||'#003543',nm=getProdukVal('produkNama'),dc=getProdukVal('produkDesc'),ha=parseFloat(getProdukVal('produkHargaAsal'))||0,hp=parseFloat(getProdukVal('produkHargaPromo'))||0,lb=getProdukVal('produkLabel'),tl=getProdukVal('produkTel'),lk=getProdukVal('produkLink'),no=getProdukVal('produkNota'),stk=getProdukVal('produkStok');
    const p={syarikat:sy,slogan:sl,warna:w,nama:nm,desc:dc,hargaAsal:ha,hargaPromo:hp,label:lb,tel:tl,link:lk,nota:no,stok:stk,logoUrl:produkLogoUrl,gambarUrl:produkGambarUrl};
    c.innerHTML=bunaFlyerHTML(p,'produkQrCode',true);
    if(lk){const qe=document.getElementById('produkQrCode');if(qe){qe.innerHTML='';new QRCode(qe,{text:lk,width:60,height:60,colorDark:w,colorLight:'#ffffff'});}}
}

// Muat turun flyer — format A4 (kertas standard)
function getFlyerStyleA4(){return `<style>@page{margin:0;size:A4}*{margin:0;padding:0;box-sizing:border-box}html,body{background:white!important;font-family:'Segoe UI',Arial,sans-serif;display:flex;justify-content:center;align-items:flex-start;padding:2cm}img{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}[style]{-webkit-print-color-adjust:exact;print-color-adjust:exact}</style>`;}

function downloadFlyerA4(){renderProdukPreview();setTimeout(()=>{const el=document.getElementById('produkFlyerEl');if(!el){alert('Isi maklumat produk dahulu.');return;}const clone=el.cloneNode(true);const cv=el.querySelector('#produkQrCode canvas');if(cv){const du=cv.toDataURL('image/png');const cq=clone.querySelector('#produkQrCode');if(cq)cq.innerHTML=`<img src="${du}" width="60" height="60" style="display:block;">`;}const html=clone.outerHTML;const nama=getProdukVal('produkNama')||'flyer';const win=window.open('','_blank');if(!win){tunjukToast('Popup disekat.','error');return;}win.document.open();win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${nama}</title>${getFlyerStyleA4()}<style>@media screen{body{padding:20px;justify-content:center}}</style></head><body>${html}<script>window.addEventListener('load',function(){setTimeout(function(){window.print();},600)});<\/script></body></html>`);win.document.close();tunjukToast(`Flyer "${nama}" sedia (A4)`,'success');},300);}

function downloadFlyerByIdA4(id){const list=JSON.parse(localStorage.getItem('weo_produk_list')||'[]');const p=list.find(x=>x._id===id);if(!p)return;bukaFormProduk(p);setTimeout(()=>{renderProdukPreview();setTimeout(downloadFlyerA4,400);},300);}

// [BUTTON: Eksport PNG — guna Canvas]
function muat_turunPNG(id){
    const list=JSON.parse(localStorage.getItem('weo_produk_list')||'[]');
    const p=list.find(x=>x._id===id);if(!p)return;
    // Bina iframe sementara untuk render
    tunjukProdukPreview(id);
    setTimeout(()=>{
        const el=document.getElementById('produkFlyerPreview')||document.getElementById('produkFlyerEl');
        if(!el){tunjukToast('Tidak dapat eksport. Buka pratonton dahulu.','error');return;}
        // Guna html2canvas jika ada, jika tidak papar mesej
        if(typeof html2canvas!=='undefined'){
            html2canvas(el,{scale:2,useCORS:true,backgroundColor:'#ffffff'}).then(canvas=>{const a=document.createElement('a');a.download=(p.nama||'flyer')+'.png';a.href=canvas.toDataURL('image/png');a.click();tunjukToast('Flyer PNG dimuat turun!','success');});
        }else{
            // Fallback: buka dalam tab baru sebagai PNG via SVG
            tunjukToast('Guna Print → Simpan sebagai PDF atau screenshot untuk PNG','info');
        }
    },500);
}

function editProduk(id){const l=JSON.parse(localStorage.getItem('weo_produk_list')||'[]');const p=l.find(x=>x._id===id);if(p)bukaFormProduk(p);}
function padamProduk(id){if(!confirm('Padam produk ini?'))return;let l=JSON.parse(localStorage.getItem('weo_produk_list')||'[]');const nm=l.find(p=>p._id===id)?.nama||'produk';l=l.filter(p=>p._id!==id);localStorage.setItem('weo_produk_list',JSON.stringify(l));tunjukToast(`"${nm}" dipadam`,'info');renderProdukGrid();}

