import asyncio
import random
import string
from typing import Dict, List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI()

class RoomManager:
    def __init__(self):
        self.rooms: Dict[str, dict] = {}
        self.timer_tasks: Dict[str, asyncio.Task] = {}

    def generate_code(self) -> str:
        while True:
            code = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
            if code not in self.rooms:
                return code

    def create_room(self, host_ws: WebSocket) -> str:
        code = self.generate_code()
        self.rooms[code] = {
            "host": host_ws,
            "players": {},
            "game_state": "waiting",
            "duration": 60
        }
        return code

    async def broadcast_to_room(self, room_code: str, message: dict, skip_ws: WebSocket = None):
        if room_code not in self.rooms:
            return
        
        room = self.rooms[room_code]
        targets = list(room["players"].values()) + [room["host"]]
        
        for ws in targets:
            if ws != skip_ws:
                try:
                    await ws.send_json(message)
                except Exception:
                    pass

    def remove_player(self, room_code: str, player_id: str):
        if room_code in self.rooms and player_id in self.rooms[room_code]["players"]:
            del self.rooms[room_code]["players"][player_id]

    async def start_room_timer(self, room_code: str, duration: int):
        if room_code in self.timer_tasks:
            self.timer_tasks[room_code].cancel()

        self.timer_tasks[room_code] = asyncio.create_task(
            self._timer_loop(room_code, duration)
        )

    async def _timer_loop(self, room_code: str, duration: int):
        try:
            while duration >= 0:
                if room_code not in self.rooms:
                    break
                
                await self.broadcast_to_room(room_code, {
                    "status": "timer_tick",
                    "time_left": duration
                })
                
                if duration == 0:
                    await self.broadcast_to_room(room_code, {
                        "status": "timer_expired"
                    })
                    break
                
                await asyncio.sleep(1)
                duration -= 1
        except asyncio.CancelledError:
            pass

    def stop_room_timer(self, room_code: str):
        if room_code in self.timer_tasks:
            self.timer_tasks[room_code].cancel()
            del self.timer_tasks[room_code]

manager = RoomManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    room_code = None
    player_id = None
    is_host = False

    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")

            if action == "create_room":
                room_code = manager.create_room(websocket)
                is_host = True
                await websocket.send_json({"status": "room_created", "room_code": room_code})

            elif action == "join_room":
                room_code = data.get("room_code")
                player_id = data.get("player_id")
                
                if room_code not in manager.rooms:
                    await websocket.send_json({"status": "error", "message": "Room not found"})
                    continue
                
                manager.rooms[room_code]["players"][player_id] = websocket
                await websocket.send_json({"status": "joined", "room_code": room_code})
                
                await manager.broadcast_to_room(room_code, {
                    "status": "player_joined",
                    "player_id": player_id
                }, skip_ws=websocket)

            elif action == "start_round" or action == "next_round":
                if is_host and room_code in manager.rooms:
                    duration = data.get("duration", 60)
                    manager.rooms[room_code]["game_state"] = "playing"
                    
                    await manager.broadcast_to_room(room_code, {
                        "status": "round_started",
                        "round_number": data.get("round_number"),
                        "coords": data.get("coords") 
                    })
                    
                    await manager.start_room_timer(room_code, duration)

            elif action == "submit_guess":
                if room_code in manager.rooms:
                    host_ws = manager.rooms[room_code]["host"]
                    await host_ws.send_json({
                        "status": "player_guess",
                        "player_id": player_id,
                        "coords": data.get("coords")
                    })

            elif action == "end_round":
                if is_host:
                    manager.stop_room_timer(room_code)
                    if room_code in manager.rooms:
                        manager.rooms[room_code]["game_state"] = "results"
                        
                    await manager.broadcast_to_room(room_code, {
                        "status": "round_ended",
                        "scores": data.get("scores")
                    })

    except WebSocketDisconnect:
        if is_host:
            manager.stop_room_timer(room_code)
            await manager.broadcast_to_room(room_code, {"status": "host_disconnected"})
            if room_code in manager.rooms:
                del manager.rooms[room_code]
        else:
            if room_code and player_id:
                manager.remove_player(room_code, player_id)
                await manager.broadcast_to_room(room_code, {
                    "status": "player_left",
                    "player_id": player_id
                })

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)