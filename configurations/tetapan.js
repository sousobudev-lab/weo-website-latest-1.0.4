// ============================================================
// pages/tetapan.js — Modul Tetapan
// Dimuatkan oleh pages/tetapan.html
// ============================================================

// ── 20. TETAPAN ──────────────────────────────────────────────
function initTetapan(){
    muatTetapan();
    if(_listenersInit.tetapan)return;
    _listenersInit.tetapan=true;

    // [BUTTON: themeTogglePage]
    const thBtn=document.getElementById('themeTogglePage');if(thBtn)thBtn.addEventListener('click',()=>applyTheme(currentTheme==='dark'?'light':'dark'));

    // [BUTTON: tetapanAvatarInput — upload gambar profil]
    const avInput=document.getElementById('tetapanAvatarInput');if(avInput)avInput.addEventListener('change',function(){const f=this.files[0];if(!f)return;const r=new FileReader();r.onload=e=>{const url=e.target.result;['tetapanAvatarImg','sidebarAvatarImg','topbarAvatarImg','avatarModalImg'].forEach(id=>{const el=document.getElementById(id);if(el)el.src=url;});const profil=JSON.parse(localStorage.getItem('weo_profil')||'{}');profil.avatarUrl=url;localStorage.setItem('weo_profil',JSON.stringify(profil));tunjukToast('Gambar profil dikemaskini!','success');};r.readAsDataURL(f);});

    // [BUTTON: btnSimpanProfil]
    const bProfil=document.getElementById('btnSimpanProfil');if(bProfil)bProfil.addEventListener('click',()=>{const nama=document.getElementById('tetapanNama')?.value.trim();if(!nama)return;const profil=JSON.parse(localStorage.getItem('weo_profil')||'{}');profil.nama=nama;localStorage.setItem('weo_profil',JSON.stringify(profil));document.getElementById('sidebarUserName').textContent=nama;document.getElementById('avatarModalName').textContent=nama;tunjukToast(`Profil dikemaskini: ${nama}`,'success');});

    // [BUTTON: btnSimpanPenjual]
    const bPj=document.getElementById('btnSimpanPenjual');if(bPj)bPj.addEventListener('click',()=>{const v=document.getElementById('tetapanPenjual')?.value.trim();if(!v)return;localStorage.setItem('weo_penjual',v);tunjukToast('Penjual aktif dikemaskini!','success');});

    // [BUTTON: btnSimpanBiz]
    const bBiz=document.getElementById('btnSimpanBiz');if(bBiz)bBiz.addEventListener('click',simpanBiz);

    // [BUTTON: btnTambahAkaun]
    const bAkaun=document.getElementById('btnTambahAkaun');if(bAkaun)bAkaun.addEventListener('click',()=>{const nama=prompt('Nama akaun baru:');if(!nama)return;let akunList=JSON.parse(localStorage.getItem('weo_akun_list')||'[]');akunList.push({id:Date.now(),nama,biz:{}});localStorage.setItem('weo_akun_list',JSON.stringify(akunList));renderAkunList();tunjukToast(`Akaun "${nama}" ditambah!`,'success');});
}

function muatTetapan(){
    // Profil
    const profil=JSON.parse(localStorage.getItem('weo_profil')||'{}');if(profil.nama){const t=document.getElementById('tetapanNama');if(t)t.value=profil.nama;}if(profil.avatarUrl){['tetapanAvatarImg','sidebarAvatarImg','topbarAvatarImg','avatarModalImg'].forEach(id=>{const el=document.getElementById(id);if(el)el.src=profil.avatarUrl;});}
    // Penjual
    const pjEl=document.getElementById('tetapanPenjual');if(pjEl)pjEl.value=localStorage.getItem('weo_penjual')||'';
    // Biz
    const biz=JSON.parse(localStorage.getItem('weo_biz')||'{}');const sI=(id,v)=>{const el=document.getElementById(id);if(el)el.value=v||'';};sI('tetapanBizNama',biz.nama);sI('tetapanBizReg',biz.reg);sI('tetapanBizAlamat',biz.alamat);sI('tetapanBizTel',biz.tel);sI('tetapanBizEmail',biz.email);sI('tetapanBizBank',biz.bank);sI('tetapanBizNamaBank',biz.namaBank);sI('tetapanBizQR',biz.qr);sI('tetapanBizLink',biz.link);
    renderAkunList();
}

function simpanBiz(){
    const g=id=>document.getElementById(id)?.value.trim()||'';
    const biz={
        nama:g('tetapanBizNama'),reg:g('tetapanBizReg'),alamat:g('tetapanBizAlamat'),
        tel:g('tetapanBizTel'),email:g('tetapanBizEmail'),bank:g('tetapanBizBank'),
        namaBank:g('tetapanBizNamaBank'),qr:g('tetapanBizQR'),link:g('tetapanBizLink')
    };
    localStorage.setItem('weo_biz',JSON.stringify(biz));
    // Kemaskini syarikat_list untuk cadangan
    if(biz.nama){
        let sl=JSON.parse(localStorage.getItem('weo_syarikat_list')||'[]');
        const e={companyName:biz.nama,companyReg:biz.reg,companyAddress:biz.alamat,companyPhone:biz.tel,companyEmail:biz.email};
        const ix=sl.findIndex(s=>s.companyName===biz.nama);
        if(ix>=0)sl[ix]=e;else sl.unshift(e);
        localStorage.setItem('weo_syarikat_list',JSON.stringify(sl));
    }
    tunjukToast('Maklumat perniagaan disimpan!','success');
}

let _akunAktifIdx=0;
function renderAkunList(){const box=document.getElementById('akunList');if(!box)return;const list=JSON.parse(localStorage.getItem('weo_akun_list')||'[]');if(!list.length){box.innerHTML='<span style="font-size:0.78rem;color:var(--text-muted)">Tiada akaun tambahan</span>';return;}box.innerHTML=list.map((a,i)=>`<button class="btn-akun ${i===_akunAktifIdx?'active':''}" onclick="pilihAkun(${i},event)">${a.nama}</button>`).join('');}
function pilihAkun(idx,e){if(e)e.stopPropagation();_akunAktifIdx=idx;renderAkunList();tunjukToast('Akaun ditukar','info');}

