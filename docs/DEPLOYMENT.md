# 🚀 StayCool Booking Deployment Guide

This document details the production deployment process for both the **Next.js App** and the **Supabase Backend Services**.

---

## 🔺 Frontend Deployment (Vercel / Netlify / VPS)

We recommend deploying the Next.js application on **Vercel** for optimal performance, built-in edge caching, and serverless function scaling.

### Steps:
1. Push your clean code to a remote repository (GitHub / GitLab / Bitbucket).
2. Connect your repository to Vercel.
3. Configure the following environment variables in the Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
4. Set the framework preset to **Next.js**.
5. Click **Deploy**. Vercel will automatically build the static assets, optimize images, and deploy serverless functions.

---

## ⚡ Supabase Backend Deployment

### 1. Migrations Execution
Ensure your production Supabase database matches the local development schema. 
- Go to the **Supabase Dashboard** -> **SQL Editor**.
- Open the SQL scripts located in `database/migrations/` sequentially (ordered by date prefix).
- Execute the scripts on your production database instance.
- Ensure all Row Level Security (RLS) policies are active.

### 2. Storage Buckets Configuration
Create the following storage buckets in the Supabase Dashboard under **Storage** with **Public** access:
1. `property-images` (For hosting property gallery listings)
2. `kyc-documents` (Private bucket, accessible only via authenticated admin profiles)

---

## 💳 Razorpay Gateway Configuration

To accept live production payments:
1. Log in to the **Razorpay Dashboard**.
2. Switch from **Test Mode** to **Live Mode**.
3. Generate a new **Key ID** and **Key Secret**, and update these values in your frontend environment variables.
4. Go to **Settings** -> **Webhooks** and configure a webhook pointing to your production endpoint:
   `https://yourdomain.com/api/payments/razorpay/webhook`
5. Select the following event triggers:
   - `payment.captured`
   - `payment.failed`
   - `refund.processed`
6. Set the Secret and copy it to your server's environment configuration.

---

## 🔍 Post-Deployment Verifications

Run deployment diagnostics using the PowerShell script inside the deployment folder:
```powershell
./scripts/deployment/check_host_status.ps1
```
This ensures database endpoints are reachable, payment APIs are validated, and the frontend is resolving successfully.
