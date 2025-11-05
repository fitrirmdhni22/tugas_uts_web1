(function(){
  function $(s,root){return (root||document).querySelector(s)}
  function $all(s,root){return Array.from((root||document).querySelectorAll(s))}
  function show(el){el.classList.remove('hidden')}
  function hide(el){el.classList.add('hidden')}
  function rupiahToInt(str){if(!str) return 0; return parseInt(String(str).replace(/[^0-9]/g,''))||0}
  function intToRupiah(n){return 'Rp ' + (n||0).toString().replace(/\B(?=(\d{3})+(?!\d))/g,'.')}
  function setError(input, msg){
    if(!input) return; input.classList.add('invalid');
    let s = input.nextElementSibling; if(!(s && s.classList && s.classList.contains('error-text'))){ s = document.createElement('small'); s.className='error-text'; input.after(s) }
    // ensure unique id for aria-describedby
    if(!s.id){ s.id = input.id ? input.id + '-error' : 'err-' + Math.random().toString(36).slice(2,7) }
    input.setAttribute('aria-invalid','true'); input.setAttribute('aria-describedby', s.id);
    s.textContent = msg || 'Input tidak valid';
  }
  function clearError(input){
    if(!input) return; input.classList.remove('invalid');
    input.removeAttribute('aria-invalid'); input.removeAttribute('aria-describedby');
    const s=input.nextElementSibling; if(s && s.classList && s.classList.contains('error-text')) s.textContent='';
  }
  function clearErrors(form){ if(!form) return; Array.from(form.querySelectorAll('.invalid')).forEach(el=>el.classList.remove('invalid')); Array.from(form.querySelectorAll('small.error-text')).forEach(s=>s.textContent='') }

  $all('[data-modal-open]').forEach(b=>b.addEventListener('click',()=>{const t=b.getAttribute('data-modal-open'); const m=$(t); if(m) m.classList.add('show')}))
  $all('[data-modal-close]').forEach(b=>b.addEventListener('click',()=>{b.closest('.modal').classList.remove('show')}))
  $all('.modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m) m.classList.remove('show')}))

  const page = document.body.getAttribute('data-page')

  if(page==='login'){
    const form = $('#loginForm');
    form.addEventListener('submit', function(e){
      e.preventDefault();
      const email = $('#email').value.trim().toLowerCase();
      const pass = $('#password').value;
      const found = (window.dataPengguna||[]).find(u=>u.email.toLowerCase()===email && u.password===pass)
      if(!found){ show($('#loginAlert')); return }
      localStorage.setItem('uts_user', JSON.stringify({id:found.id,nama:found.nama,role:found.role,email:found.email}))
      location.href='dashboard.html'
    })
    const fForm = $('#forgotForm');
    if(fForm){
      fForm.addEventListener('submit', function(e){
        e.preventDefault();
        const info = $('#forgotInfo'); const ok = $('#forgotSuccess');
        if(info) hide(info);
        if(ok) show(ok);
        setTimeout(()=>{ const m=$('#modal-forgot'); if(m) m.classList.remove('show') }, 1200);
      });
    }
    const rForm = $('#registerForm');
    if(rForm){
      rForm.addEventListener('submit', function(e){
        e.preventDefault();
        const nama=$('#regNama'), email=$('#regEmail'), pass=$('#regPass');
        clearErrors(rForm); let ok=true;
        if(!nama.value.trim() || nama.value.trim().length<3){ setError(nama,'Nama minimal 3 karakter'); ok=false }
        if(!/^\S+@\S+\.\S+$/.test(email.value.trim())){ setError(email,'Format email tidak valid'); ok=false }
        if((pass.value||'').length<6){ setError(pass,'Panjang password minimal 6'); ok=false }
        if(!ok) return;
        const info = $('#regInfo'); const suc = $('#regSuccess');
        if(info) hide(info);
        if(suc) show(suc);
        setTimeout(()=>{ const m=$('#modal-register'); if(m) m.classList.remove('show') }, 1200);
      })
    }
  }

  if(page==='history'){
    const key='uts_orders';
    function load(){ return JSON.parse(localStorage.getItem(key)||'[]') }
    function save(arr){ localStorage.setItem(key, JSON.stringify(arr)) }
    function render(){
      const list = load().reverse();
      const tbody = document.getElementById('historyBody');
      if(tbody){
        tbody.innerHTML='';
        list.forEach((o,idx)=>{
          const tr=document.createElement('tr');
          const tgl = new Date(o.waktu).toLocaleString('id-ID');
          tr.innerHTML = '<td>'+tgl+'</td>'
            + '<td>'+o.nama+'</td>'
            + '<td>'+o.buku+'</td>'
            + '<td>'+o.qty+'</td>'
            + '<td>'+o.method.toUpperCase()+'</td>'
            + '<td class="currency">'+intToRupiah(o.subtotal)+'</td>'
            + '<td class="currency">'+intToRupiah(o.fee)+'</td>'
            + '<td class="currency">'+intToRupiah(o.total)+'</td>'
            + '<td class="actions"><button class="btn btn-outline" data-act="delete">Hapus</button></td>';
          tbody.appendChild(tr);
          tr.querySelector('[data-act="delete"]').addEventListener('click', ()=>{
            const all = load();
            const realIndex = all.length-1-idx;
            all.splice(realIndex,1); save(all); render();
          })
        })
      }
      const list2 = load();
      const sum = list2.reduce((acc,o)=>{acc.count++; acc.sub+=o.subtotal||0; acc.fee+=o.fee||0; return acc},{count:0, sub:0, fee:0})
      const hC=document.getElementById('hCount'); if(hC) hC.textContent = sum.count
      const hS=document.getElementById('hSum'); if(hS) hS.textContent = intToRupiah(sum.sub)
      const hF=document.getElementById('hFee'); if(hF) hF.textContent = intToRupiah(sum.fee)
    }
    render();
  }

  if(page==='dashboard'){
    const userRaw = localStorage.getItem('uts_user');
    if(!userRaw){ location.href='index.html'; return }
    const user = JSON.parse(userRaw)
    $('#userInfo').textContent = user.nama + ' ('+user.role+')'
    $('#btnLogout').addEventListener('click',()=>{localStorage.removeItem('uts_user'); location.href='index.html'})
    const h = new Date().getHours();
    let g = 'Halo'; if(h<11) g='Selamat pagi'; else if(h<15) g='Selamat siang'; else if(h<19) g='Selamat sore'; else g='Selamat malam';
    $('#greet').textContent = g + ', ' + user.nama
    const wc = document.getElementById('welcomeCopy');
    if(wc){ wc.textContent = 'Selamat datang di Dashboard Book Store. Gunakan menu dan tautan di bawah untuk mengelola stok/katalog, melacak pengiriman, membuat pemesanan, dan melihat riwayat transaksi.' }
    const totalBuku = (window.dataKatalogBuku||[]).length
    const totalStok = (window.dataKatalogBuku||[]).reduce((s,b)=>s+(b.stok||0),0)
    $('#totalBuku').textContent = totalBuku
    $('#totalStok').textContent = totalStok
  }

  if(page==='stok'){
    function renderCards(list){
      const grid = $('#gridBuku'); grid.innerHTML=''
      list.forEach((b,i)=>{
        const div = document.createElement('div'); div.className='card';
        const coverUrl = b.cover||'img/placeholder.svg';
        const isVideo = /\.(mp4|webm)(\?|$)/i.test(coverUrl);
        const mediaHTML = isVideo
          ? '<video src="'+coverUrl+'" muted autoplay loop playsinline></video>'
          : '<img src="'+coverUrl+'" alt="cover" onerror="this.onerror=null;this.src=\'img/placeholder.svg\'">';
        div.innerHTML = '<div class="card-body book-card">'
          + mediaHTML
          + '<div class="book-info">'
          + '<div class="badge">'+b.jenisBarang+' · Edisi '+b.edisi+'</div>'
          + '<strong>'+b.namaBarang+'</strong>'
          + '<div class="price">'+b.harga+'</div>'
          + '<div class="stock">Stok: '+b.stok+'</div>'
          + '<div class="actions mt-2"><button class="btn btn-primary" data-act="add-cart" data-idx="'+i+'">Tambah ke Keranjang</button></div>'
          + '</div></div>'
        grid.appendChild(div)
      })
    }
    function renderTable(list){
      const tbody = $('#stokBody'); tbody.innerHTML=''
      list.forEach(b=>{
        const tr=document.createElement('tr')
        tr.innerHTML='<td>'+b.kodeBarang+'</td><td>'+b.namaBarang+'</td><td>'+b.jenisBarang+'</td><td>'+b.edisi+'</td><td>'+b.stok+'</td><td>'+b.harga+'</td>'
        tbody.appendChild(tr)
      })
    }
    const list = (window.dataKatalogBuku||[]).map(x=>Object.assign({},x))
    renderCards(list); renderTable(list)
    const grid = $('#gridBuku');
    if(grid){
      grid.addEventListener('click', function(e){
        const btn = e.target.closest('[data-act="add-cart"]');
        if(!btn) return;
        const i = parseInt(btn.getAttribute('data-idx')||'-1');
        if(!(i>=0)) return;
        const item = list[i];
        const key = 'uts_cart';
        const cart = JSON.parse(localStorage.getItem(key)||'[]');
        const idx = cart.findIndex(c=>c.kodeBarang===item.kodeBarang);
        if(idx>=0){ cart[idx].qty = (cart[idx].qty||0)+1 }
        else { cart.push({kodeBarang:item.kodeBarang, namaBarang:item.namaBarang, harga:item.harga, qty:1}) }
        localStorage.setItem(key, JSON.stringify(cart));
        alert('Ditambahkan ke keranjang');
        updateCartCount();
      });
    }
    // Cart helpers & renderers
    const CART_KEY = 'uts_cart';
    function loadCart(){ return JSON.parse(localStorage.getItem(CART_KEY)||'[]') }
    function saveCart(arr){ localStorage.setItem(CART_KEY, JSON.stringify(arr)) }
    function updateCartCount(){
      const c=document.getElementById('cartCount'); if(!c) return;
      const cart=loadCart();
      const count = cart.reduce((s,it)=>s+(it.qty||0),0);
      c.textContent = String(count);
    }
    function renderCart(){
      const tbody = document.getElementById('cartBody');
      const empty = document.getElementById('cartEmpty');
      const tEl = document.getElementById('cartTotal');
      if(!tbody) return;
      const cart = loadCart();
      tbody.innerHTML='';
      if(!cart.length){ if(empty) empty.classList.remove('hidden'); if(tEl) tEl.textContent='Rp 0'; return }
      if(empty) empty.classList.add('hidden');
      let total = 0;
      cart.forEach((it,idx)=>{
        const hargaInt = rupiahToInt(it.harga);
        const sub = hargaInt * (it.qty||1);
        total += sub;
        const tr=document.createElement('tr');
        tr.innerHTML = '<td>'+it.namaBarang+'</td>'
          + '<td class="num">'+(it.qty||1)+'</td>'
          + '<td class="currency">'+(it.harga||'-')+'</td>'
          + '<td class="currency">'+intToRupiah(sub)+'</td>'
          + '<td class="actions"><button class="btn btn-outline" data-act="del" data-idx="'+idx+'">Hapus</button></td>';
        tbody.appendChild(tr);
        tr.querySelector('[data-act="del"]').addEventListener('click', ()=>{
          const cur = loadCart();
          const real = parseInt(tr.querySelector('[data-act="del"]').getAttribute('data-idx'));
          if(real>=0){ cur.splice(real,1); saveCart(cur); renderCart(); updateCartCount(); }
        })
      })
      if(tEl) tEl.textContent = intToRupiah(total);
    }
    updateCartCount();
    const btnOpenCart = document.querySelector('[data-modal-open="#modal-cart"]');
    if(btnOpenCart){ btnOpenCart.addEventListener('click', renderCart) }
    const btnClear = document.getElementById('btnClearCart');
    if(btnClear){ btnClear.addEventListener('click', ()=>{ saveCart([]); renderCart(); updateCartCount(); }) }
    $('#formAdd').addEventListener('submit', function(e){
      e.preventDefault()
      const form = e.target; clearErrors(form); let ok=true;
      const vKode=$('#fKode'), vNama=$('#fNama'), vJenis=$('#fJenis'), vEdisi=$('#fEdisi'), vStok=$('#fStok'), vHarga=$('#fHarga');
      if(!vKode.value.trim()){ setError(vKode,'Kode wajib diisi'); ok=false }
      if(vNama.value.trim().length<3){ setError(vNama,'Nama minimal 3 karakter'); ok=false }
      if(!vJenis.value.trim()){ setError(vJenis,'Jenis wajib diisi'); ok=false }
      const ed = parseInt(vEdisi.value||'0'); if(!(ed>=1)){ setError(vEdisi,'Edisi minimal 1'); ok=false }
      const st = parseInt(vStok.value||''); if(isNaN(st) || st<0){ setError(vStok,'Stok harus >= 0'); ok=false }
      const hInt = rupiahToInt(vHarga.value); if(hInt<=0){ setError(vHarga,'Harga harus lebih dari 0'); ok=false }
      if(!ok){ show($('#stokError')); return }
      hide($('#stokError'))
      const item = {
        kodeBarang: vKode.value.trim(),
        namaBarang: vNama.value.trim(),
        jenisBarang: vJenis.value.trim(),
        edisi: String(ed),
        stok: st,
        harga: intToRupiah(hInt),
        cover: ($('#fCover').value||'').trim()
      }
      list.push(item)
      renderCards(list); renderTable(list)
      e.target.reset()
    })
  }

  if(page==='checkout'){
    const select = $('#oBuku');
    (window.dataKatalogBuku||[]).forEach((b,i)=>{
      const opt=document.createElement('option'); opt.value=i; opt.textContent=b.namaBarang+' ('+b.harga+')'; select.appendChild(opt)
    })
    function calcFee(subtotal, method){
      if(method==='transfer') return 2500;
      if(method==='ewallet') return Math.max(1000, Math.round(subtotal*0.015));
      if(method==='cod') return 5000;
      return 0;
    }
    // Orders list (Data Pemesanan) on checkout page
    const ORD_KEY='uts_orders';
    function loadOrders(){ return JSON.parse(localStorage.getItem(ORD_KEY)||'[]') }
    function saveOrders(arr){ localStorage.setItem(ORD_KEY, JSON.stringify(arr)) }
    function renderOrders(){
      const tbody = document.getElementById('ordersBody');
      if(!tbody) return;
      const list = loadOrders().reverse();
      tbody.innerHTML='';
      list.forEach((o,idx)=>{
        const tr=document.createElement('tr');
        const tgl = new Date(o.waktu).toLocaleString('id-ID');
        tr.innerHTML = '<td>'+tgl+'</td>'
          + '<td>'+o.nama+'</td>'
          + '<td>'+o.buku+'</td>'
          + '<td><input type="number" min="1" value="'+o.qty+'" data-act="qty" class="input" style="width:90px"></td>'
          + '<td><select data-act="method" class="input" style="width:140px">'
            + '<option value="transfer"'+(o.method==='transfer'?' selected':'')+'>Transfer</option>'
            + '<option value="ewallet"'+(o.method==='ewallet'?' selected':'')+'>E-Wallet</option>'
            + '<option value="cod"'+(o.method==='cod'?' selected':'')+'>COD</option>'
          + '</select></td>'
          + '<td class="currency">'+intToRupiah(o.subtotal)+'</td>'
          + '<td class="currency">'+intToRupiah(o.fee)+'</td>'
          + '<td class="currency">'+intToRupiah(o.total)+'</td>'
          + '<td class="actions"><button class="btn btn-primary" data-act="save">Edit</button><button class="btn btn-outline" data-act="delete">Hapus</button></td>';
        tbody.appendChild(tr);
        // Handlers per row
        tr.querySelector('[data-act="save"]').addEventListener('click', ()=>{
          const qty = parseInt(tr.querySelector('[data-act="qty"]').value||'1');
          const method = tr.querySelector('[data-act="method"]').value;
          const all = loadOrders();
          const realIndex = all.length-1-idx; // reversed mapping
          const item = all[realIndex];
          const buku = (window.dataKatalogBuku||[]).find(b=>b.namaBarang===item.buku)
          const price = buku ? rupiahToInt(buku.harga) : Math.round((item.subtotal||0)/(item.qty||1)||0);
          const newSubtotal = price*qty;
          const fee = calcFee(newSubtotal, method);
          all[realIndex] = Object.assign({}, item, {qty, method, subtotal:newSubtotal, fee, total:newSubtotal+fee});
          saveOrders(all); renderOrders();
        })
        tr.querySelector('[data-act="delete"]').addEventListener('click', ()=>{
          const all = loadOrders();
          const realIndex = all.length-1-idx;
          all.splice(realIndex,1); saveOrders(all); renderOrders();
        })
      })
    }
    function updateTotal(){
      const idx = parseInt(select.value||'0'); const qty = parseInt($('#oQty').value||'1')
      const pay = ($('#oPay') && $('#oPay').value) || 'transfer'
      const item = (window.dataKatalogBuku||[])[idx]||{harga:'Rp 0'}
      const subtotal = rupiahToInt(item.harga)*qty
      const fee = calcFee(subtotal, pay)
      const grand = subtotal + fee
      $('#oTotal').textContent = intToRupiah(subtotal)
      if($('#oFee')) $('#oFee').textContent = intToRupiah(fee)
      if($('#oGrand')) $('#oGrand').textContent = intToRupiah(grand)
      $('#ringkasan').innerHTML = ''
        + '<div class="badge">Informasi Pemesanan</div>'
        + '<div class="mt-2">'
          + '<strong>'+(item.namaBarang||'-')+'</strong> × '+qty+'<br>'
          + 'Harga satuan: '+(item.harga||'Rp 0')+
        '</div>'
        + '<div class="badge mt-2">Informasi Pembayaran</div>'
        + '<div class="mt-2">'
          + 'Metode: '+pay.toUpperCase()+'<br>'
          + 'Subtotal: <strong>'+intToRupiah(subtotal)+'</strong><br>'
          + 'Biaya Admin: <strong>'+intToRupiah(fee)+'</strong><br>'
          + 'Total Bayar: <strong>'+intToRupiah(grand)+'</strong>'
        + '</div>'
    }
    select.addEventListener('change', updateTotal); $('#oQty').addEventListener('input', updateTotal); const oPay=$('#oPay'); if(oPay){ oPay.addEventListener('change', updateTotal) } updateTotal()
    $('#formOrder').addEventListener('submit', function(e){
      e.preventDefault();
      const form=e.target; clearErrors(form); let ok=true;
      const vNama=$('#oNama'), vAlamat=$('#oAlamat'), vTelp=$('#oTelp'), vQty=$('#oQty');
      if(vNama.value.trim().length<3){ setError(vNama,'Nama minimal 3 karakter'); ok=false }
      if(vAlamat.value.trim().length<5){ setError(vAlamat,'Alamat minimal 5 karakter'); ok=false }
      if(!/^0[0-9]{9,12}$/.test(vTelp.value.trim())){ setError(vTelp,'No. telp 10-13 digit, diawali 0'); ok=false }
      const qty = parseInt(vQty.value||'0'); if(!(qty>=1)){ setError(vQty,'Qty minimal 1'); ok=false }
      if(!ok){ show($('#orderError')); return } else { hide($('#orderError')) }
      const idx = parseInt(select.value||'0');
      const item = (window.dataKatalogBuku||[])[idx]||{};
      
      const subtotal = rupiahToInt(item.harga||'0')*qty;
      const method = ($('#oPay') && $('#oPay').value) || 'transfer';
      const fee = calcFee(subtotal, method);
      const grand = subtotal+fee;
      const order = {
        waktu: new Date().toISOString(),
        nama: ($('#oNama').value||'-'),
        telp: ($('#oTelp').value||'-'),
        alamat: ($('#oAlamat').value||'-'),
        buku: (item.namaBarang||'-'),
        qty, method, subtotal, fee, total: grand
      };
      const list = loadOrders();
      list.push(order); saveOrders(list);
      show($('#orderAlert'));
      e.target.reset(); updateTotal(); renderOrders();
    })
    renderOrders();
  }

  if(page==='tracking'){
    $('#btnCari').addEventListener('click', function(){
      const no = $('#inputDO').value.trim();
      const data = (window.dataTracking||{})[no]
      if(!data){ hide($('#trackResult')); show($('#trackNotFound')); return }
      hide($('#trackNotFound')); show($('#trackResult'))
      $('#trackName').textContent = data.nama + ' · DO ' + data.nomorDO
      $('#trackStatus').textContent = data.status
      $('#trackEkspedisi').textContent = data.ekspedisi
      $('#trackTanggal').textContent = data.tanggalKirim
      if(document.getElementById('trackPaket')) document.getElementById('trackPaket').textContent = data.paket || '-'
      if(document.getElementById('trackResi')) document.getElementById('trackResi').textContent = data.nomorResi || '-'
      if(document.getElementById('trackBerat')) document.getElementById('trackBerat').textContent = data.berat || '-'
      $('#trackTotal').textContent = data.total
      const tl = $('#timeline'); tl.innerHTML=''
      data.perjalanan.forEach(p=>{
        const d=document.createElement('div'); d.className='item';
        d.innerHTML='<div class="time">'+p.waktu+'</div><div class="desc">'+p.keterangan+'</div>'
        tl.appendChild(d)
      })
      const max = 6; const percent = Math.max(10, Math.min(100, Math.round((data.perjalanan.length/max)*100)))
      $('#trackBar').style.width = percent + '%'
    })
  }
})();
