// ============================================================
// pages/resit.js — Modul Resit / Invois
// Dimuatkan oleh pages/resit.html
// ============================================================

// ── 8. RESIT — Pemboleh ubah ─────────────────────────────────
let currentLang='ms',logoDataUrl='',currentDocType='resit',items=[];
function generateDocNo(type){
    const pfx=type==='invoice'?'INV':'RES';
    const list=JSON.parse(localStorage.getItem('weo_pelanggan')||'[]');
    const existingNos=list.filter(r=>r.jenis===type).map(r=>{const m=r.docNo?.match(new RegExp(pfx+'-\\d+'));return m?parseInt(m[0].split('-')[1]):0;}).filter(n=>n>0).sort((a,b)=>a-b);
    let nextNo=1;
    for(let i=0;i<existingNos.length;i++){
        if(existingNos[i]!==i+1){nextNo=i+1;break;}
        nextNo=existingNos[i]+1;
    }
    return pfx+'-'+String(nextNo).padStart(4,'0');
}
function getVal(id){return document.getElementById(id)?.value?.trim()||'';}
function setVal(id,v){const el=document.getElementById(id);if(el)el.value=v||'';}
function formatRM(n){return 'RM '+parseFloat(n||0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,',');}
function formatPhoneValue(value){
    const digits=(value||'').replace(/\D/g,'').replace(/^0+/,'');
    if(!digits) return '';
    if(digits.length<=2) return digits;
    if(digits.length<=6){
        return `${digits.slice(0,2)}-${digits.slice(2)}`;
    }
    if(digits.length<=9){
        const first=digits.slice(0,2);
        const second=digits.slice(2,5);
        const third=digits.slice(5);
        return third?`${first}-${second} ${third}`:`${first}-${second}`;
    }
    const first=digits.slice(0,2);
    const second=digits.slice(2,6);
    const third=digits.slice(6);
    return third?`${first}-${second} ${third}`:`${first}-${second}`;
}
function formatDate(s){if(!s)return '-';return new Date(s).toLocaleDateString('ms-MY',{day:'numeric',month:'long',year:'numeric'});}
function calcTotals(){const sub=items.reduce((s,i)=>{const lt=i.qty*i.harga;return s+lt-lt*((i.disc||0)/100);},0),dp=parseFloat(getVal('discountPct'))||0,tp=parseFloat(getVal('taxPct'))||0,da=sub*(dp/100),af=sub-da,ta=af*(tp/100);return{subtotal:sub,discPct:dp,discAmt:da,taxPct:tp,taxAmt:ta,grand:af+ta};}
function applyStatusSelectColor(){const s=document.getElementById('invoiceStatus');if(s)s.className='form-input status-select status-'+(s.value||'unpaid');}

function isResitSellerVisible(){return localStorage.getItem('weo_resit_seller_visible')!=='false';}
function setResitSellerButtonText(){const btn=document.getElementById('btnToggleSeller'); if(!btn)return; btn.textContent = isResitSellerVisible() ? 'Sembunyikan Penjual' : 'Tunjuk Penjual';}

// ── 9. INIT RESIT (Event listeners dipasang SEKALI) ──────────
function initResit(){
    // Sentiasa: isi dropdown & auto-isi biz
    isiDropdownResitProduk();
    autoIsiBizDlmResit();

    if(_listenersInit.resit){applyStatusSelectColor();renderItems();renderPreview();return;}
    _listenersInit.resit=true;

    // Set tarikh awal
    const today=new Date(),due=new Date();due.setDate(due.getDate()+30);
    setVal('invoiceDate',today.toISOString().split('T')[0]);
    setVal('invoiceDue',due.toISOString().split('T')[0]);
    setVal('invoiceNo',generateDocNo('resit'));

    // Logo upload — [BUTTON: logoUploadArea klik]
    const logoArea=document.getElementById('logoUploadArea'),logoInput=document.getElementById('logoInput');
    if(logoArea)logoArea.onclick=e=>{e.stopPropagation();logoInput.click();};
    if(logoInput)logoInput.addEventListener('change',function(){
        const f=this.files[0];if(!f)return;
        const r=new FileReader();r.onload=e=>{logoDataUrl=e.target.result;const lp=document.getElementById('logoPreview');if(lp){lp.src=logoDataUrl;lp.style.display='block';}document.getElementById('logoPlaceholder').style.display='none';document.getElementById('btnDeleteLogo').style.display='flex';simpanDataSyarikat();renderPreview();};r.readAsDataURL(f);
    });
    // [BUTTON: btnDeleteLogo]
    const bdl=document.getElementById('btnDeleteLogo');
    if(bdl)bdl.addEventListener('click',e=>{e.stopPropagation();logoDataUrl='';const lp=document.getElementById('logoPreview');if(lp){lp.src='';lp.style.display='none';}document.getElementById('logoPlaceholder').style.display='flex';bdl.style.display='none';logoInput.value='';renderPreview();});

    // Auto preview pada semua input
    document.querySelectorAll('#page-resit .form-input,#page-resit textarea').forEach(inp=>{inp.addEventListener('input',renderPreview);inp.addEventListener('change',renderPreview);});

    // QR preview
    const qrUrlEl=document.getElementById('qrUrl');
    if(qrUrlEl)qrUrlEl.addEventListener('input',updateQrFormPreview);

    // [BUTTON: btnResitTambahProduk — tambah dari dropdown]
    const btnTP=document.getElementById('btnResitTambahProduk');
    if(btnTP)btnTP.addEventListener('click',()=>{
        const sel=document.getElementById('resitPilihProduk');
        if(!sel||!sel.value){tunjukToast('Pilih produk dahulu','warning',true);return;}
        const list=JSON.parse(localStorage.getItem('weo_produk_list')||'[]');
        const p=list.find(x=>x._id===sel.value);
        if(!p){tunjukToast('Produk tidak sah','error',true);return;}
        const existingIndex=items.findIndex(item=>item.nama===p.nama);
        if(existingIndex>=0){
            tunjukToast('Produk sudah wujud dalam senarai resit','warning',true);
            renderItems(existingIndex);
            return;
        }
        const h=p.hargaPromo>0?p.hargaPromo:(p.hargaAsal||0);
        items.push({nama:p.nama,qty:1,harga:h,disc:0});
        sel.value='';
        renderItems();
        renderPreview();
    });

    // Lang tabs — [BUTTON: .lang-tab]
    document.querySelectorAll('#page-resit .lang-tab').forEach(tab=>tab.addEventListener('click',function(){document.querySelectorAll('#page-resit .lang-tab').forEach(t=>t.classList.remove('active'));this.classList.add('active');currentLang=this.dataset.lang;renderPreview();}));

    const btnToggleSeller = document.getElementById('btnToggleSeller');
    if(btnToggleSeller){
        btnToggleSeller.addEventListener('click',()=>{
            localStorage.setItem('weo_resit_seller_visible', !isResitSellerVisible());
            setResitSellerButtonText();
            renderPreview();
        });
        setResitSellerButtonText();
    }

    // Doc type — [BUTTON: .doc-type-btn]
    document.querySelectorAll('#page-resit .doc-type-btn').forEach(btn=>btn.addEventListener('click',function(){document.querySelectorAll('#page-resit .doc-type-btn').forEach(b=>b.classList.remove('active'));this.classList.add('active');currentDocType=this.dataset.doctype;tukarDocType(currentDocType);renderItems();renderPreview();}));

    // Cadangan syarikat
    const cn=document.getElementById('companyName');
    if(cn){cn.addEventListener('focus',tunjukCadanganSyarikat);cn.addEventListener('input',tunjukCadanganSyarikat);cn.addEventListener('blur',()=>setTimeout(()=>{const s=document.getElementById('companySuggest');if(s)s.style.display='none';},200));}

    // Status select warna
    const ss=document.getElementById('invoiceStatus');
    if(ss)ss.addEventListener('change',function(){applyStatusSelectColor();renderPreview();});

    // Status Pesanan (Baru/Proses/Siap) pada seksyen Nota Tambahan
    const ps = document.getElementById('resitPesananStatus');
    if(ps) ps.addEventListener('change', () => { renderPreview(); });

    // Tel input formatting sama seperti pesanan
    const resitTelInput=document.getElementById('clientPhone');
    if(resitTelInput){
        resitTelInput.addEventListener('input',function(){this.value=formatPhoneValue(this.value);});
    }

    // [BUTTON: btnSave — Simpan rekod BARU, atau kemaskini pesanan sedia ada]
    const bSave=document.getElementById('btnSave');
    if(bSave)bSave.addEventListener('click',function(){
        if(!getVal('companyName')&&!getVal('clientName')){tunjukToast('Sila isi Nama Syarikat atau Pelanggan','error');return;}
        const clientName=getVal('clientName').trim();
        const docNo=getVal('invoiceNo')||'dokumen';

        // Semak nama pelanggan dalam senarai pesanan
        if(clientName){
            const pesList=JSON.parse(localStorage.getItem('weo_pesanan_list')||'[]');
            const sepadan=pesList.filter(p=>p.pelanggan.toLowerCase()===clientName.toLowerCase());
            if(sepadan.length>0){
                const noSepadan=sepadan.map(p=>p.no).join(', ');
                const pilih=confirm(
                    `"${clientName}" sudah wujud dalam pesanan (${noSepadan}).

`+
                    `✔ OK  → Kemaskini pesanan sedia ada
`+
                    `✘ Batal → Simpan sebagai rekod baru`
                );
                if(pilih){
                    renderPreview();
                    simpanDanKemaskiniPesanan(sepadan[0]._id,docNo);
                    return;
                }
            }
        }
        // Buat rekod baru
        if(!confirm(`Simpan ${docNo} sebagai rekod baru?`))return;
        renderPreview();simpanSebelumCetak();tunjukToast(`${docNo} berjaya disimpan!`,'success');
    });

    // [BUTTON: btnDownload — Print/PDF]
    const bDl=document.getElementById('btnDownload');
    if(bDl)bDl.addEventListener('click',muat_turunPDF);

    // [BUTTON: btnReset — Reset]
    const bReset=document.getElementById('btnReset');
    if(bReset)bReset.addEventListener('click',resetResit);

    // Muat data terakhir
    muatDataSyarikat();
    applyStatusSelectColor();
    renderItems();
    renderPreview();
}

// Dropdown produk untuk resit
function isiDropdownResitProduk(){
    const sel=document.getElementById('resitPilihProduk');if(!sel)return;
    const list=JSON.parse(localStorage.getItem('weo_produk_list')||'[]');
    if(!list.length){
        sel.innerHTML='<option value="" disabled selected>Tiada produk</option>';
        return;
    }
    sel.innerHTML='<option value="" disabled selected hidden>— Pilih produk —</option>'+
        list.map(p=>{const h=p.hargaPromo>0?p.hargaPromo:(p.hargaAsal||0);return`<option value="${p._id}">${p.nama}${h>0?' (RM '+parseFloat(h).toFixed(2)+')':' (Percuma)'}</option>`;}).join('');
}

// Auto-isi dari tetapan perniagaan
function autoIsiBizDlmResit(){
    const biz=JSON.parse(localStorage.getItem('weo_biz')||'{}');if(!biz.nama)return;
    if(!getVal('companyName')){setVal('companyName',biz.nama);setVal('companyReg',biz.reg);setVal('companyAddress',biz.alamat);setVal('companyPhone',biz.tel);setVal('companyEmail',biz.email);}
    if(!getVal('bankAccount')&&biz.bank)setVal('bankAccount',biz.bank);
    if(!getVal('bankName')&&biz.namaBank)setVal('bankName',biz.namaBank);
    if(!getVal('qrUrl')&&biz.qr){setVal('qrUrl',biz.qr);updateQrFormPreview();}
}

// Simpan & muat data syarikat terakhir
function simpanDataSyarikat(){const d={companyName:getVal('companyName'),companyReg:getVal('companyReg'),companyAddress:getVal('companyAddress'),companyPhone:getVal('companyPhone'),companyEmail:getVal('companyEmail'),logoDataUrl};if(!d.companyName)return;let list=JSON.parse(localStorage.getItem('weo_syarikat_list')||'[]');const idx=list.findIndex(s=>s.companyName===d.companyName);if(idx>=0)list[idx]=d;else list.unshift(d);if(list.length>10)list=list.slice(0,10);localStorage.setItem('weo_syarikat_list',JSON.stringify(list));}

function muatDataSyarikat(){const list=JSON.parse(localStorage.getItem('weo_syarikat_list')||'[]');if(!list.length)return;const last=list[0];if(!getVal('companyName')){setVal('companyName',last.companyName);setVal('companyReg',last.companyReg);setVal('companyAddress',last.companyAddress);setVal('companyPhone',last.companyPhone);setVal('companyEmail',last.companyEmail);if(last.logoDataUrl){logoDataUrl=last.logoDataUrl;const lp=document.getElementById('logoPreview');if(lp){lp.src=logoDataUrl;lp.style.display='block';}const ph=document.getElementById('logoPlaceholder');if(ph)ph.style.display='none';const dl=document.getElementById('btnDeleteLogo');if(dl)dl.style.display='flex';}}}

// Cadangan syarikat drop-down
function tunjukCadanganSyarikat(){const q=getVal('companyName').toLowerCase(),list=JSON.parse(localStorage.getItem('weo_syarikat_list')||'[]'),box=document.getElementById('companySuggest');if(!box)return;const f=list.filter(s=>s.companyName.toLowerCase().includes(q)&&q.length>0);if(!f.length){box.style.display='none';return;}box.style.display='block';box.innerHTML=f.map(s=>`<div class="suggest-item" data-name="${s.companyName}">${s.companyName}</div>`).join('');box.querySelectorAll('.suggest-item').forEach(it=>it.addEventListener('click',function(){const s=list.find(x=>x.companyName===this.dataset.name);if(!s)return;setVal('companyName',s.companyName);setVal('companyReg',s.companyReg);setVal('companyAddress',s.companyAddress);setVal('companyPhone',s.companyPhone);setVal('companyEmail',s.companyEmail);if(s.logoDataUrl){logoDataUrl=s.logoDataUrl;const lp=document.getElementById('logoPreview');if(lp){lp.src=logoDataUrl;lp.style.display='block';}const ph=document.getElementById('logoPlaceholder');if(ph)ph.style.display='none';const dl=document.getElementById('btnDeleteLogo');if(dl)dl.style.display='flex';}box.style.display='none';renderPreview();}));}

// ── 10. TUKAR DOC TYPE ───────────────────────────────────────
function tukarDocType(type){
    const isInv=type==='invoice';
    setVal('invoiceNo',generateDocNo(type));
    const fp=document.getElementById('formPanelTitle');if(fp)fp.textContent=isInv?'Maklumat Invois':'Maklumat Resit';
    const pp=document.getElementById('previewPanelTitle');if(pp)pp.textContent=isInv?'Pratonton Invois':'Pratonton Resit';
    const dd=document.getElementById('docDetailsTitle');if(dd)dd.textContent='Butiran Pesanan';
    const dl=document.getElementById('docNoLabel');if(dl)dl.textContent='No. Pesanan';
    const inv=document.getElementById('invoiceNo');
    if(inv){
        inv.placeholder='ORD-0001';
        if(pesananNoAutogen){
            inv.value=pesananNoAutogen;
        } else {
            inv.value=generateDocNo(type);
        }
    }
    // Tarikh Luput hanya untuk Invois
    const rowL=document.getElementById('rowTarikhLuput');if(rowL)rowL.style.display=isInv?'':'none';
    // Set default status berdasarkan doc type
    setVal('invoiceStatus',isInv?'paid':'unpaid');
    applyStatusSelectColor();
}

// QR preview dalam form
function updateQrFormPreview(){const url=getVal('qrUrl'),w=document.getElementById('qrFormPreview'),d=document.getElementById('qrFormCode');if(!w||!d)return;if(!url){w.style.display='none';return;}w.style.display='block';d.innerHTML='';new QRCode(d,{text:url,width:100,height:100,colorDark:'#1a1a2e',colorLight:'#ffffff'});}

// ── 11. RENDER ITEMS — qty×harga, nama statik ────────────────
function renderItems(highlightIndex=null){
    const container=document.getElementById('itemsList');if(!container)return;
    container.innerHTML='';
    const isInv=currentDocType==='invoice';
    const cols=isInv?'1fr 56px 90px 52px 78px 26px':'1fr 56px 90px 78px 26px';
    const hdr=document.createElement('div');hdr.className='item-header';hdr.style.gridTemplateColumns=cols;
    hdr.innerHTML=isInv?'<span>Nama Item</span><span style="text-align:center">Qty</span><span>Harga (RM)</span><span style="text-align:center">Dis%</span><span style="text-align:right">Jumlah</span><span></span>':'<span>Nama Item</span><span style="text-align:center">Qty</span><span>Harga (RM)</span><span style="text-align:right">Jumlah</span><span></span>';
    container.appendChild(hdr);
    if(!items.length){
        const noRow=document.createElement('div');
        noRow.className='item-empty';
        noRow.style.gridColumn='1 / -1';
        noRow.style.padding='0.7rem 0.5rem';
        noRow.style.color='var(--text-muted)';
        noRow.style.fontStyle='italic';
        noRow.textContent='Tiada item. Sila pilih produk dan klik + Tambah untuk mula.';
        container.appendChild(noRow);
        return;
    }
    items.forEach((item,i)=>{
        const lt=item.qty*item.harga,net=lt-lt*((item.disc||0)/100);
        const row=document.createElement('div');row.className='item-row'+(highlightIndex===i?' highlight':'');row.style.gridTemplateColumns=cols;
        // Nama: label statik (dari produk). Qty: input boleh ubah. Harga: statik.
        row.innerHTML=`<div class="item-nama-label" title="${item.nama||''}">${item.nama||'(pilih produk)'}</div>
            <input type="number" class="item-qty-input" value="${item.qty}" min="1" data-idx="${i}">
            <div class="item-harga-label">RM ${parseFloat(item.harga).toFixed(2)}</div>
            ${isInv?`<input type="number" class="item-disc-input" value="${item.disc||0}" min="0" max="100" data-idx="${i}" style="text-align:center">`:'' }
            <div class="item-total-display">RM ${net.toFixed(2)}</div>
            <button class="btn-del-item" data-idx="${i}">✕</button>`;
        container.appendChild(row);
    });
    container.querySelectorAll('.item-qty-input').forEach(inp=>inp.addEventListener('input',function(){const i=parseInt(this.dataset.idx);items[i].qty=parseFloat(this.value)||1;kemaskiniJmlBaris(this,i);renderPreview();}));
    container.querySelectorAll('.item-disc-input').forEach(inp=>inp.addEventListener('input',function(){const i=parseInt(this.dataset.idx);items[i].disc=parseFloat(this.value)||0;kemaskiniJmlBaris(this,i);renderPreview();}));
    container.querySelectorAll('.btn-del-item').forEach(btn=>btn.addEventListener('click',function(){
        const i=parseInt(this.dataset.idx);
        items.splice(i,1);
        renderItems();
        renderPreview();
    }));
}
function kemaskiniJmlBaris(inp,i){const row=inp.closest('.item-row');if(!row)return;const it=items[i],lt=it.qty*it.harga,net=lt-lt*((it.disc||0)/100);const td=row.querySelector('.item-total-display');if(td)td.textContent='RM '+net.toFixed(2);}

// ── 12. RENDER PREVIEW — Ikut layout contoh gambar ───────────
function renderPreview(){
    const preview=document.getElementById('invoicePreview');if(!preview)return;
    const isInv=currentDocType==='invoice';
    const L=currentLang==='ms'?{tajuk:isInv?'INVOIS':'RESIT',billTo:'DIKENAKAN KEPADA',from:'DARIPADA',seller:'Penjual',invDate:isInv?'TARIKH INVOIS':'TARIKH RESIT',dueDate:'TARIKH LUPUT',invNo:isInv?'NO. INVOIS':'NO. RESIT',item:'NAMA ITEM',qty:'QTY',price:'HARGA (RM)',disc:'DIS.%',total:'JUMLAH (RM)',subtotal:'Jumlah Kecil',grand:'JUMLAH KESELURUHAN',payment:'MAKLUMAT PEMBAYARAN',qr:'Imbas untuk bayar',notes:'NOTA',footer:'Terima kasih atas kepercayaan anda.',status:{paid:'DIBAYAR',unpaid:'BELUM BAYAR',pending:'TERTANGGUH'}}:{tajuk:isInv?'INVOICE':'RECEIPT',billTo:'BILL TO',from:'FROM',seller:'Seller',invDate:isInv?'INVOICE DATE':'RECEIPT DATE',dueDate:'DUE DATE',invNo:isInv?'INVOICE NO.':'RECEIPT NO.',item:'ITEM',qty:'QTY',price:'PRICE (RM)',disc:'DISC.%',total:'TOTAL (RM)',subtotal:'Subtotal',grand:'GRAND TOTAL',payment:'PAYMENT INFO',qr:'Scan to pay',notes:'NOTES',footer:'Thank you for your business.',status:{paid:'PAID',unpaid:'UNPAID',pending:'PENDING'}};
    const status=getVal('invoiceStatus')||'unpaid', orderStatus=getVal('resitPesananStatus')||'baru',qrUrl=getVal('qrUrl'),notes=getVal('invoiceNotes');
    const {subtotal,discPct,discAmt,taxPct,taxAmt,grand}=calcTotals();
    const sBg={paid:'#dcfce7',unpaid:'#fee2e2',pending:'#fef3c7'};
    const sCol={paid:'#16a34a',unpaid:'#dc2626',pending:'#ca8a04'};
    const penjual=localStorage.getItem('weo_penjual')||'';
    const showSeller=isResitSellerVisible();
    const resitCountryCode=getVal('resitCountryCode')||'+60';
    const resitPhone=getVal('clientPhone')?`${resitCountryCode} ${getVal('clientPhone')}`:'';
    // Item baris
    const itemRows=items.map(item=>{const lt=item.qty*item.harga,net=lt-lt*((item.disc||0)/100);
        return isInv?`<tr><td>${item.nama||'-'}</td><td style="text-align:center">${item.qty}</td><td style="text-align:center">RM ${parseFloat(item.harga).toFixed(2)}</td><td style="text-align:center">${item.disc>0?item.disc+'%':'-'}</td><td style="text-align:right;font-weight:700">RM ${net.toFixed(2)}</td></tr>`:`<tr><td>${item.nama||'-'}</td><td style="text-align:center">${item.qty}</td><td style="text-align:center">RM ${parseFloat(item.harga).toFixed(2)}</td><td style="text-align:right;font-weight:700">RM ${net.toFixed(2)}</td></tr>`;}).join('');
    const thead=isInv?`<tr><th style="text-align:left">${L.item}</th><th>${L.qty}</th><th>${L.price}</th><th>DIS.%</th><th style="text-align:right">${L.total}</th></tr>`:`<tr><th style="text-align:left">${L.item}</th><th>${L.qty}</th><th>${L.price}</th><th style="text-align:right">${L.total}</th></tr>`;

    preview.innerHTML=`<div class="inv-doc" id="invDoc">
        <div class="inv-header">
            <div>${logoDataUrl?`<img src="${logoDataUrl}" class="inv-company-logo">`:''}
                <div class="inv-company-name">${getVal('companyName')||'Nama Syarikat'}</div>
                <div class="inv-company-detail">${getVal('companyReg')?`No. Reg: ${getVal('companyReg')}<br>`:''} ${getVal('companyAddress').replace(/\n/g,'<br>')}${getVal('companyPhone')?`<br>📞 ${getVal('companyPhone')}`:''} ${getVal('companyEmail')?`<br>✉️ ${getVal('companyEmail')}`:''}</div>
            </div>
            <div class="inv-title-block">
                <div class="inv-title">${L.tajuk}</div>
                <div class="inv-no"># ${getVal('invoiceNo')||(isInv?'INV-0000':'RES-0000')}</div>
                ${(penjual && showSeller)?`<div style="font-size:0.65rem;color:#94a3b8;margin-top:4px">${L.seller}: ${penjual}</div>`:''}
            </div>
        </div>
        <div class="inv-parties">
            <div><div class="inv-party-label">${L.from}</div><div class="inv-party-name">${getVal('companyName')||'-'}</div><div class="inv-party-detail">${getVal('companyAddress').replace(/\n/g,'<br>')}${getVal('companyPhone')?`<br>📞 ${getVal('companyPhone')}`:''} ${getVal('companyEmail')?`<br>✉️ ${getVal('companyEmail')}`:''}</div></div>
            <div><div class="inv-party-label">${L.billTo}</div><div class="inv-party-name">${getVal('clientName')||'-'}</div><div class="inv-party-detail">${getVal('clientAddress').replace(/\n/g,'<br>')}${getVal('clientEmail')?`<br>✉️ ${getVal('clientEmail')}`:''} ${resitPhone?`<br>📞 ${resitPhone}`:''}</div></div>
        </div>
        <div class="inv-dates">
            <div class="inv-date-item"><label>${L.invDate}</label><span>${formatDate(getVal('invoiceDate'))}</span></div>
            ${isInv?`<div class="inv-date-item"><label>${L.dueDate}</label><span>${formatDate(getVal('invoiceDue'))}</span></div>`:''}
            <div class="inv-date-item"><label>${L.invNo}</label><span>${getVal('invoiceNo')||'-'}</span></div>
        </div>
        <table class="inv-table"><thead>${thead}</thead><tbody>${itemRows}</tbody></table>
        <div class="inv-totals"><div class="inv-totals-box">
            <div class="inv-total-row"><span>${L.subtotal}</span><span>${formatRM(subtotal)}</span></div>
            ${discPct>0?`<div class="inv-total-row discount"><span>Diskaun (${discPct}%)</span><span>- ${formatRM(discAmt)}</span></div>`:''}
            ${taxPct>0?`<div class="inv-total-row tax"><span>SST/GST (${taxPct}%)</span><span>+ ${formatRM(taxAmt)}</span></div>`:''}
            <div class="inv-total-row grand"><span>${L.grand}</span><span>${formatRM(grand)}</span></div>
        </div></div>
        ${(getVal('bankAccount')||qrUrl)?`<div class="inv-payment"><div><div class="inv-payment-label">${L.payment}</div><div class="inv-payment-info">${getVal('bankName')?`🏦 ${getVal('bankName')}<br>`:''} ${getVal('bankAccount')?`💳 ${getVal('bankAccount')}`:''}</div></div>${qrUrl?`<div class="inv-qr-wrap"><div id="qrcode"></div><span>${L.qr}</span></div>`:''}</div>`:''}
        ${notes?`<div class="inv-notes"><div class="inv-notes-label">${L.notes}</div><div class="inv-notes-text">${notes.replace(/\n/g,'<br>')}</div></div>`:''}
        <div class="inv-footer">${L.footer}</div>
    </div>`;
    if(qrUrl){const qrEl=document.getElementById('qrcode');if(qrEl){qrEl.innerHTML='';new QRCode(qrEl,{text:qrUrl,width:90,height:90,colorDark:'#1a1a2e',colorLight:'#ffffff'});}}
}

// ── 13. PRINT STYLE & PDF ────────────────────────────────────
function getPrintStyle(){return`<style>@page{margin:1cm;size:A4 portrait}*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}html,body{background:white!important;font-family:'Segoe UI',Arial,sans-serif;color:#1a1a1a}.inv-doc{padding:1.5rem 2rem;max-width:100%}.inv-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.5rem;padding-bottom:1rem;border-bottom:1.5px solid #e2e8f0}.inv-company-logo{max-height:56px;max-width:140px;object-fit:contain;margin-bottom:6px;display:block}.inv-company-name{font-size:1.05rem;font-weight:800;color:#1a1a2e}.inv-company-detail{font-size:0.7rem;color:#64748b;margin-top:4px;line-height:1.6}.inv-title-block{text-align:right}.inv-title{font-size:2rem;font-weight:900;color:#1a1a2e;letter-spacing:3px}.inv-no{font-size:0.85rem;color:#64748b;margin-top:2px}.inv-status{display:inline-block;padding:3px 12px;border-radius:20px;font-size:0.7rem;font-weight:700;margin-top:6px;-webkit-print-color-adjust:exact;print-color-adjust:exact}.inv-parties{display:grid;grid-template-columns:1fr 1fr;gap:2rem;margin-bottom:1.5rem}.inv-party-label{font-size:0.62rem;font-weight:700;color:#94a3b8;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px}.inv-party-name{font-size:0.92rem;font-weight:700;color:#1a1a2e;margin-bottom:2px}.inv-party-detail{font-size:0.72rem;color:#64748b;line-height:1.5}.inv-dates{display:flex;gap:2rem;background:#f8fafc!important;border-radius:8px;padding:0.65rem 1rem;margin-bottom:1.5rem;-webkit-print-color-adjust:exact;print-color-adjust:exact}.inv-date-item label{display:block;font-size:0.6rem;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:2px}.inv-date-item span{font-size:0.88rem;font-weight:600;color:#1a1a2e}.inv-table{width:100%;border-collapse:collapse;margin-bottom:1.5rem;font-size:0.82rem}.inv-table thead tr{background:#1a1a2e!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}.inv-table thead th{color:white!important;padding:0.6rem 0.75rem;font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;text-align:center}.inv-table thead th:first-child{text-align:left}.inv-table thead th:last-child{text-align:right}.inv-table tbody tr{border-bottom:1px solid #e2e8f0}.inv-table tbody tr:nth-child(even){background:#f8fafc!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}.inv-table tbody td{padding:0.6rem 0.75rem;color:#334155;text-align:center}.inv-table tbody td:first-child{text-align:left}.inv-table tbody td:last-child{text-align:right;font-weight:700}.inv-totals{display:flex;justify-content:flex-end;margin-bottom:1.5rem}.inv-totals-box{width:260px}.inv-total-row{display:flex;justify-content:space-between;padding:0.3rem 0;font-size:0.82rem;color:#475569;border-bottom:1px solid #e2e8f0}.inv-total-row.discount{color:#dc2626}.inv-total-row.tax{color:#0369a1}.inv-total-row.grand{font-size:0.95rem;font-weight:800;color:#1a1a2e;border-bottom:none;border-top:2px solid #1a1a2e;margin-top:4px;padding-top:0.4rem}.inv-payment{display:grid;grid-template-columns:1fr auto;gap:1.5rem;background:#f8fafc!important;border-radius:10px;padding:1rem 1.2rem;margin-bottom:1.2rem;align-items:center;-webkit-print-color-adjust:exact;print-color-adjust:exact}.inv-payment-label{font-size:0.62rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px}.inv-payment-info{font-size:0.85rem;font-weight:600;color:#1a1a2e;line-height:1.6}.inv-qr-wrap{display:flex;flex-direction:column;align-items:center;gap:4px}.inv-qr-wrap span{font-size:0.65rem;color:#94a3b8}.inv-notes{background:#fffbeb!important;border-left:4px solid #f59e0b;padding:0.7rem 1rem;border-radius:0 8px 8px 0;margin-bottom:1.2rem;-webkit-print-color-adjust:exact;print-color-adjust:exact}.inv-notes-label{font-size:0.62rem;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px}.inv-notes-text{font-size:0.8rem;color:#78350f;line-height:1.5}.inv-footer{text-align:center;padding-top:1rem;border-top:1px solid #e2e8f0;font-size:0.72rem;color:#94a3b8}.item-total-display,.item-qty-input,.item-disc-input,.item-nama-label,.item-harga-label,.item-header,.btn-del-item{display:none}img{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}</style>`;}

function getDocHtml(docId){const doc=document.getElementById(docId);if(!doc)return null;const clone=doc.cloneNode(true);const canvas=doc.querySelector('#qrcode canvas');if(canvas){const du=canvas.toDataURL('image/png');const cq=clone.querySelector('#qrcode');if(cq)cq.innerHTML=`<img src="${du}" width="90" height="90" style="display:block;">`;}return clone.outerHTML;}

function muat_turunPDF(){
    renderPreview();
    setTimeout(()=>{
        const html=getDocHtml('invDoc');if(!html){alert('Sila isi maklumat dahulu.');return;}
        const docNo=getVal('invoiceNo')||(currentDocType==='invoice'?'INV-0000':'RES-0000');
        const win=window.open('','_blank');if(!win){tunjukToast('Popup disekat. Benarkan popup untuk muat turun.','error');return;}
        win.document.open();win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${docNo}</title>${getPrintStyle()}</head><body>${html}<script>window.addEventListener('load',function(){setTimeout(function(){window.print();},700)});<\/script></body></html>`);win.document.close();
        tunjukToast(`${docNo} sedia dimuat turun sebagai PDF`,'success');
        simpanDataSyarikat(); // Simpan data syarikat ke cache tapi TIDAK buat rekod baru
    },400);
}

// ── 14. RESET RESIT ──────────────────────────────────────────
function resetResit(){
    if(!confirm('Reset semua maklumat resit?'))return;
    ['companyName','companyReg','companyAddress','companyPhone','companyEmail','clientName','clientAddress','clientEmail','clientPhone','bankAccount','bankName','qrUrl','invoiceNotes'].forEach(id=>setVal(id,''));
    setVal('resitCountryCode','+60');
    setVal('discountPct','0');setVal('taxPct','6');setVal('invoiceStatus','unpaid');
    const ps = document.getElementById('resitPesananStatus'); if(ps) ps.value='baru';
    const t=new Date(),d=new Date();d.setDate(d.getDate()+30);setVal('invoiceDate',t.toISOString().split('T')[0]);setVal('invoiceDue',d.toISOString().split('T')[0]);setVal('invoiceNo',pesananNoAutogen || generateDocNo(currentDocType));
    logoDataUrl='';const lp=document.getElementById('logoPreview');if(lp){lp.src='';lp.style.display='none';}document.getElementById('logoPlaceholder').style.display='flex';document.getElementById('btnDeleteLogo').style.display='none';document.getElementById('logoInput').value='';
    const qfp=document.getElementById('qrFormPreview');if(qfp)qfp.style.display='none';const qfc=document.getElementById('qrFormCode');if(qfc)qfc.innerHTML='';
    items=[];applyStatusSelectColor();renderItems();renderPreview();
}

// ── 15. SIMPAN SEBELUM CETAK → rekod pelanggan ───────────────
// Kemaskini rekod pesanan sedia ada dengan data resit/invois dari form
function simpanDanKemaskiniPesanan(pesananId,docNo){
    const {grand}=calcTotals();
    const status=getVal('invoiceStatus');
    const statusMap={paid:'Dibayar',unpaid:'Belum Bayar',pending:'Tertangguh'};
    const clientName=getVal('clientName');
    const penjual=localStorage.getItem('weo_penjual')||'';

    // Simpan ke weo_pelanggan (untuk pratonton resit)
    simpanSebelumCetak();

    // Kemaskini pesanan: jumlah dan docNo
    let pesList=JSON.parse(localStorage.getItem('weo_pesanan_list')||'[]');
    const idx=pesList.findIndex(p=>p._id===pesananId);
    if(idx>=0){
        pesList[idx].jumlah=formatRM(grand);
        pesList[idx].docNo=docNo;
        pesList[idx]._resitLinked=true;
        localStorage.setItem('weo_pesanan_list',JSON.stringify(pesList));
        tunjukToast(`Pesanan ${pesList[idx].no} dikemaskini dengan ${docNo}!`,'success');
        tambahNotif(`${docNo} dikaitkan dengan ${pesList[idx].no}`,'pesanan','iwwa:receipt');
    }
    if(_listenersInit.gabung)renderGabungTable();
    kemaskiniDashboard();
}


function simpanSebelumCetak(){
    const clientName=getVal('clientName');if(!clientName)return;
    const {grand}=calcTotals(),statusMap={paid:'Dibayar',unpaid:'Belum Bayar',pending:'Tertangguh'},status=getVal('invoiceStatus'),prodList=items.filter(i=>i.nama).map(i=>i.nama).slice(0,3).join(', '),penjual=localStorage.getItem('weo_penjual')||'';
    const resitCode=document.getElementById('resitCountryCode')?.value||'+60';
    const clientLocal=getVal('clientPhone').replace(/\D/g,'');
    const clientPhoneParsed = clientLocal ? `${resitCode}${clientLocal}` : '';
    const orderStatus=getVal('resitPesananStatus')||'baru';
    const rekod={_id:'C'+Date.now(),docNo:getVal('invoiceNo'),pelanggan:clientName,produk:prodList||'-',tarikh:formatDate(getVal('invoiceDate')),luput:formatDate(getVal('invoiceDue')),jumlah:formatRM(grand),status,statusLabel:statusMap[status]||status,jenis:currentDocType,jenisLabel:currentDocType==='invoice'?'Invois':'Resit',penjual,
        _data:{items:JSON.parse(JSON.stringify(items)),companyName:getVal('companyName'),companyReg:getVal('companyReg'),companyAddress:getVal('companyAddress'),companyPhone:getVal('companyPhone'),companyEmail:getVal('companyEmail'),clientName,clientAddress:getVal('clientAddress'),clientEmail:getVal('clientEmail'),clientPhone:clientPhoneParsed,clientPhoneRaw:getVal('clientPhone'),resitCountryCode:resitCode,bankAccount:getVal('bankAccount'),bankName:getVal('bankName'),qrUrl:getVal('qrUrl'),invoiceNotes:getVal('invoiceNotes'),invoiceDate:getVal('invoiceDate'),invoiceDue:getVal('invoiceDue'),invoiceNo:getVal('invoiceNo'),invoiceStatus:status,documentStatus:orderStatus,discountPct:getVal('discountPct'),taxPct:getVal('taxPct'),logoDataUrl,currentDocType,currentLang}};
    let list=JSON.parse(localStorage.getItem('weo_pelanggan')||'[]');list.unshift(rekod);localStorage.setItem('weo_pelanggan',JSON.stringify(list));
    if(_listenersInit.gabung)renderGabungTable();
    tambahNotif(`${rekod.docNo} disimpan untuk ${clientName}`,'pelanggan','iwwa:receipt');
    // Jana/kemaskini fail pelanggan
    janaFilePelanggan(rekod);
}

