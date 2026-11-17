from internal.data.cognitive_domain_store import CognitiveDomainStore


def test_list_all_from_seed(db):
    names = [d.name for d in CognitiveDomainStore(db).list_all()]
    assert {"memory", "attention"} <= set(names) and names == sorted(names)
