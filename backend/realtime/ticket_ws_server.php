<?php
/**
 * Minimal Ratchet-based WebSocket server for ticket chats.
 * Room = ticket_id
 * Events: message:new, message:read, typing:start, typing:stop
 *
 * Note: This is a skeleton. Install Ratchet via Composer and run:
 * php ticket_ws_server.php
 */

// Placeholder to avoid breaking builds if Ratchet is not installed.
if (!file_exists(__DIR__ . '/vendor/autoload.php')) {
    echo "Ratchet not installed. Install via composer require cboden/ratchet\n";
    exit;
}

require __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/../config/jwt.php';
require_once __DIR__ . '/../config/database.php';

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;

class TicketChat implements MessageComponentInterface
{
    protected $clients; // SplObjectStorage
    protected $rooms;   // ticket_id => [connections]

    public function __construct()
    {
        $this->clients = new \SplObjectStorage;
        $this->rooms = [];
    }

    public function onOpen(ConnectionInterface $conn)
    {
        // Expect query params: token, ticket_id
        $query = [];
        parse_str($conn->httpRequest->getUri()->getQuery(), $query);
        $token = $query['token'] ?? null;
        $ticketId = isset($query['ticket_id']) ? (int)$query['ticket_id'] : 0;

        try {
            $payload = jwt_decode($token);
            if (!$ticketId) throw new Exception('ticket_id required');
            // No deep ticket access validation here; add if needed
            $conn->ticket_id = $ticketId;
            $conn->user = $payload;

            $this->clients->attach($conn);
            $this->rooms[$ticketId] = $this->rooms[$ticketId] ?? [];
            $this->rooms[$ticketId][spl_object_hash($conn)] = $conn;
        } catch (\Exception $e) {
            $conn->send(json_encode(['type' => 'error', 'message' => $e->getMessage()]));
            $conn->close();
        }
    }

    public function onMessage(ConnectionInterface $from, $msg)
    {
        $data = json_decode($msg, true);
        if (!$data || !isset($data['type'])) return;

        $room = $from->ticket_id ?? null;
        if (!$room || !isset($this->rooms[$room])) return;

        switch ($data['type']) {
            case 'typing:start':
            case 'typing:stop':
            case 'message:read':
            case 'message:new':
                foreach ($this->rooms[$room] as $client) {
                    $client->send($msg);
                }
                break;
            default:
                $from->send(json_encode(['type' => 'error', 'message' => 'Unknown event']));
        }
    }

    public function onClose(ConnectionInterface $conn)
    {
        $this->clients->detach($conn);
        $room = $conn->ticket_id ?? null;
        if ($room && isset($this->rooms[$room])) {
            unset($this->rooms[$room][spl_object_hash($conn)]);
        }
    }

    public function onError(ConnectionInterface $conn, \Exception $e)
    {
        $conn->send(json_encode(['type' => 'error', 'message' => $e->getMessage()]));
        $conn->close();
    }
}

$port = 8081;
$server = \Ratchet\App::factory('localhost', $port);
$server->route('/tickets', new TicketChat, ['*']);
echo "Ticket WS server running on ws://localhost:$port/tickets\n";
$server->run();
