
fetch('/api/dashboard').then(r=>r.json()).then(d=>{
  document.getElementById('totalQty').innerText = d?.totals?.total_quantity || 0;
});
