<?php
/* ============================================================
   lib/WebPushLite.php
   Web Push LITE — envia "push vacio" (sin payload encriptado)
   para despertar al service worker, que luego hace fetch a
   api/push-pull.php para obtener el contenido real.

   Por que lite:
   - Web Push con payload requiere ECDH P-256 + HKDF + AES-128-GCM.
     Son ~300 lineas de PHP y propensas a bugs sutiles.
   - El patron "push vacio + pull" es soportado por TODOS los
     push services (FCM, Mozilla, Apple), es usado por Mastodon,
     GitHub, etc., y mantiene el cifrado end-to-end para el
     payload real porque viaja por HTTPS a tu propio servidor.

   Requiere:
   - PHP 7.1+
   - extension openssl
   - VAPID keys en api/push-config.php
   ============================================================ */

class WebPushLite {

    private $publicKey;     // base64url
    private $privateKey;    // base64url
    private $subject;       // mailto:...

    public function __construct($publicKey, $privateKey, $subject) {
        $this->publicKey  = $publicKey;
        $this->privateKey = $privateKey;
        $this->subject    = $subject;
    }

    /* =========================================================
       Base64 URL-safe sin padding
       ========================================================= */
    public static function b64url($bin) {
        return rtrim(strtr(base64_encode($bin), '+/', '-_'), '=');
    }

    public static function b64urlDecode($str) {
        $pad = strlen($str) % 4;
        if ($pad) { $str .= str_repeat('=', 4 - $pad); }
        return base64_decode(strtr($str, '-_', '+/'));
    }

    /* =========================================================
       Firmar un JWT VAPID (alg=ES256)
       ========================================================= */
    public function firmarJWT($audience, $expEnSegundos = 43200 /* 12h */) {
        // Header
        $header = array('typ' => 'JWT', 'alg' => 'ES256');
        $headerB64 = self::b64url(json_encode($header));

        // Payload
        $payload = array(
            'aud' => $audience,
            'exp' => time() + $expEnSegundos,
            'sub' => $this->subject
        );
        $payloadB64 = self::b64url(json_encode($payload));

        $signingInput = $headerB64 . '.' . $payloadB64;

        // Firmar con ES256 (ECDSA P-256 + SHA-256)
        $privateKeyPem = $this->privateKeyToPem();
        $pkey = openssl_pkey_get_private($privateKeyPem);
        if ($pkey === false) {
            throw new Exception('No se pudo cargar private key: ' . openssl_error_string());
        }

        $signatureDer = '';
        $ok = openssl_sign($signingInput, $signatureDer, $pkey, 'sha256');
        if (!$ok) {
            throw new Exception('openssl_sign fallo: ' . openssl_error_string());
        }
        if (PHP_MAJOR_VERSION < 8) { openssl_free_key($pkey); }

        // OpenSSL devuelve firma DER — necesitamos "raw" (R || S, 64 bytes)
        $signatureRaw = $this->derToRaw($signatureDer);
        $signatureB64 = self::b64url($signatureRaw);

        return $signingInput . '.' . $signatureB64;
    }

    /* =========================================================
       Enviar push vacio a un endpoint
       Devuelve array con:
         - ok          : true/false
         - http_code   : codigo HTTP
         - expired     : true si 404/410 (hay que borrar la sub)
         - error       : mensaje curl si lo hubo
       ========================================================= */
    public function enviarPush($endpoint, $ttl = 86400) {
        // 1. Audience = scheme://host del endpoint
        $parts = parse_url($endpoint);
        if (!$parts || !isset($parts['scheme']) || !isset($parts['host'])) {
            return array('ok' => false, 'http_code' => 0, 'expired' => false,
                         'error' => 'endpoint invalido');
        }
        $audience = $parts['scheme'] . '://' . $parts['host'];

        // 2. Firmar JWT VAPID
        try {
            $jwt = $this->firmarJWT($audience);
        } catch (Exception $e) {
            return array('ok' => false, 'http_code' => 0, 'expired' => false,
                         'error' => 'jwt: ' . $e->getMessage());
        }

        // 3. Headers segun draft-ietf-webpush-vapid-02 (el formato vigente)
        $headers = array(
            'Authorization: vapid t=' . $jwt . ', k=' . $this->publicKey,
            'TTL: ' . intval($ttl),
            'Content-Length: 0',
        );

        // 4. POST vacio al endpoint
        $ch = curl_init($endpoint);
        curl_setopt_array($ch, array(
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => '',
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT        => 10,
            CURLOPT_SSL_VERIFYPEER => true,
        ));
        $resp     = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr  = curl_error($ch);
        curl_close($ch);

        if ($resp === false) {
            return array('ok' => false, 'http_code' => 0, 'expired' => false,
                         'error' => 'curl: ' . $curlErr);
        }

        $expired = ($httpCode === 404 || $httpCode === 410);
        $ok      = ($httpCode >= 200 && $httpCode < 300);

        return array(
            'ok'        => $ok,
            'http_code' => $httpCode,
            'expired'   => $expired,
            'error'     => $ok ? '' : ('http ' . $httpCode . ': ' . substr($resp, 0, 200))
        );
    }

    /* =========================================================
       Convertir private key base64url (32 bytes raw) a PEM
       para que openssl_pkey_get_private pueda leerla.
       ========================================================= */
    private function privateKeyToPem() {
        $privateBin = self::b64urlDecode($this->privateKey);
        if (strlen($privateBin) !== 32) {
            throw new Exception('Private key debe ser 32 bytes (got ' . strlen($privateBin) . ')');
        }
        $publicBin = self::b64urlDecode($this->publicKey);
        if (strlen($publicBin) !== 65) {
            throw new Exception('Public key debe ser 65 bytes (got ' . strlen($publicBin) . ')');
        }

        // Construir DER ECPrivateKey (RFC 5915) con parameters y publicKey:
        //   SEQUENCE {
        //     INTEGER 1,
        //     OCTET STRING (32 bytes privateKey),
        //     [0] OID prime256v1 (1.2.840.10045.3.1.7),
        //     [1] BIT STRING publicKey (0x04 || X || Y)
        //   }
        // OID prime256v1: 06 08 2A 86 48 CE 3D 03 01 07
        $oidP256 = "\x06\x08\x2A\x86\x48\xCE\x3D\x03\x01\x07";
        $params  = "\xA0" . $this->derLen(strlen($oidP256)) . $oidP256;

        $bitString = "\x00" . $publicBin;
        $bitStringWrapped = "\x03" . $this->derLen(strlen($bitString)) . $bitString;
        $pubWrapped = "\xA1" . $this->derLen(strlen($bitStringWrapped)) . $bitStringWrapped;

        $version    = "\x02\x01\x01";
        $privOctets = "\x04\x20" . $privateBin;

        $seqBody = $version . $privOctets . $params . $pubWrapped;
        $der     = "\x30" . $this->derLen(strlen($seqBody)) . $seqBody;

        $pem  = "-----BEGIN EC PRIVATE KEY-----\n";
        $pem .= chunk_split(base64_encode($der), 64, "\n");
        $pem .= "-----END EC PRIVATE KEY-----\n";

        return $pem;
    }

    private function derLen($n) {
        if ($n < 0x80) return chr($n);
        if ($n < 0x100) return "\x81" . chr($n);
        return "\x82" . chr(($n >> 8) & 0xFF) . chr($n & 0xFF);
    }

    /* =========================================================
       Convertir firma DER (secuencia de dos INTEGERs R,S) a
       formato RAW concatenado (R || S, 64 bytes total).
       ========================================================= */
    private function derToRaw($der) {
        // DER: 30 LEN 02 LR R 02 LS S
        $offset = 2; // salta 30 LEN
        if (ord($der[1]) & 0x80) {
            $offset += (ord($der[1]) & 0x7F);
        }
        // R
        if ($der[$offset] !== "\x02") {
            throw new Exception('DER signature invalida (no INTEGER en R)');
        }
        $offset++;
        $rLen = ord($der[$offset]); $offset++;
        $r = substr($der, $offset, $rLen); $offset += $rLen;
        // S
        if ($der[$offset] !== "\x02") {
            throw new Exception('DER signature invalida (no INTEGER en S)');
        }
        $offset++;
        $sLen = ord($der[$offset]); $offset++;
        $s = substr($der, $offset, $sLen);

        // Quitar byte 0x00 de padding si INTEGER era negativo
        if (strlen($r) === 33 && $r[0] === "\x00") $r = substr($r, 1);
        if (strlen($s) === 33 && $s[0] === "\x00") $s = substr($s, 1);

        // Rellenar a 32 bytes
        $r = str_pad($r, 32, "\x00", STR_PAD_LEFT);
        $s = str_pad($s, 32, "\x00", STR_PAD_LEFT);

        return $r . $s;
    }
}
