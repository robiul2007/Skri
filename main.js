// 1. CONNECT TO THE LIVE MOCKAPI DATABASE
const API_URL = "https://69ba5f18b3dcf7e0b4bcb73f.mockapi.io/products";

// Global State Variables
let products = []; 
let cart = [];
let currentProduct = null;
let currentUser = null;
let checkoutMode = 'single'; 
let orderMethod = 'instagram'; 
let currentOrderTotal = 0; 

// Store Info
const sellerWhatsAppNumber = '919876543210'; 
const instagramUsername = 'rs__fashion____009'; 
const myUpiId = ''; 

// Boot up the website
document.addEventListener("DOMContentLoaded", () => {
    restoreSession(); 
    fetchProductsFromDatabase(); 
    startAutoSlide();
});

// Fetch Live Inventory Data
async function fetchProductsFromDatabase() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        products = data.map(item => ({
            id: item.id,       
            sku: `Rs${item.id}K`,      
            name: item.name,
            price: parseInt(item.price),
            img: item.img,
            stock: parseInt(item.stock) || 0,
            status: item.status || 'Active'
        }));

        renderProducts(); 
        
    } catch (error) {
        console.error("Error loading products", error);
        const grid = document.getElementById('products-grid');
        if(grid) grid.innerHTML = "<p style='text-align:center; width:100%; color:red;'>Failed to load products. Please check your internet connection.</p>";
    }
}

// Global UI Functions
function showToast(msg) {
    const toast = document.getElementById('toast');
    if(!toast) return;
    toast.innerHTML = `<i class="fas fa-info-circle"></i> ${msg}`;
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 3000);
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const themeIcon = document.getElementById('theme-toggle');
    if(!themeIcon) return;
    
    if (document.body.classList.contains('dark-mode')) {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    } else {
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
    }
}

function shareProduct() {
    if(!currentProduct) return;
    const shareText = `Hey! Check out this beautiful ${currentProduct.name} at RS Fashion. Only ₹${currentProduct.price}!\n\nBrowse the collection here: https://rsfashion.vercel.app`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
}
// Image Slider Logic
let slideIndex = 0;
let slideInterval;
function showSlide(index) {
    const wrapper = document.getElementById('sliderWrapper');
    if(!wrapper) return;
    if (index > 3) slideIndex = 0; 
    else if (index < 0) slideIndex = 3; 
    else slideIndex = index;
    wrapper.style.transform = `translateX(-${slideIndex * 100}%)`;
}
function nextSlide() { showSlide(slideIndex + 1); resetSlideTimer(); }
function prevSlide() { showSlide(slideIndex - 1); resetSlideTimer(); }
function startAutoSlide() { slideInterval = setInterval(() => { nextSlide(); }, 3500); }
function resetSlideTimer() { clearInterval(slideInterval); startAutoSlide(); }

function navigate(viewId) {
    document.querySelectorAll('.view-section').forEach(view => view.classList.remove('active-view'));
    const targetView = document.getElementById(viewId);
    if(targetView) targetView.classList.add('active-view');
    window.scrollTo(0, 0);
    if(viewId === 'cart-view') renderCart();
}

// Render Products with Out of Stock Badges
function renderProducts() {
    const homeGrid = document.getElementById('products-grid');
    const allProductsGrid = document.getElementById('all-products-grid');
    
    if(homeGrid) homeGrid.innerHTML = '';
    if(allProductsGrid) allProductsGrid.innerHTML = '';
    
    if (products.length === 0) {
        if(homeGrid) homeGrid.innerHTML = '<p style="text-align:center; width:100%;">Database is empty. Please check back later!</p>';
        return;
    }

    products.forEach((p, index) => {
        let isOutOfStock = p.status === 'Out of Stock' || p.stock <= 0;
        
        let badgeHtml = isOutOfStock 
            ? `<div style="position: absolute; top: 10px; left: 10px; background: #f64e60; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; z-index: 10; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">Sold Out</div>` 
            : '';

        let cardStyle = isOutOfStock ? 'opacity: 0.7;' : '';
        let imgStyle = isOutOfStock ? 'filter: grayscale(80%);' : '';

        let cardHtml = `
            <div class="product-card" onclick="openProduct('${p.id}')" style="position: relative; ${cardStyle}">
                ${badgeHtml}
                <div class="product-img-wrap"><img src="${p.img}" alt="${p.name}" style="${imgStyle}"></div>
                <div class="product-info">
                    <h3 class="p-title">${p.name}</h3>
                    <p class="p-price">₹${p.price}</p>
                </div>
            </div>
        `;
        
        if (index < 6 && homeGrid) homeGrid.innerHTML += cardHtml;
        if (allProductsGrid) allProductsGrid.innerHTML += cardHtml;
    });
}

function renderSuggestedProducts(excludeId) {
    const suggestedGrid = document.getElementById('suggested-products-grid');
    if (!suggestedGrid) return;
    
    suggestedGrid.innerHTML = '';
    let availableProducts = products.filter(p => p.id !== excludeId);
    availableProducts = availableProducts.sort(() => 0.5 - Math.random());
    let suggestions = availableProducts.slice(0, 4);
    
    suggestions.forEach(p => {
        let isOutOfStock = p.status === 'Out of Stock' || p.stock <= 0;
        let cardStyle = isOutOfStock ? 'opacity: 0.7;' : '';
        
        suggestedGrid.innerHTML += `
            <div class="product-card" onclick="openProduct('${p.id}')" style="position: relative; ${cardStyle}">
                <div class="product-img-wrap"><img src="${p.img}" alt="${p.name}"></div>
                <div class="product-info">
                    <h3 class="p-title">${p.name}</h3>
                    <p class="p-price">₹${p.price}</p>
                </div>
            </div>
        `;
    });
}
// UI Toggles
function openSidebar() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebar-overlay').style.display = 'block';
}
function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').style.display = 'none';
}
function toggleSearch() {
    const searchBox = document.getElementById('search-container');
    if(!searchBox) return;
    searchBox.style.display = searchBox.style.display === 'block' ? 'none' : 'block';
    document.getElementById('search-input').focus();
}

function filterProducts() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const suggestionsBox = document.getElementById('search-suggestions');
    if(query.length === 0) { suggestionsBox.style.display = 'none'; return; }
    
    const filtered = products.filter(p => p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query));
    suggestionsBox.innerHTML = '';
    
    if(filtered.length > 0) {
        filtered.forEach(p => {
            suggestionsBox.innerHTML += `
                <div class="suggestion-item" onclick="openProduct('${p.id}'); document.getElementById('search-container').style.display='none';">
                    <img src="${p.img}" style="width: 50px; height: 50px; border-radius: 5px; object-fit: cover;">
                    <div><div style="font-weight: 500;">${p.name}</div><div style="color: var(--accent-color); font-size: 12px;">ID: ${p.sku} | ₹${p.price}</div></div>
                </div>
            `;
        });
        suggestionsBox.style.display = 'block';
    } else {
        suggestionsBox.innerHTML = '<div class="suggestion-item">No products found</div>';
        suggestionsBox.style.display = 'block';
    }
}

// Dynamic Product View Construction
function openProduct(id) {
    currentProduct = products.find(p => p.id === id);
    if(!currentProduct) return;
    
    document.getElementById('pd-img').src = currentProduct.img;
    document.getElementById('pd-img-thumb1').src = currentProduct.img;
    document.getElementById('pd-img-thumb2').src = currentProduct.img; 
    document.getElementById('pd-img-thumb3').src = currentProduct.img; 

    document.getElementById('pd-id').innerText = `Product ID: ${currentProduct.sku}`;
    document.getElementById('pd-title').innerText = currentProduct.name;
    document.getElementById('pd-price').innerText = `₹${currentProduct.price}`;
    
    // Check Stock and Render Dynamic Badge
    let isOutOfStock = currentProduct.status === 'Out of Stock' || currentProduct.stock <= 0;
    let stockDisplay = document.getElementById('pd-stock-display');
    
    // Create the stock element dynamically if it doesn't exist
    if(!stockDisplay) {
        stockDisplay = document.createElement('div');
        stockDisplay.id = 'pd-stock-display';
        stockDisplay.style.marginTop = "12px";
        const priceElement = document.getElementById('pd-price');
        priceElement.parentNode.insertBefore(stockDisplay, priceElement.nextSibling);
    }

    if(isOutOfStock) {
        stockDisplay.innerHTML = `<span style="background: #f64e60; color: white; padding: 6px 12px; border-radius: 4px; font-weight: bold; font-size: 13px; display: inline-block;"><i class="fas fa-times-circle"></i> Out of Stock</span>`;
    } else {
        stockDisplay.innerHTML = `<span style="background: rgba(27, 197, 189, 0.1); color: #1bc5bd; padding: 6px 12px; border-radius: 4px; font-weight: bold; font-size: 13px; display: inline-block; border: 1px solid #1bc5bd;"><i class="fas fa-check-circle"></i> In Stock: ${currentProduct.stock} units available</span>`;
    }

    renderSuggestedProducts(id);
    navigate('product-view');
}

function changeMainImg(src) { document.getElementById('pd-img').src = src; }

// Cart & Checkout Permissions
function addToCartFromDetail() {
    if(!currentProduct) return;
    if(currentProduct.status === 'Out of Stock' || currentProduct.stock <= 0) {
        showToast("Sorry, this item is currently out of stock!");
        return;
    }
    
    cart.push(currentProduct);
    saveCart(); 
    document.getElementById('cart-counter').innerText = cart.length;
    showToast(`${currentProduct.name} added to cart!`);
}

function renderCart() {
    const container = document.getElementById('cart-items-container');
    if(!container) return;
    container.innerHTML = '';
    let total = 0;
    if(cart.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding: 20px;">Your cart is empty.</p>';
    } else {
        cart.forEach((item, index) => {
            total += item.price;
            container.innerHTML += `
                <div class="cart-item">
                    <img src="${item.img}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 5px;">
                    <div style="flex-grow: 1;"><p style="font-size: 11px; color: var(--text-gray);">ID: ${item.sku}</p><h4>${item.name}</h4><p style="color: var(--accent-color); font-weight: bold;">₹${item.price}</p></div>
                    <i class="fas fa-trash" style="color: red; cursor: pointer; padding: 10px;" onclick="removeFromCart(${index})"></i>
                </div>
            `;
        });
    }
    document.getElementById('cart-total').innerText = `Total: ₹${total}`;
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart(); 
    document.getElementById('cart-counter').innerText = cart.length;
    renderCart();
}

function saveCart() { localStorage.setItem('rsFashionCart', JSON.stringify(cart)); }
// User Auth Logic
function handleUserClick() {
    if(currentUser) navigate('profile-view');
    else openLogin();
}

function openLogin() { document.getElementById('login-modal').style.display = 'flex'; }
function closeLogin() { document.getElementById('login-modal').style.display = 'none'; }

function processLogin() {
    const name = document.getElementById('login-name').value;
    const phone = document.getElementById('login-number').value;
    if(name && phone) {
        const uniqueId = `Rs${Math.floor(1000 + Math.random() * 9000)}R`;
        currentUser = { name, phone, id: uniqueId };
        
        localStorage.setItem('rsFashionUser', JSON.stringify(currentUser));
        updateProfileUI();
        closeLogin();
        navigate('profile-view');
        showToast("Successfully logged in!");
    } else { showToast("Please enter both Name and Number."); }
}

function logoutUser() {
    currentUser = null;
    localStorage.removeItem('rsFashionUser');
    updateProfileUI();
    document.getElementById('login-name').value = '';
    document.getElementById('login-number').value = '';
    navigate('home-view');
    showToast("Logged out successfully.");
}

function updateProfileUI() {
    if(currentUser) {
        document.getElementById('sidebar-user-display').innerHTML = `Logged in as: <b>${currentUser.name}</b><br>ID: <span style="color: var(--accent-color)">${currentUser.id}</span>`;
        if(document.getElementById('prof-name')) document.getElementById('prof-name').innerText = currentUser.name;
        if(document.getElementById('prof-phone')) document.getElementById('prof-phone').innerText = currentUser.phone;
        if(document.getElementById('prof-id')) document.getElementById('prof-id').innerText = currentUser.id;
    } else {
        document.getElementById('sidebar-user-display').innerText = "Not Logged In";
        if(document.getElementById('prof-name')) document.getElementById('prof-name').innerText = "Name";
        if(document.getElementById('prof-phone')) document.getElementById('prof-phone').innerText = "...";
        if(document.getElementById('prof-id')) document.getElementById('prof-id').innerText = "...";
    }
}

function restoreSession() {
    const savedUser = localStorage.getItem('rsFashionUser');
    if(savedUser) {
        currentUser = JSON.parse(savedUser);
        updateProfileUI();
    }
    const savedCart = localStorage.getItem('rsFashionCart');
    if(savedCart) {
        cart = JSON.parse(savedCart);
        if(document.getElementById('cart-counter')) document.getElementById('cart-counter').innerText = cart.length;
    }
}

// Checkout & Instagram Logic
function toggleUPI(show) {
    const upiSection = document.getElementById('upi-section');
    if(upiSection) upiSection.style.display = show ? 'block' : 'none';
}

function openCheckoutModal(mode) {
    if (!currentUser) {
        showToast("Please login first to place an order!");
        openLogin(); 
        return; 
    }

    // Out of stock verification check before opening checkout
    if (mode === 'single' && currentProduct) {
        if(currentProduct.status === 'Out of Stock' || currentProduct.stock <= 0) {
            showToast("Sorry, this item is currently out of stock!");
            return;
        }
    }

    checkoutMode = mode;
    currentOrderTotal = 0;

    if (mode === 'single') {
        currentOrderTotal = currentProduct.price;
        document.getElementById('checkout-product-name').innerText = `1 Item - ₹${currentOrderTotal}`;
    } else {
        if(cart.length === 0) { showToast("Your cart is empty!"); return; }
        currentOrderTotal = cart.reduce((sum, item) => sum + item.price, 0);
        document.getElementById('checkout-product-name').innerText = `Cart Total (${cart.length} items) - ₹${currentOrderTotal}`;
    }
    
    document.getElementById('chk-name').value = currentUser.name;
    document.getElementById('chk-phone').value = currentUser.phone;
    document.getElementById('upi-amount').innerText = currentOrderTotal;
    
    if (myUpiId === '') {
        document.getElementById('upi-link').href = "#";
        document.getElementById('upi-link').onclick = (e) => { 
            e.preventDefault(); 
            alert("Payment system is ready! Please provide your UPI ID to activate this button."); 
        };
    } else {
        const upiLink = `upi://pay?pa=${myUpiId}&pn=RS Fashion&am=${currentOrderTotal}&cu=INR&tn=Order Payment`;
        document.getElementById('upi-link').href = upiLink;
        document.getElementById('upi-link').onclick = null;
    }

    document.querySelector('input[value="Cash on Delivery (COD)"]').checked = true;
    toggleUPI(false);
    document.getElementById('checkout-modal').style.display = 'flex';
}

function closeCheckout() { document.getElementById('checkout-modal').style.display = 'none'; }

function showInstagramInstructionModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.style.zIndex = '9999'; 
    
    modal.innerHTML = `
        <div class="modal-content" style="text-align: center; padding: 30px 20px;">
            <div style="width: 60px; height: 60px; background: var(--light-bg); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                <i class="fab fa-instagram" style="font-size: 35px; color: #E1306C;"></i>
            </div>
            <h2 style="font-family: 'Playfair Display'; margin-bottom: 10px; color: var(--text-main);">One Last Step!</h2>
            
            <div style="background: var(--light-bg); border: 1px solid var(--border-color); padding: 15px; border-radius: 8px; text-align: left; margin-bottom: 20px;">
                <p style="font-size: 14px; color: var(--text-main); margin-bottom: 8px;">✅ <b>Order details copied automatically!</b></p>
                <p style="font-size: 13px; color: var(--text-gray); margin-bottom: 5px;">1. Click the button below to open Instagram.</p>
                <p style="font-size: 13px; color: var(--text-gray); margin-bottom: 5px;">2. Go to RS Fashion's chat.</p>
                <p style="font-size: 13px; color: var(--text-gray);">3. <b>Paste</b> the message and send to confirm!</p>
            </div>

            <button onclick="window.open('https://ig.me/m/${instagramUsername}', '_blank'); this.parentElement.parentElement.remove();" style="width: 100%; padding: 14px; background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); color: white; border: none; border-radius: 5px; font-size: 15px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 10px rgba(225, 48, 108, 0.3);">
                Open Instagram
            </button>
            <p onclick="this.parentElement.parentElement.remove()" style="margin-top: 15px; color: var(--text-gray); cursor: pointer; text-decoration: underline; font-size: 13px;">Cancel</p>
        </div>
    `;
    document.body.appendChild(modal);
}

document.getElementById('checkout-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('chk-name').value;
    const phone = document.getElementById('chk-phone').value;
    const address = `${document.getElementById('chk-add1').value}, ${document.getElementById('chk-add2').value}`;
    const pin = document.getElementById('chk-pin').value;
    const selectedPayMode = document.querySelector('input[name="pay_mode"]:checked').value;

    let msg = `*New Order Request!*\n\n`;
    msg += `*User ID:* ${currentUser.id}\n`;
    msg += `*Registered Name:* ${currentUser.name}\n\n`;
    msg += `*Items Ordered:*\n`;
    
    let finalTotal = 0;

    if(checkoutMode === 'single') {
        msg += `1. ${currentProduct.name} (ID: ${currentProduct.sku}) - ₹${currentProduct.price}\n`;
        finalTotal = currentProduct.price;
    } else {
        cart.forEach((item, i) => {
            msg += `${i+1}. ${item.name} (ID: ${item.sku}) - ₹${item.price}\n`;
            finalTotal += item.price;
        });
    }

    msg += `\n*Total Amount:* ₹${finalTotal}\n`;
    msg += `*Payment Mode:* ${selectedPayMode}\n\n`; 
    msg += `*Delivery Details:*\nName: ${name}\nMobile: ${phone}\nAddress: ${address}\nPincode: ${pin}\n\n`;
    msg += `*Order from the website*`;

    if (orderMethod === 'whatsapp') {
        showToast("WhatsApp ordering is coming soon! Please use Instagram to place your order.");
        return; 
    } else if (orderMethod === 'instagram') {
        const tempTextArea = document.createElement("textarea");
        tempTextArea.value = msg;
        document.body.appendChild(tempTextArea);
        tempTextArea.select();
        tempTextArea.setSelectionRange(0, 99999); 
        
        try {
            document.execCommand("copy");
            closeCheckout();
            showInstagramInstructionModal();
            
            if(checkoutMode === 'cart') {
                cart = []; 
                saveCart(); 
                document.getElementById('cart-counter').innerText = 0;
            }
            document.getElementById('checkout-form').reset();
            
        } catch (err) {
            showToast("Copy failed on this browser. Please try again.");
        }
        document.body.removeChild(tempTextArea);
    }
});
