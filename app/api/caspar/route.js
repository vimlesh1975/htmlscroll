import net from "node:net";

export const runtime = "nodejs";

function sendAmcpCommand({ host, port, command }) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(
      {
        host,
        port,
        timeout: 5000
      },
      () => {
        socket.write(`${command}\r\n`);
      }
    );

    let response = "";

    socket.on("data", (chunk) => {
      response += chunk.toString("utf8");
      if (/^2\d\d|^4\d\d|^5\d\d/m.test(response)) {
        socket.end();
      }
    });

    socket.on("timeout", () => {
      socket.destroy(new Error("Timed out while waiting for CasparCG."));
    });

    socket.on("error", reject);
    socket.on("end", () => resolve(response.trim()));
    socket.on("close", () => {
      if (!response) {
        resolve("");
      }
    });
  });
}

export async function POST(request) {
  const body = await request.json();
  const host = body.host || "127.0.0.1";
  const port = Number(body.port || 5250);
  const channel = Number(body.channel || 1);
  const layer = Number(body.layer || 20);
  const url = body.url;
  const action = body.action || "play";

  if (!url && action !== "clear") {
    return Response.json(
      { ok: false, error: "Missing ticker URL." },
      { status: 400 }
    );
  }

  const command =
    action === "clear"
      ? `STOP ${channel}-${layer}`
      : `PLAY ${channel}-${layer} [HTML] "${url}"`;

  try {
    const response = await sendAmcpCommand({ host, port, command });
    return Response.json({ ok: true, command, response });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        command,
        error: error instanceof Error ? error.message : "Unknown AMCP error"
      },
      { status: 500 }
    );
  }
}
