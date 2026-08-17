QEVARI SUPABASE READY
1. Fill supabase-config.js with your Supabase API URL + Publishable key.
2. Run the complete SUPABASE_SQL.txt in Supabase SQL Editor (required once for customer checkout/RLS).
3. Create an Admin user in Supabase Authentication.
4. Deploy this folder to Vercel.
5. Storefront: /
6. Admin: /admin.html
Never put Secret/service_role key in this project.

6. Products: the storefront reads active products from the public `products` table. Run the updated SUPABASE_SQL.txt once.
7. A product appears only when Active is enabled and Stock is greater than 0.
8. Customer orders are saved to the orders table and can be managed at /admin.html.
