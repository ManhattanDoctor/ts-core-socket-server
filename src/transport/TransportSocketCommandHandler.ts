import { ILogger, ITransportCommand, TransportCommandHandler } from '@ts-core/common';
import { ISocketUser } from '../SocketServer';
import { TransportSocket } from './TransportSocket';
import * as _ from 'lodash';

export abstract class TransportSocketCommandHandler<U, C extends ITransportCommand<U>, V = void> extends TransportCommandHandler<U, C, V, TransportSocket> {

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
