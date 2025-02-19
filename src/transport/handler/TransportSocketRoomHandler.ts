import { ExtendedError, Logger, UnreachableStatementError } from "@ts-core/common";
import { TransportSocketRoomCommand, ITransportSocketRoomDto, TransportSocketUserId, TransportSocketRoomAction } from "@ts-core/socket-common";
import { TransportSocketCommandAsyncHandler } from "../TransportSocketCommandAsyncHandler";
import { TransportSocket } from "../TransportSocket";
import { ISocketUser } from "../../SocketServer";
import { TransportSocketServer } from "../TransportSocketServer";

export class TransportSocketRoomHandler extends TransportSocketCommandAsyncHandler<ITransportSocketRoomDto, string, TransportSocketRoomCommand> {
    // --------------------------------------------------------------------------
    //
    //  Constructor
    //
    // --------------------------------------------------------------------------

    constructor(logger: Logger, transport: TransportSocket) {
        super(logger, transport, TransportSocketRoomCommand.NAME);
    }

    // --------------------------------------------------------------------------
    //
    //  Protected Methods
    //
    // --------------------------------------------------------------------------

    protected async check(name: string, user: ISocketUser<TransportSocketUserId>, action: TransportSocketRoomAction): Promise<void> {
        if (TransportSocketServer.isUserRoom(name)) {
            throw new ExtendedError(`Forbidden "${name}" room`);
        }
    }

    // --------------------------------------------------------------------------
    //
    //  Public Methods
    //
    // --------------------------------------------------------------------------

    public async execute(params: ITransportSocketRoomDto, user: ISocketUser<TransportSocketUserId>): Promise<string> {
        let { clientId } = user;
        let { name, action } = params;
        await this.check(name, user, params.action);

        switch (action) {
            case TransportSocketRoomAction.ADD:
                return this.transport.socket.addClientToRoom(clientId, name);
            case TransportSocketRoomAction.REMOVE:
                return this.transport.socket.removeClientFromRoom(clientId, name);
            default:
                throw new UnreachableStatementError(action);
        }
    }
}