import { ExtendedError, Logger, UnreachableStatementError } from "@ts-core/common";
import { TransportSocketRoomCommand, ITransportSocketRoomDto, TransportSocketUserId, TransportSocketRoomAction } from "@ts-core/socket-common";
import { TransportSocketCommandHandler } from "../TransportSocketCommandHandler";
import { TransportSocket } from "../TransportSocket";
import { ISocketUser } from "../../SocketServer";
import { TransportSocketServer } from "../TransportSocketServer";

export class TransportSocketRoomHandler<T = string> extends TransportSocketCommandHandler<ITransportSocketRoomDto<T>, TransportSocketRoomCommand<T>> {
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
    //  Public Methods
    //
    // --------------------------------------------------------------------------

    public async execute(params: ITransportSocketRoomDto<T>, user: ISocketUser<TransportSocketUserId>): Promise<void> {
        let name = params.name.toString();
        if (TransportSocketServer.isUserRoom(name)) {
            throw new ExtendedError(`Forbidden "${name}" room`);
        }

        let clientId = user.clientId;
        switch (params.action) {
            case TransportSocketRoomAction.ADD:
                await this.transport.socket.addClientToRoom(clientId, name);
                break;
            case TransportSocketRoomAction.REMOVE:
                await this.transport.socket.removeClientFromRoom(clientId, name);
                break;
            default:
                throw new UnreachableStatementError(params.action);
        }
    }
}