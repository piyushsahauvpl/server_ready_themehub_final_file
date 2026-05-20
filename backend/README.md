# ThemeHub Admin Backend

## Setup Instructions

### 1. Database Setup

1. Open phpMyAdmin (http://localhost/phpmyadmin)
2. Import the database schema:
   - Go to "Import" tab
   - Select file: `backend/database/schema.sql`
   - Click "Go"

   OR run via command line:
   ```bash
   mysql -u root -p < backend/database/schema.sql
   ```

### 2. Database Configuration

If your MySQL credentials are different, update `backend/config/database.php`:
```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'themehub_db');
```

### 3. File Upload Directories

The following directories will be created automatically when files are uploaded:
- `backend/uploads/products/` - Product images and zip files
- `backend/uploads/blogs/` - Blog images

Make sure these directories have write permissions.

### 4. API Endpoints

All API endpoints are located in `backend/api/admin/`:

- **Authentication:**
  - `POST /api/admin/login.php` - Admin login
  - `GET /api/admin/check-auth.php` - Check authentication
  - `POST /api/admin/logout.php` - Logout

- **Dashboard:**
  - `GET /api/admin/dashboard.php` - Get dashboard statistics

- **Products:**
  - `GET /api/admin/products.php` - List products
  - `POST /api/admin/products.php` - Create product
  - `PUT /api/admin/products.php` - Update product
  - `DELETE /api/admin/products.php` - Delete product

- **Categories & Frameworks:**
  - `GET /api/admin/categories.php?type=category` - List categories
  - `GET /api/admin/categories.php?type=framework` - List frameworks
  - `POST /api/admin/categories.php` - Create category/framework
  - `PUT /api/admin/categories.php` - Update category/framework
  - `DELETE /api/admin/categories.php` - Delete category/framework

- **Users:**
  - `GET /api/admin/users.php` - List users
  - `POST /api/admin/users.php` - Create user
  - `PUT /api/admin/users.php` - Update user
  - `DELETE /api/admin/users.php` - Delete user

- **Blogs:**
  - `GET /api/admin/blogs.php` - List blogs
  - `GET /api/admin/blogs.php?id=1` - Get single blog
  - `POST /api/admin/blogs.php` - Create blog
  - `PUT /api/admin/blogs.php` - Update blog
  - `DELETE /api/admin/blogs.php` - Delete blog

- **Alerts:**
  - `GET /api/admin/alerts.php` - List alerts
  - `POST /api/admin/alerts.php` - Create alert
  - `PUT /api/admin/alerts.php` - Mark alert as read
  - `DELETE /api/admin/alerts.php` - Delete alert

### 5. Default Admin Credentials

- **Email:** admin@themehub.com
- **Password:** Admin@1437

### 6. CORS Configuration

The backend is configured to accept requests from `http://localhost:3000` (React frontend).

If your frontend runs on a different port, update `backend/config/cors.php`.

### 7. Testing

1. Start XAMPP (Apache and MySQL)
2. Start React frontend: `npm start`
3. Access admin login: http://localhost:3000/admin/login
4. Login with default credentials

### 8. File Access

Uploaded files are accessible via:
- Product images: `http://localhost/Frontend/backend/uploads/products/[filename]`
- Blog images: `http://localhost/Frontend/backend/uploads/blogs/[filename]`
- Product files: `http://localhost/Frontend/backend/uploads/products/[filename]`

## Notes

- All APIs require authentication (except login)
- Session-based authentication is used
- File uploads are limited to 40MB for zip files and 2MB for images
- All database operations use prepared statements to prevent SQL injection
