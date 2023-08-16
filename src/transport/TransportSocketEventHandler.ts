
import { ITransportEvent, ILogger, TransportEventHandler } from '@ts-core/common';
import { ISocketUser } from '../SocketServer';
import { TransportSocket } from './TransportSocket';
import * as _ from 'lodash';

export abstract class TransportSocketEventHandler<U, E extends ITransportEvent<U>> extends TransportEventHandler<U, E, TransportSocket> {
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

    protected abstract execute(request: U, user: ISocketUser): Promise<void>;
}
