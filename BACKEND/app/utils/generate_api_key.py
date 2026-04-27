import hashlib

api_key = "libros_book"

# api_key = "Prueba_Comercio_2"

key_hash = hashlib.sha256(api_key.encode()).hexdigest()

print(key_hash)