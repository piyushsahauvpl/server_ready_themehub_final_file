import pymysql

conn = pymysql.connect(host='127.0.0.1', user='root', password='', db='themehub_db', charset='utf8mb4', cursorclass=pymysql.cursors.DictCursor)
with conn:
    with conn.cursor() as cur:
        cur.execute("SELECT id,email,full_name,role,password FROM users WHERE email IN ('rabi@gmail.com','biju@gmail.com','jaga@gmail.com','support@test.com') LIMIT 5")
        rows = cur.fetchall()
        for row in rows:
            print(row)
