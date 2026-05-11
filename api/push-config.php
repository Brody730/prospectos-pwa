<?php
// api/push-config.php
// NO COMITEAR A GIT. Esta en --exclude del deploy script.

define('VAPID_PUBLIC_KEY',  'BDGF4Pt2ZiLeqCtnZuYbEO_QKQh7-EN04rF93cZlgr7gIm4iMZjwBYxHFe05pxxxNNdB_v-_DuWhkLLU27i4egY');
define('VAPID_PRIVATE_KEY', 'ngTW-7KefLGFezRf3nWpEgGbHfKMERU5oXoBvj9anUE');
define('VAPID_SUBJECT',     'mailto:chernandezzaragoza5@gmail.com');

// Credenciales BD (fallback CLI si DB_query del ERP no carga)
define('PWA_DB_HOST', 'localhost');
define('PWA_DB_USER', 'root');
define('PWA_DB_PASS', 'pr*mysql');
define('PWA_DB_NAME', 'erprogmai');
