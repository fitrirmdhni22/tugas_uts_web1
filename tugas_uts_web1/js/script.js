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
    s.textContent = msg || 'Input tidak valid';
  }
  function clearError(input){ if(!input) return; input.classList.remove('invalid'); const s=input.nextElementSibling; if(s && s.classList && s.classList.contains('error-text')) s.textContent=''; }
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
          // Attach handlers
          tr.querySelector('[data-act="save"]').addEventListener('click', ()=>{
            const qty = parseInt(tr.querySelector('[data-act="qty"]').value||'1');
            const method = tr.querySelector('[data-act="method"]').value;
            const all = load();
            const realIndex = all.length-1-idx; // because reversed
            const item = all[realIndex];
            const buku = (window.dataKatalogBuku||[]).find(b=>b.namaBarang===item.buku)
            const price = buku ? rupiahToInt(buku.harga) : Math.round(item.subtotal/(item.qty||1));
            const newSubtotal = price*qty;
            const fee = (function(){ if(method==='transfer') return 2500; if(method==='ewallet') return Math.max(1000, Math.round(newSubtotal*0.015)); if(method==='cod') return 5000; return 0 })();
            all[realIndex] = Object.assign({}, item, {qty, method, subtotal:newSubtotal, fee, total:newSubtotal+fee});
            save(all); render();
          })
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
    const totalBuku = (window.dataKatalogBuku||[]).length
    const totalStok = (window.dataKatalogBuku||[]).reduce((s,b)=>s+(b.stok||0),0)
    $('#totalBuku').textContent = totalBuku
    $('#totalStok').textContent = totalStok
  }

  if(page==='stok'){
    function renderCards(list){
      const grid = $('#gridBuku'); grid.innerHTML=''
      list.forEach(b=>{
        const div = document.createElement('div'); div.className='card';
        div.innerHTML = '<div class="card-body book-card">'
          + '<img src="'+(b.cover||'img/placeholder.svg')+'" alt="cover" onerror="this.onerror=null;this.src=\'img/placeholder.svg\'">'
          + '<div class="book-info">'
          + '<div class="badge">'+b.jenisBarang+' · Edisi '+b.edisi+'</div>'
          + '<strong>'+b.namaBarang+'</strong>'
          + '<div class="price">'+b.harga+'</div>'
          + '<div class="stock">Stok: '+b.stok+'</div>'
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
      $('#ringkasan').innerHTML = '<div class="badge">Item</div><div class="mt-2"><strong>'+(item.namaBarang||'-')+'</strong> × '+qty+'<br>Harga satuan: '+item.harga+'<br>Metode: '+pay.toUpperCase()+'</div>'
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
      const key='uts_orders';
      const list = JSON.parse(localStorage.getItem(key)||'[]');
      list.push(order); localStorage.setItem(key, JSON.stringify(list));
      show($('#orderAlert'));
      e.target.reset(); updateTotal();
    })
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
