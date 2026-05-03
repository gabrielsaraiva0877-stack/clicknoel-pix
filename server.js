const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const CI = "ci_lf0hleeq6eowmss";
const CS = "cs_bjkf8ncsttb1zb3py3xncf65h";
const PORT = 3000;

function uid() {
  return "pix-" + Date.now() + "-" + Math.random().toString(36).substring(2, 8);
}

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
    const filePath = path.join(__dirname, "index.html");
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("index.html nao encontrado na pasta");
        return;
      }
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(data);
    });
    return;
  }

  if (req.method === "POST" && req.url === "/gerar-pix") {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", () => {
      let amount;
      try {
        amount = JSON.parse(body).amount;
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Valor invalido" }));
        return;
      }

      const payload = JSON.stringify({
        amount: amount,
        payerName: "Cliente",
        payerDocument: "00000000000",
        transactionId: uid(),
        description: "Pagamento PIX"
      });

      const options = {
        hostname: "api.misticpay.com",
        path: "/api/transactions/create",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ci": CI,
          "cs": CS,
          "Content-Length": Buffer.byteLength(payload)
        }
      };

      const apiReq = https.request(options, (apiRes) => {
        let data = "";
        apiRes.on("data", chunk => (data += chunk));
        apiRes.on("end", () => {
          res.writeHead(apiRes.statusCode, { "Content-Type": "application/json" });
          res.end(data);
        });
      });

      apiReq.on("error", (e) => {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: e.message }));
      });

      apiReq.write(payload);
      apiReq.end();
    });
    return;
  }

  res.writeHead(404);
  res.end("Nao encontrado");
});

server.listen(PORT, () => {
  console.log("Servidor rodando em http://localhost:" + PORT);
});
