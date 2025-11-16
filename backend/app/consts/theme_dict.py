from enum import IntEnum


class ThemeEnum(IntEnum):
    GAMING = 1
    MUSIC = 2
    JUST_CHATTING = 3

    @classmethod
    def to_dict(cls):
        return {theme.name.lower(): theme.value for theme in cls}

    @classmethod
    def to_list(cls):
        return [(role.name.lower(), role.value) for role in cls]
