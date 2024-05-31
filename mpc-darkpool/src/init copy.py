import argparse
import asyncio
from typing import List, Tuple
import pickle 

from tno.mpc.communication import Pool

from tno.mpc.protocols.distributed_keygen import DistributedPaillier
import json

corruption_threshold = 1  # corruption threshold
key_length = 128  # bit length of private key
prime_thresh = 2000  # threshold for primality check
correct_param_biprime = 40  # correctness parameter for biprimality test
stat_sec_shamir = (
    40  # statistical security parameter for secret sharing over the integers
)


def setup_local_pool(server_port: int, ports: List[int]) -> Pool:
    pool = Pool()
    pool.add_http_server(server_port)
    for client_port in (port for port in ports if port != server_port):
        pool.add_http_client(f"client{client_port}", "localhost", client_port)
    return pool



# REGION EXAMPLE SETUP
# this region contains code that is used for the toy example, but can be deleted when the `others`
# variable underneath the region is set to the proper values.

parser = argparse.ArgumentParser(description="Set the parameters to run the protocol.")

parser.add_argument(
    "--party",
    type=int,
    help="Identifier for this party. This should be different for all scripts but should be in the "
    "set [0, ..., nr_of_parties - 1].",
)

parser.add_argument(
    "--nr_of_parties",
    type=int,
    help="Total number of parties involved. This should be the same for all scripts.",
)

parser.add_argument(
    "--base-port",
    type=int,
    default=8888,
    help="port first player used for communication, incremented for other players"
)

args = parser.parse_args()
party_number = args.party
nr_of_parties = args.nr_of_parties

base_port = args.base_port
# ENDREGION

# Change this to the ips and server ports of the other machines
others = [
    ("localhost", base_port + i) for i in range(nr_of_parties) if i != party_number
]

# Change this to the port you want this machine to listen on (note that this should correspond
# to the port of this party in the scripts on the other machines)
# server_port = base_port + party_number
# pool = setup_local_pool(server_port, others)
local_ports = [3000 + i for i in range(nr_of_parties)]
local_pools = [
    setup_local_pool(server_port, local_ports) for server_port in local_ports
]
loop = asyncio.get_event_loop()

async_coroutines = [
    DistributedPaillier.from_security_parameter(
        pool,
        corruption_threshold,
        key_length,
        prime_thresh,
        correct_param_biprime,
        stat_sec_shamir,
        distributed=False,
    )
    for pool in local_pools
]
print("Starting distributed key generation protocol.")
distributed_paillier_schemes = loop.run_until_complete(
    asyncio.gather(*async_coroutines)
)
# protocol_coroutine = DistributedPaillier.from_security_parameter(
#     pool,
#     corruption_threshold,
#     key_length,
#     prime_thresh,
#     correct_param_biprime,
#     stat_sec_shamir,
#     distributed=True,
# )
# distributed_paillier_scheme = loop.run_until_complete(protocol_coroutine)
print(distributed_paillier_schemes[0].public_key.serialize())
with open('src/store/publickey.json', 'w') as f:
    json.dump(distributed_paillier_schemes[0].public_key.serialize(), f)
# print(distributed_paillier_scheme.serialize_with_secret_key())
# daa = DistributedPaillier.serialize_with_secret_key(distributed_paillier_scheme)
# print(daa)
# print(type(daa))

for party_number in range(nr_of_parties):

# for distributed_paillier_scheme in distributed_paillier_schemes[0]:
    distributed_paillier_scheme = distributed_paillier_schemes[party_number]
    with open(f"src/store/{party_number}.pkl", 'wb') as file: 
        
        # A new file will be created 
        pickle.dump(distributed_paillier_scheme.serialize_with_secret_key(), file) 
# async def fnn():
        
#     # The assumption here is that this code is placed inside an async method
#     ciphertext = distributed_paillier_scheme.encrypt(42)          # encryption of 42
#     # await distributed_paillier_scheme.pool.send("party2", ciphertext, msg_id="step1")  # send the ciphertext to party 2

#     # final_ciphertext = await distributed_paillier_scheme.recv("party3", msg_id="step3")  # receive the ciphertext from party 3

#     # # all parties need to participate in the decryption protocol
#     # plaintext = await distributed_paillier_scheme.decrypt(final_ciphertext)
#     # assert plaintext == 426

#     # # alternative decryption of which the shares (and result) are only obtained by party 2
#     # # note: even though we do not receive the result, we are required to participate
#     # await distributed_paillier_scheme.decrypt(final_ciphertext, receivers=["party2"])
    
# dd = loop.run_until_complete(fnn)
