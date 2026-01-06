# @ts-core/socket-server

Серверная библиотека для работы с WebSocket через Socket.IO. Предоставляет абстракции для управления подключениями клиентов, обработки команд и событий, работы с комнатами и пользователями.

## Установка

```bash
npm install @ts-core/socket-server
```

## Зависимости

- `@ts-core/socket-common` — общие классы и интерфейсы
- `socket.io` — сервер Socket.IO

## Основные классы

### SocketServer

Базовый абстрактный класс для создания сокет-сервера:

```typescript
import { SocketServer } from '@ts-core/socket-server';
import { ILogger } from '@ts-core/common';
import { Socket, Namespace } from 'socket.io';

class MySocketServer extends SocketServer {
    constructor(logger: ILogger) {
        super(logger);
    }

    protected async clientConnectionHandler(client: Socket): Promise<void> {
        console.log('Client connected:', client.id);
    }

    protected async clientDisconnectionHandler(client: Socket): Promise<void> {
        console.log('Client disconnected:', client.id);
    }

    protected clientEventListenersAdd(client: Socket): void {
        client.on('message', (data) => this.handleMessage(client, data));
    }

    protected clientEventListenersRemove(client: Socket): void {
        client.removeAllListeners('message');
    }

    private handleMessage(client: Socket, data: any): void {
        console.log('Message from', client.id, ':', data);
    }
}
```

### TransportSocketServer

Расширенный сервер с поддержкой транспортных команд, событий и управления пользователями:

```typescript
import { TransportSocketServer } from '@ts-core/socket-server';
import { TransportSocketUserId } from '@ts-core/socket-common';
import { Socket } from 'socket.io';

class MyTransportServer extends TransportSocketServer {
    constructor(logger: ILogger) {
        super(logger);
    }

    protected async getClientUserId(client: Socket): Promise<TransportSocketUserId> {
        // Извлечение userId из handshake (токен, сессия и т.д.)
        const token = client.handshake.auth.token;
        const user = await this.validateToken(token);
        return user.id;
    }
}
```

## Работа с событиями

### Подписка на события через RxJS

```typescript
const server = new MyTransportServer(logger);

// Подписка на транспортные события от клиентов
server.evented.subscribe((event) => {
    console.log('Event:', event.uid, event.data);
    console.log('From user:', event['userId']);
    console.log('From client:', event['clientId']);
});

// Подписка на запросы команд
server.requested.subscribe((request) => {
    console.log('Command request:', request.name);
    console.log('Request data:', request.request);
});

// Подписка на ответы команд
server.responsed.subscribe((response) => {
    console.log('Command response:', response.id);
});
```

## Отправка данных

### Broadcast всем клиентам

```typescript
await server.emit('notification', { message: 'Hello everyone!' });
```

### Отправка конкретному пользователю

```typescript
const userId = 123;
await server.emitToUser('private-message', { text: 'Hello!' }, userId);

// Отправка только одному клиенту пользователя (если несколько вкладок)
await server.emitToUser('private-message', { text: 'Hello!' }, userId, true);
```

### Отправка конкретному клиенту

```typescript
await server.emitToClient('direct-message', { text: 'Hi!' }, clientId);
```

### Отправка в комнату

```typescript
await server.emitToRoom('room-message', { text: 'Room update' }, 'room-name');
// Или в несколько комнат
await server.emitToRoom('update', data, ['room1', 'room2']);
```

## Управление комнатами

```typescript
// Добавление пользователя в комнату
await server.addUserToRoom(userId, 'chat-room');
await server.addUserToRoom(userId, ['room1', 'room2']);

// Удаление пользователя из комнаты
await server.removeUserFromRoom(userId, 'chat-room');

// Добавление клиента в комнату
await server.addClientToRoom(clientId, 'room-name');

// Удаление клиента из комнаты
await server.removeClientFromRoom(clientId, 'room-name');
```

## Управление подключениями

```typescript
// Отключение пользователя (все его клиенты)
await server.disconnectUser(userId);

// Отключение конкретного клиента
await server.disconnectClient(clientId);

// Получение клиента по ID
const socket = server.getClient(clientId);
```

## Обработчики команд

### TransportSocketCommandHandler

Базовый класс для обработки синхронных команд:

```typescript
import { TransportSocketCommandHandler } from '@ts-core/socket-server';
import { ISocketUser } from '@ts-core/socket-server';

class GetUserHandler extends TransportSocketCommandHandler<
    GetUserRequest,
    GetUserCommand,
    GetUserResponse
> {
    constructor(logger: ILogger, transport: TransportSocket) {
        super(logger, transport, GetUserCommand.NAME);
    }

    protected async execute(
        request: GetUserRequest,
        user: ISocketUser
    ): Promise<GetUserResponse> {
        // user.userId - ID текущего пользователя
        // user.clientId - ID текущего клиента
        return { name: 'John', id: request.id };
    }
}
```

### TransportSocketCommandAsyncHandler

Для асинхронных команд с ответом:

```typescript
import { TransportSocketCommandAsyncHandler } from '@ts-core/socket-server';

class ProcessDataHandler extends TransportSocketCommandAsyncHandler<
    ProcessRequest,
    ProcessCommand,
    ProcessResponse
> {
    protected async execute(
        request: ProcessRequest,
        user: ISocketUser
    ): Promise<ProcessResponse> {
        const result = await this.processData(request);
        return result;
    }
}
```

### TransportSocketEventHandler

Для обработки событий:

```typescript
import { TransportSocketEventHandler } from '@ts-core/socket-server';

class UserActivityHandler extends TransportSocketEventHandler<UserActivityEvent> {
    constructor(logger: ILogger, transport: TransportSocket) {
        super(logger, transport, UserActivityEvent.UID);
    }

    protected async execute(event: UserActivityEvent): Promise<void> {
        console.log('User activity:', event.data);
    }
}
```

### TransportSocketRoomHandler

Обработчик для управления комнатами:

```typescript
import { TransportSocketRoomHandler } from '@ts-core/socket-server';

// Автоматически обрабатывает команды на добавление/удаление из комнат
const roomHandler = new TransportSocketRoomHandler(logger, transport, server);
```

## Интеграция с NestJS

```typescript
import { WebSocketGateway, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Namespace, Socket } from 'socket.io';

@WebSocketGateway({ namespace: '/api' })
export class MyGateway extends TransportSocketServer
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

    constructor(logger: ILogger) {
        super(logger);
    }

    afterInit(namespace: Namespace): void {
        super.afterInit(namespace);
    }

    handleConnection(client: Socket): void {
        super.handleConnection(client);
    }

    handleDisconnect(client: Socket): void {
        super.handleDisconnect(client);
    }

    protected async getClientUserId(client: Socket): Promise<TransportSocketUserId> {
        // Валидация JWT токена и получение userId
        const token = client.handshake.auth.token;
        return this.authService.validateToken(token);
    }
}
```

## API Reference

### SocketServer

| Метод | Описание |
|-------|----------|
| `afterInit(namespace)` | Вызывается после инициализации namespace |
| `handleConnection(client)` | Обработка нового подключения |
| `handleDisconnect(client)` | Обработка отключения |
| `disconnect(client)` | Принудительное отключение клиента |
| `namespace` | Текущий namespace Socket.IO |

### TransportSocketServer

| Метод | Описание |
|-------|----------|
| `emit(name, data)` | Отправка всем клиентам |
| `emitToUser(name, data, userId, isOnlyOne?)` | Отправка пользователю |
| `emitToClient(name, data, clientId)` | Отправка клиенту |
| `emitToRoom(name, data, room)` | Отправка в комнату |
| `addUserToRoom(userId, room)` | Добавление пользователя в комнату |
| `removeUserFromRoom(userId, room)` | Удаление пользователя из комнаты |
| `addClientToRoom(clientId, room)` | Добавление клиента в комнату |
| `removeClientFromRoom(clientId, room)` | Удаление клиента из комнаты |
| `disconnectUser(userId)` | Отключение всех клиентов пользователя |
| `disconnectClient(clientId)` | Отключение клиента |
| `getClient(clientId)` | Получение Socket по ID |
| `getUserRoom(userId)` | Получение имени комнаты пользователя |
| `isUserRoom(room)` | Проверка, является ли комната пользовательской |
| `events` | Observable всех событий |
| `evented` | Observable транспортных событий |
| `requested` | Observable запросов команд |
| `responsed` | Observable ответов команд |

### ISocketUser

```typescript
interface ISocketUser<U = TransportSocketUserId> {
    userId?: U;      // ID пользователя
    clientId: string; // ID клиента (socket.id)
}
```

## Безопасность

- Валидация пользователей происходит в методе `getClientUserId`
- При ошибке валидации клиент автоматически отключается
- Ошибки отправляются клиенту через `TRANSPORT_SOCKET_ERROR`

```typescript
protected async getClientUserId(client: Socket): Promise<TransportSocketUserId> {
    const token = client.handshake.auth.token;
    if (!token) {
        throw new Error('No token provided');
    }

    const user = await this.authService.validate(token);
    if (!user) {
        throw new Error('Invalid token');
    }

    return user.id;
}
```

## Связанные пакеты

- `@ts-core/socket-common` — общие классы и интерфейсы
- `@ts-core/socket-client` — клиентская реализация

## Автор

**Renat Gubaev** — [renat.gubaev@gmail.com](mailto:renat.gubaev@gmail.com)

- GitHub: [ManhattanDoctor](https://github.com/ManhattanDoctor)
- Repository: [ts-core-socket-server](https://github.com/ManhattanDoctor/ts-core-socket-server)

## Лицензия

ISC
