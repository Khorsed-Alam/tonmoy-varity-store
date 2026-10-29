# 📊 Project Progress: Tonmoy Variety Store

**Project:** Tonmoy Variety Store (E-Commerce & Store Management Platform)  
**Tech Stack:** React 18 (Vite) + Tailwind CSS + Supabase (PostgreSQL / RLS) + Google Stitch  
**Architecture:** Enterprise Modular Layered Structure (`app`, `services`, `context`, `hooks`, `utils`, `pages`, `components`)  
**Last Updated:** October 29, 2026  
**Status:** In Active Development & Running 🚀

---

## 🏗️ Project Architecture & Directory Layout

```text
tonmoy-varity-store/
├── public/
│   └── images/
├── src/
│   ├── app/
│   │   ├── App.jsx                  # Root App component
│   │   └── router.jsx               # Centralized React Router configuration & guards
│   ├── components/
│   │   ├── common/                  # Navbar, Footer, MobileBottomNav, MarketListModal, Badges
│   │   ├── products/                # ProductCard, ProductSkeleton
│   │   ├── cart/                    # CartItem
│   │   └── admin/                   # AdminLayout, Admin navigation & header
│   ├── pages/
│   │   ├── Home.jsx                 # Storefront homepage
│   │   ├── Shop.jsx                 # Full product catalog & filter engine
│   │   ├── ProductDetails.jsx       # Single product details & recommendations
│   │   ├── Cart.jsx                 # Shopping cart view
│   │   ├── Checkout.jsx             # Checkout, address form, and payment selection
│   │   ├── Login.jsx                # Customer login
│   │   ├── Register.jsx             # Customer registration
│   │   ├── MyOrders.jsx             # Customer order history
│   │   └── admin/
│   │       ├── Dashboard.jsx        # Admin real-time analytics & cash drawer
│   │       ├── Products.jsx         # Product catalog CRUD
│   │       ├── Categories.jsx       # Category management
│   │       ├── Orders.jsx           # Order queue & status updates
│   │       ├── Inventory.jsx        # Stock tracking & quick restock
│   │       ├── Customers.jsx        # Customer directory & spending history
│   │       └── Settings.jsx         # Store profile & delivery fee parameters
│   ├── context/
│   │   ├── AuthContext.jsx          # Session state, role detection, profile updates
│   │   ├── CartContext.jsx          # Cart items, persistent quantity handling
│   │   └── LanguageContext.jsx      # Bengali/English locale switcher
│   ├── hooks/
│   │   ├── useAuth.js               # Authentication hook
│   │   ├── useProducts.js           # Product querying & realtime sync hook
│   │   └── useOrders.js             # Order management hook
│   ├── lib/
│   │   └── supabaseClient.js        # Supabase client instance
│   ├── services/
│   │   ├── productService.js        # Product API & database operations
│   │   ├── categoryService.js       # Category API operations
│   │   ├── orderService.js          # Order submission & status pipeline
│   │   ├── inventoryService.js      # Stock adjustment & batch restock
│   │   └── uploadService.js         # Image upload to Supabase storage
│   ├── utils/
│   │   ├── currency.js              # Taka currency formatting & delivery fee rules
│   │   └── validation.js            # BD mobile phone, email, and input validators
│   ├── styles/
│   │   └── index.css                # Tailwind CSS base styles & design tokens
│   └── main.jsx                     # Application bootstrap & provider wrapping
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql   # Relational schema, indexes & RLS policies
│   ├── functions/
│   │   └── create-order/            # Edge Function for atomic order processing
│   └── seed.sql                     # Initial categories & products seed data
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 🎯 Implementation Status

### 1. 🗄️ Database & Services Layer (7 Core Tables Implemented)
- [x] **7 Core Database Tables** defined with full PostgreSQL DDL, foreign keys, constraints & RLS:
  1. `profiles`: Customer profile & user role (`id → auth.users.id`)
  2. `categories`: Grocery categories (`categories → products` 1:N)
  3. `products`: Product details, price, cost price, stock (`category_id → categories.id`)
  4. `orders`: Customer order, shipping, total, status (`user_id → profiles.id`)
  5. `order_items`: Order line items with snapshot purchase price (`order_id → orders.id`, `product_id → products.id`)
  6. `inventory_transactions`: Stock-in/stock-out audit history (`product_id → products.id`)
  7. `shop_settings`: Store branding, delivery fees, pickup flags
- [x] Automated stock audit trigger (`tr_log_inventory_audit`) on `products` table
- [x] **Row Level Security (RLS)** enabled on all 7 tables (`categories`, `products`, `profiles`, `orders`, `order_items`, `inventory_transactions`, `shop_settings`) with precise customer, anon, and admin policies
- [x] Service layer created (`src/services/`): `productService`, `categoryService`, `orderService`, `inventoryService` (with stock transaction audit queries), `uploadService`
- [x] Custom React hooks created (`src/hooks/`): `useAuth`, `useProducts`, `useOrders`
- [x] Client initialization moved to standard location (`src/lib/supabaseClient.js`)
- [x] Utilities organized (`src/utils/`): `currency.js` and `validation.js`

### 2. 🎨 Application Core & Router
- [x] Centralized routing moved to `src/app/router.jsx`
- [x] Root component moved to `src/app/App.jsx`
- [x] Styles moved to `src/styles/index.css`
- [x] Entry point updated in `src/main.jsx`

### 3. 🧩 Components Reorganization
- [x] Common UI components grouped in `src/components/common/`
- [x] Product UI components grouped in `src/components/products/`
- [x] Cart components grouped in `src/components/cart/`
- [x] Admin layout and header components grouped in `src/components/admin/`

### 4. 📄 Pages Reorganization
- [x] Customer pages moved to `src/pages/` (`Home`, `Shop`, `ProductDetails`, `Cart`, `Checkout`, `Login`, `Register`, `MyOrders`)
- [x] Admin pages organized in `src/pages/admin/` (`Dashboard`, `Products`, `Categories`, `Orders`, `Inventory`, `Customers`, `Settings`)

---

## 🛠️ Verification & Build Status
- **Vite Build**: Compiled cleanly (`1563 modules transformed in 2.52s`) with 0 errors.
- **Database Schema**: 7 core tables aligned with PostgreSQL identity order numbers, atomic stock deductions, and audit transactions.
- **Dev Server**: Running on `http://localhost:5173/`.
