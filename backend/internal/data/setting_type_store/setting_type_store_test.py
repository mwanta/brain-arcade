from internal.data.setting_type_store import SettingTypeStore


def test_list_all_from_seed(db):
    by_name = {t.name: t for t in SettingTypeStore(db).list_all()}
    assert by_name["max_errors"].unit == "errors" and by_name["time_limit"].unit == "ms"
