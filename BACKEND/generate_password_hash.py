#!/usr/bin/env python3
"""
Script to generate Argon2 password hashes for test users in auth_users table.
"""

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHash

def generate_hash(password: str) -> str:
    """Generate Argon2 hash for password."""
    ph = PasswordHasher()
    return ph.hash(password)

def verify_hash(password: str, hash_value: str) -> bool:
    """Verify password against hash."""
    ph = PasswordHasher()
    try:
        ph.verify(hash_value, password)
        return True
    except:
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("ARGON2 PASSWORD HASH GENERATOR FOR auth_users TABLE")
    print("=" * 60)
    print()
    
    while True:
        password = input("Enter password (or 'quit' to exit): ").strip()
        
        if password.lower() == 'quit':
            break
        
        if len(password) < 8:
            print("❌ Password must be at least 8 characters long\n")
            continue
        
        if not any(c.isdigit() for c in password):
            print("❌ Password must contain at least one number\n")
            continue
        
        if not any(c.isalpha() for c in password):
            print("❌ Password must contain at least one letter\n")
            continue
        
        try:
            hash_value = generate_hash(password)
            print(f"\n✅ Hash generated successfully:")
            print(f"   Password: {password}")
            print(f"   Hash: {hash_value}\n")
            
            # Verify it works
            if verify_hash(password, hash_value):
                print("✅ Hash verified successfully\n")
            else:
                print("❌ Hash verification failed\n")
        except Exception as e:
            print(f"❌ Error generating hash: {e}\n")
