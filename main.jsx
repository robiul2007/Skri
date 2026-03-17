import React, { useState } from 'react';
import { 
  LayoutDashboard, ShoppingBag, PlusCircle, Users, Settings, 
  Bell, Search, Moon, Sun, TrendingUp, Package, Tag, LogOut, 
  Activity, AlertCircle 
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- MOCK DATA ---
const salesData = [
  { name: 'Jan', revenue: 4000 }, { name: 'Feb', revenue: 3000 },
  { name: 'Mar', revenue: 5000 }, { name: 'Apr', revenue: 4500 },
  { name: 'May', revenue: 6000 }, { name: 'Jun', revenue: 8000 },
];

const mockProducts = [
  { id: 'Rs01K', name: 'Soft Pink Layered Abaya', price: 1299, stock: 12, status: 'Active' },
  { id: 'Rs02K', name: 'Classic Black Open Abaya', price: 1299, stock: 3, status: 'Low Stock' },
  { id: 'Rs03K', name: 'Grey Tiered Zip-Front', price: 1499, stock: 0, status: 'Out of Stock' },
];

const mockOrders = [
  { id: '#ORD-092', customer: 'Riya Khan', amount: 1299, status: 'Pending', date: 'Today' },
  { id: '#ORD-091', customer: 'Ayesha S.', amount: 2598, status: 'Shipped', date: 'Yesterday' },
  { id: '#ORD-090', customer: 'Fatima A.', amount: 1499, status: 'Delivered', date: '15 Mar' },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Theme Styles
  const theme = {
    bg: isDarkMode ? '#121212' : '#f4f7f6',
    sidebarBg: isDarkMode ? '#1e1e2d' : '#1e1e2d',
    cardBg: isDarkMode ? '#1e1e1e' : '#ffffff',
    text: isDarkMode ? '#e0e0e0' : '#3f4254',
    textMuted: isDarkMode ? '#888' : '#a2a3b7',
    border: isDarkMode ? '#333' : '#eee',
    primary: '#c5a880'
  };

  const navItems = [
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Overview' },
    { id: 'products', icon: <ShoppingBag size={20} />, label: 'Products' },
    { id: 'orders', icon: <Package size={20} />, label: 'Orders' },
    { id: 'customers', icon: <Users size={20} />, label: 'Customers' },
    { id: 'coupons', icon: <Tag size={20} />, label: 'Discounts' },
    { id: 'settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: theme.bg, color: theme.text, fontFamily: 'system-ui, sans-serif' }}>
      
      {/* 1. SIDEBAR NAVIGATION */}
      <aside style={{ width: '260px', backgroundColor: theme.sidebarBg, color: '#fff', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', fontSize: '22px', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', color: theme.primary }}>
          RS FASHION
        </div>
        <nav style={{ flexGrow: 1, padding: '20px 0' }}>
          {navItems.map(item => (
            <div 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                padding: '15px 25px', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer',
                backgroundColor: activeTab === item.id ? 'rgba(197, 168, 128, 0.1)' : 'transparent',
                color: activeTab === item.id ? theme.primary : '#a2a3b7',
                borderLeft: activeTab === item.id ? `4px solid ${theme.primary}` : '4px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              {item.icon} <span style={{ fontWeight: 500 }}>{item.label}</span>
            </div>
          ))}
        </nav>
        <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#a2a3b7' }}>
          <LogOut size={20} /> <span>Logout</span>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* 2. TOP HEADER */}
        <header style={{ height: '70px', backgroundColor: theme.cardBg, borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexGrow: 1 }}>
            <div style={{ position: 'relative', width: '300px' }}>
              <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: theme.textMuted }} />
              <input type="text" placeholder="Search orders, products..." style={{ width: '100%', padding: '10px 10px 10px 35px', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.text }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button onClick={() => setIsDarkMode(!isDarkMode)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.text }}>
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div style={{ position: 'relative', cursor: 'pointer' }}>
              <Bell size={20} />
              <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'red', color: 'white', fontSize: '10px', borderRadius: '50%', padding: '2px 6px' }}>3</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: theme.primary, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>S</div>
              <span style={{ fontWeight: 500 }}>Saru Bhai</span>
            </div>
          </div>
        </header>

        {/* SCROLLABLE VIEW PORT */}
        <div style={{ padding: '30px', overflowY: 'auto', flexGrow: 1 }}>
          
          {/* --- VIEW 1: DASHBOARD --- */}
          {activeTab === 'dashboard' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2>Business Overview</h2>
                <button onClick={() => setIsAddModalOpen(true)} style={{ backgroundColor: theme.primary, color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  <PlusCircle size={18} /> Quick Add Product
                </button>
              </div>

              {/* 3. Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
                {[
                  { label: 'Total Revenue', value: '₹1,24,500', icon: <TrendingUp size={24} color="#1bc5bd" />, bg: 'rgba(27, 197, 189, 0.1)' },
                  { label: 'Active Orders', value: '14', icon: <Package size={24} color="#3699ff" />, bg: 'rgba(54, 153, 255, 0.1)' },
                  { label: 'Total Customers', value: '892', icon: <Users size={24} color="#8950fc" />, bg: 'rgba(137, 80, 252, 0.1)' },
                  { label: 'Low Stock Items', value: '3', icon: <AlertCircle size={24} color="#f64e60" />, bg: 'rgba(246, 78, 96, 0.1)' }
                ].map((stat, i) => (
                  <div key={i} style={{ backgroundColor: theme.cardBg, padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ color: theme.textMuted, fontSize: '13px', textTransform: 'uppercase', marginBottom: '5px' }}>{stat.label}</p>
                      <h3 style={{ fontSize: '24px', margin: 0 }}>{stat.value}</h3>
                    </div>
                    <div style={{ width: '50px', height: '50px', borderRadius: '10px', backgroundColor: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {stat.icon}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                {/* 4. Sales Chart */}
                <div style={{ backgroundColor: theme.cardBg, padding: '20px', borderRadius: '10px' }}>
                  <h3 style={{ marginBottom: '20px' }}>Revenue Analytics</h3>
                  <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={salesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                        <XAxis dataKey="name" stroke={theme.textMuted} />
                        <YAxis stroke={theme.textMuted} />
                        <Tooltip contentStyle={{ backgroundColor: theme.cardBg, borderColor: theme.border }} />
                        <Line type="monotone" dataKey="revenue" stroke={theme.primary} strokeWidth={3} activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 10. Activity Log */}
                <div style={{ backgroundColor: theme.cardBg, padding: '20px', borderRadius: '10px' }}>
                  <h3 style={{ marginBottom: '20px' }}>Recent Activity</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {[
                      { log: 'New order #ORD-092 placed', time: '10 mins ago', icon: <ShoppingBag size={16}/>, color: '#3699ff' },
                      { log: 'Product "Grey Abaya" updated', time: '2 hours ago', icon: <Activity size={16}/>, color: '#1bc5bd' },
                      { log: 'Stock alert: Black Undercap', time: '5 hours ago', icon: <AlertCircle size={16}/>, color: '#f64e60' }
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: `${item.color}20`, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</div>
                        <div>
                          <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>{item.log}</p>
                          <p style={{ margin: 0, fontSize: '12px', color: theme.textMuted }}>{item.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- VIEW 2: PRODUCTS --- */}
          {activeTab === 'products' && (
            <div style={{ backgroundColor: theme.cardBg, padding: '20px', borderRadius: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2>Inventory Management</h2>
                <button onClick={() => setIsAddModalOpen(true)} style={{ backgroundColor: theme.primary, color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer' }}>+ Add Product</button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${theme.border}`, color: theme.textMuted }}>
                    <th style={{ padding: '12px' }}>SKU</th>
                    <th style={{ padding: '12px' }}>Product Name</th>
                    <th style={{ padding: '12px' }}>Price</th>
                    <th style={{ padding: '12px' }}>Stock</th>
                    <th style={{ padding: '12px' }}>Status</th>
                    <th style={{ padding: '12px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {mockProducts.map((p, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${theme.border}` }}>
                      <td style={{ padding: '12px', fontWeight: 500 }}>{p.id}</td>
                      <td style={{ padding: '12px' }}>{p.name}</td>
                      <td style={{ padding: '12px' }}>₹{p.price}</td>
                      <td style={{ padding: '12px' }}>{p.stock} units</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ padding: '4px 8px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', 
                          backgroundColor: p.stock > 10 ? 'rgba(27,197,189,0.1)' : p.stock > 0 ? 'rgba(255,168,0,0.1)' : 'rgba(246,78,96,0.1)',
                          color: p.stock > 10 ? '#1bc5bd' : p.stock > 0 ? '#ffa800' : '#f64e60'
                        }}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: '#3699ff', cursor: 'pointer' }}>Edit</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ADD OTHER VIEWS (Orders, Customers, Settings) similarly here based on activeTab */}
          {(activeTab === 'orders' || activeTab === 'customers' || activeTab === 'coupons' || activeTab === 'settings') && (
            <div style={{ backgroundColor: theme.cardBg, padding: '50px', borderRadius: '10px', textAlign: 'center' }}>
              <Settings size={50} color={theme.primary} style={{ marginBottom: '20px' }} />
              <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Module</h2>
              <p style={{ color: theme.textMuted }}>This professional component is ready to be connected to your backend API.</p>
            </div>
          )}

        </div>
      </main>

      {/* 6. QUICK ADD PRODUCT MODAL */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: theme.cardBg, padding: '30px', borderRadius: '12px', width: '400px', color: theme.text }}>
            <h2 style={{ marginBottom: '20px' }}>Upload New Product</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input type="text" placeholder="Product Name" style={{ padding: '10px', borderRadius: '6px', border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text }} />
              <input type="number" placeholder="Price (₹)" style={{ padding: '10px', borderRadius: '6px', border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text }} />
              <input type="text" placeholder="Image URL" style={{ padding: '10px', borderRadius: '6px', border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text }} />
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button onClick={() => setIsAddModalOpen(false)} style={{ flex: 1, padding: '12px', border: `1px solid ${theme.border}`, background: 'transparent', color: theme.text, borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => { alert('Ready to send to Google Sheets API!'); setIsAddModalOpen(false); }} style={{ flex: 1, padding: '12px', border: 'none', background: theme.primary, color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Publish</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
