// ============================================================
// pages/pelanggan.js — Modul Pelanggan
// Dimuatkan oleh pages/pesanan.html (page gabungan)
// ============================================================

// ── 16. PELANGGAN ────────────────────────────────────────────
// Fungsi initPelanggan masih ada untuk btnNewDoc (Resit/Invois baru)
function initPelanggan(){
    if(_listenersInit.pelanggan)return;
    _listenersInit.pelanggan=true;

    // [BUTTON: btnNewDoc / btnNewDocArrow / dropdown — Resit/Invois baru]
    const btnND = document.getElementById('btnNewDoc');
    if(btnND) btnND.addEventListener('click',()=>tukarkePage('resit'));

    const btnNDA = document.getElementById('btnNewDocArrow');
    if(btnNDA) btnNDA.addEventListener('click',e=>{
        e.stopPropagation();
        document.getElementById('btnNewDropdown')?.classList.toggle('open');
    });

    document.querySelectorAll('#btnNewDropdown button').forEach(btn=>btn.addEventListener('click',function(){
        document.getElementById('btnNewDropdown')?.classList.remove('open');
        const dt=this.dataset.action==='new-invoice'?'invoice':'resit';
        currentDocType=dt; tukarkePage('resit');
        setTimeout(()=>{
            document.querySelectorAll('#page-resit .doc-type-btn').forEach(b=>b.classList.toggle('active',b.dataset.doctype===dt));
            tukarDocType(dt);
        },100);
    }));

    document.addEventListener('click',()=>{
        document.getElementById('btnNewDropdown')?.classList.remove('open');
    });
}

function kemaskiniPelangganBulkBtn(){const n=document.querySelectorAll('#pelangganTableBody input[type="checkbox"]:checked').length;const btn=document.getElementById('btnPelangganBulkDelete');if(btn)btn.style.display=n>0?'inline-flex':'none';if(n===0){const ca=document.getElementById('checkAll');if(ca)ca.checked=false;}}

let _rekodPreviewAktif=null;

function renderPelangganTable(filter){
    const tbody=document.getElementById('pelangganTableBody'),empty=document.getElementById('pelangganEmpty'),count=document.getElementById('pelangganCount');if(!tbody)return;
    let data=JSON.parse(localStorage.getItem('weo_pelanggan')||'[]');
    const tab=document.querySelector('[data-tab-pelanggan].active')?.dataset.tabPelanggan||'semua';
    if(tab!=='semua')data=data.filter(r=>r.jenis===tab);
    if(filter){const q=filter.toLowerCase();data=data.filter(r=>(r.pelanggan||'').toLowerCase().includes(q)||(r.docNo||'').toLowerCase().includes(q));}
    count.textContent=`${data.length} rekod`;
    if(!data.length){tbody.innerHTML='';empty.style.display='flex';return;}
    empty.style.display='none';
    tbody.innerHTML=data.map(r=>`<tr class="pelanggan-baris" data-id="${r._id||''}" style="cursor:pointer">
        <td onclick="event.stopPropagation()"><input type="checkbox" data-id="${r._id||''}" onchange="kemaskiniPelangganBulkBtn()"></td>
        <td><span class="no-copy-btn" onclick="event.stopPropagation();salinNo('${r.docNo||''}')">${r.docNo||'-'}</span></td>
        <td>${r.pelanggan||'-'}</td><td style="color:var(--text-secondary);font-size:0.8rem">${r.produk||'-'}</td>
        <td style="text-align:center">${r.tarikh||'-'}${r.luput&&r.luput!=='-'?` — ${r.luput}`:''}</td>
        <td>${r.jumlah||'-'}</td>
        <td><span class="status-badge ${r.status||'unpaid'}">${r.statusLabel||'Belum Bayar'}</span></td>
        <td><span class="type-badge ${r.jenis||'resit'}">${r.jenisLabel||'Resit'}</span></td>
        <td onclick="event.stopPropagation()"><div class="action-btns">
            <button class="action-btn primary" title="Edit" onclick="editPelangganRekod('${r._id||''}')"><iconify-icon icon="material-symbols:edit-sharp" width="15"></iconify-icon></button>
            <button class="action-btn danger" title="Padam" onclick="padamPelangganRekod('${r._id||''}')"><iconify-icon icon="iwwa:trash" width="14"></iconify-icon></button>
        </div></td>
    </tr>`).join('');
    // Klik baris → pratonton
    tbody.querySelectorAll('.pelanggan-baris').forEach(row=>row.addEventListener('click',function(){const id=this.dataset.id;const all=JSON.parse(localStorage.getItem('weo_pelanggan')||'[]');const r=all.find(x=>x._id===id);if(r&&r._data){_rekodPreviewAktif=r;tunjukResitPreviewModal(r);}}));
}

function tunjukResitPreviewModal(r){
    if(!r._data) return;

    // Simpan rekod aktif untuk PDF
    _rekodPreviewAktif = r;

    // Backup state form semasa
    const bkp = {
        items:         JSON.parse(JSON.stringify(items)),
        logoDataUrl,   currentDocType, currentLang
    };

    // Set state dari data rekod
    items          = r._data.items || [];
    logoDataUrl    = r._data.logoDataUrl || '';
    currentDocType = r._data.currentDocType || 'resit';
    currentLang    = r._data.currentLang || 'ms';
    Object.entries(r._data).forEach(([k,v])=>{ if(typeof v==='string') setVal(k,v); });

    // Render preview ke dalam div tersembunyi
    renderPreview();
    const inv  = document.getElementById('invDoc');
    const body = document.getElementById('modalResitPreviewBody');
    if (body && inv) {
        body.innerHTML = '<div style="background:white;border-radius:8px;overflow:hidden;padding:0">' + inv.outerHTML + '</div>';
    }

    // Pulih state form (jangan kacau form resit yang sedang dibuka)
    items          = bkp.items;
    logoDataUrl    = bkp.logoDataUrl;
    currentDocType = bkp.currentDocType;
    currentLang    = bkp.currentLang;

    // Buka modal
    bukaModal('modalResitPreview');

    // Tajuk modal
    const titleEl = document.getElementById('modalResitPreviewTitle');
    if (titleEl) titleEl.textContent = (r.docNo || '') + ' — ' + (r.pelanggan || '');

    // ── PASANG LISTENER TERUS — tidak bergantung pada initPelanggan ──
    // Guna replaceWith supaya listener lama tidak berganda
    const closeBtn = document.getElementById('modalResitPreviewClose');
    if (closeBtn) {
        const newClose = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newClose, closeBtn);
        newClose.addEventListener('click', function(e) {
            e.stopPropagation();
            tutupModal('modalResitPreview');
        });
    }

    const pdfBtn = document.getElementById('btnResitPreviewPDF');
    if (pdfBtn) {
        const newPdf = pdfBtn.cloneNode(true);
        pdfBtn.parentNode.replaceChild(newPdf, pdfBtn);
        newPdf.addEventListener('click', function(e) {
            e.stopPropagation();
            muatTurunPDFDariRekod();
        });
    }
}

function muatTurunPDFDariRekod(){
    if (!_rekodPreviewAktif?._data) {
        tunjukToast('Tiada rekod untuk dicetak', 'error');
        return;
    }
    const d   = _rekodPreviewAktif._data;
    const bkp = {
        items:         JSON.parse(JSON.stringify(items)),
        logoDataUrl,   currentDocType, currentLang
    };

    // Set state sementara untuk render
    items          = d.items || [];
    logoDataUrl    = d.logoDataUrl || '';
    currentDocType = d.currentDocType || 'resit';
    currentLang    = d.currentLang || 'ms';
    Object.entries(d).forEach(([k,v])=>{ if(typeof v==='string') setVal(k,v); });
    renderPreview();

    setTimeout(() => {
        // Cetak TANPA memanggil simpanSebelumCetak (elak rekod duplikat)
        const html  = getDocHtml('invDoc');
        if (!html) { alert('Tiada dokumen untuk dicetak.'); return; }
        const docNo = getVal('invoiceNo') || 'dokumen';
        const win   = window.open('', '_blank');
        if (!win) {
            tunjukToast('Popup disekat. Benarkan popup untuk muat turun.', 'error');
            return;
        }
        win.document.open();
        win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + docNo + '</title>'
            + getPrintStyle()
            + '</head><body>' + html
            + '<script>window.addEventListener("load",function(){setTimeout(function(){window.print();},700);});<\/script>'
            + '</body></html>');
        win.document.close();
        tunjukToast(docNo + ' sedia dimuat turun sebagai PDF', 'success');

        // Pulih state form
        items          = bkp.items;
        logoDataUrl    = bkp.logoDataUrl;
        currentDocType = bkp.currentDocType;
        currentLang    = bkp.currentLang;
    }, 400);
}

function editPelangganRekod(id){const all=JSON.parse(localStorage.getItem('weo_pelanggan')||'[]');const r=all.find(x=>x._id===id);if(!r||!r._data)return;const d=r._data;items=d.items||[];logoDataUrl=d.logoDataUrl||'';currentDocType=d.currentDocType||'resit';currentLang=d.currentLang||'ms';tukarkePage('resit');setTimeout(()=>{Object.entries(d).forEach(([k,v])=>{if(typeof v==='string')setVal(k,v);});document.querySelectorAll('#page-resit .doc-type-btn').forEach(b=>b.classList.toggle('active',b.dataset.doctype===currentDocType));if(logoDataUrl){const lp=document.getElementById('logoPreview');if(lp){lp.src=logoDataUrl;lp.style.display='block';}const ph=document.getElementById('logoPlaceholder');if(ph)ph.style.display='none';const dl=document.getElementById('btnDeleteLogo');if(dl)dl.style.display='flex';}tukarDocType(currentDocType);renderItems();renderPreview();applyStatusSelectColor();},150);}

function padamPelangganRekod(id){if(!id||!confirm('Padam rekod ini?'))return;let list=JSON.parse(localStorage.getItem('weo_pelanggan')||'[]');list=list.filter(r=>r._id!==id);localStorage.setItem('weo_pelanggan',JSON.stringify(list));tunjukToast('Rekod dipadam','info');renderPelangganTable();}

function salinNo(no){if(!no||no==='-')return;const copy=t=>{const e=document.createElement('textarea');e.value=t;e.style.cssText='position:fixed;opacity:0';document.body.appendChild(e);e.select();document.execCommand('copy');document.body.removeChild(e);};if(navigator.clipboard)navigator.clipboard.writeText(no).then(()=>tunjukToast(`"${no}" disalin!`,'success')).catch(()=>{copy(no);tunjukToast(`"${no}" disalin!`,'success');});else{copy(no);tunjukToast(`"${no}" disalin!`,'success');}}

