import { ILogger, ITransportCommandAsync, TransportCommandAsyncHandler, TransportCommandHandler } from '@ts-core/common';
import { ISocketUser } from '../SocketServer';
import { TransportSocket } from './TransportSocket';
import * as _ from 'lodash';

export abstract class TransportSocketCommandAsyncHandler<U, V, C extends ITransportCommandAsync<U, V>> extends TransportCommandAsyncHandler<U, V, C, TransportSocket> {

    // --------------------------------------------------------------------------
    //
    //  Constructor
    //
    // --------------------------------------------------------------------------

    protected constructor(logger: ILogger, transport: TransportSocket, name: string) {
        super(logger, transport, name);
    }

    // --------------------------------------------------------------------------
    //
    //  Abstract Methods
    //
    // --------------------------------------------------------------------------

    protected abstract execute(request: U, user: ISocketUser): Promise<V>;
}
