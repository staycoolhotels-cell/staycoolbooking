# 🌐 StayCool Booking API Reference

This document outlines the primary API endpoints exposed by the Next.js application. All endpoints are hosted locally under `/api/*` and are implemented inside the Next.js `src/app/api/` routing structure.

---

## 🔒 Security & Authentication

All private API routes require a valid Supabase authentication session. Send the session token inside the `Authorization` header:
`Authorization: Bearer <access_token>`

---

## 🏡 Properties Endpoint

### `GET /api/properties`
Fetches a list of active properties with filtering.

- **Query Parameters**:
  - `city` (string, optional) - Filter by city.
  - `category` (string, optional) - Filter by property category.
  - `guests` (number, optional) - Minimum guest capacity.

- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "c7a884fa-bf2b-42b7-bd2f-f44ebbc1aef4",
        "title": "Aura Luxury Villa",
        "description": "Premium villa with private pool",
        "price_per_night": 4500,
        "city": "Hyderabad",
        "status": "active"
      }
    ]
  }
  ```

### `POST /api/properties`
Creates a new property listing (Requires Host or Admin role).

---

## 📅 Bookings & Reservations

### `POST /api/bookings`
Initiates a guest reservation request.

- **Request Body**:
  ```json
  {
    "property_id": "c7a884fa-bf2b-42b7-bd2f-f44ebbc1aef4",
    "check_in": "2026-06-01",
    "check_out": "2026-06-05",
    "guests_count": 2
  }
  ```

- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "booking_id": "b18b4fae-9d21-4f11-987a-8cc89531102b",
    "status": "pending_payment",
    "total_amount": 18000
  }
  ```

---

## 💳 Razorpay Payments Integration

### `POST /api/payments/razorpay/create-order`
Generates a Razorpay Order ID to initiate the gateway transaction.

- **Request Body**:
  ```json
  {
    "booking_id": "b18b4fae-9d21-4f11-987a-8cc89531102b"
  }
  ```

- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "order_id": "order_PJyv6fGqXw9LzR",
    "amount": 1800000,
    "currency": "INR"
  }
  ```

### `POST /api/payments/razorpay/verify-payment`
Verifies Razorpay payment signature and updates the reservation state.

- **Request Body**:
  ```json
  {
    "razorpay_order_id": "order_PJyv6fGqXw9LzR",
    "razorpay_payment_id": "pay_PJyv9fR9t1NqWk",
    "razorpay_signature": "e581fa3d9e8712..."
  }
  ```

- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Payment verified and booking confirmed."
  }
  ```

---

## 🛡️ KYC & Verification API

### `POST /api/kyc/upload`
Uploads identification documents for Host KYC approval.

- **Request Body**: Form-data containing:
  - `document_type`: "aadhaar" | "pan" | "passport"
  - `file`: (Binary File)

- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "document_url": "https://supabase-storage/kyc-docs/aadhaar_user123.jpg",
    "status": "under_review"
  }
  ```
