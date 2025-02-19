import { ILogger, LoggerWrapper } from '@ts-core/common';
import { TransportSocketUserId } from '@ts-core/socket-common';
import { Namespace, Socket } from 'socket.io';
import * as _ from 'lodash';

export abstract class SocketServer extends LoggerWrapper {

    // --------------------------------------------------------------------------
    //
    //  Properties
    //
    // --------------------------------------------------------------------------

    protected _namespace: Namespace;

    // --------------------------------------------------------------------------
    //
    //  Constructor
    //
    // --------------------------------------------------------------------------

    constructor(logger: ILogger) {
        super(logger);
    }

    // --------------------------------------------------------------------------
    //
    //  Protected Methods
    //
    // --------------------------------------------------------------------------

    protected clientEventListenersAdd(client: Socket): void { }

    protected clientEventListenersRemove(client: Socket): void { }

    protected async clientConnectionHandler(client: Socket): Promise<void> { }

    protected async clientDisconnectionHandler(client: Socket): Promise<void> { }

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
        this._namespace = null;
    }

    // --------------------------------------------------------------------------
    //
    //  Event Handlers
    //
    // --------------------------------------------------------------------------

    public afterInit(item: Namespace): void {
        this._namespace = item;
    }

    public handleConnection(client: Socket): void {
        this.clientConnectionHandler(client)
            .then(() => {
                this.clientEventListenersAdd(client);
            })
            .catch(error => {
                this.warn(`Connection rejected: ${error.toString()}`);
                client.disconnect(true);
            });
    }

    public handleDisconnect(client: Socket): void {
        this.clientDisconnectionHandler(client)
            .catch(error => {
                this.warn(`Connection rejected: ${error.toString()}`);
                client.disconnect(true);
            })
            .finally(() => {
                this.clientEventListenersRemove(client);
            });
    }

    public disconnect(client: Socket): void {
        client.disconnect(true);
    }

    // --------------------------------------------------------------------------
    //
    //  Public Properties
    //
    // --------------------------------------------------------------------------

    public get namespace(): Namespace {
        return this._namespace;
    }
}

export interface ISocketUser<U extends TransportSocketUserId = TransportSocketUserId> {
    userId?: U;
    clientId: string;
}

export type SocketClient = string | Socket;
