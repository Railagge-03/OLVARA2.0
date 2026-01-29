// ==========================================
// 1. KONFIGURASI FIREBASE
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyA7_ujIyDHPaefbOI10mmOhIilm53wqC68",
  authDomain: "olvara-parfume.firebaseapp.com",
  databaseURL: "https://olvara-parfume-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "olvara-parfume",
  storageBucket: "olvara-parfume.firebasestorage.app",
  messagingSenderId: "637688213084",
  appId: "1:637688213084:web:9ee8589557737f7098099",
  measurementId: "G-J5H8ZTB6ZL"
};

if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const database = firebase.database();

// ==========================================
// 2. FITUR SHOPPING CART (SISTEM LOCALSTORAGE)
// ==========================================
// Ambil data dari memori browser agar tidak reset saat pindah page
let cart = JSON.parse(localStorage.getItem('olvara_cart')) || []; 

const itemData = {
    'PEACEFULL': { price: 60000, img: 'parfume1.jpeg' },
    'ROYAL BLUE': { price: 60000, img: 'parfume2.jpeg' },
    'VANILLA GRACE': { price: 60000, img: 'parfume3.jpeg' }
};

function addToCart(itemName) {
    cart.push(itemName);
    localStorage.setItem('olvara_cart', JSON.stringify(cart)); // Simpan data
    updateCartCount();
    alert(itemName + " masuk keranjang!");
}

function updateCartCount() {
    const cartIcons = document.querySelectorAll('.cart-icon');
    cartIcons.forEach(el => {
        el.innerText = `Cart (${cart.length})`;
    });
}

function sendToWhatsapp() {
    if (cart.length === 0) return alert("Keranjang masih kosong kak, harap isi terlebih dahulu!");
    
    const modal = document.getElementById('cart-modal');
    const list = document.getElementById('cart-items-list');
    const totalEl = document.getElementById('cart-total-price');
    
    if(!modal || !list) return;

    list.innerHTML = '';
    let total = 0;

    cart.forEach((name, index) => {
        const item = itemData[name.toUpperCase()] || { price: 60000, img: '4.jpeg' };
        total += item.price;
        list.innerHTML += `
            <div class="cart-item">
                <img src="${item.img}" onerror="this.src='4.jpeg'">
                <div class="cart-item-info">
                    <h4>${name}</h4>
                    <p>Rp ${item.price.toLocaleString()}</p>
                </div>
                <button class="remove-item" onclick="removeFromCart(${index})">&times;</button>
            </div>`;
    });

    totalEl.innerText = `Rp ${total.toLocaleString()}`;
    modal.style.display = 'flex';
}

function closeCart() {
    const modal = document.getElementById('cart-modal');
    if(modal) modal.style.display = 'none';
}

function removeFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem('olvara_cart', JSON.stringify(cart));
    updateCartCount();
    if (cart.length === 0) closeCart();
    else sendToWhatsapp();
}

// ==========================================
// 3. CHECKOUT VIA FONNTE API
// ==========================================
function proceedToCheckout() {
    // 1. Ambil data dari inputan di Modal
    const name = document.getElementById('cust-name').value;
    const phone = document.getElementById('cust-phone').value;
    const location = document.getElementById('cust-address').value;

    // 2. Validasi: Jangan kasih lolos kalau belum diisi!
    if (!name || !phone || !location) {
        alert("Waduh, datanya lengkapin dulu dong kak biar parfumnya nyampe tujuan!");
        return;
    }

    // 3. Proses pengiriman via Fonnte (Logika tetep sama)
    const token = "8xtvPbSYkqBGaCJGoNfk"; 
    const target = "6282231195863"; 
    const itemList = cart.map((p, i) => `${i+1}. ${p}`).join('\n');
    
    const msg = `*PESANAN BARU - OLVARA PARFUME*\n\n` +
                `*Identitas Pembeli:*\n` +
                `- Nama: ${name.toUpperCase()}\n` +
                `- WA: ${phone}\n` +
                `- Tujuan: ${location}\n\n` +
                `*Daftar Order:*\n${itemList}\n\n` +
                `Mohon segera diproses ya Admin!`;

    const data = new FormData();
    data.append('target', target);
    data.append('message', msg);

    // Animasi Loading dikit biar keren
    const btn = document.querySelector('.cart-footer .btn-premium');
    btn.innerText = "SENDING...";
    btn.disabled = true;

    fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: { 'Authorization': token },
        body: data
    })
    .then(res => res.json())
    .then(res => {
        if(res.status) {
            alert(`Sip! Pesanan atas nama ${name} sudah kami terima.`);
            cart = [];
            localStorage.removeItem('olvara_cart');
            updateCartCount();
            closeCart();
            // Reset Form
            document.getElementById('cust-name').value = '';
            document.getElementById('cust-phone').value = '';
            document.getElementById('cust-address').value = '';
        } else {
            alert("Error: " + res.reason);
        }
    })
    .catch(() => alert("Koneksi error!"))
    .finally(() => {
        btn.innerText = "PESAN SEKARANG";
        btn.disabled = false;
    });
}
// ==========================================
// 4. RATING & REVIEW (FIREBASE)
// ==========================================
let selectedRating = 0;

document.addEventListener('click', (e) => {
    const star = e.target.closest('.star');
    if (star) {
        selectedRating = parseInt(star.getAttribute('data-value'));
        document.querySelectorAll('.star').forEach(s => {
            const val = parseInt(s.getAttribute('data-value'));
            s.classList.toggle('active', val <= selectedRating);
        });
    }
});

function submitReview() {
    const n = document.getElementById('reviewer-name');
    const t = document.getElementById('review-text');
    const btn = document.querySelector('.btn-premium');

    if (!n.value || !t.value || selectedRating === 0) return alert("Harap melengkapi terlebih dahulu ya kak!");

    btn.innerText = "SENDING...";
    btn.disabled = true;

    database.ref('reviews').push({
        username: n.value, message: t.value, rating: selectedRating, timestamp: Date.now()
    }).then(() => {
        alert("Review Terkirim!");
        n.value = ''; t.value = '';
        selectedRating = 0;
        document.querySelectorAll('.star').forEach(s => s.classList.remove('active'));
        btn.innerText = "POST REVIEW";
        btn.disabled = false;
    }).catch(() => { btn.disabled = false; });
}

database.ref('reviews').on('value', (snapshot) => {
    const list = document.getElementById('review-list');
    if(!list) return;
    list.innerHTML = '';
    const data = snapshot.val();
    if (data) {
        Object.keys(data).reverse().forEach(key => {
            const r = data[key];
            const stars = "★".repeat(r.rating) + "☆".repeat(5 - r.rating);
            list.innerHTML += `
                <div class="review-item">
                    <div class="review-header"><strong>${r.username.toUpperCase()}</strong><span>${stars}</span></div>
                    <p>"${r.message}"</p>
                </div>`;
        });
    }
});

// ==========================================
// 5. INISIALISASI SAAT HALAMAN DIBUKA (PENTING!)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // 1. Panggil ini biar keranjang muncul angkanya di SEMUA page
    updateCartCount(); 

    // 2. Logika Hamburger Menu
    const menuBtn = document.querySelector('#mobile-menu');
    const navMenu = document.querySelector('#nav-menu');
    if(menuBtn && navMenu) {
        menuBtn.onclick = () => {
            navMenu.classList.toggle('active'); 
            menuBtn.classList.toggle('active');
        };
    }

    // 3. Otomatis tandai menu aktif
    const currentLoc = window.location.pathname.split("/").pop() || "index.html"; // Default ke index kalau kosong
document.querySelectorAll('nav ul li a').forEach(link => {
    const linkHref = link.getAttribute('href');
    if (linkHref === currentLoc) {
        link.classList.add('active');
    } else {
        link.classList.remove('active');
    }
	});
});
