# ThemeHub Admin Panel - Complete Setup Guide

## Prerequisites
- XAMPP installed and running
- Node.js and npm installed
- React development environment set up

## Step 1: Database Setup

1. **Start XAMPP Services:**
   - Open XAMPP Control Panel
   - Start Apache
   - Start MySQL

2. **Create Database:**
   - Open phpMyAdmin: http://localhost/phpmyadmin
   - Click on "Import" tab
   - Choose file: `backend/database/schema.sql`
   - Click "Go"
   
   OR via command line:
   ```bash
   mysql -u root -p < backend/database/schema.sql
   ```

3. **Verify Database:**
   - Check that `themehub_db` database exists
   - Verify tables: admins, categories, frameworks, products, users, blogs, orders, alerts

## Step 2: Backend Configuration

1. **Update Database Credentials (if needed):**
   - Edit `backend/config/database.php`
   - Update DB_USER, DB_PASS if your MySQL has different credentials

2. **Verify File Upload Directories:**
   - `backend/uploads/products/` - Will be created automatically
   - `backend/uploads/blogs/` - Will be created automatically

## Step 3: Frontend Configuration

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Set API URL (Optional):**
   - Create `.env` file in project root:
   ```
   REACT_APP_API_URL=http://localhost/Frontend/backend/api/admin
   ```
   - Or the default will be used automatically

3. **Start React Development Server:**
   ```bash
   npm start
   ```

## Step 4: Access Admin Panel

1. **Open Browser:**
   - Navigate to: http://localhost:3000/admin/login

2. **Login Credentials:**
   - **Email:** admin@themehub.com
   - **Password:** Admin@1437

## Step 5: Test Features

### 1. Login System
- ✅ Login at http://localhost:3000/admin/login
- ✅ Use credentials: admin@themehub.com / Admin@1437

### 2. Dashboard
- ✅ View statistics from database
- ✅ Charts show real data

### 3. Add Product
- ✅ Go to http://localhost:3000/admin/add-product
- ✅ Upload theme image, zip file
- ✅ Fill in all details
- ✅ Submit and verify in products list

### 4. Categories Management
- ✅ Go to http://localhost:3000/admin/categories
- ✅ Add/Edit/Delete categories
- ✅ Add/Edit/Delete frameworks

### 5. Products List
- ✅ Go to http://localhost:3000/admin/products
- ✅ View all uploaded products
- ✅ Edit/Delete products

### 6. Add User
- ✅ Go to http://localhost:3000/admin/add-user
- ✅ Create users with different roles
- ✅ Verify in user list

### 7. User List
- ✅ Go to http://localhost:3000/admin/user-list
- ✅ View all users
- ✅ Block/Unblock users
- ✅ Delete users

### 8. Add Blog
- ✅ Go to http://localhost:3000/admin/add-blog
- ✅ Upload blog image
- ✅ Add title and content
- ✅ Submit blog

### 9. Blogs List
- ✅ Go to http://localhost:3000/admin/blogs
- ✅ View all blogs
- ✅ Edit/Delete blogs

## API Endpoints Reference

All APIs are located at: `http://localhost/Frontend/backend/api/admin/`

### Authentication
- `POST /login.php` - Admin login
- `GET /check-auth.php` - Check if authenticated
- `POST /logout.php` - Logout

### Dashboard
- `GET /dashboard.php` - Get statistics

### Products
- `GET /products.php` - List all products
- `POST /products.php` - Create product (multipart/form-data)
- `PUT /products.php` - Update product (JSON)
- `DELETE /products.php` - Delete product (JSON)

### Categories & Frameworks
- `GET /categories.php?type=category` - List categories
- `GET /categories.php?type=framework` - List frameworks
- `POST /categories.php` - Create category/framework (JSON)
- `PUT /categories.php` - Update category/framework (JSON)
- `DELETE /categories.php` - Delete category/framework (JSON)

### Users
- `GET /users.php` - List all users
- `POST /users.php` - Create user (JSON)
- `PUT /users.php` - Update user (JSON)
- `DELETE /users.php` - Delete user (JSON)

### Blogs
- `GET /blogs.php` - List all blogs
- `GET /blogs.php?id=1` - Get single blog
- `POST /blogs.php` - Create blog (multipart/form-data)
- `PUT /blogs.php` - Update blog (JSON)
- `DELETE /blogs.php` - Delete blog (JSON)

### Alerts
- `GET /alerts.php` - List all alerts
- `POST /alerts.php` - Create alert (JSON)
- `PUT /alerts.php` - Mark as read (JSON)
- `DELETE /alerts.php` - Delete alert (JSON)

## Troubleshooting

### Database Connection Error
- Check MySQL is running in XAMPP
- Verify database credentials in `backend/config/database.php`
- Ensure database `themehub_db` exists

### CORS Errors
- Verify backend `.htaccess` file exists
- Check `backend/config/cors.php` allows your frontend URL
- Ensure Apache mod_headers is enabled

### File Upload Issues
- Check `backend/uploads/` directories have write permissions
- Verify PHP upload_max_filesize and post_max_size in php.ini
- Check file size limits (images: 2MB, zip: 40MB)

### Session Issues
- Ensure PHP sessions are enabled
- Check session.save_path in php.ini
- Clear browser cookies and try again

### API Not Found
- Verify Apache is running
- Check file paths are correct
- Ensure `.htaccess` files are in place

## File Structure

```
Frontend/
├── backend/
│   ├── api/
│   │   └── admin/
│   │       ├── login.php
│   │       ├── dashboard.php
│   │       ├── products.php
│   │       ├── categories.php
│   │       ├── users.php
│   │       ├── blogs.php
│   │       └── alerts.php
│   ├── config/
│   │   ├── database.php
│   │   └── cors.php
│   ├── database/
│   │   └── schema.sql
│   └── uploads/
│       ├── products/
│       └── blogs/
└── src/
    └── admin/
        ├── Auth/
        ├── Products/
        ├── Users/
        ├── Blog/
        └── components/
```

## Notes

- All APIs use session-based authentication
- File uploads are stored in `backend/uploads/`
- Database uses prepared statements for security
- Default admin password is hashed using PHP password_hash()

## Support

If you encounter any issues:
1. Check browser console for errors
2. Check Apache error logs
3. Verify database connection
4. Ensure all file permissions are correct
