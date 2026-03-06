import base64
import hashlib
import hmac
import os


def hash_password(password: str) -> str:
    if not password:
        raise ValueError('Password must not be empty')

    salt = os.urandom(16)
    digest = hashlib.scrypt(password.encode('utf-8'), salt=salt, n=16384, r=8, p=1)
    return 'scrypt$16384$8$1$' + base64.b64encode(salt).decode('ascii') + '$' + base64.b64encode(digest).decode('ascii')


def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, n, r, p, salt_b64, digest_b64 = encoded.split('$', 5)
        if algorithm != 'scrypt':
            return False

        salt = base64.b64decode(salt_b64.encode('ascii'))
        expected = base64.b64decode(digest_b64.encode('ascii'))
        actual = hashlib.scrypt(
            password.encode('utf-8'),
            salt=salt,
            n=int(n),
            r=int(r),
            p=int(p),
        )
        return hmac.compare_digest(actual, expected)
    except Exception:
        return False
