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

function showToast(msg, type = 'success') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${msg}</span>`;
    toast.style.cssText = `
        position:fixed; bottom:30px; left:50%; transform:translateX(-50%) translateY(100px); 
        padding:12px 25px; border-radius:30px; color:white; font-weight:bold; font-size:14px; 
        display:flex; align-items:center; gap:10px; opacity:0; transition:0.4s ease; 
        z-index:99999; box-shadow:0 5px 15px rgba(0,0,0,0.2);
    `;
    
    if (type === 'success') toast.style.background = '#1bc5bd';
    else if (type === 'error') toast.style.background = '#f64e60';
    else if (type === 'info') toast.style.background = '#3699ff';
    
    document.body.appendChild(toast);
    setTimeout(() => { 
        toast.style.transform = 'translateX(-50%) translateY(0)'; 
        toast.style.opacity = '1'; 
    }, 10);
    setTimeout(() => { 
        toast.style.transform = 'translateX(-50%) translateY(100px)'; 
        toast.style.opacity = '0'; 
        setTimeout(() => toast.remove(), 400); 
    }, 3000);
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('rsDarkModeMain', isDark);
    document.getElementById('theme-toggle').className = isDark ? 'fas fa-sun' : 'fas fa-moon';
}

async function fetchAdminSettings() {
    try {
        let res = await fetch(DB_URL + 'settings.json');
        let data = await res.json();
        if (data && data.upiId) { dynamicUpiId = data.upiId; }
    } catch(e) {}
}

document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem('rsDarkModeMain') === 'true') {
        document.body.classList.add('dark-mode');
        document.getElementById('theme-toggle').className = 'fas fa-sun';
    }
    fetchAdminSettings();
    restoreSession();
    fetchProductsFromDatabase();
});

async function fetchProductsFromDatabase() {
    try {
        const res = await fetch(DB_URL + 'products.json');
        const data = await res.json();
        products = [];
        if (data) {
            products = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        }
        renderProducts();
    } catch (e) {}
}
function renderProducts() {
    const homeGrid = document.getElementById('products-grid');
    if (!homeGrid) return;
    homeGrid.innerHTML = '';
    
    products.forEach((p, i) => {
        let soldOut = p.status === 'Out of Stock' || p.stock <= 0;
        let autoDiscount = p.discount > 0 && !p.coupon;
        let finalPrice = autoDiscount ? Math.round(p.price - (p.price * (p.discount/100))) : p.price;
        
        let badgeHtml = '';
        if (autoDiscount && !soldOut) {
            badgeHtml = `
                <div style="position:absolute; top:10px; right:10px; background:#f64e60; color:white; padding:4px 8px; font-size:11px; font-weight:bold; border-radius:4px; z-index:2;">
                    ${p.discount}% OFF
                </div>
            `;
        }
        
        let soldOutBadge = soldOut ? `
            <div style="position:absolute; top:10px; left:10px; background:#1e1e2d; color:white; padding:4px 8px; font-size:11px; font-weight:bold; border-radius:4px; z-index:2;">
                Sold Out
            </div>
        ` : '';
        
        let priceHtml = autoDiscount ? `<span style="text-decoration:line-through; color:#888; font-size:11px; margin-right:5px;">₹${p.price}</span>₹${finalPrice}` : `₹${p.price}`;
        
        let html = `
            <div class="product-card" onclick="openProduct('${p.id}')" style="position:relative; ${soldOut ? 'opacity:0.6' : ''}">
                ${soldOutBadge} ${badgeHtml}
                <div class="product-img-wrap"><img src="${p.img}" style="${soldOut ? 'filter:grayscale(1)' : ''}"></div>
                <div class="product-info"><h3>${p.name}</h3><p>${priceHtml}</p></div>
            </div>
        `;
        if (i < 8) homeGrid.innerHTML += html;
    });
}

function openProduct(id) {
    currentProduct = products.find(p => p.id === id);
    const pdImg = document.getElementById('pd-img');
    pdImg.src = currentProduct.img;
    
    let galleryContainer = document.getElementById('pd-gallery') || document.createElement('div');
    galleryContainer.id = 'pd-gallery';
    galleryContainer.style.cssText = "display:flex; gap:10px; margin-top:15px; overflow-x:auto; padding-bottom:5px;";
    galleryContainer.innerHTML = '';
    
    if (currentProduct.gallery && currentProduct.gallery.length > 1) {
        currentProduct.gallery.forEach(imgUrl => {
            galleryContainer.innerHTML += `
                <img src="${imgUrl}" style="width:65px; height:65px; object-fit:cover; border-radius:8px; cursor:pointer; border:1px solid var(--border-color);" onclick="document.getElementById('pd-img').src='${imgUrl}';">
            `;
        });
    }
    if (!document.getElementById('pd-gallery')) pdImg.parentNode.insertBefore(galleryContainer, pdImg.nextSibling);
    
    document.getElementById('pd-title').innerText = currentProduct.name;
    
    let autoDiscount = currentProduct.discount > 0 && !currentProduct.coupon;
    let finalPrice = autoDiscount ? Math.round(currentProduct.price - (currentProduct.price * (currentProduct.discount/100))) : currentProduct.price;
    currentProduct.finalPrice = finalPrice;
    
    let priceHtml = autoDiscount ? `<span style="text-decoration:line-through; color:#888; font-size:14px; margin-right:8px;">₹${currentProduct.price}</span>₹${finalPrice} <span style="color:#f64e60; font-size:12px; font-weight:bold; margin-left:5px;">(${currentProduct.discount}% OFF)</span>` : `₹${currentProduct.price}`;
    document.getElementById('pd-price').innerHTML = priceHtml;
    
    let featuresList = document.getElementById('pd-features');
    featuresList.innerHTML = `<li><i class="fas fa-check-circle"></i> Premium Quality Fabric</li>`;
    
    if (currentProduct.paymentMode === 'UPI Only') {
        featuresList.innerHTML += `<li style="color:#d9534f;"><i class="fas fa-exclamation-circle"></i> Prepaid / UPI Only (No COD)</li>`;
    } else {
        featuresList.innerHTML += `<li><i class="fas fa-check-circle"></i> Cash on Delivery (COD) Available</li>`;
    }
    
    let isOutOfStock = currentProduct.status === 'Out of Stock' || currentProduct.stock <= 0;
    let sd = document.getElementById('pd-stock-display') || document.createElement('div');
    sd.id = 'pd-stock-display';
    sd.style.marginTop = "10px";
    
    let stockMsg = isOutOfStock ? `<span style="background:#f64e60; color:white; padding:5px 10px; border-radius:4px; font-size:12px; font-weight:bold;">Out of Stock</span>` : `<span style="background:#e8f8f5; color:#1bc5bd; padding:5px 10px; border-radius:4px; font-size:12px; font-weight:bold; border:1px solid #1bc5bd;">In Stock: ${currentProduct.stock} left</span>`;
    sd.innerHTML = stockMsg;
    
    document.getElementById('pd-price').parentNode.insertBefore(sd, document.getElementById('pd-price').nextSibling);
    
    navigate('product-view');
}

function navigate(viewId) {
    document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active-view'));
    const target = document.getElementById(viewId);
    if(target) target.classList.add('active-view');
    window.scrollTo(0, 0);
    
    if(viewId === 'cart-view') renderCart();
    if(viewId === 'profile-view') fetchMyOrders();
    
    if(viewId === 'chat-view') {
        if(currentUser) {
            document.getElementById('user-chat-input-wrapper').style.display = 'flex';
            fetchUserMessages();
            if(!chatPoller) chatPoller = setInterval(fetchUserMessages, 5000);
        }
    } else {
        if(chatPoller) { clearInterval(chatPoller); chatPoller = null; }
    }
}

function openSidebar() { document.getElementById('sidebar').classList.add('open'); document.getElementById('sidebar-overlay').style.display='block'; }
function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebar-overlay').style.display='none'; }
function toggleSearch() { const s = document.getElementById('search-container'); s.style.display = s.style.display === 'block' ? 'none' : 'block'; document.getElementById('search-input').focus(); }

function filterProducts() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const suggestionsBox = document.getElementById('search-suggestions');
    if(query.length === 0) { suggestionsBox.style.display = 'none'; return; }
    
    const filtered = products.filter(p => p.name.toLowerCase().includes(query));
    suggestionsBox.innerHTML = '';
    
    if(filtered.length > 0) {
        filtered.forEach(p => {
            suggestionsBox.innerHTML += `
                <div class="suggestion-item" onclick="openProduct('${p.id}'); document.getElementById('search-container').style.display='none';">
                    <img src="${p.img}" style="width: 50px; height: 50px; border-radius: 5px; object-fit: cover;">
                    <div>
                        <div style="font-weight: 500;">${p.name}</div>
                        <div style="color: var(--primary-color); font-size: 12px;">₹${p.price}</div>
                    </div>
                </div>
            `;
        });
        suggestionsBox.style.display = 'block';
    }
}
function showBanModal() {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; z-index:99999;';
    modal.innerHTML = `
        <div style="background: var(--card-bg); padding: 35px 25px; border-radius: 12px; width: 90%; max-width: 380px; text-align: center;">
            <div style="width: 70px; height: 70px; background: rgba(246, 78, 96, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;"><i class="fas fa-user-slash" style="font-size: 30px; color: #f64e60;"></i></div>
            <h2 style="color: var(--text-main); margin-bottom: 10px;">Account Suspended</h2>
            <p style="color: #888; font-size: 14px; margin-bottom: 25px;">Your access has been restricted by the administrator.</p>
            <button onclick="this.parentElement.parentElement.remove()" style="width: 100%; padding: 14px; background: transparent; color: #888; border: 1px solid var(--border-color); border-radius: 8px; font-weight: bold;">Close</button>
        </div>
    `;
    document.body.appendChild(modal);
}

async function processLogin() {
    const name = document.getElementById('login-name').value;
    const phone = document.getElementById('login-number').value;
    if(!name || !phone) return showToast("⚠️ Please enter Name & Number", "error");
    
    try {
        const res = await fetch(DB_URL + 'users.json');
        const data = await res.json();
        let existingUser = null; 
        let existingKey = null;
        
        if(data) {
            for(let key in data) {
                if(data[key].phone === phone) { existingUser = data[key]; existingKey = key; break; }
            }
        }
        
        if(existingUser && existingUser.banned === true) {
            document.getElementById('login-modal').style.display='none';
            showBanModal(); 
            return;
        }
        
        if(existingUser) {
            currentUser = existingUser; 
            currentUser.dbKey = existingKey;
        } else {
            const uniqueId = `RS${Math.floor(10000 + Math.random() * 90000)}`;
            currentUser = { name: name, phone: phone, userId: uniqueId, banned: false, searches: [], cart: [] };
            const postRes = await fetch(DB_URL + 'users.json', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(currentUser) });
            const postData = await postRes.json();
            currentUser.dbKey = postData.name;
        }
        
        if(currentUser.cart && currentUser.cart.length > 0 && cart.length === 0) {
            cart = currentUser.cart;
            localStorage.setItem('rsFashionCart', JSON.stringify(cart));
            document.getElementById('cart-counter').innerText = cart.length;
        }
        
        localStorage.setItem('rsFashionUser', JSON.stringify(currentUser));
        updateProfileUI();
        document.getElementById('login-modal').style.display='none';
        navigate('profile-view');
        showToast("✅ Logged in successfully!", "success");
    } catch (error) { showToast("⚠️ Network Error.", "error"); }
}

function logoutUser() {
    currentUser = null;
    localStorage.removeItem('rsFashionUser');
    window.location.reload();
}

function updateProfileUI() {
    if(currentUser) {
        const sidebarDisplay = document.getElementById('sidebar-user-display');
        if(sidebarDisplay) sidebarDisplay.innerHTML = `<b>${currentUser.name}</b><br>ID: ${currentUser.userId}`;
        if(document.getElementById('prof-name')) document.getElementById('prof-name').innerText = currentUser.name;
        if(document.getElementById('prof-phone')) document.getElementById('prof-phone').innerText = currentUser.phone;
        if(document.getElementById('prof-id')) document.getElementById('prof-id').innerText = currentUser.userId;
    }
}

async function restoreSession() {
    const savedCart = localStorage.getItem('rsFashionCart');
    if(savedCart) {
        cart = JSON.parse(savedCart);
        if(document.getElementById('cart-counter')) document.getElementById('cart-counter').innerText = cart.length;
    }
    const u = localStorage.getItem('rsFashionUser');
    if(u) {
        currentUser = JSON.parse(u);
        updateProfileUI();
        try {
            const res = await fetch(DB_URL + 'users.json');
            const data = await res.json();
            if(data) {
                for(let key in data) {
                    if(data[key].phone === currentUser.phone) {
                        if(data[key].banned === true) { logoutUser(); showBanModal(); return; }
                        currentUser.dbKey = key;
                    }
                }
            }
        } catch(e) {}
    }
}

function handleUserClick() { if(currentUser) navigate('profile-view'); else document.getElementById('login-modal').style.display='flex'; }
function openLogin() { document.getElementById('login-modal').style.display = 'flex'; }
function closeLogin() { document.getElementById('login-modal').style.display = 'none'; }

function syncCartToFirebase() {
    if(currentUser && currentUser.dbKey) {
        fetch(`${DB_URL}users/${currentUser.dbKey}.json`, { method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ cart: cart }) });
        currentUser.cart = cart;
        localStorage.setItem('rsFashionUser', JSON.stringify(currentUser));
    }
}

function addToCartFromDetail() {
    if(!currentProduct) return;
    if(currentProduct.status === 'Out of Stock' || currentProduct.stock <= 0) return showToast("⚠️ Sorry, Sold Out!", "error");
    
    let cartItem = { ...currentProduct, price: currentProduct.finalPrice || currentProduct.price };
    cart.push(cartItem);
    
    document.getElementById('cart-counter').innerText = cart.length;
    localStorage.setItem('rsFashionCart', JSON.stringify(cart));
    syncCartToFirebase();
    showToast("🛍️ Item added to cart!", "success");
}

function renderCart() {
    const container = document.getElementById('cart-items-container');
    container.innerHTML = '';
    let total = 0;
    cart.forEach((item, index) => {
        total += item.price;
        container.innerHTML += `
            <div class="cart-item" style="display:flex; align-items:center; gap:15px; margin-bottom:15px;">
                <img src="${item.img}" style="width:50px; border-radius:5px;">
                <div>
                    <h4>${item.name}</h4>
                    <p style="font-weight:bold; color:var(--primary-color);">₹${item.price}</p>
                </div>
                <i class="fas fa-trash" style="color:#f64e60; margin-left:auto; cursor:pointer;" onclick="removeFromCart(${index})"></i>
            </div>
        `;
    });
    document.getElementById('cart-total').innerText = `Total: ₹${total}`;
}

function removeFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem('rsFashionCart', JSON.stringify(cart));
    renderCart();
    document.getElementById('cart-counter').innerText = cart.length;
    syncCartToFirebase();
    showToast("🗑️ Item removed", "info");
}
window.selectPayment = function(type) {
    document.getElementById('cod-label').classList.remove('selected');
    document.getElementById('upi-label').classList.remove('selected');
    document.getElementById('cod-check').style.color = '#ddd';
    document.getElementById('upi-check').style.color = '#ddd';
    
    if(type === 'COD') {
        document.getElementById('cod-label').classList.add('selected');
        document.getElementById('cod-check').style.color = '#c5a880';
        document.getElementById('upi-proof-section').style.display = 'none';
        document.querySelector('input[value="COD"]').checked = true;
    } else {
        document.getElementById('upi-label').classList.add('selected');
        document.getElementById('upi-check').style.color = '#c5a880';
        document.getElementById('upi-proof-section').style.display = 'block';
        document.querySelector('input[value="UPI"]').checked = true;
    }
}

function openCheckoutModal(mode) {
    if (!currentUser) return showToast("⚠️ Please Login First to Checkout!", "error");
    
    checkoutMode = mode;
    let orderItems = checkoutMode === 'single' ? [currentProduct] : cart;
    let isUpiOnly = orderItems.some(i => i.paymentMode === 'UPI Only');
    
    checkoutBaseTotal = orderItems.reduce((s, i) => s + (i.finalPrice || i.price), 0);
    checkoutDiscount = 0;
    checkoutFinalTotal = checkoutBaseTotal;
    appliedCouponCode = "";
    
    document.getElementById('chk-coupon').value = "";
    document.getElementById('chk-discount-row').style.display = 'none';
    document.getElementById('chk-subtotal').innerText = checkoutBaseTotal;
    document.getElementById('chk-final-total').innerText = checkoutFinalTotal;
    document.getElementById('display-upi-total').innerText = checkoutFinalTotal;
    
    let upiLinkStr = `upi://pay?pa=${dynamicUpiId}&pn=RS%20Fashion&am=${checkoutFinalTotal}&cu=INR&tn=RS_Fashion_Order`;
    document.getElementById('pay-now-btn').href = upiLinkStr;

    document.getElementById('screenshot-preview').style.display = 'none';
    document.getElementById('screenshot-preview').src = '';
    document.getElementById('upload-text').innerText = "Tap here to attach screenshot";
    document.getElementById('upload-label').style.borderColor = "#c5a880";
    document.getElementById('upload-label').style.background = "var(--card-bg)";
    document.getElementById('upi-screenshot').value = '';

    let codLabel = document.getElementById('cod-label');
    let upiWarning = document.getElementById('upi-only-warning');
    
    if (isUpiOnly) {
        codLabel.style.display = 'none';
        selectPayment('UPI');
        upiWarning.style.display = 'block';
    } else {
        codLabel.style.display = 'flex';
        selectPayment('COD');
        upiWarning.style.display = 'none';
    }
    
    document.getElementById('checkout-modal').style.display = 'flex';
}

function closeCheckout() { 
    document.getElementById('checkout-modal').style.display = 'none'; 
}

function applyCouponCode() {
    let code = document.getElementById('chk-coupon').value.trim().toUpperCase();
    if(!code) return;
    
    let orderItems = checkoutMode === 'single' ? [currentProduct] : cart;
    let discountFound = 0;
    
    orderItems.forEach(item => {
        if(item.coupon && item.coupon.toUpperCase() === code) {
            discountFound += Math.round(item.price * (item.discount / 100));
        }
    });
    
    if (discountFound > 0) { 
        checkoutDiscount = discountFound;
        checkoutFinalTotal = checkoutBaseTotal - discountFound;
        appliedCouponCode = code; 
        
        document.getElementById('chk-discount-row').style.display = 'inline';
        document.getElementById('chk-discount').innerText = checkoutDiscount;
        document.getElementById('chk-final-total').innerText = checkoutFinalTotal;
        document.getElementById('display-upi-total').innerText = checkoutFinalTotal; 
        
        let upiLinkStr = `upi://pay?pa=${dynamicUpiId}&pn=RS%20Fashion&am=${checkoutFinalTotal}&cu=INR&tn=RS_Fashion_Order`;
        document.getElementById('pay-now-btn').href = upiLinkStr;
        
        showToast("🎉 Coupon Applied!", "success"); 
    } else {
        showToast("❌ Invalid Coupon Code", "error");
    }
}
function previewScreenshot(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('screenshot-preview').src = e.target.result;
            document.getElementById('screenshot-preview').style.display = 'block';
            document.getElementById('upload-text').innerText = "Screenshot Attached! ✅";
            document.getElementById('upload-label').style.borderColor = "#1bc5bd";
            document.getElementById('upload-label').style.background = "rgba(27, 197, 189, 0.05)";
        };
        reader.readAsDataURL(file);
    }
}

function resizeImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const scale = 400 / img.width;
                canvas.width = 400;
                canvas.height = img.height * scale;
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.6));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

document.getElementById('checkout-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = document.getElementById('order-now-btn');
    if(btn) { 
        btn.innerHTML = "<i class='fas fa-spinner fa-spin'></i> Processing..."; 
        btn.disabled = true; 
    }

    let selectedPayment = "COD";
    const paymentRadios = document.getElementsByName('payment_method');
    for(let radio of paymentRadios) {
        if(radio.checked) { selectedPayment = radio.value; break; }
    }

    let upiScreenshotBase64 = "";
    if (selectedPayment === "UPI") {
        const fileInput = document.getElementById('upi-screenshot');
        if (!fileInput.files || fileInput.files.length === 0) {
            if(btn) { 
                btn.innerHTML = "🚀 Confirm & Order Now 🛍️"; 
                btn.disabled = false; 
            }
            return showToast("⚠️ Payment screenshot is required for UPI!", "error");
        }
        upiScreenshotBase64 = await resizeImage(fileInput.files[0]);
    }

    const addressData = document.getElementById('chk-add1').value + ", " + document.getElementById('chk-add2').value + " - Pincode: " + document.getElementById('chk-pin').value;
    
    let itemsString = checkoutMode === 'single' ? currentProduct.name : cart.map(i => i.name).join(", ");
    if(appliedCouponCode) {
        itemsString += ` [Coupon Used: ${appliedCouponCode}]`;
    }

    const orderData = {
        userId: currentUser.userId,
        customerName: currentUser.name,
        phone: currentUser.phone,
        address: addressData,
        items: itemsString,
        totalAmount: checkoutFinalTotal, 
        status: "Pending",
        deliveryTime: "Awaiting Admin Confirmation",
        paymentType: selectedPayment,
        upiScreenshot: upiScreenshotBase64
    };

    try {
        const res = await fetch(DB_URL + 'orders.json', { 
            method: 'POST', 
            body: JSON.stringify(orderData) 
        }); 
        const savedOrder = await res.json();
        
        closeCheckout();
        
        if(checkoutMode === 'cart') {
            cart = [];
            localStorage.setItem('rsFashionCart', JSON.stringify(cart));
            syncCartToFirebase();
            document.getElementById('cart-counter').innerText = 0;
        }
        
        showToast("🎉 Order Placed Successfully!", "success");
        setTimeout(() => { navigate('profile-view'); }, 1500);
        
    } catch (err) {
        showToast("❌ Failed to place order.", "error");
    }
    
    if(btn) { 
        btn.innerHTML = "🚀 Confirm & Order Now 🛍️"; 
        btn.disabled = false; 
    }
});

async function fetchMyOrders() {
    const container = document.getElementById('order-history-list');
    if(!container || !currentUser) return;
    
    container.innerHTML = '<p style="text-align:center; color:var(--primary-color);"><i class="fas fa-spinner fa-spin"></i> Checking live status...</p>';
    
    try {
        const res = await fetch(DB_URL + 'orders.json');
        const data = await res.json();
        container.innerHTML = '';
        let hasOrders = false;
        
        if(data) {
            Object.keys(data).reverse().forEach(key => {
                let o = data[key];
                if(o.userId === currentUser.userId) {
                    hasOrders = true;
                    let color = o.status === 'Pending' ? '#ffa800' : (o.status === 'Rejected' ? '#f64e60' : '#1bc5bd');
                    let payBadge = o.paymentType === 'COD' ? '<span style="background:#333; color:white; padding:2px 6px; border-radius:4px; font-size:9px; margin-left:5px;">COD</span>' : '<span style="background:#6528F7; color:white; padding:2px 6px; border-radius:4px; font-size:9px; margin-left:5px;">UPI</span>';
                    
                    container.innerHTML += `
                        <div style="background:var(--card-bg, #fff); padding:15px; border-radius:8px; margin-bottom:15px; border-left:4px solid ${color}; border:1px solid var(--border-color, #ddd);">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <b>${o.items}</b>
                                <span style="background:${color}; color:white; padding:4px 10px; border-radius:4px; font-size:11px; font-weight:bold;">${o.status}</span>
                            </div>
                            <p style="font-size:13px; margin-top:10px; font-weight:bold;">🚚 ${o.deliveryTime}</p>
                            <p style="font-size:12px; color:#888; margin-top:5px;">Amount: ₹${o.totalAmount} ${payBadge}</p>
                        </div>`;
                }
            });
        }
        if(!hasOrders) container.innerHTML = '<p style="text-align:center; color:#888;">No orders found yet.</p>';
    } catch (e) {
        container.innerHTML = '<p style="color:red;">Error syncing tracking data.</p>';
    }
}

// PREMIUM CONCIERGE CHAT ENGINE
function formatTime(ts) {
    if(!ts) return '';
    return new Date(ts).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

async function fetchUserMessages() {
    if(!currentUser || !currentUser.dbKey) return;
    try {
        let res = await fetch(`${DB_URL}chats/${currentUser.dbKey}/messages.json`);
        let msgs = await res.json();
        let box = document.getElementById('user-chat-box');
        
        let initialHTML = `
            <div style="text-align:center; margin-bottom:20px;">
                <p style="background:rgba(197, 168, 128, 0.1); color:#c5a880; font-weight:bold; font-size:11px; padding:5px 15px; border-radius:20px; display:inline-block;">Secure Support Channel</p>
            </div>
        `;
        box.innerHTML = initialHTML;
        
        let updates = {};

        if(msgs) {
            Object.keys(msgs).forEach(k => {
                let m = msgs[k];
                let isMe = m.sender === 'user';
                
                if(!isMe && m.status !== 'seen') {
                    updates[`chats/${currentUser.dbKey}/messages/${k}/status`] = 'seen';
                }

                let cssClass = isMe ? 'chat-user' : 'chat-admin';
                let imgHtml = m.img ? `<img src="${m.img}" style="max-width:200px; border-radius:8px; margin-bottom:5px; cursor:pointer;" onclick="window.open(this.src)"><br>` : '';
                
                let tickHtml = '';
                if(isMe) {
                    tickHtml = m.status === 'seen' ? `<i class="fas fa-check-double" style="color:#3699ff; font-size:10px; margin-left:5px;"></i>` : `<i class="fas fa-check" style="color:#eee; font-size:10px; margin-left:5px;"></i>`;
                }

                let timeHtml = `<div style="font-size:10px; margin-top:5px; opacity:0.7; display:flex; align-items:center; justify-content:flex-end;">${formatTime(m.timestamp)}${tickHtml}</div>`;
                
                box.innerHTML += `
                    <div class="chat-bubble ${cssClass}">
                        ${imgHtml}${m.text || ''}${timeHtml}
                    </div>
                `;
            });
            box.scrollTop = box.scrollHeight;
            
            if(Object.keys(updates).length > 0) {
                fetch(`${DB_URL}.json`, { method: 'PATCH', body: JSON.stringify(updates) });
            }
        } else { 
            box.innerHTML += '<p style="text-align:center; color:#888; font-size:13px; margin-top:20px;">Send a message to start chatting with us.</p>'; 
        }
    } catch(e) {}
}

async function sendUserMessage(imgBase64 = null) {
    if(!currentUser || !currentUser.dbKey) return;
    let input = document.getElementById('user-chat-input');
    let text = input.value.trim();
    if(!text && !imgBase64) return;
    input.value = '';
    
    let msgData = { sender: 'user', text: text, timestamp: Date.now(), status: 'sent' };
    if(imgBase64) msgData.img = imgBase64;

    try {
        await fetch(`${DB_URL}chats/${currentUser.dbKey}/userName.json`, { 
            method: 'PUT', 
            body: JSON.stringify(currentUser.name) 
        });
        await fetch(`${DB_URL}chats/${currentUser.dbKey}/messages.json`, { 
            method: 'POST', 
            body: JSON.stringify(msgData) 
        });
        fetchUserMessages();
    } catch(e) {}
}

async function sendUserChatImage(event) {
    const file = event.target.files[0];
    if(file) {
        showToast("Uploading image...", "info");
        let base64 = await resizeImage(file);
        sendUserMessage(base64);
    }
}
