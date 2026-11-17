class FakeSettingTypeStore:
    def __init__(self, setting_types=()):
        self._types = list(setting_types)

    def list_all(self):
        return sorted(self._types, key=lambda t: t.name)
