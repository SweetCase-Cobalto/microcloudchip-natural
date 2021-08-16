import os

from module.MicrocloudchipException.exceptions import MicrocloudchipDirectoryAlreadyExistError, \
    MicrocloudchipDirectoryNotFoundError
from module.data_builder.storage_builder import StorageBuilder


class DirectoryBuilder(StorageBuilder):
    """
        디렉토리 생성 및 삭제 Builder
    """

    def is_all_have(self) -> bool:
        if not self.system_root or not self.target_root or \
                not self.TOKEN or not self.author_static_id:
            return False
        return True

    def save(self):
        try:
            full_root = self.get_full_root()
        except ValueError as e:
            raise e
        if os.path.isdir(full_root):
            # 이미 존재한 경우
            raise MicrocloudchipDirectoryAlreadyExistError(f"Directory {self.target_root} already exist")
        else:
            # 이전 디렉토리가 이미 존재하는 지 체크해야 한다.
            # 없으면 생성 불가
            slash_idx = -1
            for i in range(len(full_root) - 1, -1, -1):
                if full_root[i] == self.TOKEN:
                    slash_idx = i
                    break
            if not os.path.isdir(full_root[:slash_idx]):
                raise MicrocloudchipDirectoryNotFoundError(f"Prev Directory for add new directory does not exist: "
                                                           f"{full_root[:slash_idx]}")

            os.mkdir(full_root)