#!/usr/bin/env php
<?php
/* ============================================================
   scripts/gen-vapid.php
   Genera un par de llaves VAPID (ECDSA P-256) y las imprime
   en formato base64url — listas para pegar en api/push-config.php.

   Uso:
     php scripts/gen-vapid.php

   Estrategia:
     1) Intenta openssl_pkey_new() de PHP (rapido).
     2) Si falla (Amazon Linux 2 con openssl.cnf faltante),
        hace fallback al binario `openssl` de la CLI y parsea
        `openssl ec -text -noout` para extraer X, Y, D.
   ============================================================ */

function b64url($bin) {
    return rtrim(strtr(base64_encode($bin), '+/', '-_'), '=');
}

function hex_limpiar($s) {
    // Quitar espacios, dos puntos, saltos de linea, tabs
    return preg_replace('/[^0-9a-fA-F]/', '', $s);
}

function hex_a_bin_32($hex) {
    $hex = hex_limpiar($hex);
    // Si viene impar (leading zero comido), rellenar
    if (strlen($hex) % 2 !== 0) $hex = '0' . $hex;
    $bin = hex2bin($hex);
    if ($bin === false) return false;
    // Padding a 32 bytes (P-256)
    if (strlen($bin) < 32) {
        $bin = str_repeat("\0", 32 - strlen($bin)) . $bin;
    } elseif (strlen($bin) > 32) {
        // Puede haber un leading 0x00 en ASN.1; tomar los ultimos 32
        $bin = substr($bin, -32);
    }
    return $bin;
}

/* =============================================================
   INTENTO 1: openssl_pkey_new()  (API nativa de PHP)
   ============================================================= */
$xBin = $yBin = $dBin = null;

if (function_exists('openssl_pkey_new')) {
    // Intentar silenciar los warnings si falla
    $prev = error_reporting(0);
    $res  = @openssl_pkey_new(array(
        'curve_name'       => 'prime256v1',
        'private_key_type' => OPENSSL_KEYTYPE_EC,
    ));
    error_reporting($prev);

    if ($res !== false) {
        $details = openssl_pkey_get_details($res);
        if ($details !== false
            && isset($details['ec']['x'])
            && isset($details['ec']['y'])
            && isset($details['ec']['d'])) {
            $xBin = str_pad($details['ec']['x'], 32, "\0", STR_PAD_LEFT);
            $yBin = str_pad($details['ec']['y'], 32, "\0", STR_PAD_LEFT);
            $dBin = str_pad($details['ec']['d'], 32, "\0", STR_PAD_LEFT);
            fwrite(STDERR, "[info] keypair generado via openssl_pkey_new()\n");
        }
    }
    // Limpiar mensajes de error residuales para que no ensucien stdout
    while (openssl_error_string() !== false) { /* drain */ }
}

/* =============================================================
   INTENTO 2: fallback a binario `openssl` via shell
   ============================================================= */
if ($xBin === null || $yBin === null || $dBin === null) {
    fwrite(STDERR, "[info] openssl_pkey_new fallo, usando binario openssl CLI\n");

    // Buscar openssl en PATH
    $openssl = trim((string)@shell_exec('command -v openssl 2>/dev/null'));
    if ($openssl === '') {
        fwrite(STDERR, "ERROR: no se encontro el binario 'openssl' en el PATH\n");
        exit(1);
    }

    $tmp  = tempnam(sys_get_temp_dir(), 'vapid_');
    $pem  = $tmp . '.pem';
    @unlink($tmp);

    // 1) Generar keypair EC P-256 en formato PEM
    $cmd1 = escapeshellarg($openssl) .
            ' ecparam -name prime256v1 -genkey -noout -out ' . escapeshellarg($pem) .
            ' 2>&1';
    $out1 = (string)shell_exec($cmd1);
    if (!file_exists($pem) || filesize($pem) === 0) {
        fwrite(STDERR, "ERROR generando PEM con openssl CLI:\n$out1\n");
        exit(1);
    }

    // 2) Extraer texto con X, Y, D
    $cmd2 = escapeshellarg($openssl) .
            ' ec -in ' . escapeshellarg($pem) .
            ' -text -noout 2>&1';
    $txt = (string)shell_exec($cmd2);
    @unlink($pem);

    if ($txt === '') {
        fwrite(STDERR, "ERROR leyendo PEM con openssl ec -text\n");
        exit(1);
    }

    /*
       Formato esperado:

         Private-Key: (256 bit)
         priv:
             aa:bb:cc:...:dd
         pub:
             04:xx:xx:...:yy
         ASN1 OID: prime256v1
         NIST CURVE: P-256
    */

    // Extraer priv
    if (!preg_match('/priv:\s*([0-9a-fA-F:\s\n]+?)(?:pub:|\Z)/s', $txt, $m)) {
        fwrite(STDERR, "ERROR: no pude extraer priv del output de openssl\n");
        fwrite(STDERR, $txt . "\n");
        exit(1);
    }
    $privHex = hex_limpiar($m[1]);

    // Extraer pub (empieza con 04 = uncompressed)
    if (!preg_match('/pub:\s*([0-9a-fA-F:\s\n]+?)(?:ASN1 OID|NIST|\Z)/s', $txt, $m)) {
        fwrite(STDERR, "ERROR: no pude extraer pub del output de openssl\n");
        fwrite(STDERR, $txt . "\n");
        exit(1);
    }
    $pubHex = hex_limpiar($m[1]);

    // pub debe medir 130 hex chars = 65 bytes (04 || X(32) || Y(32))
    if (strlen($pubHex) !== 130 || substr($pubHex, 0, 2) !== '04') {
        fwrite(STDERR, "ERROR: public key con formato inesperado (len=" . strlen($pubHex) . ")\n");
        exit(1);
    }
    $xHex = substr($pubHex, 2, 64);
    $yHex = substr($pubHex, 66, 64);

    $xBin = hex_a_bin_32($xHex);
    $yBin = hex_a_bin_32($yHex);
    $dBin = hex_a_bin_32($privHex);

    if (!$xBin || !$yBin || !$dBin) {
        fwrite(STDERR, "ERROR: conversion hex->bin fallo\n");
        exit(1);
    }
    fwrite(STDERR, "[info] keypair generado via openssl CLI ($openssl)\n");
}

/* =============================================================
   Codificar y mostrar
   ============================================================= */
$publicKeyBin = "\x04" . $xBin . $yBin;   // 65 bytes uncompressed
$privateKeyBin = $dBin;                    // 32 bytes

$publicB64  = b64url($publicKeyBin);
$privateB64 = b64url($privateKeyBin);

echo "\n";
echo "========================================================\n";
echo " VAPID Keys generadas - pega estas constantes en\n";
echo " api/push-config.php (crealo si no existe).\n";
echo "========================================================\n\n";

echo "<?php\n";
echo "// api/push-config.php\n";
echo "// NO COMITEAR A GIT. Esta en --exclude del deploy script.\n";
echo "\n";
echo "define('VAPID_PUBLIC_KEY',  '" . $publicB64  . "');\n";
echo "define('VAPID_PRIVATE_KEY', '" . $privateB64 . "');\n";
echo "define('VAPID_SUBJECT',     'mailto:chernandezzaragoza5@gmail.com');\n";
echo "\n";

echo "========================================================\n";
echo " Listo. Publica el archivo en:\n";
echo "   /var/www/html/prospectos/api/push-config.php\n";
echo " (chmod 640, chown apache:apache)\n";
echo "========================================================\n";
