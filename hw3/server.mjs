import { createServer } from 'node:http';
import os from 'os';

const server = createServer((request, response) => {

    console.log("");
    console.log("Url:", request.url);
    console.log("Method:", request.method);


    if (request.method === "GET" && (request.url === "/health/" || request.url === "/health")) {

        response.statusCode = 200;
        response.setHeader('Content-Type', 'application/json');

        var data = {
            status: 'OK',
        };

        response.end(JSON.stringify(data) + "\r\n");
    } else {
        response.statusCode = 404;
        var sResponse = "Requested resource not found: " + request.url + "\r\n";
        sResponse += "Host: " + os.hostname() + "\r\n";
        response.end(sResponse);
    }

});

// starts a simple http server locally on port 8000
server.listen(8000, '0.0.0.0', () => {
    console.log('Listening port 8000');
});