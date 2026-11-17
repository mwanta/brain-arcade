class FakeCognitiveDomainStore:
    def __init__(self, domains=()):
        self._domains = list(domains)

    def list_all(self):
        return sorted(self._domains, key=lambda d: d.name)
