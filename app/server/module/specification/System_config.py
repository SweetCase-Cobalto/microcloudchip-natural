import json
import sys
import os

# Exception import
from module.MicrocloudchipException.exceptions \
    import MicrocloudchipSystemConfigFileNotFoundError, \
    MicrocloudchipSystemConfigFileParsingError


class SystemConfig:
    """
        System 작동을 위한 Config 데이터가 들어가 있는
        객체
    """

    INTERNAL: str = "sqlite"
    MYSQL: str = "mysql"

    system_root: str
    system_port: int
    admin_email: str
    rdbms_type: str

    def __new__(cls, config_root: str = "server/config.json"):
        # Singletone 기법으로 작동한다.
        if not hasattr(cls, 'system_config_instance'):
            cls.system_config_instance = super(SystemConfig, cls).__new__(cls)
        return cls.system_config_instance

    def __init__(self, config_root: str = "server/config.json"):
        """
            config_root: config.json File root
        """
        try:
            with open(config_root) as f:
                _j = json.load(f)
                config_raw_data = _j['system']
                admin_data = _j['admin']
                database_data = _j['database']

            # Get Data
            system_root = config_raw_data['root']
            system_port = config_raw_data['port']
            self.rdbms_type = database_data['rdbms']['type']

            # 유효성 확인
            # system_root

            # OS에 따라 Root 형식이 다르다
            # 테스트는 windows 기준으로 한다.
            splited_system_root = \
                system_root.split('\\') if sys.platform == 'win32' else system_root.split('/')

            # Root checking
            # is string?
            if not isinstance(system_root, str):
                raise MicrocloudchipSystemConfigFileParsingError("system root must be string")

            # 끝부분이 microcloudchip 인 지 검토
            # 디렉토리가 맞는 지 검토
            if splited_system_root[-1] != 'microcloudchip' or \
                    not os.path.isdir(system_root):
                raise MicrocloudchipSystemConfigFileParsingError("invalid root")

            # Port Checking
            if not isinstance(system_port, int):
                raise MicrocloudchipSystemConfigFileParsingError("port must be integer")
            if not 1023 < system_port < 49152:
                raise MicrocloudchipSystemConfigFileParsingError("this port is not available")

            # Set config data
            self.system_root = system_root
            self.system_port = system_port
            self.admin_email = admin_data['email']
        except FileNotFoundError:
            # 파일 못찾음
            raise MicrocloudchipSystemConfigFileNotFoundError()
        except KeyError as e:
            omitted_key = e.args[0]
            raise MicrocloudchipSystemConfigFileParsingError(f"Config is omitted -> {omitted_key}")

    def get_system_root(self):
        return self.system_root

    def get_system_port(self):
        return self.system_port

    def get_admin_eamil(self):
        return self.admin_email
