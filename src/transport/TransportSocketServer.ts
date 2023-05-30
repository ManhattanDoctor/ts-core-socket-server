
import { Logger, ObservableData } from '@ts-core/common';
import { ITransportSocketRequestPayload, TransportSocketRequestPayload, ITransportSocketResponsePayload, TRANSPORT_SOCKET_CONNECTED_EVENT, TRANSPORT_SOCKET_COMMAND_REQUEST_METHOD, TRANSPORT_SOCKET_COMMAND_RESPONSE_METHOD } from '@ts-core/socket-common';
import { Subject, filter, map, Observable } from 'rxjs';
import { Namespace, Socket } from 'socket.io';
import { SocketServer } from '../SocketServer';
import * as _ from 'lodash';

export abstract class TransportSocketServer<U = any, V = any> extends SocketServer {
    
    // --------------------------------------------------------------------------
    //
    //  Properties
    //
    // --------------------------------------------------------------------------

    protected observer: Subject<ObservableData<U | TransportSocketServerEvent, V | TransportSocketServerEventData>>;

    // --------------------------------------------------------------------------
    //
    //  Constructor
    //
    // --------------------------------------------------------------------------

    constructor(logger: Logger) {
        super(logger);
        this.observer = new Subject();
    }

    // --------------------------------------------------------------------------
    //
    //  Protected Methods
    //
    // --------------------------------------------------------------------------

    protected async clientHandshake(client: Socket): Promise<void> {
        let userId = client.data.userId = await this.getClientUserId(client);
        await client.join(this.getUserRoom(userId));
        client.emit(TRANSPORT_SOCKET_CONNECTED_EVENT);
    }

    protected clientEventListenersAdd(client: Socket): void {
        client.on(TRANSPORT_SOCKET_COMMAND_REQUEST_METHOD, item => this.transportCommandRequestHandler(client, item));
        client.on(TRANSPORT_SOCKET_COMMAND_RESPONSE_METHOD, item => this.transportCommandResponseHandler(client, item));
    }

    protected clientEventListenersRemove(client: Socket): void {
        client.removeAllListeners(TRANSPORT_SOCKET_COMMAND_REQUEST_METHOD);
        client.removeAllListeners(TRANSPORT_SOCKET_COMMAND_RESPONSE_METHOD);
    }

    // --------------------------------------------------------------------------
    //
    //  Client Methods
    //
    // --------------------------------------------------------------------------

    protected async getClients(userId?: string, isOnlyOne?: boolean): Promise<Set<string>> {
        let items = !_.isNil(userId) ? await this.namespace.to(this.getUserRoom(userId)).allSockets() : await this.namespace.allSockets();
        return !isOnlyOne ? items : new Set<string>([items.values().next().value]);
    }

    protected getUserRoom(id: string): string {
        return `user${id}`;
    }

    protected abstract getClientUserId(client: Socket): Promise<string>;

    // --------------------------------------------------------------------------
    //
    //  Event Handlers
    //
    // --------------------------------------------------------------------------

    public async afterInit(item: Namespace): Promise<void> {
        await super.afterInit(item);
        this.log(`Transport socket opened on namespace "${item.name}"`);
    }

    protected async clientConnectionHandler(client: Socket): Promise<void> {
        await super.clientConnectionHandler(client);
        await this.clientHandshake(client);
    }

    protected transportCommandRequestHandler(client: Socket, item: ITransportSocketRequestPayload): void {
        if (_.isNil(item) || _.isNil(item.id)) {
            return;
        }
        TransportSocketRequestPayload.setDefaultOptions(item);
        item.options.userId = client.data.userId;
        item.options.clientId = client.id;
        this.observer.next(new ObservableData(TransportSocketServerEvent.TRANSPORT_COMMAND_REQUEST, item));
    }

    protected transportCommandResponseHandler(client: Socket, item: ITransportSocketResponsePayload): void {
        if (_.isNil(item) || _.isNil(item.id)) {
            return;
        }
        item.userId = client.data.userId;
        item.clientId = client.id;
        this.observer.next(new ObservableData(TransportSocketServerEvent.TRANSPORT_COMMAND_RESPONSE, item));
    }

    // --------------------------------------------------------------------------
    //
    //  Public Methods
    //
    // --------------------------------------------------------------------------

    public async emitToUser<T>(name: string, data: T, userId: string, isOnlyOne?: boolean): Promise<void> {
        let items = await this.getClients(userId, isOnlyOne);
        items.forEach(item => this.emitToClient(name, data, item));
    }

    public async emitToClient<T>(name: string, data: T, clientId: string): Promise<void> {
        let client = this.namespace.sockets.get(clientId);
        if (!_.isNil(client)) {
            client.emit(name, data);
        }
    }

    public destroy(): void {
        if (this.isDestroyed) {
            return;
        }
        super.destroy();
        this.observer.complete();
        this.observer = null;
    }

    // --------------------------------------------------------------------------
    //
    //  Event Handlers
    //
    // --------------------------------------------------------------------------

    public get events(): Observable<ObservableData<U | TransportSocketServerEvent, V | TransportSocketServerEventData>> {
        return this.observer.asObservable();
    }

    public get request(): Observable<ITransportSocketRequestPayload> {
        return this.events.pipe(
            filter(item => item.type === TransportSocketServerEvent.TRANSPORT_COMMAND_REQUEST),
            map(item => item.data as ITransportSocketRequestPayload)
        );
    }

    public get response(): Observable<ITransportSocketResponsePayload> {
        return this.events.pipe(
            filter(item => item.type === TransportSocketServerEvent.TRANSPORT_COMMAND_RESPONSE),
            map(item => item.data as ITransportSocketResponsePayload)
        );
    }
}

export interface ITransportSocketServer {
    get sent(): Observable<ITransportSocketRequestPayload>;
    get received(): Observable<ITransportSocketResponsePayload>;
}

export type TransportSocketServerEventData = ITransportSocketRequestPayload | ITransportSocketResponsePayload;

export enum TransportSocketServerEvent {
    TRANSPORT_COMMAND_REQUEST = 'TRANSPORT_COMMAND_REQUEST',
    TRANSPORT_COMMAND_RESPONSE = 'TRANSPORT_COMMAND_RESPONSE',
}
