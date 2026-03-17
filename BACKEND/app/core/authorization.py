SUPERADMIN_EMAILS = {
    "angel@fraudai.com",
    "ivan@fraudai.com",
}


def is_superadmin_email(email: str | None) -> bool:
    if not email:
        return False
    return email.strip().lower() in SUPERADMIN_EMAILS