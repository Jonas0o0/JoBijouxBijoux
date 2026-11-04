"""
Hardware Mock Simulator for Jewelry POS
Simulates:
1. Mettler Toledo / Ohaus Jewelry Precision Scale (SICS Protocol & WebSocket stream)
2. Zebra / Citizen Thermal Jewelry Label Printer (Port 9100 RAW ZPL/EPL listener)
3. TPE Payment Terminal Mock
"""

import asyncio
import json
import logging
import os
import random
import time
from aiohttp import web

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("mock-hardware")

# State
current_weight = 12.450  # grams
is_scale_stable = True
last_printed_labels = []
scale_ws_clients = set()


# --- RAW TCP Printer Server (Port 9100) ---
class RawPrinterProtocol(asyncio.Protocol):
    def connection_made(self, transport):
        self.transport = transport
        peer = transport.get_extra_info('peername')
        logger.info(f"Printer client connected from {peer}")
        self.buffer = bytearray()

    def data_received(self, data):
        self.buffer.extend(data)
        logger.info(f"Printer received {len(data)} bytes")

    def connection_lost(self, exc):
        raw_content = self.buffer.decode('latin-1', errors='replace')
        entry = {
            "timestamp": time.time(),
            "bytes_received": len(self.buffer),
            "preview": raw_content[:500],
            "is_zpl": "^XA" in raw_content or "^XZ" in raw_content,
            "is_epl": "N\n" in raw_content or "P1\n" in raw_content
        }
        last_printed_labels.append(entry)
        if len(last_printed_labels) > 50:
            last_printed_labels.pop(0)
        logger.info(f"Print job completed. ZPL detected: {entry['is_zpl']}. Stored in buffer.")


# --- HTTP & WebSocket API (Port 8089) ---
async def handle_get_weight(request):
    global current_weight, is_scale_stable
    noise = random.choice([-0.001, 0.000, 0.001]) if is_scale_stable else random.uniform(-0.05, 0.05)
    weight_val = round(max(0.0, current_weight + noise), 3)
    return web.json_response({
        "status": "OK",
        "stable": is_scale_stable,
        "weight": weight_val,
        "unit": "g",
        "raw_sics": f"S S   {weight_val:8.3f} g\r\n"
    })


async def handle_set_weight(request):
    global current_weight, is_scale_stable
    data = await request.json()
    if "weight" in data:
        current_weight = float(data["weight"])
    if "stable" in data:
        is_scale_stable = bool(data["stable"])
    logger.info(f"Mock scale set to: {current_weight}g (stable={is_scale_stable})")
    return web.json_response({"status": "SUCCESS", "current_weight": current_weight, "stable": is_scale_stable})


async def handle_tare(request):
    global current_weight
    current_weight = 0.000
    logger.info("Mock scale tared to 0.000g")
    return web.json_response({"status": "SUCCESS", "weight": 0.000, "message": "Scale tared"})


async def handle_print_history(request):
    return web.json_response({
        "count": len(last_printed_labels),
        "jobs": last_printed_labels
    })


async def handle_tpe_pay(request):
    data = await request.json()
    amount = data.get("amount_cents", 0)
    logger.info(f"TPE: Transaction request for {amount / 100:.2f} EUR")
    await asyncio.sleep(1.2)  # simulate PIN & chip reading
    return web.json_response({
        "status": "APPROVED",
        "authorization_code": f"AUTH-{random.randint(100000, 999999)}",
        "card_brand": "CB_VISA",
        "pan_masked": "4970-XXXX-XXXX-1234",
        "amount_cents": amount,
        "timestamp": time.time()
    })


async def handle_scale_ws(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)
    scale_ws_clients.add(ws)
    logger.info("New WebSocket client connected to scale stream")

    try:
        while not ws.closed:
            noise = random.choice([-0.001, 0.000, 0.001]) if is_scale_stable else random.uniform(-0.05, 0.05)
            weight_val = round(max(0.0, current_weight + noise), 3)
            payload = {
                "event": "SCALE_DATA",
                "weight": weight_val,
                "unit": "g",
                "stable": is_scale_stable,
                "timestamp": time.time()
            }
            await ws.send_json(payload)
            await asyncio.sleep(0.2)
    finally:
        scale_ws_clients.discard(ws)
        logger.info("WebSocket client disconnected")
    return ws


async def main():
    loop = asyncio.get_running_loop()

    # 1. Start RAW Printer TCP Server on 9100
    printer_server = await loop.create_server(RawPrinterProtocol, "0.0.0.0", 9100)
    logger.info("Mock Label Printer listening on TCP port 9100 (RAW ZPL/EPL)...")

    # 2. Start HTTP + WS API Server on 8089
    app = web.Application()
    app.router.add_get("/scale/weight", handle_get_weight)
    app.router.add_post("/scale/weight", handle_set_weight)
    app.router.add_post("/scale/tare", handle_tare)
    app.router.add_get("/printer/history", handle_print_history)
    app.router.add_post("/tpe/pay", handle_tpe_pay)
    app.router.add_get("/ws/scale", handle_scale_ws)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", 8089)
    await site.start()
    logger.info("Mock Hardware HTTP/WS API listening on http://0.0.0.0:8089...")

    await asyncio.gather(
        printer_server.serve_forever(),
        asyncio.Event().wait()
    )


if __name__ == "__main__":
    asyncio.run(main())
