// ============================================================
// pages/pesanan.js — Modul Pesanan
// Dimuatkan oleh pages/pesanan.html
// ============================================================

// ── 18. PESANAN ──────────────────────────────────────────────
let pesananItems=[],pesananEditId=null,pesananNoAutogen='';

function initPesanan(){
    if(_listenersInit.pesanan)return;
    _listenersInit.pesanan=true;

    // [BUTTON: btnPesananBaru] (optional, removed from UI)
    const btnPesananBaru = document.getElementById('btnPesananBaru');
    if(btnPesananBaru){
        btnPesananBaru.addEventListener('click',()=>{pesananEditId=null;resetFormPesanan();isiDropdownPesananProduk();document.getElementById('modalPesananTitle').textContent='Pesanan Baru';document.getElementById('btnPesananSave').innerHTML='<iconify-icon icon="iwwa:save" width="14"></iconify-icon> Simpan';bukaModal('modalPesanan');});
    }
    // [BUTTON: modalPesananClose]
    document.getElementById('modalPesananClose').addEventListener('click',()=>tutupModal('modalPesanan'));
    // [BUTTON: btnTambahPesananItem]
    document.getElementById('btnTambahPesananItem').addEventListener('click',()=>{
        const sel=document.getElementById('pesananPilihProduk');
        if(!sel || !sel.value){
            tunjukToast('Sila pilih produk dahulu','warning',true);
            return;
        }
        const l=JSON.parse(localStorage.getItem('weo_produk_list')||'[]');
        const p=l.find(x=>x._id===sel.value);
        if(!p){
            tunjukToast('Produk tidak sah','error',true);
            return;
        }
        const existingIndex=pesananItems.findIndex(item=>item.nama===p.nama);
        if(existingIndex>=0){
            tunjukToast('Produk sudah wujud dalam senarai pesanan','warning',true);
            renderPesananItems(existingIndex);
            return;
        }
        const h=p.hargaPromo>0?p.hargaPromo:(p.hargaAsal||0);
        pesananItems.push({nama:p.nama,qty:1,harga:h});
        sel.value='';
        renderPesananItems();
    });
    // [BUTTON: btnPesananReset]
    document.getElementById('btnPesananReset').addEventListener('click',()=>{if(!confirm('Reset?'))return;resetFormPesanan();});
    // [INPUT: pesananTel numeric with formatting]
    const pesananTelInput=document.getElementById('pesananTel');
    if(pesananTelInput){
        pesananTelInput.addEventListener('input',function(){
            const x=this.value;
            this.value=formatPhoneValue(x);
        });
    }
    // [BUTTON: btnPesananSave]
    document.getElementById('btnPesananSave').addEventListener('click',()=>{
        const pel=document.getElementById('pesananPelanggan')?.value.trim();
        const telRaw=document.getElementById('pesananTel')?.value.trim();
        if(!pel){tunjukToast('Sila isi Nama Pelanggan','error');return;}
        if(!telRaw){tunjukToast('Sila isi No. Telefon','error');return;}
        if(confirm('Simpan pesanan?')){simpanPesanan();tutupModal('modalPesanan');}
    });
    document.getElementById('pesananSearch').addEventListener('input',function(){renderPesananTable(this.value);});
    document.querySelectorAll('[data-tab-pesanan]').forEach(btn=>btn.addEventListener('click',function(){document.querySelectorAll('[data-tab-pesanan]').forEach(b=>b.classList.remove('active'));this.classList.add('active');renderPesananTable();}));
    document.getElementById('pesananCheckAll').addEventListener('change',function(){document.querySelectorAll('#pesananTableBody input[type="checkbox"]').forEach(cb=>cb.checked=this.checked);kemaskiniPesananBulkBtn();});
    // [BUTTON: btnPesananBulkDelete]
    document.getElementById('btnPesananBulkDelete').addEventListener('click',()=>{const cbs=[...document.querySelectorAll('#pesananTableBody input[type="checkbox"]:checked')];if(!cbs.length)return;if(!confirm(`Padam ${cbs.length} pesanan?`))return;const ids=cbs.map(c=>c.dataset.id);let l=JSON.parse(localStorage.getItem('weo_pesanan_list')||'[]');l=l.filter(p=>!ids.includes(p._id));localStorage.setItem('weo_pesanan_list',JSON.stringify(l));document.getElementById('pesananCheckAll').checked=false;document.getElementById('btnPesananBulkDelete').style.display='none';tunjukToast(`${ids.length} pesanan dipadam`,'info');renderPesananTable();});
}

function kemaskiniPesananBulkBtn(){const n=document.querySelectorAll('#pesananTableBody input[type="checkbox"]:checked').length;const btn=document.getElementById('btnPesananBulkDelete');if(btn)btn.style.display=n>0?'inline-flex':'none';}

function isiDropdownPesananProduk(){
    const sel=document.getElementById('pesananPilihProduk');if(!sel)return;
    const list=JSON.parse(localStorage.getItem('weo_produk_list')||'[]').filter(p=>p.stok!=='habis');
    if(!list.length){
        sel.innerHTML='<option value="" disabled selected>Tiada produk</option>';
        return;
    }
    sel.innerHTML='<option value="" disabled selected hidden>— Pilih produk —</option>'+
        list.map(p=>{const h=p.hargaPromo>0?p.hargaPromo:(p.hargaAsal||0);return`<option value="${p._id}">${p.nama}${h>0?' (RM '+parseFloat(h).toFixed(2)+')':' (Percuma)'}</option>`;}).join('');
}


function parsePesananTel(raw){
    const value = (raw||'').trim();
    if(!value){
        return {code:'+60',number:''};
    }
    const normalized = value.replace(/[\s\-()]/g,'');
    const supportedCodes=['+60','+62','+65','+66','+1','+44','+81'];
    if(normalized.startsWith('+')){
        for(const code of supportedCodes.sort((a,b)=>b.length-a.length)){
            if(normalized.startsWith(code)){
                const numberPart = normalized.slice(code.length).replace(/\D/g,'').replace(/^0+/,'');
                return {code,number:numberPart};
            }
        }
        const m = normalized.match(/^\+(\d{1,3})(\d*)$/);
        if(m){
            const code='+'+m[1];
            const numberPart=m[2].replace(/^0+/,'');
            return {code:supportedCodes.includes(code)?code:'+60',number:numberPart};
        }
        return {code:'+60',number:''};
    }
    const clean=value.replace(/\D/g,'');
    if(clean.startsWith('60') && clean.length>2){
        return {code:'+60',number:clean.slice(2).replace(/^0+/,'')};
    }
    return {code:'+60',number:clean.replace(/^0+/,'')};
}

function getNextPesananNumber(){
    const list=JSON.parse(localStorage.getItem('weo_pesanan_list')||'[]');
    const used=list.map(p=>{const m=(p.no||'').match(/ORD-(\d+)/i);return m?parseInt(m[1],10):null;}).filter(n=>Number.isFinite(n));
    const usedSet=new Set(used);
    let i=1;
    while(usedSet.has(i)) i++;
    return i;
}

function resetFormPesanan(){
    pesananItems=[];
    const t=new Date();
    const nextNo=getNextPesananNumber();
    pesananNoAutogen='ORD-'+String(nextNo).padStart(4,'0');
    setVal('pesananTarikh',t.toISOString().split('T')[0]);
    setVal('pesananPelanggan','');
    setVal('pesananEmail','');
    document.getElementById('pesananCountryCode').value='+60';
    setVal('pesananTel','');
    setVal('pesananNota','');
    document.getElementById('pesananStatus').value='baru';
    document.getElementById('btnPesananSave').innerHTML='<iconify-icon icon="iwwa:save" width="14"></iconify-icon> Simpan';
    renderPesananItems();
}

function renderPesananItems(highlightIndex=null){
    const c=document.getElementById('pesananItemList');if(!c)return;c.innerHTML='';
    const hdr=document.createElement('div');hdr.className='item-header';hdr.style.gridTemplateColumns='1fr 56px 90px 78px 26px';hdr.innerHTML='<span>Nama Item</span><span style="text-align:center">Qty</span><span>Harga (RM)</span><span style="text-align:right">Jumlah</span><span></span>';
    c.appendChild(hdr);
    if(!pesananItems.length){
        const noRow=document.createElement('div');
        noRow.className='item-empty';
        noRow.style.gridColumn='1 / -1';
        noRow.style.padding='0.7rem 0.5rem';
        noRow.style.color='var(--text-muted)';
        noRow.style.fontStyle='italic';
        noRow.textContent='Tiada item. Sila pilih produk dan klik + Tambah untuk mula.';
        c.appendChild(noRow);
        return;
    }
    pesananItems.forEach((item,i)=>{
        const net=item.qty*item.harga;
        const row=document.createElement('div');
        row.className='item-row'+(highlightIndex===i?' highlight':'');
        row.style.gridTemplateColumns='1fr 56px 90px 78px 26px';
        row.innerHTML=`<div class="item-nama-label">${item.nama||'(nama item)'}</div><input type="number" class="item-qty-input" value="${item.qty}" min="1" data-pi="${i}"><div class="item-harga-label">RM ${parseFloat(item.harga).toFixed(2)}</div><div class="item-total-display">RM ${net.toFixed(2)}</div><button class="btn-del-item" data-pi="${i}">✕</button>`;
        c.appendChild(row);
    });
    c.querySelectorAll('.item-qty-input').forEach(inp=>inp.addEventListener('input',function(){
        const i=parseInt(this.dataset.pi);
        pesananItems[i].qty=parseFloat(this.value)||1;
        const row=this.closest('.item-row');
        const td=row?.querySelector('.item-total-display');
        if(td)td.textContent='RM '+(pesananItems[i].qty*pesananItems[i].harga).toFixed(2);
    }));
    c.querySelectorAll('.btn-del-item').forEach(btn=>btn.addEventListener('click',function(){
        pesananItems.splice(parseInt(this.dataset.pi),1);
        renderPesananItems();
    }));
}

function simpanPesanan(){
    const statusMap={baru:'Baru',proses:'Dalam Proses',siap:'Siap'};
    const status=document.getElementById('pesananStatus')?.value||'baru';
    const no=pesananNoAutogen||('ORD-'+String(getNextPesananNumber()).padStart(4,'0'));
    let cnt=parseInt(localStorage.getItem('weo_ord_counter')||'0');
    const noMatch=no.match(/^ORD-(\d+)$/i);
    const noNum=noMatch?parseInt(noMatch[1],10):0;
    if(noNum>cnt) cnt=noNum;
    localStorage.setItem('weo_ord_counter',cnt);
    const jumlah=pesananItems.reduce((s,i)=>s+(i.qty*i.harga),0),tarikh=document.getElementById('pesananTarikh')?.value||'',penjual=localStorage.getItem('weo_penjual')||'';
    const countryCode=document.getElementById('pesananCountryCode')?.value||'+60';
    const localTel=document.getElementById('pesananTel')?.value.replace(/\D/g,'')||'';
    const tel = localTel ? `${countryCode}${localTel}` : '';
    const email = document.getElementById('pesananEmail')?.value.trim()||'';
    const rekod={_id:pesananEditId||('O'+Date.now()),no,pelanggan:document.getElementById('pesananPelanggan')?.value.trim()||'-',email,tel:tel,item:pesananItems.filter(i=>i.nama).map(i=>i.nama).slice(0,2).join(', ')||'-',items:JSON.parse(JSON.stringify(pesananItems)),tarikhRaw:tarikh,tarikh:formatDate(tarikh),jumlah:formatRM(jumlah),status,statusLabel:statusMap[status]||status,nota:document.getElementById('pesananNota')?.value.trim()||'',penjual};
    let list=JSON.parse(localStorage.getItem('weo_pesanan_list')||'[]');if(pesananEditId){const idx=list.findIndex(p=>p._id===pesananEditId);if(idx>=0)list[idx]=rekod;else list.unshift(rekod);}else list.unshift(rekod);localStorage.setItem('weo_pesanan_list',JSON.stringify(list));
    syncPesananKePelanggan(rekod);
    tunjukToast(`Pesanan ${rekod.no} berjaya disimpan!`,'success');tambahNotif(`Pesanan ${rekod.no} — ${rekod.pelanggan}`,'pesanan','iwwa:file-text');if(_listenersInit.gabung)renderGabungTable();kemaskiniDashboard();
}

function syncPesananKePelanggan(pesanan){
    if(!pesanan||!pesanan._id) return;
    const jenis = pesanan.status === 'siap' ? 'resit' : 'invoice';
    const jenisLabel = jenis === 'invoice' ? 'Invois' : 'Resit';

    let bahaya = JSON.parse(localStorage.getItem('weo_pelanggan')||'[]');
    let item = bahaya.find(r=>r.pesananId===pesanan._id);
    const uniqueId = 'C'+pesanan._id.substring(1);
    
    if(!item){
        item = {
            _id: uniqueId,
            pesananId: pesanan._id,
            docNo: pesanan.no || generateDocNo(jenis),
            pelanggan: pesanan.pelanggan,
            produk: pesanan.item || '-',
            tarikh: pesanan.tarikh || formatDate(new Date().toISOString().split('T')[0]),
            luput: pesanan.tarikh || '',
            jumlah: pesanan.jumlah || 'RM 0.00',
            status: 'unpaid',
            statusLabel: 'Belum Bayar',
            jenis,
            jenisLabel,
            penjual: pesanan.penjual || '',
            _data: null
        };
        const existIdx = bahaya.findIndex(r=>r._id===uniqueId);
        if(existIdx>=0){ bahaya[existIdx]=item; }
        else { bahaya.unshift(item); }
    } else {
        item.pelanggan = pesanan.pelanggan;
        item.docNo = pesanan.no || item.docNo;
        item.produk = pesanan.item || '-';
        item.tarikh = pesanan.tarikh || item.tarikh;
        item.luput = pesanan.tarikh || item.luput;
        item.jumlah = pesanan.jumlah || item.jumlah;
        item.jenis = jenis;
        item.jenisLabel = jenisLabel;
        item.penjual = pesanan.penjual || item.penjual;
    }
    localStorage.setItem('weo_pelanggan',JSON.stringify(bahaya));
    if(_listenersInit.gabung)renderGabungTable();
    if(_listenersInit.pelanggan)renderPelangganTable();
}

function renderPesananTable(filter){
    const tbody=document.getElementById('pesananTableBody'),empty=document.getElementById('pesananEmpty'),count=document.getElementById('pesananCount');if(!tbody)return;
    let list=JSON.parse(localStorage.getItem('weo_pesanan_list')||'[]');
    const tab=document.querySelector('[data-tab-pesanan].active')?.dataset.tabPesanan||'semua';if(tab!=='semua')list=list.filter(p=>p.status===tab);
    if(filter){const q=filter.toLowerCase();list=list.filter(p=>(p.no||'').toLowerCase().includes(q)||(p.pelanggan||'').toLowerCase().includes(q));}
    count.textContent=`${list.length} pesanan`;
    if(!list.length){tbody.innerHTML='';empty.style.display='flex';return;}empty.style.display='none';
    // Bintik: baru=merah, proses=kuning, siap=hijau
    const dotC={baru:'#ef4444',proses:'#f4a426',siap:'#22c55e'};
    tbody.innerHTML=list.map(p=>`<tr>
        <td><input type="checkbox" data-id="${p._id}" onchange="kemaskiniPesananBulkBtn()"></td>
        <td><span class="no-copy-btn" onclick="salinNo('${p.no}')">${p.no}</span></td>
        <td>${p.pelanggan}</td><td style="color:var(--text-secondary);font-size:0.8rem">${p.item}</td>
        <td style="text-align:center">${p.tarikh||'-'}</td><td>${p.jumlah}</td>
        <td><div style="display:flex;align-items:center;gap:5px"><span style="width:9px;height:9px;border-radius:50%;background:${dotC[p.status]||'#94a3b8'};flex-shrink:0;display:inline-block;box-shadow:0 0 5px ${dotC[p.status]||'transparent'}"></span><span class="status-badge ${p.status}">${p.statusLabel}</span></div></td>
        <td><div class="action-btns"><button class="action-btn primary" title="Edit" onclick="editPesanan('${p._id}')"><iconify-icon icon="material-symbols:edit-sharp" width="15"></iconify-icon></button></div></td>
        <td><select class="status-mini-select" onchange="kemaskiniStatusPesanan('${p._id}',this.value)"><option value="baru" ${p.status==='baru'?'selected':''}>Baru</option><option value="proses" ${p.status==='proses'?'selected':''}>Dalam Proses</option><option value="siap" ${p.status==='siap'?'selected':''}>Siap</option></select></td>
    </tr>`).join('');
}

function kemaskiniStatusPesanan(id,status){const statusMap={baru:'Baru',proses:'Dalam Proses',siap:'Siap'};let list=JSON.parse(localStorage.getItem('weo_pesanan_list')||'[]');const idx=list.findIndex(p=>p._id===id);if(idx>=0){list[idx].status=status;list[idx].statusLabel=statusMap[status]||status;localStorage.setItem('weo_pesanan_list',JSON.stringify(list));syncPesananKePelanggan(list[idx]);tunjukToast('Status dikemaskini: '+statusMap[status],'success');kemaskiniDashboard();renderPesananTable();if(_listenersInit.gabung)renderGabungTable();}}function kemaskiniStatusBayarPesanan(id,status){const statusMap={unpaid:'Belum Bayar',paid:'Dibayar',pending:'Tertangguh'};let list=JSON.parse(localStorage.getItem('weo_pelanggan')||'[]');const idx=list.findIndex(r=>r.pesananId===id);if(idx>=0){list[idx].status=status;list[idx].statusLabel=statusMap[status]||status;localStorage.setItem('weo_pelanggan',JSON.stringify(list));tunjukToast('Status pembayaran dikemaskini: '+statusMap[status],'success');if(_listenersInit.gabung)renderGabungTable();renderPelangganTable();
    kemaskiniStatusFilePelanggan(id,status);}}

function editPesanan(id){const list=JSON.parse(localStorage.getItem('weo_pesanan_list')||'[]');const p=list.find(x=>x._id===id);if(!p)return;pesananEditId=id;pesananItems=p.items||[{nama:'',qty:1,harga:0}];document.getElementById('modalPesananTitle').textContent=`Edit: ${p.no}`;document.getElementById('btnPesananSave').innerHTML='<iconify-icon icon="iwwa:save" width="14"></iconify-icon> Kemas kini';pesananNoAutogen=p.no;setVal('pesananTarikh',p.tarikhRaw);setVal('pesananPelanggan',p.pelanggan);setVal('pesananEmail',p.email||'');const parsed=parsePesananTel(p.tel);document.getElementById('pesananCountryCode').value=parsed.code||'+60';
    const telInput=document.getElementById('pesananTel');
    if(telInput){
        telInput.value = parsed.number || '';
        telInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    setVal('pesananNota',p.nota);document.getElementById('pesananStatus').value=p.status;renderPesananItems();isiDropdownPesananProduk();bukaModal('modalPesanan');}

