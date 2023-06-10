import * as _ from 'lodash';
import { ExtendedError, ILogger, ITransportCommand, ITransportCommandAsync, ITransportEvent, ITransportSettings } from '@ts-core/common';
import { takeUntil } from 'rxjs';
import { TransportSocketImpl, ITransportSocketCommandOptions, TRANSPORT_SOCKET_COMMAND_RESPONSE_METHOD, TRANSPORT_SOCKET_COMMAND_REQUEST_METHOD, ITransportSocketEventOptions, ITransportSocketCommandRequest, TRANSPORT_SOCKET_EVENT } from '@ts-core/socket-common';
import { TransportSocketServer } from './TransportSocketServer';

export class TransportSocket<S extends TransportSocketServer = TransportSocketServer> extends TransportSocketImpl {
    // --------------------------------------------------------------------------
    //
    //  Properties
    //
    // --------------------------------------------------------------------------

    protected _socket: S;

    // --------------------------------------------------------------------------
    //
    //  Constructor
    //
    // --------------------------------------------------------------------------

    constructor(logger: ILogger, settings: ITransportSettings, socket: S) {
        super(logger, settings);

        this._socket = socket;
        this.socket.evented.pipe(takeUntil(this.destroyed)).subscribe(this.requestEventReceived);
        this.socket.requested.pipe(takeUntil(this.destroyed)).subscribe(this.responseRequestReceived);
        this.socket.responsed.pipe(takeUntil(this.destroyed)).subscribe(this.requestResponseReceived);
    }

    // --------------------------------------------------------------------------
    //
    //  Protected Methods
    //
    // --------------------------------------------------------------------------

    protected async eventRequestExecute<U>(event: ITransportEvent<U>, options?: ITransportSocketEventOptions): Promise<void> {
        try {
            if (!_.isNil(options.userId)) {
                await this.socket.emitToUser(TRANSPORT_SOCKET_EVENT, event, options.userId, options.isOnlyOne);
            }
            else if (!_.isNil(options.clientId)) {
                await this.socket.emitToClient(TRANSPORT_SOCKET_EVENT, event, options.clientId);
            }
            else if (!_.isNil(options.room)) {
                await this.socket.emitToRoom(TRANSPORT_SOCKET_EVENT, event, options.room);
            }
            else {
                throw new ExtendedError(`Command options "userId" or "clientId" must be not nil`);
            }
        }
        catch (error) {
            this.eventRequestErrorCatch(event, options, error);
        }
    }

    protected async commandRequestExecute<U>(command: ITransportCommand<U>, options: ITransportSocketCommandOptions, isNeedReply: boolean): Promise<void> {
        let payload = this.createRequestPayload(command, options, isNeedReply);
        try {
            if (!_.isNil(options.userId)) {
                await this.socket.emitToUser(TRANSPORT_SOCKET_COMMAND_REQUEST_METHOD, payload, options.userId, options.isOnlyOne);
            }
            else if (!_.isNil(options.clientId)) {
                await this.socket.emitToClient(TRANSPORT_SOCKET_COMMAND_REQUEST_METHOD, payload, options.clientId);
            }
            else if (!_.isNil(options.room)) {
                await this.socket.emitToRoom(TRANSPORT_SOCKET_COMMAND_REQUEST_METHOD, payload, options.room);
            }
            else {
                throw new ExtendedError(`Command options "userId" or "clientId" must be not nil`);
            }
        }
        catch (error) {
            this.commandRequestErrorCatch(command, options, isNeedReply, error);
        }
    }

    protected async commandResponseExecute<U, V>(command: ITransportCommandAsync<U, V>, request: ITransportSocketCommandRequest): Promise<void> {
        let payload = this.createResponsePayload(command, request);
        try {
            if (!_.isNil(request.clientId)) {
                await this.socket.emitToClient(TRANSPORT_SOCKET_COMMAND_RESPONSE_METHOD, payload, request.clientId);
            }
            else {
                throw new ExtendedError(`Command request "clientId" must be not nil`);
            }
        }
        catch (error) {
            this.commandResponseErrorCatch(command, request, error);
        }
    }

    protected async commandResponseDispatch<U>(command: ITransportCommand<U>, options: ITransportSocketCommandOptions, isNeedReply: boolean): Promise<void> {
        command['userId'] = options.userId;
        command['clientId'] = options.clientId;
        return super.commandResponseRequestDispatch(command, options, isNeedReply);
    }

    // --------------------------------------------------------------------------
    //
    //  Public Methods
    //
    // --------------------------------------------------------------------------

    public destroy(): void {
        if (this.isDestroyed) {
            return;
        }
        super.destroy();
        this._socket = null;
    }

    // --------------------------------------------------------------------------
    //
    //  Public Properties
    //
    // --------------------------------------------------------------------------

    public get socket(): S {
        return this._socket;
    }
}
