const DB_URL = "https://leon-41242-default-rtdb.firebaseio.com/";

let products = [];
let cart = [];
let currentUser = null;
let currentProduct = null;
let checkoutMode = 'single';
let dynamicUpiId = "YOUR_UPI_ID@okaxis";
let chatPoller = null;

let checkoutBaseTotal = 0;
let checkoutDiscount = 0;
let checkoutFinalTotal = 0;
let appliedCouponCode = "";

let currentHomeSlide = 0;
let homeSlideTimer;
function showHomeSlide(index) {
    const wrapper = document.getElementById('sliderWrapper');
    const slides = wrapper.children;
    if(index >= slides.length) currentHomeSlide = 0;
    else if(index < 0) currentHomeSlide = slides.length - 1;
    else currentHomeSlide = index;
    wrapper.style.transform = `translateX(-${currentHomeSlide * 100}%)`;
}
function nextHomeSlide() { showHomeSlide(currentHomeSlide + 1); resetHomeTimer(); }
function prevHomeSlide() { showHomeSlide(currentHomeSlide - 1); resetHomeTimer(); }
function resetHomeTimer() { clearInterval(homeSlideTimer); homeSlideTimer = setInterval(nextHomeSlide, 4000); }

function showToast(msg, type = 'success') {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = `toast-notification`;
    toast.innerHTML = `<span>${msg}</span>`;
    toast.style.color = type === 'error' ? '#f64e60' : '#1bc5bd';
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 3000);
}

function toggleTheme() { document.body.classList.toggle('dark-mode'); localStorage.setItem('rsDarkModeMain', document.body.classList.contains('dark-mode')); document.getElementById('theme-toggle').className = document.body.classList.contains('dark-mode') ? 'fas fa-sun' : 'fas fa-moon'; }

document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem('rsDarkModeMain') === 'true') { document.body.classList.add('dark-mode'); document.getElementById('theme-toggle').className = 'fas fa-sun'; }
    fetch(DB_URL + 'settings.json').then(r=>r.json()).then(d=>{if(d && d.upiId) dynamicUpiId = d.upiId;}).catch(e=>{});
    resetHomeTimer();
    restoreSession();
    fetchProducts();
});

async function fetchProducts() {
    try {
        const res = await fetch(DB_URL + 'products.json'); const data = await res.json();
        products = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
        renderProducts(products, 'home-grid', 8);
        renderProducts(products, 'shop-grid', 100);
    } catch (e) {}
}

function navigate(viewId) {
    document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active-view'));
    const target = document.getElementById(viewId);
    if(target) target.classList.add('active-view');
    window.scrollTo(0, 0);
    
    if(viewId === 'cart-view') renderCart();
    if(viewId === 'orders-view') fetchMyOrders();
    
    if(viewId === 'chat-view') {
        if(!currentUser) {
            document.getElementById('user-chat-box').innerHTML = '<div style="text-align:center; margin-top:40px;"><i class="fas fa-lock" style="font-size:40px; color:#ddd; margin-bottom:15px;"></i><p>Please login to access live support.</p><button onclick="openLogin()" style="margin-top:15px; padding:10px 20px; background:#c5a880; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">Login Now</button></div>';
        } else {
            document.getElementById('user-chat-input-wrapper').style.display = 'flex';
            fetchUserMessages();
            if(!chatPoller) chatPoller = setInterval(fetchUserMessages, 5000);
        }
    } else { if(chatPoller) { clearInterval(chatPoller); chatPoller = null; } }
}

function openSidebar() { document.getElementById('sidebar').classList.add('open'); document.getElementById('sidebar-overlay').style.display='block'; }
function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebar-overlay').style.display='none'; }
function toggleSearch() { const s = document.getElementById('search-container'); s.style.display = s.style.display === 'block' ? 'none' : 'block'; document.getElementById('search-input').focus(); }

function filterProducts() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const box = document.getElementById('search-suggestions');
    if(query.length === 0) { box.style.display = 'none'; return; }
    const filtered = products.filter(p => p.name.toLowerCase().includes(query));
    box.innerHTML = '';
    if(filtered.length > 0) {
        filtered.forEach(p => { box.innerHTML += `<div class="suggestion-item" onclick="openProduct('${p.id}'); document.getElementById('search-container').style.display='none';"><img src="${p.img}"><div><b>${p.name}</b><br><span style="color:#c5a880; font-size:12px;">₹${p.price}</span></div></div>`; });
        box.style.display = 'block';
    }
}
function renderProducts(productList, containerId, limit = 100) {
    const grid = document.getElementById(containerId);
    if (!grid) return;
    grid.innerHTML = '';
    productList.slice(0, limit).forEach(p => {
        let soldOut = p.status === 'Out of Stock' || p.stock <= 0;
        let finalPrice = p.discount > 0 ? Math.round(p.price - (p.price * (p.discount/100))) : p.price;
        let badgeHtml = (p.discount > 0 && !soldOut) ? `<div style="position:absolute; top:10px; right:10px; background:#f64e60; color:white; padding:4px 8px; font-size:11px; font-weight:bold; border-radius:4px; z-index:2;">${p.discount}% OFF</div>` : '';
        let soldOutBadge = soldOut ? `<div style="position:absolute; top:10px; left:10px; background:#1e1e2d; color:white; padding:4px 8px; font-size:11px; font-weight:bold; border-radius:4px; z-index:2;">Sold Out</div>` : '';
        let priceHtml = p.discount > 0 ? `<span style="text-decoration:line-through; color:#888; font-size:11px; margin-right:5px;">₹${p.price}</span>₹${finalPrice}` : `₹${p.price}`;
        grid.innerHTML += `<div class="product-card" onclick="openProduct('${p.id}')" style="position:relative; ${soldOut ? 'opacity:0.6' : ''}">${soldOutBadge} ${badgeHtml}<div class="product-img-wrap"><img src="${p.img}" style="${soldOut ? 'filter:grayscale(1)' : ''}"></div><div class="product-info"><h3>${p.name}</h3><p style="color:var(--accent-color); font-weight:bold;">${priceHtml}</p></div></div>`;
    });
}

let activeGallery = [];
let galleryIndex = 0;
function updateGalleryUI() { if(activeGallery.length > 0) document.getElementById('pd-img').src = activeGallery[galleryIndex]; }
function nextGalleryImage() { galleryIndex = (galleryIndex + 1) % activeGallery.length; updateGalleryUI(); }
function prevGalleryImage() { galleryIndex = (galleryIndex === 0) ? activeGallery.length - 1 : galleryIndex - 1; updateGalleryUI(); }

function openProduct(id) {
    currentProduct = products.find(p => p.id === id);
    activeGallery = currentProduct.gallery && currentProduct.gallery.length > 0 ? currentProduct.gallery : [currentProduct.img];
    galleryIndex = 0; updateGalleryUI();
    document.getElementById('gal-left').style.display = activeGallery.length > 1 ? 'flex' : 'none';
    document.getElementById('gal-right').style.display = activeGallery.length > 1 ? 'flex' : 'none';
    document.getElementById('pd-title').innerText = currentProduct.name;
    document.getElementById('pd-id').innerText = "ID: " + currentProduct.id;
    let finalPrice = currentProduct.discount > 0 ? Math.round(currentProduct.price - (currentProduct.price * (currentProduct.discount/100))) : currentProduct.price;
    currentProduct.finalPrice = finalPrice;
    document.getElementById('pd-price').innerHTML = currentProduct.discount > 0 ? `<span style="text-decoration:line-through; color:#888; font-size:14px; margin-right:8px;">₹${currentProduct.price}</span>₹${finalPrice} <span style="color:#f64e60; font-size:12px;">(${currentProduct.discount}% OFF)</span>` : `₹${currentProduct.price}`;
    
    let featuresList = document.getElementById('pd-features');
    featuresList.innerHTML = `<li><i class="fas fa-check-circle"></i> Premium Quality Fabric</li>`;
    featuresList.innerHTML += currentProduct.paymentMode === 'UPI Only' ? `<li style="color:#d9534f;"><i class="fas fa-exclamation-circle"></i> Prepaid / UPI Only (No COD)</li>` : `<li><i class="fas fa-check-circle"></i> Cash on Delivery Available</li>`;
    
    let suggestions = products.filter(p => p.id !== id).sort(() => 0.5 - Math.random()).slice(0, 4);
    renderProducts(suggestions, 'suggested-products-grid', 4);
    navigate('product-view');
}

function shareProduct() {
    if(!currentProduct) return;
    const text = `Hey! Check out this beautiful ${currentProduct.name} for just ₹${currentProduct.finalPrice} at RS Fashion! 🛍️\n\n${window.location.href}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`);
}

async function processLogin() {
    const name = document.getElementById('login-name').value; const phone = document.getElementById('login-number').value;
    if(!name || !phone) return showToast("Enter Name & Number", "error");
    try {
        const res = await fetch(DB_URL + 'users.json'); const data = await res.json();
        let existingUser = null; let existingKey = null;
        if(data) { for(let key in data) { if(data[key].phone === phone) { existingUser = data[key]; existingKey = key; break; } } }
        if(existingUser && existingUser.banned) { closeLogin(); alert("Account Suspended."); return; }
        if(existingUser) { currentUser = existingUser; currentUser.dbKey = existingKey; } 
        else {
            currentUser = { name: name, phone: phone, userId: `RS${Math.floor(10000 + Math.random() * 90000)}`, banned: false, cart: [] };
            const postRes = await fetch(DB_URL + 'users.json', { method: 'POST', body: JSON.stringify(currentUser) });
            const postData = await postRes.json(); currentUser.dbKey = postData.name;
        }
        if(currentUser.cart && currentUser.cart.length > 0 && cart.length === 0) { cart = currentUser.cart; localStorage.setItem('rsFashionCart', JSON.stringify(cart)); document.getElementById('cart-counter').innerText = cart.length; }
        localStorage.setItem('rsFashionUser', JSON.stringify(currentUser));
        updateProfileUI(); closeLogin(); navigate('profile-view'); showToast("Logged in!");
    } catch (error) {}
}

function logoutUser() { currentUser = null; localStorage.removeItem('rsFashionUser'); window.location.reload(); }
function updateProfileUI() {
    if(currentUser) {
        document.getElementById('sidebar-user-display').innerHTML = `<b>${currentUser.name}</b><br>ID: ${currentUser.userId}`;
        if(document.getElementById('prof-name')) document.getElementById('prof-name').innerText = currentUser.name;
        if(document.getElementById('prof-phone')) document.getElementById('prof-phone').innerText = currentUser.phone;
        if(document.getElementById('prof-id')) document.getElementById('prof-id').innerText = currentUser.userId;
    }
}

async function restoreSession() {
    const savedCart = localStorage.getItem('rsFashionCart');
    if(savedCart) { cart = JSON.parse(savedCart); document.getElementById('cart-counter').innerText = cart.length; }
    const u = localStorage.getItem('rsFashionUser');
    if(u) { currentUser = JSON.parse(u); updateProfileUI(); }
}

function handleUserClick() { if(currentUser) navigate('profile-view'); else document.getElementById('login-modal').style.display='flex'; }
function openLogin() { document.getElementById('login-modal').style.display = 'flex'; }
function closeLogin() { document.getElementById('login-modal').style.display = 'none'; }
function syncCart() { if(currentUser && currentUser.dbKey) { fetch(`${DB_URL}users/${currentUser.dbKey}.json`, { method: 'PATCH', body: JSON.stringify({ cart: cart }) }); currentUser.cart = cart; localStorage.setItem('rsFashionUser', JSON.stringify(currentUser)); } }

function addToCartFromDetail() {
    if(!currentProduct) return;
    if(currentProduct.status === 'Out of Stock' || currentProduct.stock <= 0) return showToast("Sold Out!", "error");
    cart.push({ ...currentProduct, price: currentProduct.finalPrice || currentProduct.price });
    document.getElementById('cart-counter').innerText = cart.length;
    localStorage.setItem('rsFashionCart', JSON.stringify(cart)); syncCart(); showToast("Added to cart!");
}

function renderCart() {
    const container = document.getElementById('cart-items-container'); container.innerHTML = ''; let total = 0;
    cart.forEach((item, index) => {
        total += item.price;
        container.innerHTML += `<div class="cart-item"><img src="${item.img}"><div><h4>${item.name}</h4><p style="font-weight:bold; color:var(--accent-color);">₹${item.price}</p></div><i class="fas fa-trash" style="color:#f64e60; margin-left:auto; cursor:pointer;" onclick="removeFromCart(${index})"></i></div>`;
    });
    document.getElementById('cart-total').innerText = `Total: ₹${total}`;
}
function removeFromCart(index) { cart.splice(index, 1); localStorage.setItem('rsFashionCart', JSON.stringify(cart)); renderCart(); document.getElementById('cart-counter').innerText = cart.length; syncCart(); }

window.selectPayment = function(type) {
    document.getElementById('cod-label').classList.remove('selected'); document.getElementById('upi-label').classList.remove('selected');
    document.getElementById('cod-check').style.color = '#ddd'; document.getElementById('upi-check').style.color = '#ddd';
    if(type === 'COD') {
        document.getElementById('cod-label').classList.add('selected'); document.getElementById('cod-check').style.color = '#c5a880';
        document.getElementById('upi-proof-section').style.display = 'none'; document.querySelector('input[value="COD"]').checked = true;
    } else {
        document.getElementById('upi-label').classList.add('selected'); document.getElementById('upi-check').style.color = '#c5a880';
        document.getElementById('upi-proof-section').style.display = 'block'; document.querySelector('input[value="UPI"]').checked = true;
    }
}

function openCheckoutModal(mode) {
    if (!currentUser) return showToast("Login First!", "error");
    checkoutMode = mode;
    let orderItems = checkoutMode === 'single' ? [currentProduct] : cart;
    let isUpiOnly = orderItems.some(i => i.paymentMode === 'UPI Only');
    
    checkoutBaseTotal = orderItems.reduce((s, i) => s + (i.finalPrice || i.price), 0);
    checkoutDiscount = 0; checkoutFinalTotal = checkoutBaseTotal; appliedCouponCode = "";
    
    document.getElementById('chk-name').value = currentUser.name;
    document.getElementById('chk-phone').value = currentUser.phone;
    
    document.getElementById('chk-coupon').value = "";
    document.getElementById('chk-discount-row').style.display = 'none';
    document.getElementById('chk-subtotal').innerText = checkoutBaseTotal;
    document.getElementById('chk-final-total').innerText = checkoutFinalTotal;
    document.getElementById('display-upi-total').innerText = checkoutFinalTotal;
    
    let upiLinkStr = `upi://pay?pa=${dynamicUpiId}&pn=RS%20Fashion&am=${checkoutFinalTotal}&cu=INR`;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const payBtn = document.getElementById('pay-now-btn'); const qrImg = document.getElementById('qr-code-img');
    
    if (isMobile) { payBtn.style.display = 'block'; qrImg.style.display = 'none'; payBtn.href = upiLinkStr; } 
    else { payBtn.style.display = 'none'; qrImg.style.display = 'block'; qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiLinkStr)}`; }

    document.getElementById('screenshot-preview').style.display = 'none'; document.getElementById('upi-screenshot').value = '';

    if (isUpiOnly) { document.getElementById('cod-label').style.display = 'none'; selectPayment('UPI'); } 
    else { document.getElementById('cod-label').style.display = 'flex'; selectPayment('COD'); }
    
    document.getElementById('checkout-modal').style.display = 'flex';
}
function closeCheckout() { document.getElementById('checkout-modal').style.display = 'none'; }

function applyCouponCode() {
    let code = document.getElementById('chk-coupon').value.trim().toUpperCase();
    if(!code) return;
    let orderItems = checkoutMode === 'single' ? [currentProduct] : cart;
    let discountFound = 0;
    orderItems.forEach(item => { if(item.coupon && item.coupon.toUpperCase() === code) { discountFound += Math.round(item.price * (item.discount / 100)); } });
    
    if (discountFound > 0) { 
        checkoutDiscount = discountFound; checkoutFinalTotal = checkoutBaseTotal - discountFound; appliedCouponCode = code; 
        document.getElementById('chk-discount-row').style.display = 'inline';
        document.getElementById('chk-discount').innerText = checkoutDiscount;
        document.getElementById('chk-final-total').innerText = checkoutFinalTotal;
        document.getElementById('display-upi-total').innerText = checkoutFinalTotal; 
        
        let upiLinkStr = `upi://pay?pa=${dynamicUpiId}&pn=RS%20Fashion&am=${checkoutFinalTotal}&cu=INR`;
        document.getElementById('pay-now-btn').href = upiLinkStr;
        if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            document.getElementById('qr-code-img').src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiLinkStr)}`;
        }
        showToast("🎉 Coupon Applied!", "success"); 
    } else { showToast("❌ Invalid Coupon", "error"); }
}

function previewScreenshot(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('screenshot-preview').src = e.target.result;
            document.getElementById('screenshot-preview').style.display = 'block';
            document.getElementById('upload-text').innerText = "Screenshot Attached! ✅";
        };
        reader.readAsDataURL(file);
    }
}

function resizeImage(file) { return new Promise((resolve) => { const reader = new FileReader(); reader.onload = (e) => { const img = new Image(); img.onload = () => { const canvas = document.createElement('canvas'); const scale = 400 / img.width; canvas.width = 400; canvas.height = img.height * scale; canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height); resolve(canvas.toDataURL('image/jpeg', 0.6)); }; img.src = e.target.result; }; reader.readAsDataURL(file); }); }

document.getElementById('checkout-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = document.getElementById('order-now-btn'); btn.innerHTML = "Processing..."; btn.disabled = true;

    let selectedPayment = document.querySelector('input[name="payment_method"]:checked').value;
    let upiScreenshotBase64 = "";
    if (selectedPayment === "UPI") {
        const fileInput = document.getElementById('upi-screenshot');
        if (!fileInput.files || fileInput.files.length === 0) { btn.innerHTML = "Confirm Order"; btn.disabled = false; return showToast("Screenshot required for UPI!", "error"); }
        upiScreenshotBase64 = await resizeImage(fileInput.files[0]);
    }

    let itemsString = checkoutMode === 'single' ? currentProduct.name : cart.map(i => i.name).join(", ");
    if(appliedCouponCode) { itemsString += ` [Coupon Used: ${appliedCouponCode}]`; }

    const orderData = {
        userId: currentUser.userId, customerName: currentUser.name, phone: currentUser.phone,
        address: `${document.getElementById('chk-add1').value}, ${document.getElementById('chk-add2').value} - Pin: ${document.getElementById('chk-pin').value}`,
        items: itemsString, totalAmount: checkoutFinalTotal, status: "Pending", deliveryTime: "Awaiting Admin Confirmation",
        paymentType: selectedPayment, upiScreenshot: upiScreenshotBase64
    };

    try {
        await fetch(DB_URL + 'orders.json', { method: 'POST', body: JSON.stringify(orderData) }); 
        closeCheckout();
        if(checkoutMode === 'cart') { cart = []; localStorage.setItem('rsFashionCart', JSON.stringify(cart)); syncCart(); document.getElementById('cart-counter').innerText = 0; }
        showToast("🎉 Order Placed!", "success"); setTimeout(() => { navigate('orders-view'); }, 1500);
    } catch (err) { showToast("Failed to place order.", "error"); }
    btn.innerHTML = "Confirm Order"; btn.disabled = false; 
});

async function fetchMyOrders() {
    const container = document.getElementById('order-history-list');
    if(!container || !currentUser) return;
    container.innerHTML = '<p style="text-align:center;"><i class="fas fa-spinner fa-spin"></i> Checking live status...</p>';
    try {
        const res = await fetch(DB_URL + 'orders.json'); const data = await res.json();
        container.innerHTML = ''; let hasOrders = false;
        if(data) {
            Object.keys(data).reverse().forEach(key => {
                let o = data[key];
                if(o.userId === currentUser.userId) {
                    hasOrders = true;
                    let color = o.status === 'Pending' ? '#ffa800' : (o.status === 'Rejected' ? '#f64e60' : '#1bc5bd');
                    let payBadge = o.paymentType === 'COD' ? '<span style="background:#333; color:white; padding:2px 6px; border-radius:4px; font-size:9px; margin-left:5px;">COD</span>' : '<span style="background:#6528F7; color:white; padding:2px 6px; border-radius:4px; font-size:9px; margin-left:5px;">UPI</span>';
                    container.innerHTML += `<div style="background:var(--card-bg); padding:15px; border-radius:8px; margin-bottom:15px; border-left:4px solid ${color}; border:1px solid var(--border-color);"><div style="display:flex; justify-content:space-between; align-items:center;"><b>${o.items}</b><span style="background:${color}; color:white; padding:4px 10px; border-radius:4px; font-size:11px; font-weight:bold;">${o.status}</span></div><p style="font-size:13px; margin-top:10px; font-weight:bold;">🚚 ${o.deliveryTime}</p><p style="font-size:12px; color:var(--text-gray); margin-top:5px;">Amount: ₹${o.totalAmount} ${payBadge}</p></div>`;
                }
            });
        }
        if(!hasOrders) container.innerHTML = '<p style="text-align:center; color:var(--text-gray);">No orders found.</p>';
    } catch (e) {}
}

async function fetchUserMessages() {
    if(!currentUser || !currentUser.dbKey) return;
    try {
        let res = await fetch(`${DB_URL}chats/${currentUser.dbKey}/messages.json`); let msgs = await res.json();
        let box = document.getElementById('user-chat-box');
        box.innerHTML = '';
        if(msgs) {
            Object.keys(msgs).forEach(k => {
                let m = msgs[k]; let isMe = m.sender === 'user'; let cssClass = isMe ? 'chat-user' : 'chat-admin';
                box.innerHTML += `<div class="chat-bubble ${cssClass}">${m.text || ''}</div>`;
            });
            box.scrollTop = box.scrollHeight;
        } else { box.innerHTML += '<p style="text-align:center; color:var(--text-gray); font-size:13px; margin-top:20px;">Send a message to start chatting with us.</p>'; }
    } catch(e) {}
}

async function sendUserMessage() {
    if(!currentUser || !currentUser.dbKey) return;
    let input = document.getElementById('user-chat-input'); let text = input.value.trim(); if(!text) return; input.value = '';
    try {
        await fetch(`${DB_URL}chats/${currentUser.dbKey}/userName.json`, { method: 'PUT', body: JSON.stringify(currentUser.name) });
        await fetch(`${DB_URL}chats/${currentUser.dbKey}/messages.json`, { method: 'POST', body: JSON.stringify({ sender: 'user', text: text, timestamp: Date.now(), status: 'sent' }) });
        fetchUserMessages();
    } catch(e) {}
}
