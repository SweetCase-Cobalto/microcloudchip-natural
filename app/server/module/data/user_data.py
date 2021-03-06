import shutil
from typing import List, Final

from module.data.microcloudchip_data import MicrocloudchipData
import os
from module.MicrocloudchipException.exceptions import *
from module.manager.internal_database_concurrency_manager import InternalDatabaseConcurrencyManager
from module.specification.System_config import SystemConfig
import app.models as model
from module.validator.user_validator import UserValidator
from django.core.exceptions import ValidationError


class UserData(MicrocloudchipData):
    # system root

    ICON_AVILABLE_EXTENSIONS: Final[List[str]] = ["jpg", "png"]
    system_root: str

    # Shared ID
    static_id: str
    user_name: str
    email: str
    password: str
    volume_type: str
    is_admin: bool

    # User Icon
    has_icon: bool
    icon_url: str

    def __init__(self, static_id: str = None, email: str = None, system_root: str = None):
        self.static_id = static_id
        self.email = email
        self.system_root = system_root

    def __get_asset_root(self) -> str:
        # Return: is_exist, real_file_root
        return os.path.join(self.system_root, "storage", self.static_id, "asset")

    @InternalDatabaseConcurrencyManager(SystemConfig()).manage_internal_transaction
    def __call__(self):
        if not self.static_id and not self.email:
            raise MicrocloudchipDataFormatNotCalled("need email and static id")

        if self.static_id:
            try:
                # Get User Data from Database
                data = model.User.objects.get(static_id=self.static_id)
            except model.User.DoesNotExist:
                # Not Found
                raise MicrocloudchipUserDoesNotExistError("User Is Not exist")
        else:
            try:
                data = model.User.objects.get(email=self.email)
            except model.User.DoesNotExist:
                raise MicrocloudchipUserDoesNotExistError("User Is Not exist")

        # set data
        self.static_id = data.static_id
        self.user_name = data.name
        self.email = data.email
        self.password = data.pswd
        self.is_admin = data.is_admin
        self.volume_type = data.volume_type

        self.is_called = True

        # Get Image
        asset_root: str = self.__get_asset_root()
        asset_list = os.listdir(asset_root)
        if 'user.jpg' in asset_list or 'user.png' in asset_list:
            # Find icon image
            self.has_icon = True
            self.icon_url = f"/server/user/download/icon/{self.static_id}"
        else:
            # Not Found
            self.has_icon = False
            self.icon_url = None

        return self

    @InternalDatabaseConcurrencyManager(SystemConfig()).manage_internal_transaction
    def update(self,
               new_name: str = None,
               new_password: str = None,
               new_volume_type: str = None,
               will_change_image: bool = False,
               img_extension: str = None,
               img_raw_data: bytes = None):

        # DB ??????????????? ?????? Model ??????
        raw_data: model.User = model.User.objects.get(static_id=self.static_id)

        try:
            # Checking username
            if new_name:
                try:
                    UserValidator.validate_name(new_name)
                except ValidationError:
                    raise MicrocloudchipUserInformationValidateError("name invalidate")

                # ????????? admin?????? ?????? ??? ??????
                if new_name == "admin" and self.user_name != "admin":
                    raise MicrocloudchipAuthAccessError("do not update user name to admin")
                raw_data.name = new_name

            # Checking password
            if new_password:
                try:
                    UserValidator.validate_password(new_password)
                except ValidationError:
                    raise MicrocloudchipUserInformationValidateError("password validate")
                raw_data.pswd = new_password

            # Checking Volume Type
            if new_volume_type:
                try:
                    UserValidator.validate_volume_type_by_string(new_volume_type)
                except ValidationError:
                    raise MicrocloudchipUserInformationValidateError("volumetype validate error")

                raw_data.volume_type = new_volume_type

        except MicrocloudchipException as e:
            raise e

        if will_change_image:
            # ???????????? ?????? ??????
            asset_root: str = self.__get_asset_root()

            # ????????? ??????????????? ?????? ???????????? ???????????? ????????? ??????
            # ????????? ????????????
            if not img_extension or not img_raw_data:

                if self.has_icon:
                    jpg_root = os.path.join(asset_root, "user.jpg")
                    png_root = os.path.join(asset_root, "user.png")

                    if os.path.isfile(jpg_root):
                        os.remove(jpg_root)
                    if os.path.isfile(png_root):
                        os.remove(png_root)
                else:
                    raise MicrocloudchipUserInformationValidateError("Try removed but aleady removed")

            elif img_extension and img_raw_data:
                img_extension = img_extension.lower()
                # ????????? ?????? ????????? ??????
                if img_extension not in self.ICON_AVILABLE_EXTENSIONS:
                    raise MicrocloudchipUserInformationValidateError("This is not image file")

                # ????????? ?????? ??????
                if self.has_icon:
                    # ?????? ????????? ?????????
                    os.remove(os.path.join(asset_root, f"user.{self.icon_url.split('.')[-1]}"))

                with open(os.path.join(asset_root, f"user.{img_extension}"), 'wb') as _f:
                    _f.write(img_raw_data)

        # DB ??????
        raw_data.save()

    @InternalDatabaseConcurrencyManager(SystemConfig()).manage_internal_transaction
    def remove(self):

        try:
            raw_data: model.User = model.User.objects.get(static_id=self.static_id)
        except model.User.DoesNotExist:
            self.is_called = False
            raise MicrocloudchipUserDoesNotExistError("User Not Exist")
        else:
            raw_data.delete()
            # Remove user Root
            user_root = os.path.join(self.system_root, "storage", self.static_id)
            shutil.rmtree(user_root)
            self.is_called = False
