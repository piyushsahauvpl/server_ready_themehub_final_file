# ✅ Pre-Deployment Verification Checklist

## Database Configuration ✓
- [ ] Database name: `bmcjatrn_uptula_theme_hub`
- [ ] Database user: `bmcjatrn_uptula_theme_hub`
- [ ] Database host: `localhost`
- [ ] Check `backend/config/database.php` for correct credentials
- [ ] Test database connection from localhost

## Razorpay Configuration ✓
- [ ] Using TEXT KEYS (test mode): ✅ rzp_test_SUdNz685HnllDx
- [ ] Key Secret updated: ✅ UWjbj2D5w0ruh9w0QC2Z303b
- [ ] Account number set: ✅ 2323230038852797
- [ ] Check `backend/config/razorpay.php`
- [ ] Test payment flow in test mode

## Production URL Configuration ✓
- [ ] Frontend URL: https://uptulathemehub.com
- [ ] API URL: https://uptulathemehub.com/backend/api
- [ ] Check `.env.production` file
- [ ] Confirm CORS origin in `backend/config/cors.php`

## Backend Files Updated ✓
- [ ] `backend/config/database.php` ✅ DONE
- [ ] `backend/config/razorpay.php` ✅ DONE
- [ ] `backend/config/cors.php` ✅ DONE
- [ ] `backend/api/login.php` ✅ DONE
- [ ] `backend/api/register.php` ✅ DONE
- [ ] `backend/api/create-order.php` ✅ DONE
- [ ] Other API files: Run `php backend/update-to-production.php`

## Frontend Configuration ✓
- [ ] `.env.production` created and configured
- [ ] `.env.development` created for local dev
- [ ] REACT_APP_API_URL set to: https://uptulathemehub.com/backend/api
- [ ] PUBLIC_URL set to: /

## React Build ✓
- [ ] Run `npm install` to ensure dependencies
- [ ] Run `npm run build` to create production build
- [ ] Verify `build/` directory created
- [ ] Check `build/index.html` exists
- [ ] Check `build/static/` directory has CSS and JS files

## Mobile Responsiveness ✓
- [ ] Blog page responsive on mobile (< 640px)
- [ ] Blog page responsive on tablet (640px - 1024px)
- [ ] Blog page responsive on desktop (> 1024px)
- [ ] All responsive CSS in `src/components/Blog.css`
- [ ] Tested banner looks good on mobile

## Security Headers ✓
- [ ] CORS restricted to: https://uptulathemehub.com
- [ ] X-Content-Type-Options: nosniff ✅
- [ ] X-Frame-Options: DENY ✅
- [ ] X-XSS-Protection: 1; mode=block ✅
- [ ] Referrer-Policy: strict-origin-when-cross-origin ✅
- [ ] SSL/HTTPS configured on server

## API Endpoints Testing ✓
- [ ] Test GET /backend/api/blogs.php (should work)
- [ ] Test GET /backend/api/products.php (should work)
- [ ] Test GET /backend/api/categories.php (should work)
- [ ] Test POST /backend/api/login.php (with test credentials)
- [ ] Test OPTIONS request (CORS preflight)

## File Structure on Production Server ✓
```
/public_html/ (or /httpdocs/)
├── index.html (from build/)
├── favicon.ico
├── static/
│   ├── css/
│   ├── js/
│   └── media/
├── backend/
│   ├── api/
│   ├── config/
│   ├── database/
│   ├── middleware/
│   ├── uploads/
│   ├── vendor/
│   └── ...
└── ...

Upload Permissions:
- [ ] /backend/uploads/ → 755 (writable)
- [ ] /backend/api/ → 755 (readable/executable)
- [ ] / → 755 (for build files)
```

## Database on Production Server ✓
- [ ] Database created: bmcjatrn_uptula_theme_hub
- [ ] Database user created with correct password
- [ ] Database schema imported (if available)
- [ ] Tables created (blogs, products, users, etc.)
- [ ] Test connection: `mysql -h localhost -u bmcjatrn_uptula_theme_hub -p`

## Deployment Process ✓
- [ ] Backed up current production files
- [ ] Updated all API files with production URLs
- [ ] Built React app: `npm run build`
- [ ] Uploaded `build/*` to web root
- [ ] Uploaded `backend/*` to /backend
- [ ] Set correct file permissions (755)
- [ ] Verified SSL/HTTPS working

## Post-Deployment Testing ✓
- [ ] Frontend loads at https://uptulathemehub.com
- [ ] Can navigate all pages
- [ ] Blog page loads and is responsive
- [ ] Can access products page
- [ ] Can perform login action
- [ ] Can perform registration action
- [ ] Razorpay payment test works
- [ ] API responses are correct JSON
- [ ] No CORS errors in browser console
- [ ] No 404 errors for static files
- [ ] Mobile version looks good

## Error Monitoring ✓
- [ ] Check server error logs: `/var/log/php-errors.log`
- [ ] Check application error logs
- [ ] Monitor database connection errors
- [ ] Check for any undefined API endpoints
- [ ] Review API response times

## Performance Verification ✓
- [ ] Frontend loads in < 3 seconds
- [ ] API responses in < 500ms
- [ ] Database queries efficient
- [ ] Images optimized and loading
- [ ] CSS/JS minified and compressed

## Go-Live Ready Checklist ✓
- [ ] All tests passed
- [ ] No errors in console or logs
- [ ] Database working correctly
- [ ] API responding to all endpoints
- [ ] Frontend fully functional
- [ ] Mobile responsive verified
- [ ] CORS working properly
- [ ] Security headers set
- [ ] Razorpay test keys active
- [ ] SSL certificate valid

## Future Tasks (After Go-Live)
- [ ] Monitor for 24 hours
- [ ] Collect user feedback
- [ ] When ready: Update to Razorpay LIVE keys
- [ ] Run performance optimization
- [ ] Set up automated backups
- [ ] Configure monitoring/alerting
- [ ] Document any custom changes

---

## Current Status Summary

### ✅ COMPLETED
- Production credentials configured
- Database config updated
- Razorpay test keys configured
- CORS origin updated
- Key API files updated
- Frontend environment files created
- Batch update script provided
- Deployment documentation created
- Mobile responsive design implemented

### 📝 TODO BEFORE UPLOAD
1. Run: `cd backend && php update-to-production.php`
2. Run: `npm run build`
3. Verify all files in checklist
4. Upload build/ to server
5. Upload backend/ to server
6. Set file permissions to 755
7. Verify all tests pass

### 🚀 READY FOR DEPLOYMENT
Once all items above are checked, your site is ready to go live!

---

**Date Prepared:** May 11, 2026
**Last Verified:** [Please update after testing]
**Deployment Date:** [To be filled]
**Deployed By:** [Your Name]
