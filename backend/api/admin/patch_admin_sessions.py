from pathlib import Path
import re

root = Path(__file__).resolve().parent
skip = {'login.php','logout.php','check-auth.php','wallet-summary.php','patch_admin_sessions.py'}
pattern_simple = re.compile(r'(?m)^(?P<indent>\s*)session_start\(\);\s*$')
pattern_cond = re.compile(r'(?m)^(?P<indent>\s*)if \(session_status\(\) === PHP_SESSION_NONE\) session_start\(\);\s*$')

replacement = r"\g<indent>session_name('ADMINSESSID');\n\g<indent>session_set_cookie_params([\n\g<indent>    'lifetime' => 0,\n\g<indent>    'path' => '/',\n\g<indent>    'domain' => '',\n\g<indent>    'secure' => true,\n\g<indent>    'httponly' => true,\n\g<indent>    'samesite' => 'Lax'\n\g<indent>]);\n\g<indent>session_start();"
replacement_cond = r"\g<indent>session_name('ADMINSESSID');\n\g<indent>session_set_cookie_params([\n\g<indent>    'lifetime' => 0,\n\g<indent>    'path' => '/',\n\g<indent>    'domain' => '',\n\g<indent>    'secure' => true,\n\g<indent>    'httponly' => true,\n\g<indent>    'samesite' => 'Lax'\n\g<indent>]);\n\g<indent>if (session_status() === PHP_SESSION_NONE) {\n\g<indent>    session_start();\n\g<indent>}"

for path in sorted(root.glob('*.php')):
    if path.name in skip:
        continue
    text = path.read_text(encoding='utf-8')
    if "session_name('ADMINSESSID')" in text:
        print(f'Skipping {path.name} (already has ADMINSESSID)')
        continue
    new_text = pattern_cond.sub(replacement_cond, text)
    new_text = pattern_simple.sub(replacement, new_text)
    if new_text != text:
        path.write_text(new_text, encoding='utf-8')
        print(f'Updated {path.name}')
    else:
        print(f'No replace needed for {path.name}')
