from app.auth.password import hash_password, verify_password


def test_hash_password_returns_non_trivial_string():
    hashed = hash_password("CorrectHorse1!")
    assert hashed != "CorrectHorse1!"
    assert len(hashed) > 40


def test_verify_password_accepts_correct_password():
    hashed = hash_password("CorrectHorse1!")
    assert verify_password("CorrectHorse1!", hashed) is True


def test_verify_password_rejects_wrong_password():
    hashed = hash_password("CorrectHorse1!")
    assert verify_password("wrong", hashed) is False
