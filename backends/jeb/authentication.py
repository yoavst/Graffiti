import os.path
from uuid import UUID

def _get_token_base_dir():
    return os.path.join(os.path.expanduser("~"), ".graffiti")

def _get_token_path():
    base_dir = _get_token_base_dir()
    if not os.path.exists(base_dir):
        os.makedirs(base_dir)
    return os.path.join(_get_token_base_dir(), "token")

def _validate_token(token):
    try:
        UUID(token, version=4)
        return True
    except ValueError:
        return False

def _get_token_from_file():
    if os.path.exists(_get_token_path()):
        with open(_get_token_path(), 'r') as f:
            token = f.read().strip()
            if not token:
                print("token file is empty!")
            elif not _validate_token(token):
                print("Token is not valid uuid v4: {}".format(token))
            else:
                return token
        
def _save_token_from_file(token):
    with open(_get_token_path(), 'w') as f:
        f.write(token)
        # 
def get_token_or_else(ask_for_token):
    token_from_file = _get_token_from_file()
    if token_from_file:
        return token_from_file
    
    input_token = ask_for_token()
    if input_token is None:
        print("Authentication canceled")
    elif not _validate_token(input_token):
        print("Token is not valid uuid v4: {}".format(input_token))
    else:
        _save_token_from_file(input_token)
        return input_token