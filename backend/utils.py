import random
import string

def generate_otp_token(length=6):
    """Generate a random OTP token consisting of uppercase letters and digits."""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))