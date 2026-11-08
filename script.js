// jalanin kode agenda di dalam IIFE biar ga nabrak variabel global
(function(){
	const calendarbtn = document.getElementById('calendarbtn');
	const listbtn = document.getElementById('listbtn');
	const calendarscreen = document.getElementById('calendarscreen');
	const listscreen = document.getElementById('listscreen');

	calendarbtn.addEventListener('click', () => {
		calendarbtn.classList.add('active');
		listbtn.classList.remove('active');
		calendarscreen.classList.remove('hidden');
		listscreen.classList.add('hidden');
	})

	listbtn.addEventListener('click', () => {
		calendarbtn.classList.remove('active');
		listbtn.classList.add('active');
		calendarscreen.classList.add('hidden');
		listscreen.classList.remove('hidden');
	})

	const monthYearElement = document.getElementById('month-year');
	const daysGrid = document.getElementById('days-grid');
	const prevbtn = document.getElementById('prev-btn');
	const nextbtn = document.getElementById('next-btn');

	let currentDate = new Date();

	const KEY = 'agenda_items_v1';
	let items = [];
	let filter = 'all';
	let draftType = 'assignment';

	// buat ngeload data dari localStorage
	function load(){
		try{
			const raw = localStorage.getItem(KEY);
			items = raw ? JSON.parse(raw) : [];
		}catch(e){ items = []; }
	}
	// buat nyimpen data ke localStorage
	function save(){
		try{ localStorage.setItem(KEY, JSON.stringify(items)); }catch(e){}
	}

	// bikin kalender nya omg
	function renderCalendar() {
  		const year = currentDate.getFullYear();
  		const month = currentDate.getMonth();

  		// Set the header text (e.g., "November 2026")
  		const options = { month: 'long', year: 'numeric' };
  		monthYearElement.textContent = currentDate.toLocaleDateString('en-US', options);

  		// Get the total number of days in the current month
  		const totalDays = new Date(year, month + 1, 0).getDate();
  
  		// Get what day of the week the month starts on (0 = Sunday, 6 = Saturday)
  		const firstDayIndex = new Date(year, month, 1).getDay();

  		let daysHTML = '';

  		// Add empty spaces for days before the 1st of the month
  		for (let i = 0; i < firstDayIndex; i++) {
    		daysHTML += `<p></p>`;
  		}

  		// Loop through every day of the month and create a grid cell
  		for (let day = 1; day <= totalDays; day++) {
    		// Check if this day is today's date
    		const realToday = new Date();
			const isToday =
			day === realToday.getDate() && 
      		month === realToday.getMonth() && 
      		year === realToday.getFullYear() 
        		? 'today' 
        		: '';
			let assignmentToday = '';
			for (let i = 0; i < items.length; i++) {
				if (`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}` === items[i].date) {
					assignmentToday = 'assignment';
					break
				}
			}
			daysHTML += `<button class="${isToday} ${assignmentToday} datebutton" data-date="${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}">${day}</button>`;
  		}

  		// Insert the generated days into the HTML grid
  		daysGrid.innerHTML = daysHTML;
		}

		prevbtn.addEventListener('click', () => {
			currentDate.setMonth(currentDate.getMonth() - 1);
			renderCalendar()
		})

		nextbtn.addEventListener('click', () => {
			currentDate.setMonth(currentDate.getMonth() + 1);
			renderCalendar()
		})
		
		// Run the function when the page loads
		document.addEventListener('DOMContentLoaded', () => {
			renderCalendar();
		})

	function renderPopup() {
		const popupoverlay = document.getElementById('popuptitle')
		const daysgrid = document.getElementById('days-grid');
		const closebtn = document.getElementById('close-btn');
		const popup = document.getElementById('popup');
		const contents = document.getElementById('contents');
		let title = ''
		let clickedDate = ''

		daysgrid.addEventListener('click', (event) => {
		if (event.target.classList.contains('datebutton')) {
			popup.classList.remove('hidden');
			clickedDate = event.target.dataset.date;
			const options = {day: 'numeric', month: 'long', year: 'numeric'};
			const prettyDate = new Date(clickedDate).toLocaleDateString('en-US', options);
			popupoverlay.textContent = prettyDate;

			let assignmentList = ''	
			for (let i = 0; i < items.length; i++) {
				if (items[i].date === clickedDate) {
					assignmentList += `<div><h3>- ${items[i].title} (${items[i].type}):</h3>`+`<p>${items[i].notes || "No notes provided"}</p></div>`
				}
			}

			if (assignmentList === '') {
				contents.innerHTML = 'Nothing to see here!';
			} else {
				contents.innerHTML = assignmentList;
			}
		}
		});

		closebtn.addEventListener('click', () => {
			popup.classList.add('hidden');
		});

		popup.addEventListener('click', (event) =>{
			if(event.target === popup){
				popup.classList.add('hidden');
			}
		});
	}
	renderPopup();

	// countdown ke hari yg lu tentuin
	function daysUntil(dateStr){
		if(!dateStr) return null;
		const today = new Date(); today.setHours(0,0,0,0);
		const d = new Date(dateStr+'T00:00:00');
		return Math.round((d-today)/86400000);
	}
	// biar tanggalny gampang di baca
	function formatDate(dateStr){
		if(!dateStr) return '';
		const d = new Date(dateStr+'T00:00:00');
		return d.toLocaleDateString(undefined,{month:'short',day:'numeric'});
	}
	// buat tulisan status untuk tanggal agenda.
	function dueLabel(dateStr){
		const n = daysUntil(dateStr);
		if(n===null) return '';
		if(n<0) return 'Past due';
		if(n===0) return 'Due today';
		if(n===1) return 'Due tomorrow';
		return 'Due in '+n+' days';
	}

	// nampilin ulang daftar agenda di halaman.
	function render(){
		const list = document.getElementById('list');
		const board = document.getElementById('board');
		const noteList = document.getElementById('noteList');
		const empty = document.getElementById('empty');

		const notices = items.filter(i=>i.type==='notice');
		const tasks = items
			.filter(i=>i.type!=='notice')
			.filter(i=> filter==='all' || i.type===filter)
			.sort((a,b)=> (a.date||'9999').localeCompare(b.date||'9999'));

		board.classList.toggle('show', notices.length>0 && (filter==='all'||filter==='notice'));
		noteList.innerHTML = notices.map(n=>
			'<div class="note">'+esc(n.title)+
			(n.notes? '<div class="notes-text">'+esc(n.notes)+'</div>':'')+
			'<button class="del" data-id="'+n.id+'" title="Remove">&times;</button></div>'
		).join('');

		if(filter==='notice'){
			list.innerHTML='';
			empty.style.display = notices.length? 'none':'block';
			return;
		}

		list.innerHTML = tasks.map(t=>{
			const n = daysUntil(t.date);
			const soon = n!==null && n<=2;
			return '<li class="card">'
				+ '<span class="tag '+t.type+'">'+(t.type==='exam'?'Exam':'Assignment')+'</span>'
				+ '<div class="body">'
					+ '<p class="title">'+esc(t.title)+'</p>'
					+ '<div class="meta">'
						+ (t.date? '<span class="due'+(soon?' soon':'')+'">'+dueLabel(t.date)+' · '+formatDate(t.date)+'</span>':'<span>No date set</span>')
					+ '</div>'
					+ (t.notes? '<div class="notes-text">'+esc(t.notes)+'</div>':'')
				+ '</div>'
				+ '<button class="del" data-id="'+t.id+'" title="Remove">&times;</button>'
			+'</li>';
		}).join('');

		empty.style.display = (tasks.length===0 && notices.length===0) ? 'block' : 'none';
	}

	// ngamanin teks biar aman buat ditampilin di HTML.
	function esc(s){
		return (s||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
	}

	// biar ada smth
	document.querySelectorAll('.tab').forEach(btn=>{
		// Menangani klik pada setiap tombol tab.
		btn.addEventListener('click', ()=>{
			document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
			btn.classList.add('active');
			filter = btn.dataset.filter;
			render();
		});
	});

	// buat ngapus agenda dari daftar.
	document.getElementById('list').addEventListener('click', e=>{
		if(e.target.classList.contains('del')){
			items = items.filter(i=>i.id!==e.target.dataset.id);
			save(); render(); renderCalendar();
		}
	});
	// buat ngapus catatan dari papan pengumuman.
	document.getElementById('noteList').addEventListener('click', e=>{
		if(e.target.classList.contains('del')){
			items = items.filter(i=>i.id!==e.target.dataset.id);
			save(); render(); renderCalendar();
		}
	});

	const overlay = document.getElementById('overlay');
	const fTitle = document.getElementById('fTitle');
	const fDate = document.getElementById('fDate');
	const fNotes = document.getElementById('fNotes');
	const dateLabel = document.getElementById('dateLabel');

	// buka formulir agenda baru.
	function openSheet(){
		fTitle.value=''; fDate.value=''; fNotes.value='';
		setType('assignment');
		overlay.classList.add('show');
		setTimeout(()=>fTitle.focus(), 50);
	}
	// Menutup formulir agenda.
	function closeSheet(){ overlay.classList.remove('show'); }
	// Mengatur jenis agenda yang dipilih.
	function setType(t){
		draftType = t;
		document.querySelectorAll('.typeBtn').forEach(b=> b.classList.toggle('on', b.dataset.type===t));
		fDate.parentElement.style.display = 'block';
		dateLabel.textContent = t==='notice' ? 'Date (optional)' : 'Due date';
	}

	document.getElementById('addBtn').addEventListener('click', openSheet);
	document.getElementById('cancelBtn').addEventListener('click', closeSheet);
	overlay.addEventListener('click', e=>{ if(e.target===overlay) closeSheet(); });
	// Menambahkan aksi saat jenis agenda dipilih.
	document.querySelectorAll('.typeBtn').forEach(b=>{
		// Mengubah jenis agenda sesuai tombol yang diklik.
		b.addEventListener('click', ()=> setType(b.dataset.type));
	});

	// Menyimpan agenda baru saat tombol simpan diklik.
	document.getElementById('saveBtn').addEventListener('click', ()=>{
		const title = fTitle.value.trim();
		if(!title){ fTitle.focus(); return; }
		items.push({
			id: 'i'+Date.now()+Math.random().toString(36).slice(2,7),
			type: draftType,
			title: title,
			date: fDate.value || null,
			notes: fNotes.value.trim() || null
		});
		save(); closeSheet(); render(); renderCalendar();
	});

	document.getElementById('todayLabel').textContent = new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'});

	load();
	render();
})();
