import { toBuffer } from './utils';
import { BaseTransaction } from './transaction/baseTransaction';

function commonPrepare(
    target: string,
    network: string,
    contract: Uint8Array | string,
    method: string,
    args: any,
): BaseTransaction {
    const tx = new BaseTransaction();
    tx.data.accountId = target;
    tx.data.genNonce();
    tx.data.networkName = network;
    tx.data.setSmartContractHash(contract);
    tx.data.smartContractMethod = method;
    tx.data.smartContractMethodArgs = args;
    return tx;
}

interface IAssetInitArgs {
    /** Asset name. */
    name: string;
    /** Asset description. */
    description: string;
    /** Creator's URL. */
    url: string;
    /** Max mintable units. */
    max_units: number; // eslint-disable-line camelcase
    /** Authorized accounts */
    authorized: string[];
}

interface IAssetTransferArgs {
    /** Source account ID. */
    from: string;
    /** Desctination account ID. */
    to: string;
    /** Units of asset to transfer */
    units: number;
}

interface IAssetMintArgs {
    /** Destination account ID. */
    to: string;
    /** Units of asset to mint on destination account. */
    units: number;
}

interface IAssetBurnArgs {
    /** Source account ID. */
    from: string;
    /** Units of asset to burn from source account. */
    units: number;
}

type TLockType = 0 | 1 | 2 | 3;

interface IAssetLockArgs {
    /** Asset's account ID. */
    to: string;
    /** Lock level */
    lock: TLockType
}

interface IServiceContractRegistration {
    /** Smart Contract name. */
    name: string;
    /** Smart contract description. */
    description: string;
    /** Smart contract version */
    version: string;
    /** Publisher's URL. */
    url: string;
    /** Smart contract bytes. */
    bin: Uint8Array;
}

interface IServiceGetContractInformationArgs {
    /** Smart Contract hash. */
    contract: string;
}

interface IServiceAssetRegistrationArgs {
    /** Asset's account ID. */
    id: string;
    /** Asset name */
    name: string;
    /** Creator's URL */
    url: string;
    /** Asset's smart contract hash */
    contract: Uint8Array | string;
}

interface IServiceAssetInformationArgs {
    /** Asset's account ID. */
    asset_id: string; // eslint-disable-line camelcase
}

interface IServiceAliasArgs {
    /** Alias string. */
    alias: string;
}

interface IServiceOracleRegistrationArgs {
    /** Oracle ID */
    id: string;
    /** Oracle name */
    name: string;
    /** Oracle description */
    description: string;
    /** Oracle URL */
    url: string;
    /** Oracle smart contract */
    contract: Uint8Array | string;
}

interface IServiceOracleInformationArgs {
    /** Oracle ID */
    oracle_id: string; // eslint-disable-line camelcase
}

interface IStorageStoreDataArgs {
    /** Data will be retrievable under this key */
    key: string;
    /** Data array of bytes */
    data: Uint8Array;
}

interface IStorageLoadDataArgs {
    /** Data key */
    key: string;
}

interface IStorageRemoveDataArgs {
    /** Data key */
    key: string;
}

interface IStorageTransferArgs {
    /** Destination account ID */
    to: string;
    /** Account ID of the transfered asset */
    asset: string;
    /** Transfer amount */
    units: number;
}

interface IStorageBalanceArgs {
    /** Asset account ID */
    asset: string;
}

interface IEscrowInitArgs {
    /** asset account ID */
    asset: string;
    /** Guarantor account ID */
    guarantor: string;
    /** Customer account Id */
    customer: string;
    /** Merchants account IDs with corresponding amounts */
    merchants: {
        [key: string]: number;
    };
}
interface IEscrowBalanceArgs {
    /** Asset account ID to get the balance of */
    asset: string;
}

type TEscrowStatus = 'OK' | 'KO';
interface IEscrowUpdateArgs {
    /** New escrow status */
    status: TEscrowStatus;
}

/** Interfaces to prepare some standard utility transactions. */
export namespace stdTxPrepareUnsigned {
    export namespace asset {
        export function init(
            target: string,
            network: string,
            contract: Uint8Array | string,
            args: IAssetInitArgs,
        ) {
            return commonPrepare(target, network, contract, 'init', args);
        }

        export function stats(
            target: string,
            network: string,
        ) {
            return commonPrepare(target, network, '', 'stats', {});
        }

        export function balance(
            target: string,
            network: string,
        ) {
            return commonPrepare(target, network, '', 'balance', {});
        }

        export function mint(
            target: string,
            network: string,
            args: IAssetMintArgs,
        ) {
            return commonPrepare(target, network, '', 'mint', args);
        }

        export function burn(
            target: string,
            network: string,
            args: IAssetBurnArgs,
        ) {
            return commonPrepare(target, network, '', 'burn', args);
        }

        export function transfer(
            target: string,
            network: string,
            args: IAssetTransferArgs,
        ) {
            return commonPrepare(target, network, '', 'transfer', args);
        }

        export function lock(
            target: string,
            network: string,
            args : IAssetLockArgs,
        ) {
            return commonPrepare(target, network, '', 'lock', args);
        }
    }

    export namespace service {
        export function contract_registration( // eslint-disable-line camelcase
            target: string,
            network: string,
            args: IServiceContractRegistration,
        ) {
            return commonPrepare(target, network, '', 'contract_registration', {
                name: args.name,
                description: args.description,
                version: args.version,
                url: args.url,
                bin: Buffer.from(args.bin),
            });
        }

        export function get_contract_information( // eslint-disable-line camelcase
            target: string,
            network: string,
            args: IServiceGetContractInformationArgs,
        ) {
            return commonPrepare(target, network, '', 'get_contract_information', args);
        }

        export function asset_registration( // eslint-disable-line camelcase
            target: string,
            network: string,
            args: IServiceAssetRegistrationArgs,
        ) {
            const tempArgs = args;
            tempArgs.contract = toBuffer(args.contract);
            return commonPrepare(target, network, '', 'asset_registration', tempArgs);
        }
        export function get_asset_information( // eslint-disable-line camelcase
            target: string,
            network: string,
            args: IServiceAssetInformationArgs,
        ) {
            return commonPrepare(target, network, '', 'get_asset_information', args);
        }

        export function alias_registration( // eslint-disable-line camelcase
            target: string,
            network: string,
            args: IServiceAliasArgs,
        ) {
            return commonPrepare(target, network, '', 'alias_registration', args);
        }

        export function alias_lookup( // eslint-disable-line camelcase
            target: string,
            network: string,
            args: IServiceAliasArgs,
        ) {
            return commonPrepare(target, network, '', 'alias_lookup', args);
        }

        export function alias_deletion( // eslint-disable-line camelcase
            target: string,
            network: string,
            args: IServiceAliasArgs,
        ) {
            return commonPrepare(target, network, '', 'alias_deletion', args);
        }

        export function oracle_registration( // eslint-disable-line camelcase
            target: string,
            network: string,
            args: IServiceOracleRegistrationArgs,
        ) {
            const tempArgs = args;
            tempArgs.contract = toBuffer(args.contract);
            return commonPrepare(target, network, '', 'oracle_registration', args);
        }

        export function get_oracle_information( // eslint-disable-line camelcase
            target: string,
            network: string,
            args: IServiceOracleInformationArgs,
        ) {
            return commonPrepare(target, network, '', 'get_oracle_information', args);
        }
    }

    export namespace storage {
        export function store_data( // eslint-disable-line camelcase
            target: string,
            network: string,
            contract: Uint8Array | string,
            args: IStorageStoreDataArgs,
        ) {
            const tempArgs = args;
            tempArgs.data = toBuffer(args.data);
            return commonPrepare(target, network, contract, 'store_data', tempArgs);
        }

        export function load_data( // eslint-disable-line camelcase
            target: string,
            network: string,
            args: IStorageLoadDataArgs,
        ) {
            return commonPrepare(target, network, '', 'load_data', args);
        }

        export function remove_data( // eslint-disable-line camelcase
            target: string,
            network: string,
            args: IStorageRemoveDataArgs,
        ) {
            return commonPrepare(target, network, '', 'remove_data', args);
        }

        export function transfer( // eslint-disable-line camelcase
            target: string,
            network: string,
            args: IStorageTransferArgs,
        ) {
            return commonPrepare(target, network, '', 'transfer', args);
        }

        export function balance( // eslint-disable-line camelcase
            target: string,
            network: string,
            contract: Uint8Array | string,
            args: IStorageBalanceArgs,
        ) {
            return commonPrepare(target, network, '', 'balance', args);
        }
    }

    export namespace escrow {
        export function init(
            target: string,
            network: string,
            contract: Uint8Array | string,
            args: IEscrowInitArgs,
        ) {
            return commonPrepare(target, network, contract, 'init', args);
        }

        export function get_info( // eslint-disable-line camelcase
            target: string,
            network: string,
        ) {
            return commonPrepare(target, network, '', 'get_info', {});
        }

        export function balance(
            target: string,
            network: string,
            args: IEscrowBalanceArgs,
        ) {
            return commonPrepare(target, network, '', 'balance', args);
        }

        export function update(
            target: string,
            network: string,
            args: IEscrowUpdateArgs,
        ) {
            return commonPrepare(target, network, '', 'update', args);
        }
    }
}
