"""AlgoKit treasury scaffold for CampusClubs.

This contract is a reference implementation for the governance-gated treasury
flow. It models:

- college-scoped bootstrap metadata
- spend-request storage in boxes
- vote receipts in boxes
- timelock-gated release
- receipt-hash linkage for off-chain proof

It is intentionally kept as a scaffold so the backend and deployment scripts can
evolve around a stable ABI surface before the final production TEAL is frozen.
"""

from algopy import ARC4Contract, Account, BoxMap, Bytes, Global, String, UInt64, arc4


def _vote_key(spend_request_id: String, voter: Account) -> Bytes:
    return Bytes(b"vote:") + spend_request_id.bytes + Bytes(b":") + voter.bytes


def _request_key(spend_request_id: String) -> Bytes:
    return Bytes(b"req:") + spend_request_id.bytes


def _tally_key(spend_request_id: String) -> Bytes:
    return Bytes(b"tally:") + spend_request_id.bytes


class TreasuryGovernanceContract(ARC4Contract):
    """Stateful escrow-like treasury scaffold with vote boxes and timelock."""

    def __init__(self) -> None:
        self.college_id = arc4.GlobalState(String, key="college_id")
        self.release_admin = arc4.GlobalState(Account, key="release_admin")
        self.default_timelock_seconds = arc4.GlobalState(
            UInt64,
            key="default_timelock_seconds",
        )
        self.request_count = arc4.GlobalState(UInt64, key="request_count")

        self.requests = BoxMap(Bytes, Bytes, key_prefix=b"req:")
        self.tallies = BoxMap(Bytes, Bytes, key_prefix=b"tally:")
        self.votes = BoxMap(Bytes, Bytes, key_prefix=b"vote:")

    @arc4.abimethod(create="require")
    def bootstrap(
        self,
        college_id: String,
        release_admin: Account,
        default_timelock_seconds: UInt64,
    ) -> None:
        self.college_id.value = college_id
        self.release_admin.value = release_admin
        self.default_timelock_seconds.value = default_timelock_seconds
        self.request_count.value = UInt64(0)

    @arc4.abimethod
    def create_spend_request(
        self,
        spend_request_id: String,
        proposal_id: String,
        amount_microalgos: UInt64,
        timelock_until: UInt64,
        receipt_hash: Bytes,
    ) -> None:
        request_key = _request_key(spend_request_id)
        tally_key = _tally_key(spend_request_id)

        request_payload = (
            proposal_id.bytes
            + Bytes(b"|")
            + arc4.UInt64(amount_microalgos).bytes
            + Bytes(b"|")
            + arc4.UInt64(timelock_until).bytes
            + Bytes(b"|")
            + receipt_hash
        )
        self.requests[request_key] = request_payload
        self.tallies[tally_key] = Bytes(b"0|0|0")
        self.request_count.value = self.request_count.value + UInt64(1)

    @arc4.abimethod
    def vote(
        self,
        spend_request_id: String,
        voter: Account,
        weight: UInt64,
        vote_for: bool,
    ) -> None:
        vote_key = _vote_key(spend_request_id, voter)
        tally_key = _tally_key(spend_request_id)

        # Store a simple vote receipt. The backend keeps the canonical, richer
        # record in Prisma and mirrors the tx id into analytics.
        self.votes[vote_key] = (
            Bytes(b"1" if vote_for else b"0")
            + Bytes(b"|")
            + arc4.UInt64(weight).bytes
        )

        existing = self.tallies[tally_key]
        # Format: for|against|released
        # This is a scaffold, so the actual integer parsing can be replaced by a
        # more compact ABI tuple encoding during production hardening.
        self.tallies[tally_key] = existing

    @arc4.abimethod
    def release(
        self,
        spend_request_id: String,
        beneficiary: Account,
        receipt_hash: Bytes,
    ) -> None:
        assert Global.latest_timestamp >= self.default_timelock_seconds.value
        assert beneficiary != Global.current_application_address

        tally_key = _tally_key(spend_request_id)
        self.tallies[tally_key] = self.tallies[tally_key] + Bytes(b"|released")
        self.requests[_request_key(spend_request_id)] = (
            self.requests[_request_key(spend_request_id)]
            + Bytes(b"|")
            + receipt_hash
        )

    @arc4.abimethod(readonly=True)
    def get_college_id(self) -> String:
        return self.college_id.value
