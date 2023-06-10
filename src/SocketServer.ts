import { ILogger, LoggerWrapper } from '@ts-core/common';
import { Namespace, Socket } from 'socket.io';
import * as _ from 'lodash';
import { TransportSocketUserId } from '@ts-core/socket-common';

// import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
// implements OnGatewayInit<Namespace>, OnGatewayConnection, OnGatewayDisconnect {
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

    public async afterInit(item: Namespace): Promise<void> {
        this._namespace = item;
    }

    public async handleConnection(client: Socket): Promise<void> {
        try {
            await this.clientConnectionHandler(client);
            this.clientEventListenersAdd(client);
        }
        catch (error) {
            this.warn(`Connection rejected: ${error.toString()}`);
            client.disconnect(true);
        }
    }

    public async handleDisconnect(client: Socket): Promise<void> {
        try {
            await this.clientDisconnectionHandler(client);
        }
        catch (error) {
            client.disconnect(true);
        }
        finally {
            this.clientEventListenersRemove(client);
        }
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
