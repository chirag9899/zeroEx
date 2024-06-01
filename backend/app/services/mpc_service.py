import pickle
import asyncio
from typing import Tuple, List
from tno.mpc.protocols.distributed_keygen import DistributedPaillier
from tno.mpc.encryption_schemes.paillier import PaillierCiphertext
from tno.mpc.communication import Pool
from tno.mpc.encryption_schemes.paillier.paillier import PaillierPublicKey
from tno.mpc.protocols.distributed_keygen.paillier_shared_key import PaillierSharedKey
import os

BASE_PORT = 8900
NR_PARTIES = 3
KEY_LENGTH = 128
PRIME_THRESHOLD = 2000
CORRUPTION_THRESHOLD = 1

async def setup(app):
    distributed_schemes = []
    pools = [None] * NR_PARTIES

    for party_number in range(NR_PARTIES):
        others = [
            ("localhost", BASE_PORT + i) for i in range(NR_PARTIES) if i != party_number
        ]
        server_port = BASE_PORT + party_number
        pool = setup_local_pool(server_port, others)
        pools[party_number] = pool

    distributed_schemes: Tuple[DistributedPaillier, ...] = tuple(
        await asyncio.gather(
            *[
                setup_distributed_scheme(
                    i,
                    pools[i]
                )
                for i in range(NR_PARTIES)
            ]
        )
    )
    app.state.distribute_scema = distributed_schemes
    return distributed_schemes

def setup_local_pool(server_port: int, others: List[Tuple[str, int]]) -> Pool:
    pool = Pool()
    pool.add_http_server(server_port)
    for client_ip, client_port in others:
        pool.add_http_client(
            f"client_{client_ip}_{client_port}", client_ip, client_port
        )
    return pool

async def setup_distributed_scheme(party_number, pool) -> DistributedPaillier:
    file_path = f"store/{party_number}.pkl"
    if os.path.exists(file_path):
        with open(file_path, 'rb') as f:
            data = pickle.load(f)
        paillier_public_key = PaillierPublicKey.deserialize(data['paillier']['pubkey'])
        paillier_shared_key = PaillierSharedKey.deserialize(data['paillier']['seckey'])
    else:
        # Initialize your distributed scheme with default values or generate new keys
        paillier_public_key = PaillierPublicKey()  # Replace with actual key generation
        paillier_shared_key = PaillierSharedKey()  # Replace with actual key generation
        # Save these keys to the file for future use
        with open(file_path, 'wb') as f:
            data = {
                'paillier': {
                    'pubkey': paillier_public_key.serialize(),
                    'seckey': paillier_shared_key.serialize()
                }
            }
            pickle.dump(data, f)

    (
        number_of_players,
        prime_length,
        prime_list,
        shamir_scheme,
        shares,
        other_parties,
    ) = DistributedPaillier.setup_input(pool, KEY_LENGTH, PRIME_THRESHOLD, CORRUPTION_THRESHOLD)

    index, party_indices, zero_share, session_id = await DistributedPaillier.setup_protocol(
        shamir_scheme, other_parties, pool
    )

    distributed_scheme = DistributedPaillier(
        paillier_public_key,
        paillier_shared_key,
        0,
        pool,
        index,
        party_indices,
        shares,
        session_id,
        False
    )
    return distributed_scheme

async def sum_encrypted_values(app,orders):
    distributed_schemes = app.state.distribute_scema
    ciphertext_sum = distributed_schemes[0].encrypt(0)

    for order in orders:
        ciphertext = PaillierCiphertext(int(order['encrypted_order_value']),distributed_schemes[0] )
        ciphertext_sum += ciphertext
    return ciphertext_sum

async def decrypt_all_orders(app,encrypted_vals):
    distributed_schemes = app.state.distribute_scema
    results = []
    for encrypted_val in encrypted_vals:
        dec = await asyncio.gather(
            *[
                distributed_schemes[i].decrypt(encrypted_val)
                for i in range(len(distributed_schemes))
            ]
        )
        results.append(dec[0])  # Assuming dec returns a list with a single element per scheme
    return results

async def calculate_cumulative_sums(app,orders):
    cumulative_sums = []
    sum_value = app.state.distribute_scema[0].encrypt(0)
    for order in orders:
        ciphertext = PaillierCiphertext(int(order['encrypted_order_value']), app.state.distribute_scema[0])
        sum_value += ciphertext
        cumulative_sums.append(sum_value)
    return cumulative_sums

async def binary_search_and_partial_decrypt(app,cumulative_sums, target_value, matched_orders, orders):
    low, high = 0, len(cumulative_sums) - 1

    while low < high:
        mid = (low + high) // 2
        difference = cumulative_sums[mid] - target_value
        decrypted_difference = await decrypt_all_orders(app,[difference])

        if decrypted_difference[0] < 0:
            low = mid + 1
        else:
            high = mid

    partial_matched_orders = orders[:low + 1]
    remaining_encrypted_value = cumulative_sums[low] - target_value

    for order in partial_matched_orders[:-1]:
        encrypted_order_value = PaillierCiphertext(int(order['encrypted_order_value']), app.state.distribute_scema[0])
        decrypted_order_value = await decrypt_all_orders(app,[encrypted_order_value])
        matched_orders.append({
            'user_address': order['user_address'],
            'trader_address': order['trader_address'],
            'sellToken': order['sellToken'],
            'buyToken': order['buyToken'],
            'encrypted_order_value': int(decrypted_order_value[0])  # Ensure serializable
        })

    partial_order = partial_matched_orders[-1]
    if remaining_encrypted_value != app.state.distribute_scema[0].encrypt(0):
        temp = target_value - cumulative_sums[low - 1]
        order = await decrypt_all_orders(app, [temp])

        matched_orders.append({
            'user_address': partial_order['user_address'],
            'trader_address': partial_order['trader_address'],
            'sellToken': partial_order['sellToken'],
            'buyToken': partial_order['buyToken'],
            'encrypted_order_value': int(order[0])
        })

        partial_order['encrypted_order_value'] = str(remaining_encrypted_value.get_value())
        orders.insert(0, partial_order)
    else:
        orders.pop(low)

    orders = orders[low + 1:]
    return matched_orders, orders
