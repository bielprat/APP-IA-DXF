# Certificats addicionals per a la construcció d'imatges

Si la xarxa on es construeixen les imatges Docker passa per un proxy corporatiu que
intercepta TLS, copia aquí el certificat arrel del proxy en format PEM amb extensió `.crt`.

Només s'utilitza durant la construcció (descàrrega de paquets npm i PyPI). Els fitxers
`.crt` d'aquesta carpeta no es pugen mai al repositori.
