# 🛍️ Tonmoy Varity Store (তন্ময় ভ্যারাইটি স্টোর)

A modern, production-oriented neighborhood grocery e-commerce web application tailored for Bangladesh, built with **React**, **Vite**, **Tailwind CSS**, and **Supabase**.

---

## 🌟 Key Highlights

- **Bilingual Interface (দ্বিভাষিক)**: Instant switching between Bengali (বাংলা) and English (EN) with localized navigation, labels, notifications, and currency formats.
- **Bangladeshi Local Currency**: Full support for Bangladeshi Taka (`৳` / BDT) with formatted prices, delivery fees, and discount badges.
- **Delivery & Payment Options**:
  - 🚚 **Home Delivery**: Delivery fee calculation (৳50 flat fee with Free Delivery threshold over ৳500) and Cash on Delivery (COD).
  - 🏪 **Store Pickup**: Customer collects in-store with Pay at Store option.
- **Customer Experience**:
  - Dynamic homepage with category carousel, featured items, and new arrivals.
  - Shop catalog with category filtering, real-time search, sorting, and price range filters.
  - Persistent cart state in local storage.
  - Order checkout with strict BD phone number validation (`+8801XXXXXXXXX`).
  - Visual order timeline and real-time status tracking (`Pending` ➔ `Confirmed` ➔ `Processing` ➔ `Ready` ➔ `Out for Delivery` ➔ `Delivered`).
  - Customer account profile management and order history.
- **Admin Management Portal**:
  - Secure role-guarded `/admin` dashboard with revenue metrics, total orders, customers, and low-stock alerts.
  - **Products CRUD**: Image upload directly to Supabase Storage, categorization, pricing, units (`কেজি`, `লিটার`, `প্যাকেট`), and featured toggles.
  - **Categories CRUD**: Emoji icon picker, bilingual titles, and active toggles.
  - **Orders Management**: Live search, status updates, customer address breakdown, and line items view.
  - **Quick Inventory Manager**: Fast inline stock adjustment and bulk saving.
  - **Store Settings**: Delivery fees, operating hours, and payment method switches.
- **Enterprise-Grade Security**:
  - **Supabase Edge Function** (`place-order`): Atomic server-side order calculation, stock validation, and race-condition-safe inventory decrementing using `service_role`.
  - **Row Level Security (RLS)**: Fine-grained PostgreSQL RLS policies preventing privilege escalation, restricting customer profile role updates, and isolating user order histories.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 18 + Vite |
| **Routing** | React Router v6 |
| **Styling & Design System** | Tailwind CSS (Custom Bangladeshi Grocery Palette: Deep Green `#176B3A`, Fresh Green `#2E8B57`, Mint `#EAF6ED`) |
| **Icons & UI** | Lucide React + React Hot Toast |
| **Database & Auth** | Supabase (PostgreSQL 15 + Supabase GoTrue Auth) |
| **File Storage** | Supabase Storage (`products` bucket) |
| **Serverless Logic** | Supabase Edge Functions (Deno / TypeScript) |

---

## 📁 Project Structure

```
tonmoy-varity-store/
├── public/
│   └── favicon.svg                  # Custom branded Bangla favicon
├── src/
│   ├── components/
│   │   ├── layout/                  # Navbar (bilingual, search, cart badge) & Footer
│   │   ├── product/                 # ProductCard & Skeleton loaders
│   │   └── ui/                      # Status badges, empty states
│   ├── contexts/
│   │   ├── AuthContext.jsx          # Session state, role detection, profile updates
│   │   ├── CartContext.jsx          # Cart items, persistent quantity handling
│   │   └── LanguageContext.jsx      # Bengali/English locale switcher
│   ├── layouts/
│   │   ├── CustomerLayout.jsx       # Standard storefront shell
│   │   └── AdminLayout.jsx          # Admin sidebar navigation & header
│   ├── lib/
│   │   ├── supabase.js              # Resilient Supabase client initialization
│   │   └── utils.js                 # Currency formatters, dates, BD phone validator
│   ├── pages/
│   │   ├── customer/                # Home, Shop, ProductDetail, Cart, Checkout,
│   │   │                            # OrderConfirmation, OrderHistory, OrderDetail,
│   │   │                            # Profile, Login, Register
│   │   ├── admin/                   # AdminDashboard, AdminProducts, AdminCategories,
│   │   │                            # AdminOrders, AdminOrderDetail, AdminInventory,
│   │   │                            # AdminSettings, AdminLoginPage
│   │   └── NotFoundPage.jsx         # 404 handler
│   ├── App.jsx                      # Protected routes & role-based guards
│   ├── main.jsx                     # Application bootstrap
│   └── index.css                    # Tailwind CSS directives & utility classes
├── supabase/
│   ├── functions/
│   │   └── place-order/
│   │       └── index.ts             # Secure order calculation Edge Function
│   ├── migrations/
│   │   └── 20240101000000_initial_schema.sql # Version-controlled DB migration
│   ├── schema.sql                   # Full idempotent schema & RLS policies
│   └── seed.sql                     # Rich Bangladeshi grocery products & categories
├── .env.example                     # Environment variables template
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## 🚀 Quick Setup Guide

### 1. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update with your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here
```

### 2. Set Up Database Schema & Initial Data
1. Open your **[Supabase Project Dashboard](https://supabase.com/dashboard)**.
2. Navigate to **SQL Editor** ➔ **New Query**.
3. Copy the contents of [`supabase/schema.sql`](file:///C:/Users/khors/.gemini/antigravity-ide/scratch/tonmoy-varity-store/supabase/schema.sql) and click **Run**.
4. Next, copy the contents of [`supabase/seed.sql`](file:///C:/Users/khors/.gemini/antigravity-ide/scratch/tonmoy-varity-store/supabase/seed.sql) and click **Run** to populate categories and staple products.

### 3. Deploy the Edge Function
Using the Supabase CLI:
```bash
supabase functions deploy place-order --no-verify-jwt
```
*(The function automatically verifies user credentials via the Authorization header and uses `SUPABASE_SERVICE_ROLE_KEY` for server-side stock deductions).*

### 4. Create an Admin Account
1. Register a new user in the web application at `/register` (or via Supabase Auth dashboard).
2. Run this quick query in the Supabase SQL Editor:
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
```
3. Now sign in through `/admin/login` to access the full store management suite.

### 5. Run Locally
```bash
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔒 Security Best Practices Implemented

- **Server-Side Price & Stock Verification**: Line items submitted by customers are never trusted for pricing or stock availability; prices and subtotal calculations are enforced on the backend via the Edge Function.
- **Stock Atomicity**: Stock levels are safely decremented using the `decrement_stock` PostgreSQL stored procedure.
- **Strict Role Isolation**: RLS policies prevent non-admin users from altering their own `role` or viewing other customers' order records.
- **Input Sanitization**: Phone numbers are validated against official Bangladeshi carrier prefix masks (`013-019`).
