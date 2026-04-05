// ============================================================
// script.js — Weo Dashboard Core
// Memuatkan semua modul script dari setiap page
// ============================================================

// ============================================================
// SCRIPT.JS — Weo Dashboard (Bersih, Semua Button Berfungsi)
// ============================================================

// ── 1. SIDEBAR ──────────────────────────────────────────────
const sidebar  = document.getElementById('sidebar');
const overlay  = document.getElementById('overlay');
const main     = document.getElementById('main');

// Dua button: mobile (topbar) + desktop (sidebar)
// Kita cari kedua-duanya secara selamat
const hamburgerMobile  = document.getElementById('hamburgerMobile');   // topbar — mobile/tablet
const sidebarToggleDesktop = document.getElementById('sidebarToggleDesktop'); // sidebar — desktop

function isMobile() { return window.innerWidth <= 900; }

function isSidebarOpen() {
    return isMobile()
        ? sidebar.classList.contains('open')
        : !sidebar.classList.contains('mini');
}

function bukaSidebar() {
    if (isMobile()) {
        sidebar.classList.add('open');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    } else {
        sidebar.classList.remove('mini');
        main.classList.add('sidebar-open');
    }
}

function tutupSidebar() {
    if (isMobile()) {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    } else {
        sidebar.classList.add('mini');
        main.classList.remove('sidebar-open');
    }
}

function toggleSidebar() {
    isSidebarOpen() ? tutupSidebar() : bukaSidebar();
}

// Pasang event pada KEDUA-DUA button
if (hamburgerMobile)       hamburgerMobile.addEventListener('click', toggleSidebar);
if (sidebarToggleDesktop)  sidebarToggleDesktop.addEventListener('click', toggleSidebar);

// Overlay tutup sidebar (mobile)
overlay.addEventListener('click', tutupSidebar);

// Resize handler
window.addEventListener('resize', () => {
    if (!isMobile()) {
        // Desktop: sembunyikan overlay, pulih state sidebar
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        sidebar.classList.remove('open');
        if (sidebar.classList.contains('mini')) {
            main.classList.remove('sidebar-open');
        } else {
            main.classList.add('sidebar-open');
        }
    } else {
        // Mobile: sidebar jangan guna sidebar-open class
        main.classList.remove('sidebar-open');
        if (!sidebar.classList.contains('open')) {
            overlay.classList.remove('active');
        }
    }
});

// ── 2. PAGE SWITCHING ────────────────────────────────────────
const navItems=document.querySelectorAll('.nav-item');
// pages: jangan cache — query semula setiap kali (sebab dimuatkan async)
const getPages=()=>document.querySelectorAll('.page');
let pages=[];  // diisi semula dalam tukarkePage
const pageTitle=document.getElementById('pageTitle'),breadcrumbEl=document.getElementById('breadcrumb'),breadcrumbSect=document.getElementById('breadcrumbSection');
const pageTitles={dashboard:'Dashboard',pesanan:'Pesanan & Pelanggan',resit:'Resit / Invois',pelanggan:'Pesanan & Pelanggan',produk:'Produk',laporan:'Laporan',tetapan:'Tetapan',filepelanggan:'Fail Pelanggan'};
// Flag: listeners dipasang sekali, render boleh dipanggil semula
const _listenersInit={};

function tukarkePage(tp){
    // Query semula setiap kali — sebab pages dimuatkan secara async
    const allPages = getPages();
    allPages.forEach(p=>{p.classList.remove('active'); p.classList.remove('page-pesanan');});
    const el=document.getElementById('page-'+tp);
    if(el){
        el.classList.add('active');
        if(tp==='pesanan' || tp==='pelanggan') el.classList.add('page-pesanan');
    }
    pageTitle.textContent=pageTitles[tp]||tp; breadcrumbEl.textContent=pageTitles[tp]||tp;
    const nav=document.querySelector(`.nav-item[data-page="${tp}"]`);
    if(nav&&breadcrumbSect) breadcrumbSect.textContent=nav.dataset.section||'Utama';
    navItems.forEach(n=>n.classList.remove('active')); if(nav) nav.classList.add('active');
    if(isMobile()) tutupSidebar();
    if(tp==='resit')    initResit();
    if(tp==='pelanggan'){tukarkePage('pesanan');return;}
    if(tp==='produk')   {initProduk();renderProdukGrid();}
    if(tp==='pesanan')  {initGabung();renderGabungTable();}
    if(tp==='laporan')  initLaporan();
    if(tp==='tetapan')  initTetapan();
    if(tp==='dashboard')     kemaskiniDashboard();
    if(tp==='filepelanggan')  initFilePelanggan();
}
navItems.forEach(it=>it.addEventListener('click',function(e){e.preventDefault();if(this.dataset.page)tukarkePage(this.dataset.page);}));
document.getElementById('searchInput').addEventListener('input',function(){const q=this.value.toLowerCase();navItems.forEach(it=>{const t=it.querySelector('.nav-txt');if(t)it.style.display=t.textContent.toLowerCase().includes(q)?'flex':'none';});});

// ── 3. AVATAR MODAL ─────────────────────────────────────────
const avatarModalOverlay=document.getElementById('avatarModalOverlay');
document.getElementById('topbarAvatar').addEventListener('click',()=>avatarModalOverlay.classList.add('active'));
document.getElementById('avatarModalClose').addEventListener('click',()=>avatarModalOverlay.classList.remove('active'));
avatarModalOverlay.addEventListener('click',e=>{if(e.target===avatarModalOverlay)avatarModalOverlay.classList.remove('active');});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){avatarModalOverlay.classList.remove('active');notifDropdown.classList.remove('open');}});

// ── 4. TEMA ──────────────────────────────────────────────────
let currentTheme=localStorage.getItem('weo_theme')||'dark';
function applyTheme(t){
    document.body.classList.toggle('theme-light',t==='light');document.body.classList.toggle('theme-dark',t!=='light');
    const i=document.getElementById('themeIcon');if(i)i.setAttribute('icon',t==='light'?'iwwa:sun':'iwwa:moon');
    currentTheme=t;localStorage.setItem('weo_theme',t);
    const ip=document.getElementById('themeIconPage'),lp=document.getElementById('themeLabel');
    if(ip)ip.setAttribute('icon',t==='light'?'iwwa:sun':'iwwa:moon');if(lp)lp.textContent=t==='light'?'Mod Cerah':'Mod Gelap';
}
applyTheme(currentTheme);
document.getElementById('themeToggle').addEventListener('click',()=>applyTheme(currentTheme==='dark'?'light':'dark'));

// ── 5. NOTIFIKASI ────────────────────────────────────────────
const notifBtn=document.getElementById('notifBtn'),notifDropdown=document.getElementById('notifDropdown'),notifDot=document.getElementById('notifDot'),notifListEl=document.getElementById('notifList');
let notifData=JSON.parse(localStorage.getItem('weo_notif')||'[]');
notifBtn.addEventListener('click',e=>{e.stopPropagation();notifDropdown.classList.toggle('open');if(notifDropdown.classList.contains('open'))renderNotifList();});
document.addEventListener('click',e=>{if(!notifDropdown.contains(e.target)&&e.target!==notifBtn)notifDropdown.classList.remove('open');});
notifDropdown.addEventListener('click',e=>e.stopPropagation());
document.getElementById('clearNotif').addEventListener('click',()=>{notifData=[];localStorage.setItem('weo_notif',JSON.stringify(notifData));renderNotifList();kemaskiniNotifDot();});
function tambahNotif(msg,page,icon){notifData.unshift({msg,page:page||null,icon:icon||'iwwa:checkmark',masa:new Date().toLocaleTimeString('ms-MY',{hour:'2-digit',minute:'2-digit'})});if(notifData.length>30)notifData=notifData.slice(0,30);localStorage.setItem('weo_notif',JSON.stringify(notifData));kemaskiniNotifDot();}
function kemaskiniNotifDot(){notifDot.style.display=notifData.length>0?'block':'none';}
function renderNotifList(){if(!notifData.length){notifListEl.innerHTML='<div class="notif-empty">Tiada notifikasi</div>';return;}notifListEl.innerHTML=notifData.map(n=>`<div class="notif-item" data-page="${n.page||''}"><div class="notif-item-icon"><iconify-icon icon="${n.icon}" width="16"></iconify-icon></div><div class="notif-item-text"><div class="notif-item-msg">${n.msg}</div><div class="notif-item-time">${n.masa}</div></div></div>`).join('');notifListEl.querySelectorAll('.notif-item').forEach(it=>it.addEventListener('click',function(){if(this.dataset.page)tukarkePage(this.dataset.page);notifDropdown.classList.remove('open');}));}
kemaskiniNotifDot();

// ── 6. TOAST ─────────────────────────────────────────────────
function tunjukToast(msg,type,noNotif){
    const c=document.getElementById('toastContainer'),t=document.createElement('div');
    t.className=`toast ${type||'info'}`;
    const icons={success:'iwwa:checkmark',error:'iwwa:close',info:'iwwa:info',warning:'iwwa:warning'};
    t.innerHTML=`<iconify-icon icon="${icons[type]||'iwwa:checkmark'}" width="18" class="toast-icon"></iconify-icon><span class="toast-msg">${msg}</span><button class="toast-close"><iconify-icon icon="iwwa:close" width="14"></iconify-icon></button>`;
    t.querySelector('.toast-close').addEventListener('click',()=>buangToast(t));
    c.appendChild(t);
    setTimeout(()=>buangToast(t),4000);
    if(!noNotif){tambahNotif(msg,null,icons[type]||'iwwa:checkmark');}
}
function buangToast(t){if(!t.parentNode)return;t.style.animation='toastOut 0.3s ease forwards';setTimeout(()=>{if(t.parentNode)t.remove();},300);}

// ── 7. MODAL HELPER ──────────────────────────────────────────
function bukaModal(id){const m=document.getElementById(id);if(m)m.classList.add('open');}
function tutupModal(id){const m=document.getElementById(id);if(m)m.classList.remove('open');}
document.querySelectorAll('.modal-overlay').forEach(o=>o.addEventListener('click',function(e){if(e.target===o)o.classList.remove('open');}));


// ── 21. DASHBOARD ────────────────────────────────────────────
function kemaskiniDashboard(){const pes=JSON.parse(localStorage.getItem('weo_pesanan_list')||'[]'),pel=JSON.parse(localStorage.getItem('weo_pelanggan')||'[]');const st=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};st('dashPesananBaru',pes.filter(p=>p.status==='baru').length);st('dashDalamProses',pes.filter(p=>p.status==='proses').length);st('dashSiap',pes.filter(p=>p.status==='siap').length);const total=pel.reduce((s,r)=>s+(parseFloat((r.jumlah||'0').replace(/[^0-9.]/g,''))||0),0);st('dashHasil','RM '+total.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,','));}
// kemaskiniDashboard() dipanggil dalam _initAppSelepasLoad()

// ── 22. MUAT PROFIL AWAL ─────────────────────────────────────
(function(){const profil=JSON.parse(localStorage.getItem('weo_profil')||'{}');if(profil.nama){const el=document.getElementById('sidebarUserName');if(el)el.textContent=profil.nama;}if(profil.avatarUrl){['sidebarAvatarImg','topbarAvatarImg','avatarModalImg'].forEach(id=>{const el=document.getElementById(id);if(el)el.src=profil.avatarUrl;});}})();




// ════════════════════════════════════════════════════════════
// GABUNG — Pesanan & Pelanggan (satu table)
// ════════════════════════════════════════════════════════════

function initGabung() {
    // Init sub-sistem yang masih diperlukan
    initPelanggan();   // untuk modal pratonton resit & listener btnNewDoc
    initPesanan();     // untuk modal pesanan baru (dipastikan walaupun list kosong)

    if (_listenersInit.gabung) return;
    _listenersInit.gabung = true;

    // ── Split button: satu button, dropdown semua jenis ──
    const _btnSplit    = document.getElementById('btnSplitMain');
    const _btnDropdown = document.getElementById('btnNewDropdown');

    function _closeDrop() { if(_btnDropdown) _btnDropdown.classList.remove('open'); }
    function _toggleDrop(e) {
        e.stopPropagation();
        if (_btnDropdown) _btnDropdown.classList.toggle('open');
    }

    // Klik mana-mana bahagian btn-split → toggle dropdown
    if (_btnSplit) _btnSplit.addEventListener('click', _toggleDrop);

    // Klik item dropdown
    if (_btnDropdown) {
        _btnDropdown.addEventListener('click', e => {
            e.stopPropagation();
            const btn  = e.target.closest('[data-action]');
            if (!btn) return;
            const action = btn.dataset.action;
            _closeDrop();

            if (action === 'new-pesanan') {
                // Buka modal pesanan baru
                pesananEditId = null;
                resetFormPesanan();
                isiDropdownPesananProduk();
                const titleEl = document.getElementById('modalPesananTitle');
                if (titleEl) titleEl.textContent = 'Pesanan Baru';
                const saveBtn = document.getElementById('btnPesananSave');
                if (saveBtn) saveBtn.innerHTML = '<iconify-icon icon="iwwa:save" width="14"></iconify-icon> Simpan';
                bukaModal('modalPesanan');

            } else if (action === 'new-resit' || action === 'new-invoice') {
                const docType = (action === 'new-invoice') ? 'invoice' : 'resit';
                currentDocType = docType;
                tukarkePage('resit');
                setTimeout(() => {
                    document.querySelectorAll('#page-resit .doc-type-btn')
                        .forEach(b => b.classList.toggle('active', b.dataset.doctype === docType));
                    tukarDocType(docType);
                    renderItems(); renderPreview();
                }, 80);
            }
        });
    }

    // Tutup dropdown bila klik luar
    document.addEventListener('click', _closeDrop);

    // [SEARCH]
    document.getElementById('gabungSearch')?.addEventListener('input', function () {
        renderGabungTable(this.value);
    });

    // [TAB JENIS / STATUS] - tidak digunakan untuk permintaan ini (tapis seluruh rekod terus)
    // Nota: panel tab telah dikurangkan; tiada filter asas dari UI.

    // [CHECK ALL]
    document.getElementById('gabungCheckAll')?.addEventListener('change', function () {
        document.querySelectorAll('#gabungTableBody input[type="checkbox"]').forEach(cb => cb.checked = this.checked);
        kemaskiniGabungBulkBtn();
    });

    // [BULK DELETE]
    document.getElementById('btnGabungBulkDelete')?.addEventListener('click', function () {
        const cbs = [...document.querySelectorAll('#gabungTableBody input[type="checkbox"]:checked')];
        if (!cbs.length) return;

        // Asingkan antara pesanan (_id bermula 'O') dan pelanggan (_id bermula 'C')
        const idsPes = cbs.map(c => c.dataset.id).filter(id => id && id.startsWith('O'));
        const idsPel = cbs.map(c => c.dataset.id).filter(id => id && id.startsWith('C'));

        if (!idsPes.length && !idsPel.length) { tunjukToast('Tiada rekod yang boleh dipadam', 'error'); return; }
        if (!confirm(`Padam ${idsPes.length + idsPel.length} rekod yang dipilih?`)) return;

        if (idsPes.length) {
            let pes = JSON.parse(localStorage.getItem('weo_pesanan_list') || '[]');
            pes = pes.filter(p => !idsPes.includes(p._id));
            localStorage.setItem('weo_pesanan_list', JSON.stringify(pes));
        }
        if (idsPel.length) {
            let pel = JSON.parse(localStorage.getItem('weo_pelanggan') || '[]');
            pel = pel.filter(r => !idsPel.includes(r._id));
            localStorage.setItem('weo_pelanggan', JSON.stringify(pel));
        }
        document.getElementById('gabungCheckAll').checked = false;
        document.getElementById('btnGabungBulkDelete').style.display = 'none';
        tunjukToast(`${idsPes.length + idsPel.length} rekod dipadam`, 'info');
        renderGabungTable();
        kemaskiniDashboard();
    });
}

function kemaskiniGabungBulkBtn() {
    const n = document.querySelectorAll('#gabungTableBody input[type="checkbox"]:checked').length;
    const btn = document.getElementById('btnGabungBulkDelete');
    if (btn) btn.style.display = n > 0 ? 'inline-flex' : 'none';
    if (n === 0) {
        const ca = document.getElementById('gabungCheckAll'); if (ca) ca.checked = false;
    }
}

function renderGabungTable(filter) {
    const tbody  = document.getElementById('gabungTableBody');
    const empty  = document.getElementById('gabungEmpty');
    const count  = document.getElementById('gabungCount');
    if (!tbody) return;

    // Ambil data dari kedua-dua storage
    const pesRaw = JSON.parse(localStorage.getItem('weo_pesanan_list') || '[]');
    const pelRaw = JSON.parse(localStorage.getItem('weo_pelanggan')    || '[]');

    // Normalize pesanan ke format gabungan
    const pesList = pesRaw.map(p => {
        const linked = pelRaw.find(r => r.pesananId === p._id);
        const jenis = linked ? linked.jenis : (p.status === 'siap' ? 'resit' : 'invoice');
        return {
            _id:            p._id,
            _sumber:        'pesanan',
            no:             p.no,
            pelanggan:      p.pelanggan,
            item:           p.item || '-',
            tarikh:         p.tarikh || '-',
            jumlah:         p.jumlah,
            statusOp:       p.status,
            statusOpLabel:  p.statusLabel,
            statusBayar:    linked ? linked.status : 'unpaid',
            statusBayarLabel: linked ? linked.statusLabel : 'Belum Bayar',
            jenis:          jenis,
            jenisLabel:     linked ? linked.jenisLabel : (jenis === 'invoice' ? 'Invois' : 'Resit'),
            penjual:        p.penjual || '',
            _data:          null,
            _pesData:       p,
        };
    });

    // Normalize pelanggan (resit/invois)
    const pelList = pelRaw.map(r => ({
        _id:         r._id,
        _sumber:     'pelanggan',
        no:          r.docNo || '-',
        pelanggan:   r.pelanggan || '-',
        item:        r.produk || '-',
        tarikh:      r.tarikh || '-',
        jumlah:      r.jumlah || '-',
        // Status bayaran: unpaid/paid/pending
        statusOp:    '',
        statusOpLabel: '',
        statusBayar: r.status || 'unpaid',
        statusBayarLabel: r.statusLabel || 'Belum Bayar',
        jenis:       r.jenis || 'resit',
        jenisLabel:  r.jenisLabel || 'Resit',
        penjual:     r.penjual || '',
        _data:       r,
        _pesData:    null,
    }));

    // Gabungkan dan sort mengikut tarikh terbaru
    let all = [...pesList, ...pelList].sort((a, b) => {
        // Cuba parse tarikh — format "1 April 2026"
        const parseT = s => {
            if (!s || s === '-') return 0;
            const ms = ['Jan','Feb','Mac','Apr','Mei','Jun','Jul','Ogos','Sep','Okt','Nov','Dis'];
            const en = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            let t = s;
            ms.forEach((m, i) => { t = t.replace(m, en[i]); });
            const d = Date.parse(t);
            return isNaN(d) ? 0 : d;
        };
        return parseT(b.tarikh) - parseT(a.tarikh);
    });

    // Tab filter tidak digunakan; semua rekod dipaparkan
    // (user minta div.tab-group dan tapisan dihapuskan)

    // Status operasi + status pembayaran sekarang dibina dalam setiap baris.

    // Filter carian
    if (filter) {
        const q = filter.toLowerCase();
        all = all.filter(r =>
            (r.no || '').toLowerCase().includes(q) ||
            (r.pelanggan || '').toLowerCase().includes(q) ||
            (r.item || '').toLowerCase().includes(q)
        );
    }

    // Warna dot status operasi
    const dotC = { baru: '#ef4444', proses: '#f4a426', siap: '#22c55e' };
    // Warna status bayaran
    const bayarBg  = { paid: 'rgba(34,197,94,0.12)',   unpaid: 'rgba(239,68,68,0.12)',  pending: 'rgba(244,164,38,0.12)'  };
    const bayarCol = { paid: '#22c55e',                 unpaid: '#ef4444',               pending: '#f4a426'               };
    const bayarLbl = { paid: 'Dibayar',                 unpaid: 'Belum Bayar',           pending: 'Tertangguh'            };

    count.textContent = `${all.length} rekod`;

    if (!all.length) { tbody.innerHTML = ''; empty.style.display = 'flex'; return; }
    empty.style.display = 'none';

    tbody.innerHTML = all.map(r => {
        // Kolum Status — 2 baris: baris 1 = status operasi, baris 2 = status bayaran
        let statusHtml = '';
        if (r._sumber === 'pesanan') {
            const dotOp = dotC[r.statusOp] || '#94a3b8';
            const opLabel = r.statusOpLabel || 'Baru';
            const bgBayar  = bayarBg[r.statusBayar]  || 'rgba(148,163,184,0.12)';
            const colBayar = bayarCol[r.statusBayar]  || '#94a3b8';
            const lblBayar = bayarLbl[r.statusBayar]  || r.statusBayarLabel || 'Belum Bayar';

            statusHtml  = `
                <div style="display:flex;align-items:center;gap:5px;margin-bottom:3px">
                    <span style="width:8px;height:8px;border-radius:50%;background:${dotOp};flex-shrink:0;box-shadow:0 0 4px ${dotOp}"></span>
                    <span class="status-badge ${r.statusOp}">${opLabel}</span>
                </div>
                <div style="display:flex;align-items:center;gap:5px">
                    <span style="font-size:0.65rem;font-weight:700;background:${bgBayar};color:${colBayar};padding:2px 8px;border-radius:18px;display:inline-block">${lblBayar}</span>
                </div>`;
        } else {
            // Resit/Invois: tunjuk status bayaran sahaja
            const bg  = bayarBg[r.statusBayar]  || 'rgba(148,163,184,0.12)';
            const col = bayarCol[r.statusBayar]  || '#94a3b8';
            const lbl = bayarLbl[r.statusBayar]  || r.statusBayarLabel;
            statusHtml = `
                <span style="font-size:0.75rem;font-weight:700;background:${bg};color:${col};padding:2px 8px;border-radius:20px;display:inline-block">${lbl}</span>`;
        }

        // Kolum Jenis — button untuk preview jika pelanggan, badge jika pesanan
        let jenisHtml = '';
        if(r._sumber === 'pelanggan'){
            const jenisBg  = { resit:'rgba(34,197,94,0.12)', invoice:'rgba(244,164,38,0.12)' };
            const jenisCol = { resit:'#22c55e', invoice:'#f4a426' };
            jenisHtml = `<button onclick="event.stopPropagation();const pel=JSON.parse(localStorage.getItem('weo_pelanggan')||'[]').find(x=>x._id==='${r._id}');if(pel){_rekodPreviewAktif=pel;tunjukResitPreviewModal(pel);}" style="background:${jenisBg[r.jenis]||'rgba(148,163,184,0.1)'};color:${jenisCol[r.jenis]||'#94a3b8'};border:none;padding:2px 8px;border-radius:20px;font-size:0.75rem;font-weight:700;cursor:pointer;transition:opacity 0.2s" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">${r.jenisLabel}</button>`;
        } else {
            const jenisBg  = { pesanan:'rgba(99,102,241,0.12)' };
            const jenisCol = { pesanan:'#6366f1' };
            jenisHtml = `<span style="font-size:0.75rem;font-weight:700;background:${jenisBg[r.jenis]||'rgba(148,163,184,0.1)'};color:${jenisCol[r.jenis]||'#94a3b8'};padding:2px 8px;border-radius:20px;display:inline-block">${r.jenisLabel}</span>`;
        }

        // Kolum Kemaskini — hanya untuk pesanan
        let kemaskiniHtml = '';
        if (r._sumber === 'pesanan') {
            kemaskiniHtml = `<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
                <select class="status-mini-select" onchange="kemaskiniStatusPesanan('${r._id}',this.value)">
                    <option value="baru"  ${r.statusOp==='baru'  ?'selected':''}>Baru</option>
                    <option value="proses"${r.statusOp==='proses'?'selected':''}>Dalam Proses</option>
                    <option value="siap"  ${r.statusOp==='siap'  ?'selected':''}>Siap</option>
                </select>
                <select class="status-mini-select" onchange="kemaskiniStatusBayarPesanan('${r._id}',this.value)">
                    <option value="unpaid" ${r.statusBayar==='unpaid'?'selected':''}>Belum Bayar</option>
                    <option value="paid"   ${r.statusBayar==='paid'  ?'selected':''}>Dibayar</option>
                    <option value="pending"${r.statusBayar==='pending'?'selected':''}>Tertangguh</option>
                </select>
            </div>`;
        }

        // Tindakan
        let tindakanHtml = '';
        if (r._sumber === 'pesanan') {
            tindakanHtml = `
                <button class="action-btn primary" title="Edit Pesanan" onclick="event.stopPropagation();editPesanan('${r._id}')">
                    <iconify-icon icon="material-symbols:edit-sharp" width="15"></iconify-icon>
                </button>
                <button class="action-btn danger" title="Padam Pesanan" onclick="event.stopPropagation();padamGabungRekod('${r._id}','pesanan')">
                    <iconify-icon icon="iwwa:trash" width="14"></iconify-icon>
                </button>`;
        } else {
            tindakanHtml = `
                <button class="action-btn primary" title="Edit Resit/Invois" onclick="event.stopPropagation();editPelangganRekod('${r._id}')">
                    <iconify-icon icon="material-symbols:edit-sharp" width="15"></iconify-icon>
                </button>
                <button class="action-btn danger" title="Padam" onclick="event.stopPropagation();padamGabungRekod('${r._id}','pelanggan')">
                    <iconify-icon icon="iwwa:trash" width="14"></iconify-icon>
                </button>`;
        }

        return `<tr class="gabung-baris" data-id="${r._id}" data-sumber="${r._sumber}" style="cursor:${r._sumber==='pelanggan'?'pointer':'default'}">
            <td onclick="event.stopPropagation()"><input type="checkbox" data-id="${r._id}" onchange="kemaskiniGabungBulkBtn()"></td>
            <td><span class="no-copy-btn" onclick="event.stopPropagation();salinNo('${r.no}')">${r.no}</span></td>
            <td>${r.pelanggan}</td>
            <td style="color:var(--text-secondary);font-size:0.8rem;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.item}</td>
            <td style="text-align:center;white-space:nowrap">${r.tarikh}</td>
            <td style="text-align:right;font-weight:600">${r.jumlah}</td>
            <td>${statusHtml}</td>
            <td>${jenisHtml}</td>
            <td onclick="event.stopPropagation()"><div class="action-btns">${tindakanHtml}</div></td>
            <td onclick="event.stopPropagation()">${kemaskiniHtml}</td>
        </tr>`;
    }).join('');

    // Klik baris pelanggan → pratonton resit
    tbody.querySelectorAll('.gabung-baris[data-sumber="pelanggan"]').forEach(row => {
        row.addEventListener('click', function () {
            const id  = this.dataset.id;
            const all = JSON.parse(localStorage.getItem('weo_pelanggan') || '[]');
            const r   = all.find(x => x._id === id);
            if (r && r._data) { _rekodPreviewAktif = r; tunjukResitPreviewModal(r); }
        });
    });
}

function padamGabungRekod(id, sumber) {
    if (!confirm('Padam rekod ini?')) return;
    if (sumber === 'pesanan') {
        let list = JSON.parse(localStorage.getItem('weo_pesanan_list') || '[]');
        list = list.filter(p => p._id !== id);
        localStorage.setItem('weo_pesanan_list', JSON.stringify(list));
    } else {
        let list = JSON.parse(localStorage.getItem('weo_pelanggan') || '[]');
        list = list.filter(r => r._id !== id);
        localStorage.setItem('weo_pelanggan', JSON.stringify(list));
    }
    tunjukToast('Rekod dipadam', 'info');
    renderGabungTable();
    kemaskiniDashboard();
}

function eksportGabungCSV() {
    const pesRaw = JSON.parse(localStorage.getItem('weo_pesanan_list') || '[]');
    const pelRaw = JSON.parse(localStorage.getItem('weo_pelanggan')    || '[]');
    const header = ['No.', 'Pelanggan', 'Item', 'Tarikh', 'Jumlah', 'Status Op', 'Status Bayar', 'Jenis', 'Penjual'];
    const rows   = [
        ...pesRaw.map(p => [p.no, p.pelanggan, p.item, p.tarikh, p.jumlah, p.statusLabel, '', 'Pesanan', p.penjual || '']),
        ...pelRaw.map(r => [r.docNo, r.pelanggan, r.produk, r.tarikh, r.jumlah, '', r.statusLabel, r.jenisLabel, r.penjual || '']),
    ].map(row => row.map(v => `"${(v||'').replace(/"/g,'""')}"`));
    const csv = [header, ...rows].map(r => r.join(',')).join(String.fromCharCode(13,10));
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,﻿' + encodeURIComponent(csv);
    a.download = 'weo-rekod-' + new Date().toISOString().slice(0,10) + '.csv';
    a.click();
    tunjukToast('Data dieksport sebagai CSV!', 'success');
}

// Expose fungsi lama supaya link lain masih berfungsi
function renderPesananTable(f) { renderGabungTable(f); }
function renderPelangganTable(f) { renderGabungTable(f); }

// Panggil kemaskiniDashboard guna gabung count
const _asalKemaskiniDashboard = kemaskiniDashboard;

console.log('✅ Weo Dashboard — Semua fungsi berjalan!');



// Init page Fail Pelanggan
function initFilePelanggan() {
    renderFilePelanggan();
    if (_listenersInit.filepelanggan) return;
    _listenersInit.filepelanggan = true;

    const searchEl = document.getElementById('filePelangganSearch');
    if (searchEl) searchEl.addEventListener('input', function() { renderFilePelanggan(this.value); });
}

// ════════════════════════════════════════════════════════════
// FILE PELANGGAN — Sistem Fail Pelanggan (Virtual Folder)
// Setiap pelanggan ada "folder" dalam localStorage
// ════════════════════════════════════════════════════════════

const _KEY_FILE_PEL = 'weo_file_pelanggan';

// Jana / kemaskini fail pelanggan apabila simpan dokumen
function janaFilePelanggan(rekod) {
    if (!rekod || !rekod.pelanggan) return;

    const senarai = JSON.parse(localStorage.getItem(_KEY_FILE_PEL) || '{}');
    const pelNama = rekod.pelanggan.trim();
    const key     = _slgPelanggan(pelNama);

    if (!senarai[key]) {
        senarai[key] = {
            nama:       pelNama,
            key,
            tarikhCipta: new Date().toLocaleDateString('ms-MY'),
            dokumen:    [],
        };
    }

    // Cari dokumen sedia ada (berdasarkan docNo)
    const idx = senarai[key].dokumen.findIndex(d => d.docNo === rekod.docNo);
    const dok = {
        docNo:       rekod.docNo,
        jenis:       rekod.jenis || 'resit',   // resit → invois bila bayar
        jenisLabel:  rekod.jenis === 'invoice' ? 'Invois' : 'Resit',
        status:      rekod.status || 'unpaid',
        statusLabel: rekod.statusLabel || 'Belum Bayar',
        tarikh:      rekod.tarikh,
        jumlah:      rekod.jumlah,
        penjual:     rekod.penjual || '',
        _data:       rekod._data || null,
        tarikhKemaskini: new Date().toLocaleDateString('ms-MY'),
    };

    if (idx >= 0) {
        senarai[key].dokumen[idx] = dok;
    } else {
        senarai[key].dokumen.unshift(dok);
    }

    localStorage.setItem(_KEY_FILE_PEL, JSON.stringify(senarai));
}

// Kemaskini status bayaran dalam fail pelanggan
function kemaskiniStatusFilePelanggan(docNo, statusBaru) {
    const senarai = JSON.parse(localStorage.getItem(_KEY_FILE_PEL) || '{}');
    const statusMap = { paid:'Dibayar', unpaid:'Belum Bayar', pending:'Tertangguh' };

    for (const key in senarai) {
        const idx = senarai[key].dokumen.findIndex(d => d.docNo === docNo);
        if (idx >= 0) {
            senarai[key].dokumen[idx].status      = statusBaru;
            senarai[key].dokumen[idx].statusLabel = statusMap[statusBaru] || statusBaru;
            // Bila bayar → bertukar ke "Invois" (jika asal resit)
            if (statusBaru === 'paid' && senarai[key].dokumen[idx].jenis === 'resit') {
                senarai[key].dokumen[idx].jenis      = 'invoice';
                senarai[key].dokumen[idx].jenisLabel = 'Invois';
            }
            break;
        }
    }
    localStorage.setItem(_KEY_FILE_PEL, JSON.stringify(senarai));
}

// Padam fail pelanggan
function padamFilePelanggan(key) {
    const senarai = JSON.parse(localStorage.getItem(_KEY_FILE_PEL) || '{}');
    delete senarai[key];
    localStorage.setItem(_KEY_FILE_PEL, JSON.stringify(senarai));
}

// Slug: nama → key selamat (tanpa ruang/simbol)
function _slgPelanggan(nama) {
    return nama.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
}

// ── RENDER: Senarai Fail Pelanggan ──────────────────────────
function renderFilePelanggan(filter) {
    const container = document.getElementById('filePelangganGrid');
    const empty     = document.getElementById('filePelangganEmpty');
    const count     = document.getElementById('filePelangganCount');
    if (!container) return;

    const senarai = JSON.parse(localStorage.getItem(_KEY_FILE_PEL) || '{}');
    let list = Object.values(senarai);

    if (filter) {
        const q = filter.toLowerCase();
        list = list.filter(f => f.nama.toLowerCase().includes(q));
    }

    // Sort: terbaru dulu
    list.sort((a, b) => (b.dokumen[0]?.tarikhKemaskini || '').localeCompare(a.dokumen[0]?.tarikhKemaskini || ''));

    if (count) count.textContent = list.length + ' pelanggan';

    if (!list.length) {
        container.innerHTML = '';
        if (empty) empty.style.display = 'flex';
        return;
    }
    if (empty) empty.style.display = 'none';

    container.innerHTML = list.map(f => {
        const totalDok  = f.dokumen.length;
        const totalRM   = f.dokumen.reduce((s, d) => s + (parseFloat((d.jumlah||'0').replace(/[^0-9.]/g,''))||0), 0);
        const dibayar   = f.dokumen.filter(d => d.status === 'paid').length;
        const belumBayar= f.dokumen.filter(d => d.status !== 'paid').length;

        const dokBaris  = f.dokumen.slice(0, 3).map(d => {
            const jCol  = d.status === 'paid' ? '#22c55e' : d.jenis === 'invoice' ? '#f4a426' : '#6366f1';
            const jLbl  = d.jenisLabel || (d.jenis === 'invoice' ? 'Invois' : 'Resit');
            const sLbl  = d.statusLabel || (d.status === 'paid' ? 'Dibayar' : 'Belum Bayar');
            const sBg   = d.status === 'paid' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)';
            const sCol  = d.status === 'paid' ? '#22c55e' : '#ef4444';
            return `<div class="fp-dok-baris" onclick="event.stopPropagation();cetakFilePelangganDok('${f.key}','${d.docNo}')">
                <span style="font-size:0.75rem;background:rgba(0,0,0,0.15);color:${jCol};padding:1px 7px;border-radius:10px;font-weight:700">${jLbl}</span>
                <span style="font-size:0.78rem;color:var(--text-secondary);flex:1;margin:0 6px">${d.docNo}</span>
                <span style="font-size:0.72rem;color:var(--text-secondary)">${d.jumlah||'-'}</span>
                <span style="font-size:0.7rem;background:${sBg};color:${sCol};padding:1px 6px;border-radius:8px;margin-left:4px">${sLbl}</span>
                <button onclick="event.stopPropagation();cetakFilePelangganDok('${f.key}','${d.docNo}')" style="margin-left:6px;background:rgba(99,102,241,0.1);border:none;color:var(--accent);border-radius:4px;padding:2px 6px;font-size:0.7rem;cursor:pointer" title="Muat Turun PDF">↓</button>
            </div>`;
        }).join('');

        const moreDok = totalDok > 3 ? `<div style="font-size:0.72rem;color:var(--text-muted);text-align:center;padding:4px 0">+${totalDok-3} dokumen lagi</div>` : '';

        return `<div class="fp-kad" onclick="bukaFilePelanggan('${f.key}')">
            <div class="fp-kad-header">
                <div class="fp-avatar">${f.nama.charAt(0).toUpperCase()}</div>
                <div style="flex:1;min-width:0">
                    <div class="fp-nama">${f.nama}</div>
                    <div style="font-size:0.72rem;color:var(--text-muted)">${f.tarikhCipta}</div>
                </div>
                <div style="text-align:right">
                    <div style="font-size:0.85rem;font-weight:700;color:var(--text-primary)">RM ${totalRM.toFixed(2)}</div>
                    <div style="font-size:0.68rem;color:var(--text-muted)">${totalDok} dokumen</div>
                </div>
            </div>
            <div class="fp-stats">
                <span style="color:#22c55e;font-size:0.72rem">✓ ${dibayar} dibayar</span>
                ${belumBayar > 0 ? `<span style="color:#ef4444;font-size:0.72rem">✗ ${belumBayar} belum bayar</span>` : ''}
            </div>
            <div class="fp-dok-list">${dokBaris}${moreDok}</div>
            <div class="fp-footer" onclick="event.stopPropagation()">
                <button class="fp-btn" onclick="muatTurunSemuaDokPelanggan('${f.key}')">
                    <iconify-icon icon="iwwa:download" width="13"></iconify-icon> Semua PDF
                </button>
                <button class="fp-btn danger" onclick="if(confirm('Padam fail ${f.nama}?')){padamFilePelanggan('${f.key}');renderFilePelanggan();}">
                    <iconify-icon icon="iwwa:trash" width="13"></iconify-icon> Padam
                </button>
            </div>
        </div>`;
    }).join('');
}

// Cetak / muat turun satu dokumen dari fail pelanggan
function cetakFilePelangganDok(key, docNo) {
    muatTurunSatuDokPelanggan(key, docNo);
}

// Muat turun semua PDF seorang pelanggan ke folder filepelanggan/
// Guna File System Access API (Chrome/Edge) atau fallback auto-download
async function muatTurunSemuaDokPelanggan(key) {
    const senarai = JSON.parse(localStorage.getItem(_KEY_FILE_PEL) || '{}');
    const folder  = senarai[key];
    if (!folder || !folder.dokumen.length) return;

    const semua = JSON.parse(localStorage.getItem('weo_pelanggan') || '[]');
    const namaBersih = folder.nama.replace(/[\\/:*?"<>|]/g, '_');

    // Cuba guna File System Access API (Chrome/Edge — boleh pilih folder)
    if ('showDirectoryPicker' in window) {
        try {
            tunjukToast('Pilih folder "filepelanggan" dalam direktori projek anda...', 'info', true);
            const dirHandle = await window.showDirectoryPicker({
                startIn: 'documents',
                id: 'weo-filepelanggan',
                mode: 'readwrite',
            });
            // Buat subfolder nama pelanggan
            let pelHandle;
            try {
                pelHandle = await dirHandle.getDirectoryHandle(namaBersih, { create: true });
            } catch(e) {
                pelHandle = dirHandle; // Guna root jika gagal buat subfolder
            }

            let count = 0;
            for (const dok of folder.dokumen) {
                const rekod = semua.find(r => r.docNo === dok.docNo);
                if (!rekod || !rekod._data) continue;

                // Jana HTML PDF dan simpan sebagai .html (boleh cetak PDF dari browser)
                const htmlContent = await _janaHtmlPelangganDok(rekod, dok);
                if (!htmlContent) continue;

                const isPaid  = dok.status === 'paid';
                const jenisLbl = isPaid ? 'Invois' : 'Resit';
                const namaFail = `${dok.docNo}_${jenisLbl}_${namaBersih}.html`;

                try {
                    const fileHandle = await pelHandle.getFileHandle(namaFail, { create: true });
                    const writable   = await fileHandle.createWritable();
                    await writable.write(htmlContent);
                    await writable.close();
                    count++;
                } catch(e) {
                    console.warn('Gagal simpan fail:', namaFail, e);
                }
            }

            tunjukToast(`✅ ${count} dokumen disimpan ke folder "${namaBersih}"!`, 'success', true);
            return;

        } catch (err) {
            if (err.name !== 'AbortError') {
                console.warn('File System API gagal, guna fallback:', err);
            } else {
                tunjukToast('Dibatalkan', 'info', true);
                return;
            }
        }
    }

    // Fallback: auto-download setiap dokumen (browser standard)
    let delay = 0;
    let count = 0;
    folder.dokumen.forEach(dok => {
        const rekod = semua.find(r => r.docNo === dok.docNo);
        if (!rekod) return;
        count++;
        setTimeout(() => {
            _rekodPreviewAktif = rekod;
            muatTurunPDFDariRekod();
        }, delay);
        delay += 1500;
    });
    tunjukToast(`⬇ Muat turun ${count} dokumen (${folder.nama})`, 'success', true);
}

// Jana HTML lengkap satu dokumen untuk simpan ke fail
async function _janaHtmlPelangganDok(rekod, dok) {
    if (!rekod._data) return null;
    const d = rekod._data;

    // Backup state
    const bkp = { items: JSON.parse(JSON.stringify(items)), logoDataUrl, currentDocType, currentLang };

    // Set state dari data
    items          = d.items || [];
    logoDataUrl    = d.logoDataUrl || '';
    currentDocType = d.currentDocType || 'resit';
    currentLang    = d.currentLang || 'ms';
    Object.entries(d).forEach(([k,v]) => { if (typeof v === 'string') setVal(k, v); });

    renderPreview();

    // Ambil HTML
    const invEl = document.getElementById('invDoc');
    let htmlContent = '';
    if (invEl) {
        // Convert canvas QR ke img
        const canvas = invEl.querySelector('canvas');
        if (canvas) {
            const du = canvas.toDataURL('image/png');
            const clone = invEl.cloneNode(true);
            const cq = clone.querySelector('canvas');
            if (cq) { const img = document.createElement('img'); img.src = du; img.width=100; img.height=100; cq.parentNode.replaceChild(img, cq); }
            htmlContent = clone.outerHTML;
        } else {
            htmlContent = invEl.outerHTML;
        }
    }

    // Pulih state
    items = bkp.items; logoDataUrl = bkp.logoDataUrl;
    currentDocType = bkp.currentDocType; currentLang = bkp.currentLang;

    const isPaid  = dok.status === 'paid';
    const jenisLbl = isPaid ? 'Invois' : 'Resit';
    const title   = `${dok.docNo} — ${rekod.pelanggan} (${jenisLbl})`;

    return `<!DOCTYPE html>
<html lang="ms">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width">
<title>${title}</title>
${getPrintStyle()}
<style>
body { background: white; padding: 1cm; }
@media print { body { padding: 0; } }
.no-print { display: none !important; }
</style>
</head>
<body>
<div class="no-print" style="background:#f0f4ff;padding:1rem;margin-bottom:1rem;border-radius:8px;font-family:sans-serif;font-size:14px;display:flex;align-items:center;justify-content:space-between">
    <span>📄 <strong>${title}</strong> — Fail Pelanggan Weo</span>
    <button onclick="window.print()" style="background:#6366f1;color:white;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:600">🖨 Print / Simpan PDF</button>
</div>
${htmlContent}
</body>
</html>`;
}

// Muat turun satu dokumen terus ke filepelanggan/
async function muatTurunSatuDokPelanggan(key, docNo) {
    const senarai = JSON.parse(localStorage.getItem(_KEY_FILE_PEL) || '{}');
    const folder  = senarai[key];
    if (!folder) return;
    const dok    = folder.dokumen.find(d => d.docNo === docNo);
    if (!dok) return;

    const semua  = JSON.parse(localStorage.getItem('weo_pelanggan') || '[]');
    const rekod  = semua.find(r => r.docNo === docNo);
    if (!rekod) { tunjukToast('Rekod tidak dijumpai', 'error'); return; }

    const namaBersih = folder.nama.replace(/[\\/:*?"<>|]/g, '_');
    const isPaid     = dok.status === 'paid';
    const jenisLbl   = isPaid ? 'Invois' : 'Resit';
    const namaFail   = `${dok.docNo}_${jenisLbl}_${namaBersih}.html`;

    const htmlContent = await _janaHtmlPelangganDok(rekod, dok);
    if (!htmlContent) { tunjukToast('Gagal jana dokumen', 'error'); return; }

    // Muat turun sebagai HTML
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = namaFail;
    a.click();
    URL.revokeObjectURL(url);
    tunjukToast(`⬇ ${namaFail} dimuat turun!`, 'success', true);
}

// Buka modal detail fail pelanggan
function bukaFilePelanggan(key) {
    const senarai = JSON.parse(localStorage.getItem(_KEY_FILE_PEL) || '{}');
    const folder  = senarai[key];
    if (!folder) return;

    const semua = JSON.parse(localStorage.getItem('weo_pelanggan') || '[]');
    const totalRM = folder.dokumen.reduce((s, d) => s + (parseFloat((d.jumlah||'0').replace(/[^0-9.]/g,''))||0), 0);

    const modal = document.getElementById('modalFilePelanggan');
    const body  = document.getElementById('modalFilePelangganBody');
    const title = document.getElementById('modalFilePelangganTitle');
    if (!modal || !body) { tunjukToast('Modal fail pelanggan tidak dijumpai', 'error'); return; }

    if (title) title.textContent = '📁 ' + folder.nama;

    body.innerHTML = `
        <div style="display:flex;gap:1rem;margin-bottom:1rem;flex-wrap:wrap">
            <div class="fp-stat-mini"><span>Jumlah Dokumen</span><strong>${folder.dokumen.length}</strong></div>
            <div class="fp-stat-mini"><span>Jumlah Nilai</span><strong>RM ${totalRM.toFixed(2)}</strong></div>
            <div class="fp-stat-mini"><span>Dibayar</span><strong style="color:#22c55e">${folder.dokumen.filter(d=>d.status==='paid').length}</strong></div>
            <div class="fp-stat-mini"><span>Belum Bayar</span><strong style="color:#ef4444">${folder.dokumen.filter(d=>d.status!=='paid').length}</strong></div>
        </div>
        <div class="fp-dok-full-list">
            ${folder.dokumen.map(dok => {
                const isPaid  = dok.status === 'paid';
                const jenisLbl= isPaid ? 'Invois' : (dok.jenisLabel || 'Resit');
                const jenisBg = isPaid ? 'rgba(244,164,38,0.15)' : 'rgba(99,102,241,0.12)';
                const jenisCol= isPaid ? '#f4a426' : '#6366f1';
                return `<div class="fp-dok-full-baris">
                    <div style="display:flex;align-items:center;gap:8px;flex:1">
                        <span style="background:${jenisBg};color:${jenisCol};padding:2px 9px;border-radius:10px;font-size:0.72rem;font-weight:700">${jenisLbl}</span>
                        <span style="font-size:0.85rem;font-weight:600">${dok.docNo}</span>
                        <span style="font-size:0.78rem;color:var(--text-secondary)">${dok.tarikh||''}</span>
                    </div>
                    <span style="font-size:0.82rem;font-weight:600">${dok.jumlah||'-'}</span>
                    <span style="font-size:0.72rem;background:${isPaid?'rgba(34,197,94,0.12)':'rgba(239,68,68,0.12)'};color:${isPaid?'#22c55e':'#ef4444'};padding:2px 8px;border-radius:8px">${dok.statusLabel||''}</span>
                    <button class="fp-btn" onclick="cetakFilePelangganDok('${key}','${dok.docNo}')" title="Muat Turun PDF">
                        <iconify-icon icon="iwwa:download" width="13"></iconify-icon>
                    </button>
                </div>`;
            }).join('')}
        </div>
        <div style="margin-top:1rem;display:flex;gap:0.5rem">
            <button class="btn-download" style="flex:1" onclick="muatTurunSemuaDokPelanggan('${key}')">
                <iconify-icon icon="iwwa:download" width="14"></iconify-icon> Muat Turun Semua PDF
            </button>
        </div>`;

    bukaModal('modalFilePelanggan');
}

// ════════════════════════════════════════════════════════════
// LOAD PAGES — Muatkan semua page HTML secara async
// Dipanggil dari index.html atau DOMContentLoaded
// ════════════════════════════════════════════════════════════
const _PAGE_LIST = [
    'pages/dashboard.html',
    'pages/pesanan.html',
    'pages/resit.html',
    'pages/produk.html',
    'pages/laporan.html',
    'pages/tetapan.html',
    'pages/filepelanggan.html',
];

async function loadPages() {
    const container = document.getElementById('pagesContainer');
    if (!container) {
        console.warn('⚠ pagesContainer tidak dijumpai dalam DOM');
        return;
    }

    const _PAGE_LIST = [
        'pages/dashboard.html',
        'pages/pesanan.html',
        'pages/resit.html',
        'pages/produk.html',
        'pages/laporan.html',
        'pages/tetapan.html',
    ];

    try {
        // Fetch semua HTML pages serentak
        const htmlParts = await Promise.all(
            _PAGE_LIST.map(url =>
                fetch(url)
                    .then(r => {
                        if (!r.ok) throw new Error(`HTTP ${r.status}: ${url}`);
                        return r.text();
                    })
                    .catch(err => {
                        console.warn('Gagal muat page:', err.message);
                        return `<div class="page" id="${url.replace('pages/','').replace('.html','')}">
                            <div style="padding:2rem;text-align:center;color:#ef4444">
                                Gagal memuatkan ${url}. Pastikan server berjalan.
                            </div>
                        </div>`;
                    })
            )
        );

        // Inject HTML pages ke dalam container
        container.innerHTML = htmlParts.join('\n');

        // Semua pages dah dalam DOM — init app
        _initAppSelepasLoad();

    } catch (err) {
        console.error('loadPages gagal:', err);
    }
}


function _initAppSelepasLoad() {
    // Dashboard aktif secara lalai
    const dash = document.getElementById('page-dashboard');
    if (dash) dash.classList.add('active');

    // Kemaskini dashboard stats
    kemaskiniDashboard();

    // Apply tema
    applyTheme(currentTheme);

    // Muat profil
    _muatProfilAwal();

    console.log('✅ Weo — semua pages dimuatkan.');
}

function _muatProfilAwal() {
    const profil = JSON.parse(localStorage.getItem('weo_profil') || '{}');
    if (profil.nama) {
        ['sidebarUserName'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = profil.nama; });
    }
    if (profil.avatarUrl) {
        ['sidebarAvatarImg','topbarAvatarImg','avatarModalImg'].forEach(id => {
            const el = document.getElementById(id); if (el) el.src = profil.avatarUrl;
        });
    }
}

// ════════════════════════════════════════════════════════════
// AUTO-INIT: Panggil loadPages bila DOM sedia
// ════════════════════════════════════════════════════════════
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadPages);
} else {
    // DOM dah sedia (script dimuatkan lewat / defer)
    loadPages();
}



// ════════════════════════════════════════════════════════════════
// FASA 3 — Ciri Baru
// ════════════════════════════════════════════════════════════════

// F3-1: Versi app dalam topbar
const _APP_VER = '1.0.4';
(function(){
    const v = document.getElementById('appVersion');
    if (v) v.textContent = 'ver. ' + _APP_VER;
})();

// F3-2: Pelanggan — highlight baris bila hover, tooltip "Klik untuk pratonton"
// (sudah ada cursor:pointer dalam CSS — tidak perlu JS tambahan)

// F3-3: Dashboard — shortcut klik stat card ke page berkaitan
(function initDashboardShortcuts() {
    const shortcuts = {
        dashPesananBaru:  'pesanan',
        dashDalamProses:  'pesanan',
        dashSiap:         'pesanan',
        dashHasil:        'pelanggan',
    };
    Object.entries(shortcuts).forEach(([id, page]) => {
        const card = document.getElementById(id)?.closest('.stat-card');
        if (card) {
            card.style.cursor = 'pointer';
            card.title = `Pergi ke ${pageTitles[page] || page}`;
            card.addEventListener('click', () => tukarkePage(page));
        }
    });
})();

// F3-4: Resit/Invois — salin no. dengan klik dua kali pada no. resit dalam pratonton
function salinNoResit() {
    const no = getVal('invoiceNo');
    if (!no) return;
    salinNo(no);
}

// F3-5: Pesanan — warna status badge update bila dropdown berubah (live)
function getStatusClass(status) {
    return {baru:'baru', proses:'proses', siap:'siap'}[status] || 'baru';
}

// F3-6: Pelanggan tab — kemaskini count
function kemaskiniPelangganCount() {
    const data = JSON.parse(localStorage.getItem('weo_pelanggan') || '[]');
    const tab = document.querySelector('[data-tab-pelanggan].active')?.dataset.tabPelanggan || 'semua';
    const n = tab === 'semua' ? data.length : data.filter(r => r.jenis === tab).length;
    const el = document.getElementById('pelangganCount');
    if (el) el.textContent = n + ' rekod';
}

// F3-7: Export data pelanggan sebagai CSV
function eksportPelangganCSV() {
    const data = JSON.parse(localStorage.getItem('weo_pelanggan') || '[]');
    if (!data.length) { tunjukToast('Tiada data untuk dieksport', 'error'); return; }
    const header = ['No. Dokumen', 'Pelanggan', 'Produk', 'Tarikh', 'Jumlah', 'Status', 'Jenis', 'Penjual'];
    const rows   = data.map(r => [r.docNo, r.pelanggan, r.produk, r.tarikh, r.jumlah, r.statusLabel, r.jenisLabel, r.penjual || ''].map(v => `"${(v||'').replace(/"/g, '""')}"`));
    const csv    = [header, ...rows].map(r => r.join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href     = 'data:text/csv;charset=utf-8,﻿' + encodeURIComponent(csv);
    a.download = 'pelanggan-' + new Date().toISOString().slice(0,10) + '.csv';
    a.click();
    tunjukToast('Data pelanggan dieksport sebagai CSV!', 'success');
}

// F3-8: Export data pesanan sebagai CSV
function eksportPesananCSV() {
    const data = JSON.parse(localStorage.getItem('weo_pesanan_list') || '[]');
    if (!data.length) { tunjukToast('Tiada data untuk dieksport', 'error'); return; }
    const header = ['No. Pesanan', 'Pelanggan', 'Tel', 'Item', 'Tarikh', 'Jumlah', 'Status', 'Penjual'];
    const rows   = data.map(r => [r.no, r.pelanggan, r.tel, r.item, r.tarikh, r.jumlah, r.statusLabel, r.penjual || ''].map(v => `"${(v||'').replace(/"/g, '""')}"`));
    const csv    = [header, ...rows].map(r => r.join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href     = 'data:text/csv;charset=utf-8,﻿' + encodeURIComponent(csv);
    a.download = 'pesanan-' + new Date().toISOString().slice(0,10) + '.csv';
    a.click();
    tunjukToast('Data pesanan dieksport sebagai CSV!', 'success');
}

// F3-9: Carian global (sidebar search)
(function initGlobalSearch() {
    const inp = document.getElementById('searchInput');
    if (!inp) return;
    inp.addEventListener('input', function() {
        const q = this.value.toLowerCase().trim();
        if (!q) {
            document.querySelectorAll('.nav-item').forEach(it => it.style.display = '');
            return;
        }
        document.querySelectorAll('.nav-item').forEach(it => {
            const txt = it.querySelector('.nav-txt');
            it.style.display = (!txt || txt.textContent.toLowerCase().includes(q)) ? '' : 'none';
        });
    });
})();

// F3-10: Auto-save draft resit ke localStorage setiap 30 saat
let _autosaveTimer = null;
function mulaAutoSaveDraft() {
    if (_autosaveTimer) clearInterval(_autosaveTimer);
    _autosaveTimer = setInterval(() => {
        if (!document.getElementById('page-resit')?.classList.contains('active')) return;
        const draft = {
            companyName: getVal('companyName'), companyReg: getVal('companyReg'),
            companyAddress: getVal('companyAddress'), companyPhone: getVal('companyPhone'),
            companyEmail: getVal('companyEmail'), clientName: getVal('clientName'),
            clientAddress: getVal('clientAddress'), clientEmail: getVal('clientEmail'),
            clientPhone: getVal('clientPhone'), bankAccount: getVal('bankAccount'),
            bankName: getVal('bankName'), qrUrl: getVal('qrUrl'),
            invoiceNotes: getVal('invoiceNotes'), invoiceDate: getVal('invoiceDate'),
            invoiceDue: getVal('invoiceDue'), invoiceNo: getVal('invoiceNo'),
            invoiceStatus: getVal('invoiceStatus'), discountPct: getVal('discountPct'),
            taxPct: getVal('taxPct'), items: JSON.parse(JSON.stringify(items)),
            currentDocType, currentLang, logoDataUrl,
            _masa: new Date().toLocaleTimeString('ms-MY', {hour:'2-digit', minute:'2-digit'}),
        };
        localStorage.setItem('weo_draft_resit', JSON.stringify(draft));
    }, 30000);
}

function muatDraftResit() {
    const draft = JSON.parse(localStorage.getItem('weo_draft_resit') || 'null');
    if (!draft) return;
    if (!confirm(`Terdapat draf yang disimpan pada ${draft._masa}. Muat semula draf?`)) return;
    items = draft.items || [{nama:'',qty:1,harga:0,disc:0}];
    logoDataUrl = draft.logoDataUrl || '';
    currentDocType = draft.currentDocType || 'resit';
    currentLang = draft.currentLang || 'ms';
    const fields = ['companyName','companyReg','companyAddress','companyPhone','companyEmail',
        'clientName','clientAddress','clientEmail','clientPhone','bankAccount','bankName',
        'qrUrl','invoiceNotes','invoiceDate','invoiceDue','invoiceNo','invoiceStatus',
        'discountPct','taxPct'];
    fields.forEach(k => { if (draft[k] !== undefined) setVal(k, draft[k]); });
    if (logoDataUrl) {
        const lp = document.getElementById('logoPreview');
        if (lp) { lp.src = logoDataUrl; lp.style.display = 'block'; }
        const ph = document.getElementById('logoPlaceholder'); if (ph) ph.style.display = 'none';
        const dl = document.getElementById('btnDeleteLogo'); if (dl) dl.style.display = 'flex';
    }
    renderItems(); renderPreview(); applyStatusSelectColor();
    tunjukToast('Draf dipulihkan!', 'success');
}

// Mula auto-save bila page resit aktif
document.addEventListener('DOMContentLoaded', () => mulaAutoSaveDraft());

